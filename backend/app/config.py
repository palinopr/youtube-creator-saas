from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    
    # OpenAI
    openai_api_key: str = ""
    
    # App Settings
    secret_key: str = "your-secret-key-change-in-production"
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    
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


@lru_cache()
def get_settings() -> Settings:
    return Settings()

