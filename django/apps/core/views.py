"""Health check and the not-found envelope."""

import re
from datetime import datetime, timezone

from apps.core.errors import endpoint, error_payload, json_payload

SAFE_ASSET_RE = re.compile(r"^[A-Za-z0-9._-]+(?:/[A-Za-z0-9._-]+)*$")


@endpoint(methods=("GET",))
def health(request, body, user):
    from apps.core.serialize import iso

    # app.get('/api/health') — any other method fell through to notFound.
    return {
        "success": True,
        "message": "Linux Hub API is running",
        # new Date().toISOString() — millisecond precision, Z suffix
        "time": iso(datetime.now(timezone.utc)),
    }


def api_not_found(request):
    return error_payload(
        request, f"Not found: {request.method} {request.get_full_path()}", 404
    )

