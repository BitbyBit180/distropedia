"""Health check, the SPA shell, 404 envelope, and root-relative asset serving.

The React build served its images from the public/ root (`/same-bg.webp`,
`/install-guide/*.png`, `/tux/scene.gltf`, `/tux.svg`), and the ported markup
still references those exact paths — so Django serves them from static/assets
instead of forcing a rewrite of every image URL.
"""

import mimetypes
import os
import re
from datetime import datetime, timezone

from django.http import Http404, FileResponse, HttpResponse
from django.template.loader import render_to_string

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


def spa_shell(request):
    from config import settings

    html = render_to_string(
        "spa.html",
        {
            # What the old `import.meta.env.VITE_*` values resolved to.
            "api_url": "/api",
            "google_client_id": settings.GOOGLE_CLIENT_ID,
        },
        request=request,
    )
    return HttpResponse(html)


def asset(request, rel_path):
    """`/tux.svg`, `/ubuntu-card-bg.webp`, `/install-guide/x.png`, `/tux/scene.gltf`."""
    from config import settings

    if ".." in rel_path or not SAFE_ASSET_RE.match(rel_path):
        raise Http404("Invalid asset path")

    root = os.path.normpath(os.path.join(settings.STATICFILES_DIRS[0], "assets"))
    full = os.path.normpath(os.path.join(root, rel_path))
    if not full.startswith(root) or not os.path.isfile(full):
        raise Http404("Asset not found")

    content_type = mimetypes.guess_type(full)[0] or "application/octet-stream"
    # The glTF scene references scene.bin by relative URL, so both are served
    # same-origin, like they were from the old public/ folder.
    response = FileResponse(open(full, "rb"), content_type=content_type)
    response["Cache-Control"] = "public, max-age=3600"
    return response
