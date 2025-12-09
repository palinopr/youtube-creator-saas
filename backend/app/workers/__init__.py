"""
Background worker system for async task processing.
Implements a Celery-lite pattern using threading + SQLite.
"""

from .manager import WorkerManager, start_workers, stop_workers
from .tasks import process_render_job, process_analytics_job

__all__ = [
    "WorkerManager",
    "start_workers",
    "stop_workers",
    "process_render_job",
    "process_analytics_job",
]

