from pydantic_settings import BaseSettings
from pydantic import model_validator
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # Environment
    environment: str = "development"  # "development" | "production"
    debug: bool = False
    single_user_mode: bool = False

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""

    # OpenAI
    openai_api_key: str = ""

    # App Settings
    secret_key: str = "your-secret-key-change-in-production"
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"

    # Session cookies (multi-tenant)
    session_cookie_name: str = "tubegrow_session"
    session_max_age_days: int = 30

    # Token Encryption (for storing OAuth tokens securely)
    # Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    token_encryption_key: Optional[str] = None

    # Stripe Billing
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""

    # YouTube Scopes
    youtube_readonly_scope: str = "https://www.googleapis.com/auth/youtube.readonly"
    youtube_analytics_scope: str = "https://www.googleapis.com/auth/yt-analytics.readonly"

    # LangChain/LangSmith (optional)
    langchain_tracing_v2: bool = False
    langchain_api_key: str = ""
    langchain_project: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra env vars

    @model_validator(mode="after")
    def validate_production_settings(self):
        """Fail fast on insecure/missing settings in production."""
        if self.environment.lower() == "production":
            if not self.secret_key or self.secret_key.startswith("your-secret-key"):
                raise ValueError("SECRET_KEY must be set to a strong value in production")
            if not self.google_client_id or not self.google_client_secret:
                raise ValueError("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required in production")
            if not self.token_encryption_key:
                raise ValueError("TOKEN_ENCRYPTION_KEY is required in production")
        return self


@lru_cache()
def get_settings() -> Settings:
    return Settings()
