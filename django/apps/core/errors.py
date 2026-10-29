"""The API error contract.

Every API response is JSON shaped `{ success, ... }`; failures are
`{ success: false, message }` (plus `stack` outside production). Handlers
raise ApiError with the status they want.
"""

import json
import logging
import traceback

from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from django.http import HttpResponse, HttpResponseBase
from django.views.decorators.csrf import csrf_exempt

from config import settings

log = logging.getLogger("api")


class ApiError(Exception):
    def __init__(self, message, status=500):
        super().__init__(message)
        self.status = status


class MethodNotAllowed(ApiError):
    pass


def json_payload(request, payload, status=200, headers=None):
    response = HttpResponse(
        json.dumps(payload), status=status, content_type="application/json"
    )
    for key, value in (headers or {}).items():
        response[key] = value
    return response


def error_payload(request, message, status):
    body = {"success": False, "message": message}
    if settings.EXPOSE_ERROR_STACK and status == 500:
        body["stack"] = traceback.format_exc()
    # Headers set before the failure (the limiter's Retry-After) still apply
    # to the error response, so request-scoped headers carry over.
    return json_payload(request, body, status, getattr(request, "_api_headers", None))


def read_body(request):
    """Parse the JSON body: {} when there is none."""
    if not request.body:
        return {}
    try:
        parsed = json.loads(request.body.decode("utf-8"))
    except (ValueError, UnicodeDecodeError) as exc:
        raise ApiError(f"Invalid JSON body: {exc.msg if hasattr(exc, 'msg') else 'parse error'}", 400)
    return parsed if isinstance(parsed, dict) else {"": parsed}


def endpoint(
    methods=("GET",),
    auth=False,
    admin=False,
    limiter=None,
):
    """Wrap a handler as an API route.

    Order: authentication first, then the rate limiter — whose key is the user
    id when logged in, else the IP — then
    the controller. The handler receives `(request, body, user)` and returns a
    payload dict plus optional status.
    """

    def decorator(handler):
        @csrf_exempt
        def view(request, *args, **kwargs):
            try:
                # OPTIONS is handled by ApiCorsMiddleware (a preflight is answered
                # there before routing); anything that reaches here is a method
                # the route does not implement, and those answer 404 (not 405).
                if request.method not in methods:
                    # A path that matches but a method that does not is a 404,
                    # not a 405 — the frontend depends on that.
                    raise ApiError(
                        f"Not found: {request.method} {request.get_full_path()}", 404
                    )

                user = None
                if auth or admin:
                    # public routes never resolve a user, so their limiter
                    # key falls back to the IP.
                    from apps.core.security import authenticate_request

                    user = authenticate_request(request, required=True)
                if admin:
                    from apps.core.security import require_admin

                    require_admin(user)
                if limiter is not None:
                    from apps.core.ratelimit import enforce

                    enforce(request, user, limiter)

                body = read_body(request)
                result = handler(request, body, user, *args, **kwargs)
                if isinstance(result, HttpResponseBase):
                    # A handler may return its own response (the SSE stream).
                    return result
                if result is None:
                    raise ApiError("Handler returned no response", 500)
                if isinstance(result, tuple):
                    payload, status = result
                else:
                    payload, status = result, 200
                headers = getattr(request, "_api_headers", None)
                return json_payload(request, payload, status, headers)

            except ApiError as exc:
                return error_payload(request, str(exc), exc.status)
            except ValidationError as exc:
                # field validation -> 400 {message:'Validation failed', errors:[...]}
                return json_payload(
                    request,
                    {
                        "success": False,
                        "message": "Validation failed",
                        "errors": list(exc.messages),
                    },
                    400,
                )
            except IntegrityError as exc:
                # unique-constraint violation -> 409
                return json_payload(
                    request,
                    {
                        "success": False,
                        "message": f"Duplicate value: {exc}",
                    },
                    409,
                )
            except Exception as exc:  # noqa: BLE001 - mirrors errorHandler
                log.exception("Unhandled API error on %s", request.get_full_path())
                status = getattr(exc, "status", None) or 500
                return error_payload(request, str(exc) or "Server error", status)

        view.__name__ = handler.__name__
        return view

    return decorator


def set_cache_control(request, value):
    """res.set('Cache-Control', ...) equivalent for the current request."""
    request._api_headers = {"Cache-Control": value}


def parse_id(raw):
    """An uncastable id is a 400, not a 500."""
    try:
        return int(str(raw).strip())
    except (TypeError, ValueError):
        raise ApiError(f"Invalid id: {raw}", 400)
