"""
Worker Manager - Background task processing system.
Runs long-running tasks (video rendering, analytics) outside the request loop.
"""

import asyncio
import threading
import time
import traceback
from datetime import datetime
from typing import Optional, Callable, Dict, Any
from concurrent.futures import ThreadPoolExecutor

from ..db.models import JobStatus, JobType
from ..db.repository import JobRepository


class WorkerManager:
    """
    Manages background workers for async task processing.
    Uses ThreadPoolExecutor to avoid blocking the FastAPI event loop.
    """
    
    _instance: Optional["WorkerManager"] = None
    _lock = threading.Lock()
    
    def __new__(cls):
        """Singleton pattern for global worker manager."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self._initialized = True
        self._running = False
        self._executor: Optional[ThreadPoolExecutor] = None
        self._poll_thread: Optional[threading.Thread] = None
        self._handlers: Dict[JobType, Callable] = {}
        
        # Configuration
        self._max_workers = 3  # Max concurrent tasks
        self._poll_interval = 2  # Seconds between job checks
    
    def register_handler(self, job_type: JobType, handler: Callable):
        """Register a handler function for a job type."""
        self._handlers[job_type] = handler
        print(f"🔧 Registered handler for {job_type.value}")
    
    def start(self):
        """Start the worker manager."""
        if self._running:
            return
        
        self._running = True
        self._executor = ThreadPoolExecutor(max_workers=self._max_workers)
        
        # Start polling thread
        self._poll_thread = threading.Thread(target=self._poll_loop, daemon=True)
        self._poll_thread.start()
        
        print(f"🚀 Worker Manager started with {self._max_workers} workers")
    
    def stop(self):
        """Stop the worker manager."""
        self._running = False
        
        if self._executor:
            self._executor.shutdown(wait=True)
            self._executor = None
        
        print("🛑 Worker Manager stopped")
    
    def _poll_loop(self):
        """Main polling loop - checks for pending jobs."""
        while self._running:
            try:
                self._process_pending_jobs()
            except Exception as e:
                print(f"❌ Worker poll error: {e}")
                traceback.print_exc()
            
            time.sleep(self._poll_interval)
    
    def _process_pending_jobs(self):
        """Check for and process pending jobs."""
        # Get pending jobs
        pending_jobs = JobRepository.get_pending_jobs(limit=self._max_workers)
        
        for job_data in pending_jobs:
            job_type = JobType(job_data["job_type"])
            
            if job_type not in self._handlers:
                print(f"⚠️ No handler for job type: {job_type}")
                continue
            
            # Mark as processing
            JobRepository.update_job(
                job_id=job_data["job_id"],
                status=JobStatus.PROCESSING,
                started_at=datetime.utcnow(),
                message="Processing started..."
            )
            
            # Submit to executor
            self._executor.submit(
                self._run_job,
                job_data["job_id"],
                job_type,
                job_data
            )
    
    def _run_job(self, job_id: str, job_type: JobType, job_data: dict):
        """Run a single job in the thread pool."""
        handler = self._handlers.get(job_type)
        if not handler:
            return
        
        try:
            print(f"▶️ Starting job {job_id} ({job_type.value})")
            
            # Run the handler
            result = handler(job_data)
            
            # Mark as completed
            JobRepository.update_job(
                job_id=job_id,
                status=JobStatus.COMPLETED,
                progress=100,
                completed_at=datetime.utcnow(),
                message="Completed successfully",
                output_data=result if isinstance(result, dict) else {}
            )
            
            print(f"✅ Job {job_id} completed")
            
        except Exception as e:
            error_msg = str(e)
            print(f"❌ Job {job_id} failed: {error_msg}")
            traceback.print_exc()
            
            JobRepository.update_job(
                job_id=job_id,
                status=JobStatus.FAILED,
                error_message=error_msg,
                completed_at=datetime.utcnow(),
                message=f"Failed: {error_msg[:200]}"
            )
    
    def submit_job(
        self,
        job_type: JobType,
        video_id: Optional[str] = None,
        clip_id: Optional[str] = None,
        channel_id: Optional[str] = None,
        input_data: Optional[dict] = None,
        max_videos: Optional[int] = None,
    ) -> dict:
        """
        Submit a new job for background processing.
        Returns the job data immediately (non-blocking).
        """
        job_data = JobRepository.create_job(
            job_type=job_type,
            video_id=video_id,
            clip_id=clip_id,
            channel_id=channel_id,
            input_data=input_data,
            max_videos=max_videos,
        )
        
        print(f"📝 Job {job_data['job_id']} queued ({job_type.value})")
        return job_data


# Global worker manager instance
_worker_manager: Optional[WorkerManager] = None


def get_worker_manager() -> WorkerManager:
    """Get the global worker manager instance."""
    global _worker_manager
    if _worker_manager is None:
        _worker_manager = WorkerManager()
    return _worker_manager


def start_workers():
    """Start background workers."""
    manager = get_worker_manager()
    
    # Import and register handlers here to avoid circular imports
    from .tasks import process_render_job, process_analytics_job
    
    manager.register_handler(JobType.RENDER_CLIP, process_render_job)
    manager.register_handler(JobType.DEEP_ANALYSIS, process_analytics_job)
    manager.register_handler(JobType.CAUSAL_ANALYSIS, process_analytics_job)
    manager.register_handler(JobType.VIDEO_SYNC, process_analytics_job)
    
    manager.start()


def stop_workers():
    """Stop background workers."""
    manager = get_worker_manager()
    manager.stop()

