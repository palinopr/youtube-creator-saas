"""
Email service using Resend API.
Migrated from Supabase Edge Function.
"""

import logging
import httpx
from typing import Optional

from ..config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def send_waitlist_confirmation_email(email: str, confirmation_token: str) -> bool:
    """
    Send waitlist confirmation email via Resend API.

    Args:
        email: Recipient email address
        confirmation_token: Unique token for email confirmation

    Returns:
        True if email sent successfully, False otherwise
    """
    resend_api_key = settings.resend_api_key
    if not resend_api_key:
        logger.error("RESEND_API_KEY not configured")
        return False

    frontend_url = settings.frontend_url or "https://www.tubegrow.io"
    confirmation_url = f"{frontend_url}/waitlist/confirm?token={confirmation_token}"

    email_html = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your TubeGrow Waitlist Spot</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0f;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background: linear-gradient(180deg, rgba(239, 68, 68, 0.1) 0%, rgba(10, 10, 15, 1) 100%); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1);">
          <tr>
            <td style="padding: 40px 32px;">
              <!-- Logo -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); border-radius: 12px; display: inline-block; text-align: center; line-height: 48px;">
                      <span style="color: white; font-size: 24px;">▶</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Headline -->
              <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 600; color: #ffffff; text-align: center; line-height: 1.3;">
                You're almost in!
              </h1>

              <!-- Subtext -->
              <p style="margin: 0 0 32px 0; font-size: 16px; color: rgba(255, 255, 255, 0.7); text-align: center; line-height: 1.6;">
                Click the button below to confirm your spot on the TubeGrow waitlist and get early access to AI-powered YouTube analytics.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <a href="{confirmation_url}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);">
                      Confirm My Spot
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What you'll get -->
              <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #ffffff;">
                  What you'll get access to:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.8;">
                  <li>AI-powered channel analytics</li>
                  <li>Video SEO optimization tools</li>
                  <li>Viral clips generator</li>
                  <li>Deep performance insights</li>
                </ul>
              </div>

              <!-- Footer -->
              <p style="margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.4); text-align: center; line-height: 1.6;">
                If you didn't sign up for TubeGrow, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer logo -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px;">
          <tr>
            <td style="padding: 24px; text-align: center;">
              <span style="color: rgba(255, 255, 255, 0.3); font-size: 14px;">TubeGrow</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {resend_api_key}",
                },
                json={
                    "from": "TubeGrow <noreply@tubegrow.io>",
                    "to": [email],
                    "subject": "Confirm your TubeGrow waitlist spot",
                    "html": email_html,
                },
                timeout=30.0,
            )

            if response.status_code != 200:
                logger.error(f"Resend API error: {response.status_code} - {response.text}")
                return False

            data = response.json()
            logger.info(f"Confirmation email sent to {email}, Resend ID: {data.get('id')}")
            return True

    except Exception as e:
        logger.error(f"Failed to send confirmation email: {e}")
        return False
