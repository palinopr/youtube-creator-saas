"""
Utility modules for the YouTube SaaS backend.
"""

from .error_handling import (
    handle_errors,
    handle_errors_sync,
    ServiceUnavailableError,
    RateLimitError,
    ValidationError,
)
from .llm_utils import (
    extract_json_from_response,
    extract_json_array_from_response,
    invoke_llm_with_retry,
    build_messages,
    generate_cache_key,
    truncate_for_context,
    estimate_token_count,
    LLMError,
    JSONExtractionError,
    LLMRateLimitError,
    LLMTimeoutError,
)

__all__ = [
    # Error handling
    "handle_errors",
    "handle_errors_sync",
    "ServiceUnavailableError",
    "RateLimitError",
    "ValidationError",
    # LLM utilities
    "extract_json_from_response",
    "extract_json_array_from_response",
    "invoke_llm_with_retry",
    "build_messages",
    "generate_cache_key",
    "truncate_for_context",
    "estimate_token_count",
    "LLMError",
    "JSONExtractionError",
    "LLMRateLimitError",
    "LLMTimeoutError",
]
