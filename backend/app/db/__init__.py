"""
Database module for persistent storage.
Uses SQLite for simplicity - can be swapped to PostgreSQL for production.
"""

from .models import init_db, get_db_session, JobStatus, Job, AnalyticsCache
from .repository import JobRepository, AnalyticsCacheRepository

__all__ = [
    "init_db",
    "get_db_session", 
    "JobStatus",
    "Job",
    "AnalyticsCache",
    "JobRepository",
    "AnalyticsCacheRepository",
]

