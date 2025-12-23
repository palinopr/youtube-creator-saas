"""
Cost tracking callback for LangChain LLM calls.

Intercepts all LLM calls and records token usage to the database
for cost monitoring and analytics.
"""

import logging
import time
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.outputs import LLMResult
from sqlalchemy.orm import Session

from ..db.models import AgentType, track_api_usage, SessionLocal

logger = logging.getLogger(__name__)


class CostTrackingCallback(BaseCallbackHandler):
    """
    LangChain callback handler that tracks API usage costs.

    Usage:
        callback = CostTrackingCallback(
            agent_type=AgentType.SEO,
            user_id="user-123",
            endpoint="/api/seo/analyze"
        )
        llm = ChatOpenAI(model="gpt-4o", callbacks=[callback])
    """

    def __init__(
        self,
        agent_type: AgentType,
        user_id: Optional[str] = None,
        endpoint: Optional[str] = None,
        db: Optional[Session] = None,
    ):
        """
        Initialize cost tracking callback.

        Args:
            agent_type: Type of agent making the call (SEO, ANALYTICS, etc.)
            user_id: Optional user ID for attribution
            endpoint: Optional API endpoint that triggered this call
            db: Optional database session (creates new one if not provided)
        """
        super().__init__()
        self.agent_type = agent_type
        self.user_id = user_id
        self.endpoint = endpoint
        self._db = db
        self._start_time: Optional[float] = None
        self._model: Optional[str] = None

    def on_llm_start(
        self,
        serialized: Dict[str, Any],
        prompts: List[str],
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> None:
        """Called when LLM starts processing."""
        self._start_time = time.time()
        # Extract model name from serialized config
        self._model = serialized.get("kwargs", {}).get("model_name") or \
                      serialized.get("kwargs", {}).get("model") or \
                      "gpt-4o-mini"

    def on_llm_end(
        self,
        response: LLMResult,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> None:
        """
        Called when LLM finishes processing.
        Records the usage to the database.
        """
        try:
            # Calculate latency
            latency_ms = None
            if self._start_time:
                latency_ms = int((time.time() - self._start_time) * 1000)

            # Extract token usage from response
            llm_output = response.llm_output or {}
            token_usage = llm_output.get("token_usage", {})

            prompt_tokens = token_usage.get("prompt_tokens", 0)
            completion_tokens = token_usage.get("completion_tokens", 0)

            # Get model name from response or fallback to stored value
            model = llm_output.get("model_name") or \
                    llm_output.get("model") or \
                    self._model or \
                    "gpt-4o-mini"

            # Skip if no tokens were used (shouldn't happen normally)
            if prompt_tokens == 0 and completion_tokens == 0:
                logger.warning(f"No token usage data in LLM response for {self.agent_type.value}")
                return

            # Record to database
            self._record_usage(
                model=model,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                latency_ms=latency_ms,
                success=True,
            )

            logger.debug(
                f"Tracked API usage: {self.agent_type.value} | "
                f"{model} | {prompt_tokens}+{completion_tokens} tokens | "
                f"{latency_ms}ms"
            )

        except Exception as e:
            logger.error(f"Failed to track API usage: {e}")

    def on_llm_error(
        self,
        error: Union[Exception, KeyboardInterrupt],
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> None:
        """Called when LLM errors."""
        try:
            latency_ms = None
            if self._start_time:
                latency_ms = int((time.time() - self._start_time) * 1000)

            # Record the failed attempt (with 0 tokens since we don't know)
            self._record_usage(
                model=self._model or "gpt-4o-mini",
                prompt_tokens=0,
                completion_tokens=0,
                latency_ms=latency_ms,
                success=False,
                error_message=str(error)[:500],
            )

        except Exception as e:
            logger.error(f"Failed to track API error: {e}")

    def _record_usage(
        self,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        latency_ms: Optional[int] = None,
        success: bool = True,
        error_message: Optional[str] = None,
    ) -> None:
        """Record usage to database."""
        # Use provided session or create a new one
        db = self._db
        should_close = False

        if db is None:
            db = SessionLocal()
            should_close = True

        try:
            track_api_usage(
                db=db,
                agent_type=self.agent_type,
                model=model,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                user_id=self.user_id,
                endpoint=self.endpoint,
                success=success,
                error_message=error_message,
                latency_ms=latency_ms,
            )
        finally:
            if should_close:
                db.close()


def create_cost_tracking_callback(
    agent_type: AgentType,
    user_id: Optional[str] = None,
    endpoint: Optional[str] = None,
    db: Optional[Session] = None,
) -> CostTrackingCallback:
    """
    Factory function to create a cost tracking callback.

    Args:
        agent_type: Type of agent (SEO, ANALYTICS, CLIPS, etc.)
        user_id: Optional user ID for attribution
        endpoint: Optional API endpoint
        db: Optional database session

    Returns:
        Configured CostTrackingCallback instance

    Example:
        callback = create_cost_tracking_callback(
            agent_type=AgentType.SEO,
            user_id=current_user.id,
            endpoint="/api/seo/analyze"
        )
        llm = ChatOpenAI(model="gpt-4o", callbacks=[callback])
    """
    return CostTrackingCallback(
        agent_type=agent_type,
        user_id=user_id,
        endpoint=endpoint,
        db=db,
    )
