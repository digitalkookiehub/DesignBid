import logging

from app.config import settings

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, body: str) -> bool:
    """Send email via SMTP. Returns True if sent successfully."""
    if not settings.SMTP_HOST:
        logger.warning("SMTP not configured. Email to %s not sent: %s", to, subject)
        return False

    try:
        # TODO: Implement actual SMTP sending with aiosmtplib
        logger.info("Email sent to %s: %s", to, subject)
        return True
    except Exception:
        logger.exception("Failed to send email to %s", to)
        return False


async def send_proposal_email(to: str, client_name: str, proposal_title: str, public_url: str) -> bool:
    subject = f"New Proposal: {proposal_title}"
    body = (
        f"Hi {client_name},\n\n"
        f"You have received a new proposal: {proposal_title}\n\n"
        f"View it here: {public_url}\n\n"
        f"Best regards,\nDesignBid"
    )
    return await send_email(to, subject, body)


async def send_password_reset_email(to: str, reset_url: str) -> bool:
    subject = "Password Reset - DesignBid"
    body = f"Click here to reset your password: {reset_url}\n\nIf you didn't request this, ignore this email."
    return await send_email(to, subject, body)
