"""Settings for the DistroPedia API.

These cover the JSON API only: the React/Vite app in `frontend/` is the UI,
connected with `VITE_API_URL=http://localhost:8010/api` in dev (or same-origin
in production). Secrets and knobs live in django/.env — see .env.example.
"""

import os
from pathlib import Path

from config.env import env, env_bool, env_list

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = env("DJANGO_SECRET_KEY", "dev-insecure-django-key-change-me")
DEBUG = env_bool("DEBUG", True)
ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", ["*"])

# Same-origin: in production the built frontend can be served by Django or a
# CDN proxying /api. CLIENT_URL is the dev origin allowed cross-origin CORS.
CLIENT_URL = env("CLIENT_URL", "http://localhost:5173")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "apps.core",
    "apps.catalogue",
    "apps.accounts",
    "apps.chat",
    "apps.community",
    "apps.quiz",
    "apps.learning",
]

MIDDLEWARE = [
    "apps.core.middleware.ApiCorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

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
# matches instead.

AUTH_USER_MODEL = "accounts.User"

PASSWORD_HASHERS = [
    # bcrypt at cost 10 — the API's hash format ($2b$10$…)
    "apps.accounts.hashers.Bcrypt10PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---- API behaviour knobs ----
JWT_SECRET = env("JWT_SECRET", "dev-insecure-jwt-secret")
JWT_EXPIRY_SECONDS = 7 * 24 * 60 * 60  # expiresIn: '7d'
PORT = int(env("PORT", "8010"))

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
APP_ENV = env("APP_ENV", "development")

# Error payloads include a stack trace unless running in development.
EXPOSE_ERROR_STACK = APP_ENV != "production" and DEBUG

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
}
