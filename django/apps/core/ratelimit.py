"""In-memory sliding-window limiter (single process; swap for Redis if the
app ever scales out).
"""

import threading
import time

from apps.core.errors import ApiError

_buckets = {}  # key -> list[epoch_ms]
_lock = threading.Lock()

SWEEP_INTERVAL_S = 300


def _prune(hits, now, window_ms):
    index = 0
    while index < len(hits) and now - hits[index] >= window_ms:
        index += 1
    del hits[:index]
    return hits


def _sweep(now):
    """Drop empty buckets so the map can't grow forever (setInterval twin)."""
    hour = 60 * 60 * 1000
    for key in list(_buckets):
        hits = _prune(_buckets[key], now, hour)
        if not hits:
            _buckets.pop(key, None)


def identity(request, user):
    """User id when logged in, else the client IP."""
    if user is not None:
        return str(user.pk)
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR") or request.META.get("REMOTE_HOST") or "unknown"


def enforce(request, user, spec):
    (window_ms, max_hits), preset_message = resolve(spec)
    key = f"{request.path}:{identity(request, user)}"
    now = int(time.time() * 1000)

    with _lock:
        hits = list(_buckets.get(key, []))
        _prune(hits, now, window_ms)
        if len(hits) >= max_hits:
            retry_after = max(int(round((hits[0] + window_ms - now) / 1000)), 1)
            _buckets[key] = hits
            request._api_headers = {"Retry-After": str(retry_after)}
            raise ApiError(
                preset_message or f"Too many requests — try again in {retry_after}s.", 429
            )
        hits.append(now)
        _buckets[key] = hits
        if int(now // 1000) % SWEEP_INTERVAL_S == 0:
            _sweep(now)


# Presets used by the routes (generous for humans, hostile to scripts).
VOTE_LIMIT = (60 * 1000, 60)
POST_LIMIT = (10 * 60 * 1000, 5, "Too many posts — please wait a few minutes before posting again.")
COMMENT_LIMIT = (
    10 * 60 * 1000,
    20,
    "Too many comments — please slow down a little.",
)
QUIZ_LIMIT = (60 * 1000, 20, "Too many quiz requests — please wait a moment.")
CHAT_MESSAGE_LIMIT = (60 * 1000, 30, "Too many messages — please wait a moment.")
AUTH_LIMIT = (15 * 60 * 1000, 30, "Too many auth attempts — please wait a few minutes.")
SUGGEST_CHANNEL_LIMIT = (60 * 1000, 20, "Too many suggestions — please wait a moment.")


def resolve(spec):
    """Presets may carry their own message as a third tuple element."""
    if len(spec) == 3:
        return (spec[0], spec[1]), spec[2]
    return spec, None
