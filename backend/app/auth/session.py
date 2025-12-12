"""
JWT session utilities.

In multi-tenant mode, we issue a short JWT stored in an HTTPOnly cookie after
OAuth callback. The JWT contains the user_id in "sub".
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import jwt, JWTError

from ..config import get_settings

ALGORITHM = "HS256"


def create_session_token(user_id: str) -> str:
    """Create a signed JWT session token for the given user."""
    settings = get_settings()
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.session_max_age_days)
    payload = {"sub": user_id, "exp": expires_at}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_session_token(token: str) -> Optional[str]:
    """Decode a JWT session token and return user_id if valid."""
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        return str(user_id) if user_id else None
    except JWTError:
        return None

