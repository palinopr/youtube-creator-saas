"""
Repository for LLM response caching.

Provides cache-aside pattern for LLM calls:
1. Check cache before calling LLM
2. If hit, return cached response
3. If miss, call LLM and cache response
"""

import hashlib
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from .models import SessionLocal, LLMCache

logger = logging.getLogger(__name__)


class LLMCacheRepository:
    """
    Repository for LLM response caching operations.

    Usage:
        # Check cache before LLM call
        cached = LLMCacheRepository.get_cached_response(prompt, model)
        if cached:
            return cached

        # Call LLM
        response = await llm.ainvoke(messages)

        # Cache response
        LLMCacheRepository.cache_response(
            prompt=prompt,
            model=model,
            response=response.content,
            prompt_tokens=response.usage_metadata.get('input_tokens'),
            completion_tokens=response.usage_metadata.get('output_tokens'),
            ttl_hours=24
        )
    """

    @staticmethod
    def _hash_prompt(prompt: str, model: str) -> str:
        """Generate SHA-256 hash for prompt + model combination."""
        content = f"{model}:{prompt}"
        return hashlib.sha256(content.encode()).hexdigest()

    @staticmethod
    def get_cached_response(prompt: str, model: str) -> Optional[str]:
        """
        Get cached response for a prompt.

        Args:
            prompt: The prompt text
            model: The model name (e.g., 'gpt-4o', 'gpt-4o-mini')

        Returns:
            Cached response string if found and not expired, None otherwise
        """
        prompt_hash = LLMCacheRepository._hash_prompt(prompt, model)

        with SessionLocal() as db:
            cache = db.query(LLMCache).filter(
                LLMCache.prompt_hash == prompt_hash
            ).first()

            if not cache:
                return None

            # Check expiry
            if cache.expires_at and cache.expires_at < datetime.utcnow():
                # Expired - delete and return None
                db.delete(cache)
                db.commit()
                logger.debug(f"LLM cache expired for hash {prompt_hash[:8]}...")
                return None

            # Cache hit - increment counter
            cache.hit_count = (cache.hit_count or 0) + 1
            db.commit()

            logger.debug(f"LLM cache hit for hash {prompt_hash[:8]}... (hits: {cache.hit_count})")
            return cache.response

    @staticmethod
    def cache_response(
        prompt: str,
        model: str,
        response: str,
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        ttl_hours: int = 24,
    ) -> bool:
        """
        Cache an LLM response.

        Args:
            prompt: The prompt text
            model: The model name
            response: The LLM response to cache
            prompt_tokens: Number of prompt tokens used
            completion_tokens: Number of completion tokens used
            ttl_hours: Time-to-live in hours (default 24)

        Returns:
            True if cached successfully, False otherwise
        """
        prompt_hash = LLMCacheRepository._hash_prompt(prompt, model)
        expires_at = datetime.utcnow() + timedelta(hours=ttl_hours)

        with SessionLocal() as db:
            try:
                # Check if already exists
                existing = db.query(LLMCache).filter(
                    LLMCache.prompt_hash == prompt_hash
                ).first()

                if existing:
                    # Update existing cache
                    existing.response = response
                    existing.prompt_tokens = prompt_tokens
                    existing.completion_tokens = completion_tokens
                    existing.expires_at = expires_at
                    existing.created_at = datetime.utcnow()
                    existing.hit_count = 0
                else:
                    # Create new cache entry
                    cache = LLMCache(
                        prompt_hash=prompt_hash,
                        model=model,
                        response=response,
                        prompt_tokens=prompt_tokens,
                        completion_tokens=completion_tokens,
                        expires_at=expires_at,
                    )
                    db.add(cache)

                db.commit()
                logger.debug(f"LLM response cached for hash {prompt_hash[:8]}... (TTL: {ttl_hours}h)")
                return True

            except Exception as e:
                db.rollback()
                logger.error(f"Failed to cache LLM response: {e}")
                return False

    @staticmethod
    def get_cache_stats() -> Dict[str, Any]:
        """Get cache statistics."""
        with SessionLocal() as db:
            total = db.query(LLMCache).count()
            expired = db.query(LLMCache).filter(
                LLMCache.expires_at < datetime.utcnow()
            ).count()

            # Get total hits
            from sqlalchemy import func
            total_hits = db.query(func.sum(LLMCache.hit_count)).scalar() or 0

            # Get by model
            by_model = {}
            models = db.query(LLMCache.model, func.count(LLMCache.id)).group_by(LLMCache.model).all()
            for model, count in models:
                by_model[model] = count

            return {
                "total_entries": total,
                "expired_entries": expired,
                "active_entries": total - expired,
                "total_hits": total_hits,
                "by_model": by_model,
            }

    @staticmethod
    def cleanup_expired(batch_size: int = 100) -> int:
        """
        Remove expired cache entries.

        Args:
            batch_size: Maximum entries to delete per call

        Returns:
            Number of entries deleted
        """
        with SessionLocal() as db:
            expired = db.query(LLMCache).filter(
                LLMCache.expires_at < datetime.utcnow()
            ).limit(batch_size).all()

            count = len(expired)
            for cache in expired:
                db.delete(cache)

            db.commit()

            if count > 0:
                logger.info(f"Cleaned up {count} expired LLM cache entries")

            return count

    @staticmethod
    def invalidate(prompt: str, model: str) -> bool:
        """
        Invalidate a specific cache entry.

        Args:
            prompt: The prompt text
            model: The model name

        Returns:
            True if entry was found and deleted, False otherwise
        """
        prompt_hash = LLMCacheRepository._hash_prompt(prompt, model)

        with SessionLocal() as db:
            cache = db.query(LLMCache).filter(
                LLMCache.prompt_hash == prompt_hash
            ).first()

            if cache:
                db.delete(cache)
                db.commit()
                logger.debug(f"LLM cache invalidated for hash {prompt_hash[:8]}...")
                return True

            return False

    @staticmethod
    def clear_all() -> int:
        """
        Clear all cache entries (use with caution).

        Returns:
            Number of entries deleted
        """
        with SessionLocal() as db:
            count = db.query(LLMCache).delete()
            db.commit()
            logger.warning(f"Cleared all {count} LLM cache entries")
            return count
