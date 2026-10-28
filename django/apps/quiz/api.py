"""Quiz API — POST /api/quiz/recommend, a stage-for-stage port of
quizController.js.

The verdict is FULLY AI (Jev Choice over the whole catalogue); there is no
scoring table. `ai: false` means "Jev unavailable or unsure" and the client
shows an error with a retry, never a hardcoded guess. Every successful call
answers 200, including the degraded ones.
"""

from django.conf import settings

from apps.catalogue.models import Distro
from apps.catalogue.static_data import static_distros
from apps.core.errors import ApiError, endpoint
from apps.core.ratelimit import QUIZ_LIMIT

# Lean catalogue for the AI prompt: DB first, static seed as fallback.
CATALOGUE_FIELDS = ("distro_id", "name", "tagline", "category", "desktop", "release_model", "min_ram")


def load_catalogue():
    try:
        rows = [
            dict(zip(CATALOGUE_FIELDS, row))
            for row in Distro.objects.values_list(*CATALOGUE_FIELDS).order_by("pk")
        ]
        if rows:
            return [
                {
                    "id": d["distro_id"],
                    "name": d["name"],
                    "tagline": d["tagline"] or "",
                    "category": d["category"] or "",
                    "desktop": d["desktop"] or "",
                    "releaseModel": d["release_model"] or "",
                    "minRam": d["min_ram"] or "",
                }
                for d in rows
            ]
    except Exception:  # noqa: BLE001 - a DB outage falls back to static data
        pass
    return [
        {
            "id": d.get("id"),
            "name": d.get("name"),
            "tagline": d.get("tagline") or "",
            "category": d.get("category") or "",
            "desktop": d.get("desktop") or "",
            "releaseModel": d.get("releaseModel") or "",
            "minRam": d.get("minRam") or "",
        }
        for d in static_distros()
    ]


def sanitize_order(ids, allowed):
    """Keep only ids the catalogue actually has, preserving order, no dupes."""
    seen, out = set(), []
    for raw in ids or []:
        key = str(raw or "").lower()
        if not key or key in seen or key not in allowed:
            continue
        seen.add(key)
        out.append(key)
    return out


@endpoint(methods=("POST",), limiter=QUIZ_LIMIT)
def recommend(request, body, user):
    answers = body.get("answers") if isinstance(body.get("answers"), list) else []

    if len(answers) == 0:
        raise ApiError("Provide quiz answers.", 400)

    catalogue = load_catalogue()
    allowed = {str(d["id"]).lower() for d in catalogue}

    def fallback(message):
        return {
            "success": True,
            "ai": False,
            "winner": None,
            "runnersUp": [],
            "explanation": None,
            "strengths": {},
            "tip": None,
            "message": message,
        }

    # Graceful degradation before spending a model call.
    key = settings.TYPESAFE_API_KEY or ""
    if not key.strip():
        from apps.ai.jev_client import NO_KEY_MESSAGE

        return fallback(NO_KEY_MESSAGE)

    from apps.ai.quiz_agent import MIN_TOP_PROBABILITY, recommend_distro

    try:
        verdict = recommend_distro(answers=answers, catalogue=catalogue)
    except Exception as err:  # noqa: BLE001 - the controller never 500s here
        return fallback(str(err) or "AI recommendation failed. Please try again.")

    verdict = verdict or {}

    # The model must pick from the catalogue — repair or report unsure.
    winner = sanitize_order([verdict.get("winner")], allowed)[0:1]
    winner = winner[0] if winner else None
    runners_up = [
        rid
        for rid in sanitize_order(verdict.get("runnersUp"), allowed)
        if rid != winner
    ]
    top_probability = verdict.get("topProbability")
    if top_probability is None:
        top_probability = 1
    # A near-uniform distribution means Jev couldn't separate the options —
    # report unsure instead of presenting a coin flip as a verdict.
    if not winner or top_probability < MIN_TOP_PROBABILITY:
        return fallback(
            "AI returned an unknown distro. Please try again."
            if not winner
            else "AI was unsure — please try again."
        )

    explanation = verdict.get("explanation")
    tip = verdict.get("tip")
    strengths = verdict.get("strengths")
    return {
        "success": True,
        "ai": True,
        "winner": winner,
        "runnersUp": runners_up[:2],
        "probabilities": verdict.get("probabilities") or {},
        "confidence": verdict.get("confidence"),
        "explanation": explanation[:800] if isinstance(explanation, str) else "",
        "strengths": strengths if isinstance(strengths, dict) else {},
        "tip": tip[:200] if isinstance(tip, str) else "",
    }
