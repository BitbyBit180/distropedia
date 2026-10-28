"""Tiny .env reader so settings.py has no hard dependency on python-dotenv."""

import os

try:
    from dotenv import load_dotenv

    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))
except Exception:  # dotenv missing / unreadable file: fall back to real env
    pass


def env(name, default=""):
    value = os.environ.get(name)
    return value if value not in (None, "") else default


def env_bool(name, default=False):
    value = os.environ.get(name)
    if value is None or value == "":
        return default
    return str(value).strip().lower() in ("1", "true", "yes", "on")


def env_list(name, default=None):
    """Comma-separated env value -> list of trimmed strings."""
    value = os.environ.get(name)
    if value is None or value == "":
        return list(default or [])
    return [part.strip() for part in value.split(",") if part.strip()]
