"""Shared JSON shaping — API payloads keep the frontend's key names
(id / init / installGuide) and hide the database internals.
"""

from datetime import datetime, timezone


def iso(value):
    """Dates serialise as ISO-8601 with ms and Z: `2026-10-28T19:37:00.123Z`."""
    if value is None:
        return None
    if isinstance(value, str):
        return value
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    value = value.astimezone(timezone.utc)
    return value.strftime("%Y-%m-%dT%H:%M:%S.") + f"{value.microsecond // 1000:03d}Z"


def user_json(user):
    """User model transform: expose id, hide password/reset/google fields."""
    if user is None:
        return None
    return {
        "email": user.email,
        "name": user.name,
        "isAdmin": user.is_admin,
        "createdAt": iso(user.created_at),
        "updatedAt": iso(user.updated_at),
        "id": user.pk,
    }


def author_json(user):
    """populate('author', 'name') equivalent — only these two keys appear."""
    if user is None:
        return None
    return {"name": user.name, "id": user.pk}


def timestamp_fields(obj):
    return {
        "createdAt": iso(obj.created_at),
        "updatedAt": iso(obj.updated_at),
    }
