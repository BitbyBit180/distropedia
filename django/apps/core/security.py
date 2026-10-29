"""Bearer-token auth (`protect` / `requireAdmin`).

Messages and status codes are part of the API contract — the frontend branches
on them
(err.status === 401 sends the visitor to the login view).
"""

import jwt

from config import settings
from apps.core.errors import ApiError


def sign_token(user_id):
    """jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' })"""
    import time

    return jwt.encode(
        {"id": str(user_id), "exp": int(time.time()) + settings.JWT_EXPIRY_SECONDS},
        settings.JWT_SECRET,
        algorithm="HS256",
    )


def authenticate_request(request, required=True):
    header = request.META.get("HTTP_AUTHORIZATION", "") or ""
    if not header.startswith("Bearer "):
        if not required:
            return None
        raise ApiError(
            'Not authorized, token missing. Send "Authorization: Bearer <token>"', 401
        )

    token = header.split(" ")[1]
    try:
        decoded = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except Exception:
        raise ApiError("Not authorized, token invalid or expired", 401)

    from apps.accounts.models import User

    try:
        user = User.objects.filter(pk=decoded.get("id")).first()
    except (ValueError, TypeError):
        user = None
    if user is None:
        raise ApiError("Not authorized, user no longer exists", 401)
    return user


def require_admin(user):
    if not (user and getattr(user, "is_admin", False)):
        raise ApiError("Admin access required", 403)
