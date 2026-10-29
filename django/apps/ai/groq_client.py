"""Shared thin REST client for the Groq chat-completions API
(OpenAI-compatible) — plain requests, no SDK. All AI calls go through this."""

import json
import logging
import math
import threading
import time

import requests
from django.conf import settings

API_URL = "https://api.groq.com/openai/v1/chat/completions"

# The key is read from django/.env (see .env.example).
NO_KEY_MESSAGE = "GROQ_API_KEY is not configured. Add it to django/.env"

# Up to 5 keys (GROQ_API_KEY with comma-separated lists plus GROQ_API_KEY_2 … _5,
# parsed and deduped in config/settings.py). When one key hits a rate limit (429)
# or is invalid (401), the request automatically rolls to the next key.
COOLDOWN_MS = 60 * 1000  # a 429'd key rests 60s (or Retry-After)
BAD_KEY_COOLDOWN_MS = 10 * 60 * 1000  # a 401'd key rests 10 min
MAX_COOLDOWN_MS = 5 * 60 * 1000  # Retry-After is capped at 5 minutes

logger = logging.getLogger(__name__)

# key -> cooldown-expiry timestamp (time.monotonic()); never logs the secret
# itself, only key#N. Guarded by a lock because Python serves concurrent
# requests on multiple threads.
_cooldown_until = {}
_cooldown_lock = threading.Lock()


def _load_keys():
    # settings.GROQ_KEYS is already split/trimmed/deduped/capped at 5.
    return list(settings.GROQ_KEYS)


def _ordered_keys():
    """Order keys so cooled-down ones are tried last — concurrent requests then
    spread across healthy keys instead of stampeding the same key."""
    with _cooldown_lock:
        pool = [
            (key, index, _cooldown_until.get(key, 0.0))
            for index, key in enumerate(_load_keys())
        ]
    pool.sort(key=lambda item: (item[2], item[1]))
    return [(key, index) for key, index, _cool in pool]


def _cooldown_seconds(res):
    try:
        secs = float(res.headers.get("retry-after"))
    except (TypeError, ValueError):
        secs = float("nan")
    if math.isfinite(secs) and secs > 0:
        return min(secs, MAX_COOLDOWN_MS / 1000.0)
    return COOLDOWN_MS / 1000.0


def _post_with_rotation(payload, timeout_s, abort_event=None, stream=False):
    """POST with automatic key rotation. Returns the first usable Response.

    Rotates past 429 (rate limit) and 401 (bad key in the pool); every other
    failure (network, abort, timeout) raises immediately — retrying those on
    another key could double-spend tokens on work already running server-side.
    """
    pool = _ordered_keys()
    if not pool:
        raise Exception(NO_KEY_MESSAGE)

    last_err = None
    for key, index in pool:
        if abort_event is not None and abort_event.is_set():
            raise Exception("Groq request aborted")
        res = requests.post(
            API_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {key}",
            },
            json=payload,
            timeout=timeout_s,
            stream=stream,
        )

        if res.status_code == 429:
            cool = _cooldown_seconds(res)
            with _cooldown_lock:
                _cooldown_until[key] = time.monotonic() + cool
            res.close()
            logger.warning(
                f"[groq] key#{index + 1} rate-limited, cooling {round(cool)}s"
            )
            last_err = Exception(
                "Groq rate limit reached on all keys. Please try again shortly."
            )
            continue
        if res.status_code == 401:
            with _cooldown_lock:
                _cooldown_until[key] = time.monotonic() + BAD_KEY_COOLDOWN_MS / 1000.0
            res.close()
            logger.warning(f"[groq] key#{index + 1} rejected (401), skipping for 10 min")
            last_err = Exception("Groq API key rejected. Please try again shortly.")
            continue
        return res

    raise last_err or Exception("Groq request failed on all keys.")


def _groq_messages(system, messages):
    result = [{"role": "system", "content": system}] if system else []
    result.extend(messages)
    return result


def _read_error_message(res, fallback):
    try:
        err_body = res.json()
    except ValueError:
        return fallback
    if isinstance(err_body, dict):
        error = err_body.get("error")
        if isinstance(error, dict) and error.get("message"):
            return error["message"]
    return fallback


def _normalize_usage(raw):
    if not raw:
        return None
    return {
        "prompt_tokens": raw.get("prompt_tokens") or 0,
        "completion_tokens": raw.get("completion_tokens") or 0,
        "total_tokens": raw.get("total_tokens") or 0,
    }


# Single chat-completion call → {text, usage}.
# `usage` is the provider's token accounting ({prompt_tokens,
# completion_tokens, total_tokens}) or None when absent — callers pass it
# through so the pipeline can log per-stage cost. Raises (with the API's
# own error message, plus `.status`) on non-OK responses.
def chat_completion(
    system=None,
    messages=(),
    temperature=0.7,
    max_tokens=2048,
    json_mode=False,
    timeout_ms=20000,
):
    payload = {
        "model": settings.GROQ_MODEL,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "messages": _groq_messages(system, messages),
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    res = _post_with_rotation(payload, timeout_ms / 1000.0)
    if not res.ok:
        err = Exception(_read_error_message(res, f"Groq API error {res.status_code}"))
        err.status = res.status_code
        raise err
    data = res.json()
    usage = _normalize_usage(data.get("usage"))
    text = ((data.get("choices") or [{}])[0].get("message") or {}).get("content") or ""
    return {"text": text.strip(), "usage": usage}


# Streaming chat-completion call → {text, usage}.
# Forwards each content delta to `on_token` as it arrives so the server can
# relay live tokens over SSE (chatController.sendMessageStream). Same
# plain-requests convention as chat_completion — no SDK. `abort_event`
# (threading.Event) lets the caller abort (e.g. client disconnected
# mid-stream).
def chat_completion_stream(
    system=None,
    messages=(),
    temperature=0.7,
    max_tokens=2048,
    timeout_ms=60000,
    on_token=None,
    abort_event=None,
):
    payload = {
        "model": settings.GROQ_MODEL,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": True,
        "stream_options": {"include_usage": True},
        "messages": _groq_messages(system, messages),
    }

    res = _post_with_rotation(
        payload, timeout_ms / 1000.0, abort_event=abort_event, stream=True
    )
    if not res.ok:
        err = Exception(_read_error_message(res, f"Groq API error {res.status_code}"))
        err.status = res.status_code
        raise err

    state = {"buffer": b"", "text": "", "usage": None}

    def feed(chunk):
        state["buffer"] += chunk
        frames = state["buffer"].split(b"\n\n")
        state["buffer"] = frames.pop()
        for frame in frames:
            line = next(
                (
                    l
                    for l in frame.decode("utf-8", errors="replace").split("\n")
                    if l.startswith("data:")
                ),
                None,
            )
            if not line:
                continue
            evt_payload = line[5:].strip()
            if not evt_payload or evt_payload == "[DONE]":
                continue
            try:
                evt = json.loads(evt_payload)
            except ValueError:
                # partial JSON at chunk boundary — completed by the next chunk
                continue
            if not isinstance(evt, dict):
                continue
            delta = (
                ((evt.get("choices") or [{}])[0].get("delta") or {}).get("content")
                or ""
            )
            if delta:
                state["text"] += delta
                if on_token:
                    on_token(delta)
            if evt.get("usage"):
                state["usage"] = _normalize_usage(evt["usage"])

    try:
        for chunk in res.iter_content(chunk_size=None):
            if abort_event is not None and abort_event.is_set():
                raise Exception("Groq stream aborted")
            if chunk:
                feed(chunk)
    finally:
        res.close()

    return {"text": state["text"].strip(), "usage": state["usage"]}


# Stored chat history → Groq messages.
def to_messages(history=()):
    return [
        {
            "role": "assistant" if h.get("role") == "assistant" else "user",
            "content": h.get("text"),
        }
        for h in history
    ]


# Ops helper: how many keys are loaded and how many are currently cooled.
# Reports key counts only — never secrets. Useful for
# `curl /api/health`-style checks.
def groq_pool_status():
    now = time.monotonic()
    keys = _load_keys()
    with _cooldown_lock:
        cooled = sum(1 for k in keys if _cooldown_until.get(k, 0.0) > now)
    return {"keys": len(keys), "cooled": cooled}


# True when at least one key is configured (any of GROQ_API_KEY…_5).
def has_groq_keys():
    return len(_load_keys()) > 0
