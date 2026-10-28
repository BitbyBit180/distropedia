"""Reset-token delivery — the mailer.js twin.

Two modes, selected by RESET_DELIVERY (smtp when SMTP_HOST is set, otherwise
console). In production with no SMTP configured delivery refuses loudly rather
than silently dropping the reset.
"""

import smtplib
from email.message import EmailMessage

from config import settings

TEXT_BODY = [
    "Someone requested a password reset for your DistroPedia account.",
    "",
    "Your 6-digit code (valid 15 minutes): {token}",
    "",
    "Enter it on the reset page, then choose a new password. If this was not you, ignore this email.",
]


def deliver_reset_token(email, token):
    mode = (settings.RESET_DELIVERY or "").lower()

    if mode == "smtp":
        if not settings.SMTP_HOST:
            raise RuntimeError(
                "SMTP is not configured. Set SMTP_HOST/USER/PASS in django/.env."
            )
        message = EmailMessage()
        message["From"] = settings.SMTP_FROM or settings.SMTP_USER
        message["To"] = email
        message["Subject"] = "DistroPedia password reset"
        message.set_content("\n".join(TEXT_BODY).format(token=token))

        if settings.SMTP_SECURE:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20)
        try:
            if not settings.SMTP_SECURE:
                server.ehlo()
                if server.has_extn("starttls"):
                    server.starttls()
                    server.ehlo()
            if settings.SMTP_USER and settings.SMTP_PASS:
                server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.send_message(message)
        finally:
            try:
                server.quit()
            except Exception:  # noqa: BLE001 - cleanup only
                pass

        print(f"[auth] reset email sent to {email}", flush=True)
        return

    if settings.NODE_ENV == "production":
        raise RuntimeError(
            "Password-reset email is not configured. Set SMTP_HOST/USER/PASS in django/.env."
        )
    print(f"[auth] password-reset code for {email}: {token} (valid 15 min)", flush=True)
