from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from typing import Optional
import json
import os
import tempfile

from ..config import get_settings

router = APIRouter(prefix="/auth", tags=["authentication"])

settings = get_settings()

# OAuth 2.0 scopes for YouTube
SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl",  # Required for captions API
]

# File-based token storage (persists across restarts)
TOKEN_FILE = os.path.join(tempfile.gettempdir(), "youtube_saas_tokens.json")

def load_token_storage() -> dict:
    """Load tokens from file."""
    if os.path.exists(TOKEN_FILE):
        try:
            with open(TOKEN_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {}

def save_token_storage(data: dict):
    """Save tokens to file."""
    try:
        with open(TOKEN_FILE, 'w') as f:
            json.dump(data, f)
    except Exception as e:
        print(f"[AUTH] Failed to save tokens: {e}")

# Load existing tokens on startup
token_storage: dict = load_token_storage()


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
        # Note: removed include_granted_scopes to prevent pulling in old permissions
    )
    
    # Store state for verification
    token_storage["oauth_state"] = state
    save_token_storage(token_storage)
    
    return RedirectResponse(url=authorization_url)


@router.get("/callback")
async def callback(code: str, state: str, error: Optional[str] = None):
    """Handle OAuth callback from Google."""
    # Check for OAuth errors
    if error:
        raise HTTPException(status_code=400, detail=f"OAuth error: {error}")
    
    stored_state = token_storage.get("oauth_state")
    
    if state != stored_state:
        raise HTTPException(status_code=400, detail="Invalid state parameter. Please try logging in again.")
    
    try:
        flow = get_oauth_flow()
        flow.fetch_token(code=code)
        
        credentials = flow.credentials
        
        # Store credentials
        token_storage["credentials"] = {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": list(credentials.scopes) if credentials.scopes else [],
        }
        save_token_storage(token_storage)
        
        # Redirect to frontend dashboard
        return RedirectResponse(url=f"{settings.frontend_url}?authenticated=true")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete authentication: {str(e)}")


@router.get("/status")
async def auth_status():
    """Check if user is authenticated."""
    credentials = token_storage.get("credentials")
    
    if not credentials:
        return {"authenticated": False}
    
    return {"authenticated": True}


@router.post("/logout")
async def logout():
    """Clear stored credentials."""
    token_storage.clear()
    save_token_storage(token_storage)
    # Also remove the file
    if os.path.exists(TOKEN_FILE):
        os.remove(TOKEN_FILE)
    return {"message": "Logged out successfully"}


def get_youtube_credentials() -> Optional[Credentials]:
    """Get stored YouTube credentials."""
    cred_data = token_storage.get("credentials")
    
    if not cred_data:
        return None
    
    return Credentials(
        token=cred_data["token"],
        refresh_token=cred_data.get("refresh_token"),
        token_uri=cred_data["token_uri"],
        client_id=cred_data["client_id"],
        client_secret=cred_data["client_secret"],
        scopes=cred_data.get("scopes"),
    )


def get_authenticated_service(api_name: str, api_version: str):
    """Get authenticated Google API service."""
    credentials = get_youtube_credentials()
    
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated. Please login first at /auth/login"
        )
    
    return build(api_name, api_version, credentials=credentials)

