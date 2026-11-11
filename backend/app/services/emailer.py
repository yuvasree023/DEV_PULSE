"""
Transactional email sending for DevPulse (password reset etc.).
Provider-agnostic: Resend or Brevo, chosen by which API key is configured.
No provider configured -> send is skipped and logged, never crashes the request.
"""

import logging
import os

import httpx

logger = logging.getLogger("app.services.emailer")


def email_configured() -> bool:
    """True when a sender address and at least one provider API key are set."""
    from_address = os.getenv("EMAIL_FROM_ADDRESS", "").strip()
    resend_key = os.getenv("RESEND_API_KEY", "").strip()
    brevo_key = os.getenv("BREVO_API_KEY", "").strip()
    return bool(from_address and (resend_key or brevo_key))


async def send_email(to: str, subject: str, html: str) -> bool:
    """Sends one transactional email. Returns False when unconfigured or failed."""
    from_address = os.getenv("EMAIL_FROM_ADDRESS", "").strip()
    from_name = os.getenv("EMAIL_FROM_NAME", "DevPulse").strip()
    resend_key = os.getenv("RESEND_API_KEY", "").strip()
    brevo_key = os.getenv("BREVO_API_KEY", "").strip()

    if not from_address or (not resend_key and not brevo_key):
        logger.warning("Email provider not configured; skipping email to %s", to)
        return False

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            if resend_key:
                resp = await client.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {resend_key}"},
                    json={
                        "from": f"{from_name} <{from_address}>",
                        "to": [to],
                        "subject": subject,
                        "html": html,
                    },
                )
            else:
                resp = await client.post(
                    "https://api.brevo.com/v3/smtp/email",
                    headers={"api-key": brevo_key, "Content-Type": "application/json"},
                    json={
                        "sender": {"name": from_name, "email": from_address},
                        "to": [{"email": to}],
                        "subject": subject,
                        "htmlContent": html,
                    },
                )
        if resp.status_code in (200, 201):
            return True
        logger.error("Email send failed (status %s).", resp.status_code)
        return False
    except Exception as exc:
        logger.error("Email send error: %s", type(exc).__name__)
        return False
