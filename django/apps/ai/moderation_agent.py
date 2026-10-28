"""MODERATION-SCREEN agent — first-pass triage for new posts/comments.
Batched Nouls (spam / harassment / off-topic) run in ONE Jev request;
scores at/above FLAG_THRESHOLD create an AI report in the SAME queue
admins already triage (source: 'ai'). Queue-only by policy: nothing is
auto-hidden or deleted on a bare probability. Best-effort and
fire-and-forget — screening must never fail or slow a post/comment."""

import threading

from django.conf import settings

from apps.ai.jev_client import system_one

# Start permissive: queue candidates, tune from the approval rate later.
FLAG_THRESHOLD = 0.7

QUESTIONS = {
    "is_spam": {
        "type": "noul",
        "instructions": "Is the content in `title`/`body` spam, advertising, or low-effort junk?",
        "criteria": {
            "true": "Ads, link farming, gibberish, or content-free filler",
            "false": "A genuine question, discussion, or contribution",
        },
    },
    "is_abusive": {
        "type": "noul",
        "instructions": "Does the content in `title`/`body` attack, insult, or harass a person or group?",
        "criteria": {
            "true": "Insults, slurs, threats, or targeted hostility",
            "false": "Disagreement or criticism without personal attacks",
        },
    },
    "is_offtopic": {
        "type": "noul",
        "instructions": "Is the content in `title`/`body` off-topic for a Linux distro community (not about Linux, distros, open source, or adjacent tech)?",
        "criteria": {
            "true": "Clearly unrelated subject matter",
            "false": "Linux-related or plausibly adjacent",
        },
    },
}

REASON_FOR = {"is_spam": "spam", "is_abusive": "harassment", "is_offtopic": "off-topic"}


def screen_content(target_type, target_id, title="", body=""):
    api_key = settings.TYPESAFE_API_KEY
    if not api_key or not api_key.strip():
        return
    if not target_type or not target_id:
        return
    text = f"{title}\n{body}".strip()
    if len(text) < 10:
        return

    # Fire-and-forget: the daemon thread mirrors the JS promise chain — the
    # caller never waits and every error inside is swallowed.
    threading.Thread(
        target=_screen, args=(target_type, target_id, title, body), daemon=True
    ).start()


def _screen(target_type, target_id, title, body):
    try:
        data = system_one(
            state={"title": str(title)[:300], "body": str(body)[:2000]},
            questions=QUESTIONS,
        )
        answers = (data.get("answers") or {}) if isinstance(data, dict) else {}
        hits = []
        for qid, reason in REASON_FOR.items():
            raw = ((answers.get(qid) or {}).get("noul")) if isinstance(
                answers.get(qid), dict
            ) else None
            try:
                p = float(raw)
            except (TypeError, ValueError):
                p = 0.0
            else:
                if p != p:  # NaN, like JS's Number(undefined) || 0
                    p = 0.0
            if p >= FLAG_THRESHOLD:
                hits.append({"reason": reason, "p": p})
        if not hits:
            return
        hits.sort(key=lambda h: h["p"], reverse=True)
        detail = f"AI screen: {' · '.join(f'{h['reason']} {h['p']:.2f}' for h in hits)}"[:500]

        # Imported lazily so this module loads without the app registry.
        from apps.community.models import Report

        try:
            Report.objects.create(
                reporter=None,
                source="ai",
                target_type=target_type,
                target_id=target_id,
                reason=hits[0]["reason"],
                detail=detail,
            )
        except Exception:
            pass  # includes IntegrityError (duplicate report)
    except Exception:
        pass  # screening is best-effort
    finally:
        try:
            from django.db import connections

            connections.close_all()  # don't leak the thread's DB connection
        except Exception:
            pass
