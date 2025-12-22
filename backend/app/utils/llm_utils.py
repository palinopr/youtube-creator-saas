"""
LLM Utilities for consistent AI interactions across agents.

Provides:
- JSON extraction from LLM responses (handles markdown code blocks)
- LLM invocation with automatic retry logic
- Response caching to reduce API costs

Usage:
    from app.utils.llm_utils import extract_json_from_response, invoke_llm_with_retry

    # Extract JSON from LLM output
    data = extract_json_from_response(llm_response.content)

    # Invoke LLM with automatic retries
    result = await invoke_llm_with_retry(llm, messages)
"""

import json
import re
import hashlib
import logging
from typing import Dict, Any, Optional, List, Union
from datetime import datetime, timedelta

from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, AIMessage

logger = logging.getLogger(__name__)


class LLMError(Exception):
    """Base exception for LLM-related errors."""
    pass


class JSONExtractionError(LLMError):
    """Raised when JSON cannot be extracted from LLM response."""
    pass


class LLMRateLimitError(LLMError):
    """Raised when LLM rate limits are hit."""
    pass


class LLMTimeoutError(LLMError):
    """Raised when LLM request times out."""
    pass


def extract_json_from_response(
    response_text: str,
    default: Optional[Dict] = None,
    strict: bool = False
) -> Dict[str, Any]:
    """
    Extract JSON object from LLM response text.

    Handles common LLM response formats:
    - Raw JSON
    - JSON wrapped in ```json ... ``` code blocks
    - JSON wrapped in ``` ... ``` code blocks
    - JSON with trailing text/explanation

    Args:
        response_text: The raw text response from the LLM
        default: Default value to return if extraction fails (only if strict=False)
        strict: If True, raise exception on failure; if False, return default

    Returns:
        Extracted JSON as a dictionary

    Raises:
        JSONExtractionError: If strict=True and JSON cannot be extracted

    Example:
        >>> text = "Here's the analysis:\\n```json\\n{\"score\": 85}\\n```"
        >>> extract_json_from_response(text)
        {"score": 85}
    """
    if not response_text:
        if strict:
            raise JSONExtractionError("Empty response text")
        return default or {}

    text = response_text.strip()

    # Strategy 1: Try direct JSON parse first (fastest path)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strategy 2: Extract from ```json ... ``` code block
    json_block_pattern = r"```json\s*([\s\S]*?)\s*```"
    matches = re.findall(json_block_pattern, text, re.IGNORECASE)
    for match in matches:
        try:
            return json.loads(match.strip())
        except json.JSONDecodeError:
            continue

    # Strategy 3: Extract from ``` ... ``` code block (no language specified)
    code_block_pattern = r"```\s*([\s\S]*?)\s*```"
    matches = re.findall(code_block_pattern, text)
    for match in matches:
        try:
            return json.loads(match.strip())
        except json.JSONDecodeError:
            continue

    # Strategy 4: Find JSON object pattern { ... }
    # Look for outermost { } pair
    json_object_pattern = r"\{[\s\S]*\}"
    match = re.search(json_object_pattern, text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    # Strategy 5: Find JSON array pattern [ ... ]
    json_array_pattern = r"\[[\s\S]*\]"
    match = re.search(json_array_pattern, text)
    if match:
        try:
            result = json.loads(match.group())
            # Wrap array in dict for consistent return type
            return {"items": result}
        except json.JSONDecodeError:
            pass

    # All strategies failed
    if strict:
        raise JSONExtractionError(
            f"Could not extract JSON from response: {text[:200]}..."
        )

    logger.warning(f"Failed to extract JSON from response: {text[:100]}...")
    return default or {"parse_error": True, "raw_text": text[:500]}


def extract_json_array_from_response(
    response_text: str,
    default: Optional[List] = None,
    strict: bool = False
) -> List[Any]:
    """
    Extract JSON array from LLM response text.

    Similar to extract_json_from_response but expects and returns a list.

    Args:
        response_text: The raw text response from the LLM
        default: Default value to return if extraction fails
        strict: If True, raise exception on failure

    Returns:
        Extracted JSON as a list
    """
    result = extract_json_from_response(response_text, default=None, strict=strict)

    if isinstance(result, list):
        return result
    elif isinstance(result, dict):
        # Check common wrapper patterns
        if "items" in result:
            return result["items"]
        if "results" in result:
            return result["results"]
        if "data" in result:
            return result["data"]
        # Return the dict as a single-item list
        return [result]

    return default or []


def generate_cache_key(
    prompt: str,
    model: str,
    temperature: float = 0.0,
    extra_context: Optional[str] = None
) -> str:
    """
    Generate a deterministic cache key for LLM requests.

    Args:
        prompt: The prompt text
        model: The model name
        temperature: Temperature setting (only cache temperature=0 ideally)
        extra_context: Any additional context that affects the response

    Returns:
        SHA-256 hash string suitable for cache key
    """
    content = f"{model}:{temperature}:{prompt}"
    if extra_context:
        content += f":{extra_context}"

    return hashlib.sha256(content.encode()).hexdigest()


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    retry=retry_if_exception_type((LLMRateLimitError, LLMTimeoutError)),
    reraise=True
)
async def invoke_llm_with_retry(
    llm: Any,
    messages: List[BaseMessage],
    timeout: float = 60.0
) -> Any:
    """
    Invoke LLM with automatic retry on rate limits and timeouts.

    Uses exponential backoff: 2s, 4s, 8s (up to 30s max)
    Retries up to 3 times on:
    - Rate limit errors (429)
    - Timeout errors

    Args:
        llm: LangChain LLM instance
        messages: List of messages to send
        timeout: Request timeout in seconds

    Returns:
        LLM response object

    Raises:
        LLMRateLimitError: If rate limits persist after retries
        LLMTimeoutError: If requests keep timing out
        LLMError: For other LLM-related errors
    """
    try:
        # Most LangChain LLMs support ainvoke
        response = await llm.ainvoke(messages)
        return response

    except Exception as e:
        error_str = str(e).lower()

        # Check for rate limit indicators
        if "rate" in error_str and "limit" in error_str:
            logger.warning(f"LLM rate limit hit, will retry: {e}")
            raise LLMRateLimitError(str(e))

        if "429" in error_str:
            logger.warning(f"LLM 429 error, will retry: {e}")
            raise LLMRateLimitError(str(e))

        # Check for timeout indicators
        if "timeout" in error_str or "timed out" in error_str:
            logger.warning(f"LLM timeout, will retry: {e}")
            raise LLMTimeoutError(str(e))

        # Other errors - don't retry
        logger.error(f"LLM error (no retry): {e}")
        raise LLMError(str(e))


def build_messages(
    system_prompt: str,
    user_message: str,
    chat_history: Optional[List[Dict[str, str]]] = None
) -> List[BaseMessage]:
    """
    Build a list of LangChain messages from components.

    Args:
        system_prompt: The system/instruction prompt
        user_message: The user's current message
        chat_history: Optional list of previous messages

    Returns:
        List of BaseMessage objects ready for LLM invocation

    Example:
        messages = build_messages(
            system_prompt="You are a helpful assistant.",
            user_message="What's the weather?",
            chat_history=[
                {"role": "user", "content": "Hi"},
                {"role": "assistant", "content": "Hello!"}
            ]
        )
    """
    messages: List[BaseMessage] = [SystemMessage(content=system_prompt)]

    if chat_history:
        for msg in chat_history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role in ("assistant", "ai"):
                messages.append(AIMessage(content=content))

    messages.append(HumanMessage(content=user_message))
    return messages


def truncate_for_context(
    text: str,
    max_chars: int = 10000,
    suffix: str = "\n\n[Content truncated...]"
) -> str:
    """
    Truncate text to fit within context limits while preserving meaning.

    Args:
        text: The text to truncate
        max_chars: Maximum character count
        suffix: Text to append when truncating

    Returns:
        Truncated text if needed, original otherwise
    """
    if len(text) <= max_chars:
        return text

    # Try to break at a sentence boundary
    truncated = text[:max_chars - len(suffix)]
    last_period = truncated.rfind(". ")
    if last_period > max_chars * 0.8:  # Only use if we keep most of the content
        truncated = truncated[:last_period + 1]

    return truncated + suffix


def estimate_token_count(text: str) -> int:
    """
    Rough estimate of token count for OpenAI models.

    Uses the approximation: 1 token ≈ 4 characters for English text.
    This is a rough estimate; use tiktoken for precise counts.

    Args:
        text: The text to estimate

    Returns:
        Estimated token count
    """
    return len(text) // 4
