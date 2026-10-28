"""Settings for the DistroPedia Django port.

Environment names are the same ones the Express backend used
(see backend/.env.example) so a single .env can drive either stack.
"""

import os
from pathlib import Path

from config.env import env, env_bool, env_list

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = env("DJANGO_SECRET_KEY", "dev-insecure-django-key-change-me")
DEBUG = env_bool("DEBUG", True)
ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", ["*"])

# Same-origin: Django serves both the pages and /api. CLIENT_URL is kept for
# parity with the Express CORS config (dev servers on another origin).
CLIENT_URL = env("CLIENT_URL", "http://localhost:5173")

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "django.contrib.staticfiles",
    "apps.core",
    "apps.catalogue",
    "apps.accounts",
    "apps.chat",
    "apps.community",
    "apps.quiz",
]

MIDDLEWARE = [
    "apps.core.middleware.ApiCorsMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "config.urls"

# The SPA shell is one template; every page route renders it and the
# client-side router (static/js/core/router.js) picks the page — exactly
# like the React app's pushState router did.
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": []},
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
        "OPTIONS": {"timeout": 20},
    }
}

# SQLite has no fulltext search; the API uses case-insensitive substring
# matches instead, which is what the Mongo $regex search did anyway.

AUTH_USER_MODEL = "accounts.User"

PASSWORD_HASHERS = [
    # bcryptjs at cost 10 — the Express backend's exact hash format ($2b$10$…)
    "apps.accounts.hashers.BcryptJsPasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---- API behaviour knobs (mirroring the Express implementation) ----
JWT_SECRET = env("JWT_SECRET", "dev-insecure-jwt-secret")
JWT_EXPIRY_SECONDS = 7 * 24 * 60 * 60  # expiresIn: '7d'
PORT = int(env("PORT", "8000"))

# Google sign-in is inert until both client ids are set (same as before).
GOOGLE_CLIENT_ID = env("GOOGLE_CLIENT_ID", "")

# Groq key pool: GROQ_API_KEY may itself be a comma-separated list, and
# GROQ_API_KEY_2 … _5 add more. 429/401 responses cool a key down.
GROQ_KEYS = env_list("GROQ_API_KEY", []) + env_list(
    "GROQ_API_KEY_2", []
) + env_list("GROQ_API_KEY_3", []) + env_list("GROQ_API_KEY_4", []) + env_list(
    "GROQ_API_KEY_5", []
)
GROQ_KEYS = list(dict.fromkeys(k for k in GROQ_KEYS if k))[:5]
GROQ_MODEL = env("GROQ_MODEL", "openai/gpt-oss-120b")

TYPESAFE_API_KEY = env("TYPESAFE_API_KEY", "")
TYPESAFE_MODEL = env("TYPESAFE_MODEL", "jev-latest")

# Password-reset delivery: smtp when SMTP_HOST is set, else console (dev).
RESET_DELIVERY = env("RESET_DELIVERY", "smtp" if env("SMTP_HOST") else "console")
SMTP_HOST = env("SMTP_HOST", "")
SMTP_PORT = int(env("SMTP_PORT", "587"))
SMTP_SECURE = env_bool("SMTP_SECURE", False)
SMTP_USER = env("SMTP_USER", "")
SMTP_PASS = env("SMTP_PASS", "")
SMTP_FROM = env("SMTP_FROM", SMTP_USER)
NODE_ENV = env("NODE_ENV", "development")

# Error payloads include a stack trace unless running in production, matching
# the Express errorMiddleware (`NODE_ENV !== 'production'`).
EXPOSE_ERROR_STACK = NODE_ENV != "production" and DEBUG

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
}
