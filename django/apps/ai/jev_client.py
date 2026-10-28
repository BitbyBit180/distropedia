"""Shared thin REST client for the TypeSafe System One API — plain requests,
no SDK (same convention as groq_client.py). Jev returns typed judgments
(Choice/Score/Noul), never prose: code owns the workflow, the model
supplies the decision. Docs: https://docs.typesafe.ai/api.md"""

import requests
from django.conf import settings

API_URL = "https://api.typesafe.ai/v1/systemone"

# Deliberate change from the Express port: the key now lives in django/.env.
NO_KEY_MESSAGE = "TYPESAFE_API_KEY is not configured. Add it to django/.env"


# Single System One evaluation → the response data, whose `answers` map is
# keyed by question id. Raises (with the API's own error message and
# `.status`) on non-OK responses.
def system_one(state=None, questions=None, model=None, timeout_ms=20000):
    api_key = settings.TYPESAFE_API_KEY
    if not api_key or not api_key.strip():
        raise Exception(NO_KEY_MESSAGE)
    if not state or not isinstance(questions, dict):
        raise Exception("systemOne requires state and questions.")

    res = requests.post(
        API_URL,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        json={
            "state": state,
            "model": model or settings.TYPESAFE_MODEL or "jev-latest",
            "questions": questions,
        },
        timeout=timeout_ms / 1000.0,
    )
    if not res.ok:
        message = f"TypeSafe API error {res.status_code}"
        try:
            err_body = res.json()
        except ValueError:
            err_body = None  # keep the status-code message
        if isinstance(err_body, dict):
            error = err_body.get("error")
            message = (
                err_body.get("message")
                or (error.get("message") if isinstance(error, dict) else None)
                or message
            )
        err = Exception(message)
        err.status = res.status_code
        raise err

    data = res.json()
    if (
        not isinstance(data, dict)
        or not data.get("answers")
        or not isinstance(data.get("answers"), dict)
    ):
        raise Exception("TypeSafe returned an unreadable evaluation. Please try again.")
    return data
