"""Settings for the DistroPedia API.

These cover the JSON API only: the React/Vite app in `frontend/` is the UI,
connected with `VITE_API_URL=http://localhost:8010/api` in dev (or same-origin
in production). Secrets and knobs live in django/.env — see .env.example.
"""

import os
from pathlib import Path

from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _

from config.env import env, env_bool, env_list

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = env("DJANGO_SECRET_KEY", "dev-insecure-django-key-change-me")
DEBUG = env_bool("DEBUG", True)
ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", ["*"])

# Same-origin: in production the built frontend can be served by Django or a
# CDN proxying /api. CLIENT_URL is the dev origin allowed cross-origin CORS.
CLIENT_URL = env("CLIENT_URL", "http://localhost:5173")

INSTALLED_APPS = [
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",
    "unfold.contrib.inlines",
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

import dj_database_url

DATABASES = {
    "default": dj_database_url.parse(
        env("DATABASE_URL", f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
        conn_max_age=60,
        conn_health_checks=True,
    )
}

# SQLite has no fulltext search; the API uses case-insensitive substring
# matches instead.

AUTH_USER_MODEL = "accounts.User"
LOGIN_REDIRECT_URL = "/admin/"
LOGIN_URL = "/admin/login/"

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

# ---- Django Unfold UI Configuration ----
UNFOLD = {
    "SITE_TITLE": "DistroPedia Command Center",
    "SITE_HEADER": "DistroPedia",
    "SITE_SUBHEADER": "Linux Distribution Hub & Learning Management",
    "SITE_URL": "/",
    "SITE_SYMBOL": "terminal",
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": True,
    "THEME": "dark",
    "LOGIN": {
        "redirect_after": reverse_lazy("admin:index"),
    },
    "ENVIRONMENT": "apps.core.dashboard.environment_callback",
    "DASHBOARD_CALLBACK": "apps.core.dashboard.dashboard_callback",
    "COLORS": {
        "primary": {
            "50": "#fff7ed",
            "100": "#ffedd5",
            "200": "#fed7aa",
            "300": "#fdba74",
            "400": "#fb923c",
            "500": "#f97316",
            "600": "#ea580c",
            "700": "#c2410c",
            "800": "#9a3412",
            "900": "#7c2d12",
            "950": "#431407",
        },
    },
    "COMMAND": {
        "search_models": True,
        "show_history": True,
    },
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": False,
        "navigation": [
            {
                "title": _("Catalogue"),
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": _("Linux Distros"),
                        "icon": "terminal",
                        "link": reverse_lazy("admin:catalogue_distro_changelist"),
                        "badge": "apps.core.dashboard.total_distros_badge",
                    },
                    {
                        "title": _("Distro Flavours"),
                        "icon": "category",
                        "link": reverse_lazy("admin:catalogue_flavour_changelist"),
                    },
                ],
            },
            {
                "title": _("Community & Moderation"),
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": _("Reports Queue"),
                        "icon": "gavel",
                        "link": reverse_lazy("admin:community_report_changelist"),
                        "badge": "apps.core.dashboard.pending_reports_badge",
                    },
                    {
                        "title": _("Posts & Discussions"),
                        "icon": "forum",
                        "link": reverse_lazy("admin:community_post_changelist"),
                    },
                    {
                        "title": _("Comments"),
                        "icon": "chat_bubble",
                        "link": reverse_lazy("admin:community_comment_changelist"),
                    },
                    {
                        "title": _("Votes"),
                        "icon": "thumb_up",
                        "link": reverse_lazy("admin:community_vote_changelist"),
                    },
                    {
                        "title": _("Notifications"),
                        "icon": "notifications",
                        "link": reverse_lazy("admin:community_notification_changelist"),
                    },
                    {
                        "title": _("Audit Log"),
                        "icon": "history_toggle_off",
                        "link": reverse_lazy("admin:community_auditlog_changelist"),
                    },
                ],
            },
            {
                "title": _("Learning Platform"),
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": _("Learning Plans"),
                        "icon": "school",
                        "link": reverse_lazy("admin:learning_learningplan_changelist"),
                    },
                    {
                        "title": _("Lessons"),
                        "icon": "menu_book",
                        "link": reverse_lazy("admin:learning_lesson_changelist"),
                    },
                    {
                        "title": _("Practical Exercises"),
                        "icon": "code",
                        "link": reverse_lazy("admin:learning_practicalexercise_changelist"),
                    },
                    {
                        "title": _("Verification Rules"),
                        "icon": "rule",
                        "link": reverse_lazy("admin:learning_verificationrule_changelist"),
                    },
                    {
                        "title": _("Assessments"),
                        "icon": "quiz",
                        "link": reverse_lazy("admin:learning_assessment_changelist"),
                    },
                    {
                        "title": _("Assessment Questions"),
                        "icon": "help_outline",
                        "link": reverse_lazy("admin:learning_assessmentquestion_changelist"),
                    },
                    {
                        "title": _("User Lesson Progress"),
                        "icon": "trending_up",
                        "link": reverse_lazy("admin:learning_userlessonprogress_changelist"),
                    },
                    {
                        "title": _("Exercise Attempts"),
                        "icon": "fact_check",
                        "link": reverse_lazy("admin:learning_exerciseattempt_changelist"),
                    },
                    {
                        "title": _("Assessment Attempts"),
                        "icon": "military_tech",
                        "link": reverse_lazy("admin:learning_assessmentattempt_changelist"),
                    },
                    {
                        "title": _("User Achievements"),
                        "icon": "emoji_events",
                        "link": reverse_lazy("admin:learning_userachievement_changelist"),
                    },
                ],
            },
            {
                "title": _("AI Chatbot"),
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": _("Chat Sessions"),
                        "icon": "smart_toy",
                        "link": reverse_lazy("admin:chat_chat_changelist"),
                    },
                    {
                        "title": _("Chat Messages"),
                        "icon": "question_answer",
                        "link": reverse_lazy("admin:chat_chatmessage_changelist"),
                    },
                ],
            },
            {
                "title": _("Access & Identity"),
                "separator": True,
                "collapsible": True,
                "items": [
                    {
                        "title": _("Users & Admins"),
                        "icon": "group",
                        "link": reverse_lazy("admin:accounts_user_changelist"),
                        "badge": "apps.core.dashboard.total_users_badge",
                    },
                ],
            },
        ],
    },
}
