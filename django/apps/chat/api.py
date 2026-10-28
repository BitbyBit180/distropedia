"""Chat API — conversation CRUD plus the multi-agent send pipeline (JSON and
SSE twin), matching chatController.js stage-for-stage.

Pipeline order is preserved exactly: the user message is saved first (so a
failure leaves it for the client to retry), Reddit + web research run in
parallel, the synthesizer writes the answer, then the citation screen trims
sources, and only then is the assistant message appended.
"""

import json
import logging
import time
from concurrent.futures import ThreadPoolExecutor

from django.http import HttpResponse, StreamingHttpResponse

from apps.chat.models import Chat, ChatMessage
from apps.core.errors import ApiError, endpoint, json_payload, parse_id
from apps.core.ratelimit import CHAT_MESSAGE_LIMIT
from config import settings

log = logging.getLogger("chat")


def _chat_json(chat):
    return {
        "id": chat.pk,
        "title": chat.title,
        "messages": chat.messages_json(),
        "createdAt": _iso(chat.created_at),
        "updatedAt": _iso(chat.updated_at),
    }


def _iso(value):
    from apps.core.serialize import iso

    return iso(value)


def _find_owned_chat(request, user, chat_id):
    """Chats are private: a mismatch is reported as 404 so we don't leak existence."""
    chat = Chat.objects.filter(pk=parse_id(chat_id)).first()
    if chat is None or chat.user_id != user.pk:
        raise ApiError("Chat not found", 404)
    return chat


def _history(chat):
    """Everything before the new message, in the shape the agents expect."""
    return [
        {"role": message.role, "text": message.content}
        for message in ChatMessage.objects.filter(chat=chat).order_by("pk")
    ]


def _append(chat, role, content, sources=None):
    ChatMessage.objects.create(
        chat=chat, role=role, content=content, sources=sources or []
    )


@endpoint(methods=("GET", "POST"), auth=True)
def chat_collection(request, body, user):
    if request.method == "POST":
        chat = Chat.objects.create(user=user)
        return {"success": True, "data": _chat_json(chat)}, 201

    rows = Chat.objects.filter(user=user).order_by("-updated_at", "pk")
    data = [
        {
            "id": chat.pk,
            "title": chat.title,
            "updatedAt": _iso(chat.updated_at),
            "messageCount": chat.chatmessage_set.count(),
        }
        for chat in rows
    ]
    return {"success": True, "count": len(data), "data": data}


@endpoint(methods=("GET", "DELETE"), auth=True)
def chat_detail(request, body, user, chat_id=None):
    chat = _find_owned_chat(request, user, chat_id)
    if request.method == "DELETE":
        pk = chat.pk
        chat.delete()
        return {"success": True, "message": f"Chat {pk} deleted"}
    return {"success": True, "data": _chat_json(chat)}


@endpoint(methods=("PUT",), auth=True)
def chat_rename(request, body, user, chat_id=None):
    chat = _find_owned_chat(request, user, chat_id)
    title = str((body or {}).get("title", "")).strip()[:80]
    if not title:
        raise ApiError("A chat title is required", 400)
    chat.title = title
    chat.save()
    return {"success": True, "data": _chat_json(chat)}


def _dedupe_sources(candidates):
    seen, unique = set(), []
    for source in candidates:
        url = (source or {}).get("url")
        if not url or url in seen:
            continue
        seen.add(url)
        unique.append(source)
    return unique


def _run_pipeline(chat, content, on_stage=None, on_token=None, abort=None):
    """Shared by the JSON and SSE endpoints; returns the two message payloads."""
    from apps.ai.citation_agent import filter_sources
    from apps.ai.reddit import search_reddit
    from apps.ai.synthesizer_agent import (
        synthesize_answer,
        synthesize_answer_stream,
    )
    from apps.ai.web_research_agent import run_web_research

    history = _history(chat)
    user_message = {"role": "user", "content": content, "sources": []}
    _append(chat, "user", content, [])

    started = time.time()
    if on_stage:
        on_stage("research")

    # Research agents are best-effort and self-capped; run them concurrently.
    with ThreadPoolExecutor(max_workers=2) as pool:
        reddit_future = pool.submit(search_reddit, content)
        web_future = pool.submit(run_web_research, content, history)
        reddit_stage_t = time.time()
        web_stage_t = time.time()
        reddit_results = reddit_future.result()
        reddit_ms = int((time.time() - reddit_stage_t) * 1000)
        web_research = web_future.result()
        web_ms = int((time.time() - web_stage_t) * 1000)

    if abort is not None and abort.is_set():
        return None

    if on_stage:
        on_stage("synthesizing")
    synth_started = time.time()
    if on_token is not None:
        answer = synthesize_answer_stream(
            question=content,
            history=history,
            reddit_results=reddit_results,
            web_findings=web_research["findings"],
            on_token=on_token,
            abort_event=abort,
        )
    else:
        answer = synthesize_answer(
            question=content,
            history=history,
            reddit_results=reddit_results,
            web_findings=web_research["findings"],
            web_sources=web_research["sources"],
        )
    synth_ms = int((time.time() - synth_started) * 1000)

    reddit_threads = [
        {"title": post["title"], "url": post["url"]} for post in reddit_results[:3]
    ]
    if on_token is not None:
        # The SSE variant cites what the research agent gathered, the JSON
        # variant cites what the synthesizer reported — as the two controllers
        # each did.
        raw_sources = _dedupe_sources(
            [*(web_research["sources"] or []), *reddit_threads]
        )
    else:
        raw_sources = _dedupe_sources([*(answer.get("sources") or []), *reddit_threads])

    if on_stage:
        on_stage("citations")
    screened = filter_sources(question=content, sources=raw_sources)

    assistant_message = {
        "role": "assistant",
        "content": answer["content"],
        "sources": screened["sources"],
    }
    _append(chat, "assistant", answer["content"], screened["sources"])
    if chat.title == "New chat":
        chat.title = content[:48]
    chat.save()

    tokens = (web_research.get("usage") or {}).get("total_tokens", 0) + (
        answer.get("usage") or {}
    ).get("total_tokens", 0)
    prefix = "[chat:stream]" if on_token is not None else "[chat]"
    streamed_chars = len(answer["content"])
    log.info(
        "%s chat=%s reddit=%sms(n=%s) web=%sms(tok=%s) synth=%sms(tok=%s) "
        "citations=dropped:%s/%s total=%sms tokens=%s",
        prefix,
        chat.pk,
        reddit_ms,
        len(reddit_results),
        web_ms,
        (web_research.get("usage") or {}).get("total_tokens", 0),
        synth_ms,
        (answer.get("usage") or {}).get("total_tokens", 0),
        screened["dropped"],
        len(raw_sources),
        int((time.time() - started) * 1000),
        tokens,
    )
    return {"userMessage": user_message, "assistantMessage": assistant_message}


@endpoint(methods=("POST",), auth=True, limiter=CHAT_MESSAGE_LIMIT)
def chat_messages(request, body, user, chat_id=None):
    from apps.ai.groq_client import NO_KEY_MESSAGE, has_groq_keys

    chat = _find_owned_chat(request, user, chat_id)
    content = str((body or {}).get("content", "")).strip()
    if not content:
        raise ApiError("Message content is required", 400)

    # Fast-fail before doing any work or saving anything.
    if not has_groq_keys():
        raise ApiError(NO_KEY_MESSAGE, 503)

    try:
        result = _run_pipeline(chat, content)
    except ApiError:
        raise
    except Exception as exc:  # noqa: BLE001 - the synthesizer failed
        raise ApiError(
            str(exc) or "AI assistant failed to produce an answer. Please try again.", 502
        )
    return {"success": True, "data": result}


@endpoint(methods=("POST",), auth=True, limiter=CHAT_MESSAGE_LIMIT)
def chat_message_stream(request, body, user, chat_id=None):
    """SSE twin of chat_messages.

    Pre-SSE failures are plain JSON (same contract); once headers flush, errors
    go out as `error` events instead.
    """
    from apps.ai.groq_client import NO_KEY_MESSAGE, has_groq_keys

    chat = _find_owned_chat(request, user, chat_id)
    content = str((body or {}).get("content", "")).strip()
    if not content:
        raise ApiError("Message content is required", 400)
    if not has_groq_keys():
        raise ApiError(NO_KEY_MESSAGE, 503)

    import queue
    import threading

    events = queue.Queue()
    abort = threading.Event()

    def worker():
        def on_stage(stage):
            events.put(("stage", {"stage": stage}))

        def on_token(delta):
            events.put(("token", {"text": delta}))

        try:
            result = _run_pipeline(
                chat, content, on_stage=on_stage, on_token=on_token, abort=abort
            )
            if result is not None:
                events.put(("done", result))
        except Exception as exc:  # noqa: BLE001 - relayed as an event
            events.put(("error", {"message": str(exc) or "AI assistant failed. Please try again."}))
        finally:
            events.put(None)

    def encode(event, data):
        return f"event: {event}\ndata: {json.dumps(data)}\n\n"

    def stream():
        thread = threading.Thread(target=worker, daemon=True)
        thread.start()
        try:
            while True:
                try:
                    item = events.get(timeout=15)
                except queue.Empty:
                    # Heartbeat so idle stretches (research stage) don't trip
                    # proxy timeouts.
                    yield ": ping\n\n"
                    continue
                if item is None:
                    break
                event, data = item
                yield encode(event, data)
        finally:
            abort.set()

    response = StreamingHttpResponse(
        stream(), content_type="text/event-stream", status=200
    )
    response["Cache-Control"] = "no-cache, no-transform"
    response["Connection"] = "keep-alive"
    response["X-Accel-Buffering"] = "no"
    return response
