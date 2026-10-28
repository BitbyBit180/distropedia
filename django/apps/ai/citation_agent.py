"""CITATION agent — drops cited sources that aren't actually relevant to
the user's question. One Jev request with a batched Noul per source
(title + URL are the evidence; no page fetch). Queue-style policy in
code: keep on doubt (score >= 0.3), drop only clear misses. Best-effort:
any failure keeps every source."""

from django.conf import settings

from apps.ai.jev_client import system_one

MIN_RELEVANCE = 0.3


def filter_sources(question="", sources=None):
    candidates = [
        s
        for s in (sources or [])
        if isinstance(s, dict) and s.get("url") and s.get("title")
    ]
    if not candidates or not (question or "").strip():
        return {"sources": sources, "dropped": 0}
    api_key = settings.TYPESAFE_API_KEY
    if not api_key or not api_key.strip():
        return {"sources": sources, "dropped": 0}

    questions = {}
    for i, s in enumerate(candidates):
        questions[f"src_{i}"] = {
            "type": "noul",
            "instructions": f"Is the source titled \"{s['title']}\" ({s['url']}) topically relevant to the user question in `question`?",
            "criteria": {
                "true": "Same topic — a reader could plausibly learn something useful from it",
                "false": "Unrelated topic, wrong product, or obvious mismatch",
            },
        }

    try:
        data = system_one(state={"question": question}, questions=questions)
        answers = (data.get("answers") or {}) if isinstance(data, dict) else {}
        kept = []
        for i, s in enumerate(candidates):
            a = answers.get(f"src_{i}")
            if not a:
                kept.append(s)
                continue
            if not isinstance(a, dict) or a.get("type") != "noul":
                kept.append(s)
                continue
            try:
                score = float(a.get("noul", 0))
            except (TypeError, ValueError):
                score = float("nan")  # mirrors JS Number() — a mismatch gets dropped
            if score >= MIN_RELEVANCE:
                kept.append(s)
        # Never strip everything: if all score low, the filter misfired.
        if not kept:
            return {"sources": sources, "dropped": 0}
        return {"sources": kept, "dropped": len(candidates) - len(kept)}
    except Exception:
        return {"sources": sources, "dropped": 0}
