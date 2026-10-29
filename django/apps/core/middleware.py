"""CORS for the API — only CLIENT_URL (the Vite dev server) is allowed.

The API is normally consumed same-origin, so this only matters when the Vite
dev server (or another origin) calls the API directly. A preflight is answered
here — before routing, so it never reaches authentication or a 404 — with 204
plus the Access-Control headers.
"""

from django.http import HttpResponse

PREFLIGHT_HEADERS = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
}


class ApiCorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        from config import settings

        origin = request.META.get("HTTP_ORIGIN", "")
        allowed = settings.CLIENT_URL
        is_api = request.path == "/api" or request.path.startswith("/api/")
        cors_origin = allowed if (is_api and origin and origin == allowed) else None

        if (
            cors_origin
            and request.method == "OPTIONS"
            and request.META.get("HTTP_ACCESS_CONTROL_REQUEST_METHOD")
        ):
            response = HttpResponse(status=204)
            self._apply(response, cors_origin)
            response["Vary"] = "Origin"
            for key, value in PREFLIGHT_HEADERS.items():
                response[key] = value
            return response

        response = self.get_response(request)
        if cors_origin:
            self._apply(response, cors_origin)
        return response

    @staticmethod
    def _apply(response, origin):
        response["Access-Control-Allow-Origin"] = origin
        response["Access-Control-Allow-Credentials"] = "true"
        response["Vary"] = "Origin"
