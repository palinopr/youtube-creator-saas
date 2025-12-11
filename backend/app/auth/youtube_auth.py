"""
YouTube OAuth authentication with secure database-backed token storage.
Tokens are encrypted at rest using Fernet symmetric encryption.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build
from typing import Optional
from datetime import datetime, timedelta
import logging

from ..config import get_settings
from ..db.models import UserToken, User, Subscription, PlanTier, get_db_session
from .token_encryption import encrypt_credentials, decrypt_credentials
import requests

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["authentication"])

settings = get_settings()

# OAuth 2.0 scopes for YouTube + User Profile
SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl",  # Required for captions API
    "openid",  # Required for user info
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]

# Default token key for single-user mode
# In multi-tenant mode, this would be the user_id
DEFAULT_TOKEN_KEY = "default"


def get_oauth_flow() -> Flow:
    """Create OAuth flow from client credentials."""
    client_config = {
        "web": {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [f"{settings.backend_url}/auth/callback"],
        }
    }

    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=f"{settings.backend_url}/auth/callback"
    )
    return flow


def get_or_create_token_record(token_key: str = DEFAULT_TOKEN_KEY) -> UserToken:
    """Get existing token record or create a new one."""
    with get_db_session() as session:
        token_record = session.query(UserToken).filter(
            UserToken.token_key == token_key
        ).first()

        if not token_record:
            token_record = UserToken(token_key=token_key)
            session.add(token_record)
            session.commit()
            session.refresh(token_record)

        # Detach from session to use outside context
        session.expunge(token_record)
        return token_record


def save_oauth_state(state: str, token_key: str = DEFAULT_TOKEN_KEY):
    """Save OAuth state for CSRF protection."""
    with get_db_session() as session:
        token_record = session.query(UserToken).filter(
            UserToken.token_key == token_key
        ).first()

        if not token_record:
            token_record = UserToken(token_key=token_key)
            session.add(token_record)

        token_record.oauth_state = state
        token_record.updated_at = datetime.utcnow()
        session.commit()


def get_oauth_state(token_key: str = DEFAULT_TOKEN_KEY) -> Optional[str]:
    """Get stored OAuth state for verification."""
    with get_db_session() as session:
        token_record = session.query(UserToken).filter(
            UserToken.token_key == token_key
        ).first()

        return token_record.oauth_state if token_record else None


def save_credentials(credentials: Credentials, token_key: str = DEFAULT_TOKEN_KEY):
    """
    Save OAuth credentials securely to database.
    Credentials are encrypted before storage.
    Note: client_secret is NOT stored - it's available from settings.
    """
    cred_data = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        # client_secret intentionally omitted - retrieved from settings
        "scopes": list(credentials.scopes) if credentials.scopes else [],
    }

    encrypted = encrypt_credentials(cred_data)

    if encrypted is None:
        logger.error("Failed to encrypt credentials")
        raise HTTPException(status_code=500, detail="Failed to save credentials")

    # Calculate token expiry (Google tokens typically expire in 1 hour)
    token_expiry = datetime.utcnow() + timedelta(hours=1)

    with get_db_session() as session:
        token_record = session.query(UserToken).filter(
            UserToken.token_key == token_key
        ).first()

        if not token_record:
            token_record = UserToken(token_key=token_key)
            session.add(token_record)

        token_record.encrypted_credentials = encrypted
        token_record.oauth_state = None  # Clear state after successful auth
        token_record.token_expiry = token_expiry
        token_record.updated_at = datetime.utcnow()
        session.commit()

    logger.info(f"[AUTH] Credentials saved securely for token_key={token_key}")


def load_credentials(token_key: str = DEFAULT_TOKEN_KEY) -> Optional[dict]:
    """Load and decrypt OAuth credentials from database."""
    with get_db_session() as session:
        token_record = session.query(UserToken).filter(
            UserToken.token_key == token_key
        ).first()

        if not token_record or not token_record.encrypted_credentials:
            return None

        return decrypt_credentials(token_record.encrypted_credentials)


def clear_credentials(token_key: str = DEFAULT_TOKEN_KEY):
    """Clear stored credentials (logout)."""
    with get_db_session() as session:
        token_record = session.query(UserToken).filter(
            UserToken.token_key == token_key
        ).first()

        if token_record:
            token_record.encrypted_credentials = None
            token_record.oauth_state = None
            token_record.token_expiry = None
            token_record.updated_at = datetime.utcnow()
            session.commit()

    logger.info(f"[AUTH] Credentials cleared for token_key={token_key}")


@router.get("/login")
async def login():
    """Initiate YouTube OAuth flow."""
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(
            status_code=500,
            detail="Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env"
        )

    flow = get_oauth_flow()
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        prompt="consent"
    )

    # Store state for CSRF verification
    save_oauth_state(state)

    return RedirectResponse(url=authorization_url)


@router.get("/callback")
async def callback(code: str, state: str, error: Optional[str] = None):
    """Handle OAuth callback from Google."""
    if error:
        logger.error(f"[AUTH] OAuth error: {error}")
        raise HTTPException(status_code=400, detail=f"OAuth error: {error}")

    stored_state = get_oauth_state()

    if state != stored_state:
        logger.warning("[AUTH] Invalid state parameter - possible CSRF attack")
        raise HTTPException(
            status_code=400,
            detail="Invalid state parameter. Please try logging in again."
        )

    try:
        flow = get_oauth_flow()
        flow.fetch_token(code=code)

        credentials = flow.credentials
        save_credentials(credentials)

        # Fetch user info from Google
        user_info = None
        try:
            userinfo_response = requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {credentials.token}"}
            )
            if userinfo_response.status_code == 200:
                user_info = userinfo_response.json()
                logger.info(f"[AUTH] Got user info: {user_info.get('email')}")
        except Exception as e:
            logger.warning(f"[AUTH] Failed to fetch user info: {e}")

        # Create or update user record with Google profile
        if user_info:
            with get_db_session() as session:
                google_id = user_info.get("sub")
                email = user_info.get("email")
                name = user_info.get("name")
                picture = user_info.get("picture")

                # Find existing user by google_id or email
                user = session.query(User).filter(
                    (User.google_id == google_id) | (User.email == email)
                ).first()

                if user:
                    # Update existing user
                    user.name = name or user.name
                    user.avatar_url = picture
                    user.google_id = google_id
                    user.last_login_at = datetime.utcnow()
                    logger.info(f"[AUTH] Updated user: {email}, avatar: {picture}")
                else:
                    # Create new user
                    user = User(
                        email=email,
                        google_id=google_id,
                        name=name,
                        avatar_url=picture,
                        is_active=True,
                        is_admin=True,  # First user is admin in single-user mode
                    )
                    session.add(user)
                    session.commit()
                    session.refresh(user)

                    # Create free subscription
                    subscription = Subscription(
                        user_id=user.id,
                        plan_id=PlanTier.FREE,
                    )
                    session.add(subscription)
                    logger.info(f"[AUTH] Created new user: {email}")

                session.commit()

        logger.info("[AUTH] OAuth callback successful, redirecting to frontend")
        return RedirectResponse(url=f"{settings.frontend_url}?authenticated=true")

    except Exception as e:
        logger.error(f"[AUTH] Failed to complete authentication: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to complete authentication: {str(e)}"
        )


@router.get("/status")
async def auth_status():
    """Check if user is authenticated."""
    cred_data = load_credentials()

    if not cred_data:
        return {"authenticated": False}

    return {"authenticated": True}


@router.post("/logout")
async def logout():
    """Clear stored credentials."""
    clear_credentials()
    return {"message": "Logged out successfully"}


def get_youtube_credentials() -> Optional[Credentials]:
    """
    Get stored YouTube credentials with automatic token refresh.
    Returns None if not authenticated.
    """
    cred_data = load_credentials()

    if not cred_data:
        return None

    credentials = Credentials(
        token=cred_data["token"],
        refresh_token=cred_data.get("refresh_token"),
        token_uri=cred_data["token_uri"],
        client_id=cred_data["client_id"],
        client_secret=settings.google_client_secret,  # From settings, not stored
        scopes=cred_data.get("scopes"),
    )

    # Check if token needs refresh
    if credentials.expired and credentials.refresh_token:
        try:
            logger.info("[AUTH] Token expired, refreshing...")
            credentials.refresh(GoogleRequest())

            # Save refreshed credentials
            save_credentials(credentials)
            logger.info("[AUTH] Token refreshed successfully")

        except Exception as e:
            logger.error(f"[AUTH] Failed to refresh token: {e}")
            # Don't clear credentials - user might still be able to re-auth
            return None

    return credentials


def get_authenticated_service(api_name: str, api_version: str):
    """Get authenticated Google API service."""
    credentials = get_youtube_credentials()

    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated. Please login first at /auth/login"
        )

    return build(api_name, api_version, credentials=credentials)
