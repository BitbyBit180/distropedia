"""Auth endpoints — register / login / google / me / password reset.

Validation order, message wording and status codes follow
backend/src/controllers/authController.js. Passwords are bcrypt-hashed like the
Node version did (cost 10), and tokens are HS256 JWTs carrying `{ id }` with a
7-day expiry.
"""

import hashlib
import re
import secrets
import time
from datetime import datetime, timedelta, timezone

import requests
from django.contrib.auth.hashers import make_password

from apps.accounts.models import User
from apps.core.errors import ApiError, endpoint, json_payload
from apps.core.mailer import deliver_reset_token
from apps.core.ratelimit import AUTH_LIMIT
from apps.core.security import sign_token
from apps.core.serialize import user_json
from config import settings

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
RESET_TTL_MS = 15 * 60 * 1000


def _token_payload(user):
    """respondWithToken: { success, token, data: user }"""
    return {"success": True, "token": sign_token(user.pk), "data": user_json(user)}


def _new_otp():
    """crypto.randomInt(100000, 1000000) -> a 6-digit code."""
    return str(secrets.randbelow(900000) + 100000)


def _hash_otp(otp):
    return hashlib.sha256(str(otp).strip().encode()).hexdigest()


def _find_reset_user(token):
    digest = _hash_otp(token)
    user = User.objects.filter(
        reset_token_hash=digest, reset_token_expiry__gt=datetime.now(timezone.utc)
    ).first()
    if user is None:
        raise ApiError("Code is incorrect or expired", 400)
    # Constant-time compare on the stored hash, as the Node controller did.
    if not secrets.compare_digest(user.reset_token_hash.encode(), digest.encode()):
        raise ApiError("Code is incorrect or expired", 400)
    return user


@endpoint(methods=("POST",), limiter=AUTH_LIMIT)
def register(request, body, user):
    name = (body or {}).get("name", "") or ""
    email = (body or {}).get("email", "") or ""
    password = (body or {}).get("password", "") or ""

    if not str(email).strip() or not password:
        raise ApiError("Email and password are required", 400)
    if not EMAIL_RE.match(str(email).strip()):
        raise ApiError("Please provide a valid email address", 400)
    if len(password) < 6:
        raise ApiError("Password must be at least 6 characters", 400)

    email_norm = str(email).strip().lower()
    if User.objects.filter(email=email_norm).exists():
        raise ApiError("An account with this email already exists", 409)

    created = User(
        name=str(name).strip(),
        email=email_norm,
        # bcrypt, cost factor 10 — same as `bcrypt.hash(password, 10)`
        password=make_password(password, hasher="bcrypt"),
    )
    created.save()
    return _token_payload(created), 201


@endpoint(methods=("POST",), limiter=AUTH_LIMIT)
def login(request, body, user):
    email = (body or {}).get("email", "") or ""
    password = (body or {}).get("password", "") or ""

    if not str(email).strip() or not password:
        raise ApiError("Email and password are required", 400)

    account = User.objects.filter(email=str(email).strip().lower()).first()
    # Same message for both cases — no account enumeration.
    if account is None or not account.password:
        raise ApiError("Invalid email or password", 401)
    if not account.check_password(password):
        raise ApiError("Invalid email or password", 401)

    return _token_payload(account)


@endpoint(methods=("POST",), limiter=AUTH_LIMIT)
def google(request, body, user):
    """Sign in with Google: verify the ID token, then find-or-link-or-create."""
    client_id = (settings.GOOGLE_CLIENT_ID or "").strip()
    if not client_id:
        raise ApiError(
            "Google sign-in is not configured. Add GOOGLE_CLIENT_ID to django/.env", 503
        )

    credential = str((body or {}).get("credential", "")).strip()
    if not credential:
        raise ApiError("Google credential is required", 400)

    try:
        response = requests.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": credential},
            timeout=10,
        )
        if not response.ok:
            raise ValueError("tokeninfo rejected")
        claims = response.json()
    except Exception:  # noqa: BLE001 - network or bad payload
        raise ApiError("Google verification failed. Please try again.", 401)

    now_sec = int(time.time())
    if (
        claims.get("aud") != client_id
        or claims.get("email_verified") != "true"
        or int(claims.get("exp", 0) or 0) < now_sec
        or not claims.get("email")
        or not claims.get("sub")
    ):
        raise ApiError("Google account could not be verified.", 401)

    email_norm = str(claims["email"]).lower()
    account = User.objects.filter(google_id=claims["sub"]).first() or User.objects.filter(
        email=email_norm
    ).first()

    if account:
        # Google proved email ownership, so a password account simply gains a
        # second way to sign in — the password keeps working.
        if not account.google_id:
            account.google_id = claims["sub"]
        if not account.name and claims.get("name"):
            account.name = str(claims["name"])[:80]
        account.save()
    else:
        try:
            account = User.objects.create(
                email=email_norm,
                name=str(claims.get("name") or "")[:80],
                google_id=claims["sub"],
                password="",  # Google-only account: no password set
            )
        except Exception:
            # Parallel first-logins for the same email: link the winner's row.
            account = User.objects.filter(email=email_norm).first()
            if account is None:
                raise ApiError("Google sign-in failed. Please try again.", 500)
            if not account.google_id:
                account.google_id = claims["sub"]
                account.save()

    return _token_payload(account)


@endpoint(methods=("GET",), auth=True)
def me(request, body, user):
    return {"success": True, "data": user_json(user)}


@endpoint(methods=("POST",), limiter=AUTH_LIMIT)
def forgot_password(request, body, user):
    email_norm = str((body or {}).get("email", "")).strip().lower()
    generic = "If an account exists for that email, a reset token is on its way."
    if EMAIL_RE.match(email_norm):
        account = User.objects.filter(email=email_norm).first()
        if account:
            otp = _new_otp()
            account.reset_token_hash = _hash_otp(otp)
            account.reset_token_expiry = datetime.now(timezone.utc) + timedelta(
                milliseconds=RESET_TTL_MS
            )
            account.save()
            try:
                deliver_reset_token(email=email_norm, token=otp)
            except Exception as exc:  # noqa: BLE001
                account.reset_token_hash = None
                account.reset_token_expiry = None
                account.save()
                raise ApiError(
                    str(exc) or "Could not send the reset code. Please try again.", 503
                )
    return {"success": True, "message": generic}


@endpoint(methods=("POST",), limiter=AUTH_LIMIT)
def verify_reset_token(request, body, user):
    token = str((body or {}).get("token", "")).strip()
    if not re.match(r"^\d{6}$", token):
        raise ApiError("Enter the 6-digit code from the email", 400)
    _find_reset_user(token)
    return {"success": True, "message": "Code verified — choose a new password."}


@endpoint(methods=("POST",), limiter=AUTH_LIMIT)
def reset_password(request, body, user):
    token = str((body or {}).get("token", "")).strip()
    password = (body or {}).get("password", "") or ""
    if not re.match(r"^\d{6}$", token) or len(password) < 6:
        raise ApiError("A 6-digit code and a 6+ character password are required", 400)

    account = _find_reset_user(token)
    account.password = make_password(password, hasher="bcrypt")
    account.reset_token_hash = None
    account.reset_token_expiry = None
    account.save()
    return {"success": True, "message": "Password updated — please sign in."}
