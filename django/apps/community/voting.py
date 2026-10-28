"""Vote application — the Vote.applyVote twin.

Sequential writes, no transaction: the unique (user, target, target_type)
constraint keeps the vote write idempotent and score drift from a rare failure
is corrected by the next vote. If the target row vanished, the vote write is
rolled back before the 404 goes out.
"""

from apps.community.models import Comment, Post, Vote
from apps.core.errors import ApiError

TARGETS = {"post": Post, "comment": Comment}


def apply_vote(user_id, target_type, target_id, value):
    if value not in (1, -1, 0):
        raise ApiError("value must be 1, -1, or 0", 400)

    model = TARGETS[target_type]
    existing = Vote.objects.filter(
        user_id=user_id, target_type=target_type, target_id=target_id
    ).first()
    existing_value = existing.value if existing else 0
    delta = value - existing_value

    if value == 0:
        if existing:
            existing.delete()
    elif existing:
        existing.value = value
        existing.save()
    else:
        existing = Vote.objects.create(
            user_id=user_id, target_type=target_type, target_id=target_id, value=value
        )

    target = model.objects.filter(pk=target_id).first()
    if target is None:
        # Target vanished — undo the vote write so no dangling vote remains.
        if value != 0:
            if existing_value:
                existing.value = existing_value
                existing.save()
            else:
                Vote.objects.filter(
                    user_id=user_id, target_type=target_type, target_id=target_id
                ).delete()
        raise ApiError(
            "Post not found" if target_type == "post" else "Comment not found", 404
        )

    target.score += delta
    target.save(update_fields=["score"])
    return {"score": target.score, "userVote": value}


def user_vote(user_id, target_type, target_id):
    row = Vote.objects.filter(
        user_id=user_id, target_type=target_type, target_id=target_id
    ).first()
    return row.value if row else 0


def user_votes_by_target(user_id, target_type, ids):
    """One query for a whole batch — the `withUserVotes` helper."""
    if not ids:
        return {}
    rows = Vote.objects.filter(user_id=user_id, target_type=target_type, target_id__in=ids)
    return {row.target_id: row.value for row in rows}
