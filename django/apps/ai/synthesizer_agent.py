"""SYNTHESIZER agent — turns the sub-agent research (Reddit digest + web
findings) into the final user-facing Markdown answer. Synthesis only,
keeps this call fast."""

import json

from apps.ai.groq_client import chat_completion, chat_completion_stream, to_messages

SYSTEM_INSTRUCTION = """You are DistroPedia Assistant, an expert Linux troubleshooting assistant speaking to the user. You receive research from two sub-agents (Reddit digest + web findings). Produce the FINAL user-facing answer in structured GitHub-flavored Markdown: short diagnosis line first; numbered fix steps with every command in a fenced code block with language tag; use a Markdown table when comparing options/packages/filesystems; prefer battle-tested fixes (mark Reddit-verified ones as such); end with a '### Sources' section listing the most relevant links from the provided material (markdown links). Never invent commands that contradict the research.

DOCUMENT EXPORTS: The UI shows 'Copy' and 'Download .md' buttons under every answer, so the user can save any answer as a Markdown file and convert it to PDF themselves. When the user asks you to "generate a PDF", "export", "create a report/notes/document", or similar: do NOT refuse and do NOT output a conversational reply. Instead produce a complete, standalone, properly structured Markdown DOCUMENT — a '# Title', a short overview, organised '## Sections', tables where useful, commands in fenced code blocks, and a '### Sources' section — written as a reference document (not an answer to a question). Then end with one line telling the user they can click 'Download .md' below to save it and convert it to PDF."""


def synthesize_answer(
    question,
    history=(),
    reddit_results=(),
    web_findings="",
    web_sources=(),
):
    prompt = build_prompt(
        question=question,
        history=history,
        reddit_results=reddit_results,
        web_findings=web_findings,
    )

    result = chat_completion(
        system=SYSTEM_INSTRUCTION,
        messages=[*to_messages(history), {"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=2048,
        timeout_ms=25000,
    )

    # Sources pass through from the research agent (Reddit thread links).
    return {"content": result["text"], "sources": web_sources, "usage": result["usage"]}


# Streaming variant — same prompt and contract, but forwards each content
# delta to `on_token` so the controller can relay live tokens over SSE.
# `abort_event` aborts the upstream Groq stream (client disconnected).
def synthesize_answer_stream(
    question,
    history=(),
    reddit_results=(),
    web_findings="",
    on_token=None,
    abort_event=None,
    timeout_ms=60000,
):
    prompt = build_prompt(
        question=question,
        history=history,
        reddit_results=reddit_results,
        web_findings=web_findings,
    )

    result = chat_completion_stream(
        system=SYSTEM_INSTRUCTION,
        messages=[*to_messages(history), {"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=2048,
        timeout_ms=timeout_ms,
        on_token=on_token,
        abort_event=abort_event,
    )

    return {"content": result["text"], "usage": result["usage"]}


def build_prompt(question="", history=(), reddit_results=(), web_findings=""):
    return "\n".join(
        [
            f"User question: {question}",
            "",
            "REDDIT DIGEST (community insights from real threads; may contain the most battle-tested fixes):",
            json.dumps(
                reddit_results, separators=(",", ":"), ensure_ascii=False
            )
            if reddit_results
            else "none",
            "",
            "WEB FINDINGS (from the web research sub-agent):",
            web_findings or "none",
        ]
    )
