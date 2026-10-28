"""CHANNEL-SUGGEST agent — picks the right community channel for a draft
post. One Jev Choice over `general` + every distro channel; the composer
shows it as a suggestion chip, the user still decides (code owns the
workflow, Jev supplies the judgment)."""

from apps.ai.jev_client import system_one


def suggest_channel(title="", body=""):
    # Imported lazily so this module loads without the app registry.
    from apps.catalogue.models import Flavour

    flavours = Flavour.objects.values_list("distro_id", "name")
    criteria = {
        "general": "General Linux chat — introductions, news, and anything off-topic"
    }
    for distro_id, name in flavours:
        criteria[distro_id] = f"Discussions specifically about {name}"

    data = system_one(
        state={"title": str(title)[:200], "body": str(body)[:2000]},
        questions={
            "channel": {
                "type": "choice",
                "instructions": {
                    "question": "Which community channel best fits the draft post in `title` and `body`?",
                    "rubric": "Choose `general` for introductions, news, hardware-agnostic questions, and anything not tied to one distro. Choose a distro channel only when the post is specifically about installing, configuring, or troubleshooting THAT distro.",
                },
                "criteria": criteria,
            }
        },
    )

    answer = (data.get("answers") or {}).get("channel")
    if (
        not answer
        or not isinstance(answer, dict)
        or answer.get("type") != "choice"
        or not answer.get("choice")
    ):
        raise Exception("AI returned an unreadable suggestion. Please try again.")
    channel = str(answer["choice"]).lower()
    if channel not in criteria:
        raise Exception("AI suggested an unknown channel.")
    confidence = answer.get("confidence")
    if isinstance(confidence, bool) or not isinstance(confidence, (int, float)):
        confidence = None
    return {"channel": channel, "confidence": confidence}
