"""
SerpBear API Service

Connects to local SerpBear instance to fetch SEO ranking data.
SerpBear is a self-hosted Google rank tracking tool.

API Docs: https://docs.serpbear.com/api
"""

import os
import logging
import httpx
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# SerpBear configuration
SERPBEAR_URL = os.getenv("SERPBEAR_URL", "http://localhost:3005")
SERPBEAR_API_KEY = os.getenv("SERPBEAR_API_KEY")

# Validate required config at import time (fail fast)
if not SERPBEAR_API_KEY:
    logger.warning("SERPBEAR_API_KEY not set - SerpBear SEO tracking will be unavailable")


class SerpBearClient:
    """Client for SerpBear rank tracking API."""

    def __init__(self, base_url: str = SERPBEAR_URL, api_key: Optional[str] = SERPBEAR_API_KEY):
        self.base_url = base_url.rstrip("/") if base_url else ""
        self.api_key = api_key
        self.enabled = bool(api_key)
        self.headers = {
            "Authorization": f"Bearer {api_key}" if api_key else "",
            "Content-Type": "application/json"
        }

    def _check_enabled(self) -> bool:
        """Check if SerpBear is configured."""
        if not self.enabled:
            logger.debug("SerpBear not configured - skipping operation")
            return False
        return True

    async def _request(self, method: str, endpoint: str, **kwargs) -> dict:
        """Make an HTTP request to SerpBear API."""
        url = f"{self.base_url}/api{endpoint}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.request(
                    method,
                    url,
                    headers=self.headers,
                    **kwargs
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"SerpBear API error: {e.response.status_code} - {e.response.text}")
                raise
            except httpx.RequestError as e:
                logger.error(f"SerpBear connection error: {e}")
                raise

    async def get_domains(self) -> list:
        """Get all tracked domains."""
        if not self._check_enabled():
            return []
        try:
            data = await self._request("GET", "/domains")
            return data.get("domains", [])
        except Exception as e:
            logger.error(f"Failed to get domains: {e}")
            return []

    async def get_domain(self, domain_id: int) -> Optional[dict]:
        """Get a specific domain by ID."""
        if not self._check_enabled():
            return None
        try:
            data = await self._request("GET", f"/domains/{domain_id}")
            return data.get("domain")
        except Exception as e:
            logger.error(f"Failed to get domain {domain_id}: {e}")
            return None

    async def add_domain(self, domain: str) -> Optional[dict]:
        """Add a new domain to track."""
        if not self._check_enabled():
            return None
        try:
            data = await self._request("POST", "/domains", json={"domain": domain})
            return data.get("domain")
        except Exception as e:
            logger.error(f"Failed to add domain {domain}: {e}")
            return None

    async def get_keywords(self, domain_id: int) -> list:
        """Get all keywords for a domain."""
        if not self._check_enabled():
            return []
        try:
            data = await self._request("GET", f"/domains/{domain_id}/keywords")
            return data.get("keywords", [])
        except Exception as e:
            logger.error(f"Failed to get keywords for domain {domain_id}: {e}")
            return []

    async def add_keyword(self, domain_id: int, keyword: str, device: str = "desktop", country: str = "US") -> Optional[dict]:
        """Add a keyword to track for a domain."""
        if not self._check_enabled():
            return None
        try:
            data = await self._request(
                "POST",
                f"/domains/{domain_id}/keywords",
                json={
                    "keyword": keyword,
                    "device": device,
                    "country": country
                }
            )
            return data.get("keyword")
        except Exception as e:
            logger.error(f"Failed to add keyword {keyword}: {e}")
            return None

    async def add_keywords_bulk(self, domain_id: int, keywords: list[str], device: str = "desktop", country: str = "US") -> list:
        """Add multiple keywords at once."""
        if not self._check_enabled():
            return []
        results = []
        for keyword in keywords:
            result = await self.add_keyword(domain_id, keyword, device, country)
            if result:
                results.append(result)
        return results

    async def get_keyword_history(self, domain_id: int, keyword_id: int) -> list:
        """Get ranking history for a keyword."""
        if not self._check_enabled():
            return []
        try:
            data = await self._request("GET", f"/domains/{domain_id}/keywords/{keyword_id}/history")
            return data.get("history", [])
        except Exception as e:
            logger.error(f"Failed to get keyword history: {e}")
            return []

    async def refresh_keywords(self, domain_id: int) -> bool:
        """Trigger a refresh of keyword rankings."""
        if not self._check_enabled():
            return False
        try:
            await self._request("POST", f"/domains/{domain_id}/refresh")
            return True
        except Exception as e:
            logger.error(f"Failed to refresh keywords: {e}")
            return False

    async def delete_keyword(self, domain_id: int, keyword_id: int) -> bool:
        """Delete a keyword from tracking."""
        if not self._check_enabled():
            return False
        try:
            await self._request("DELETE", f"/domains/{domain_id}/keywords/{keyword_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete keyword: {e}")
            return False

    async def get_rankings_summary(self, domain_id: int) -> dict:
        """Get a summary of all rankings for a domain."""
        if not self._check_enabled():
            return {"error": "SerpBear not configured", "total_keywords": 0, "keywords": []}
        keywords = await self.get_keywords(domain_id)

        if not keywords:
            return {
                "total_keywords": 0,
                "keywords": [],
                "position_distribution": {
                    "top_3": 0,
                    "top_10": 0,
                    "top_30": 0,
                    "top_100": 0,
                    "not_ranked": 0
                },
                "last_updated": None
            }

        # Calculate position distribution
        distribution = {"top_3": 0, "top_10": 0, "top_30": 0, "top_100": 0, "not_ranked": 0}

        for kw in keywords:
            pos = kw.get("position", 0)
            if pos == 0 or pos > 100:
                distribution["not_ranked"] += 1
            elif pos <= 3:
                distribution["top_3"] += 1
            elif pos <= 10:
                distribution["top_10"] += 1
            elif pos <= 30:
                distribution["top_30"] += 1
            else:
                distribution["top_100"] += 1

        # Format keywords for display
        formatted_keywords = []
        for kw in keywords:
            formatted_keywords.append({
                "id": kw.get("id"),
                "keyword": kw.get("keyword"),
                "position": kw.get("position", 0),
                "previous_position": kw.get("previousPosition", 0),
                "change": self._calculate_change(kw.get("position", 0), kw.get("previousPosition", 0)),
                "url": kw.get("url", ""),
                "device": kw.get("device", "desktop"),
                "country": kw.get("country", "US"),
                "updated_at": kw.get("updatedAt")
            })

        # Sort by position (best first, not ranked at end)
        formatted_keywords.sort(key=lambda x: x["position"] if x["position"] > 0 else 999)

        return {
            "total_keywords": len(keywords),
            "keywords": formatted_keywords,
            "position_distribution": distribution,
            "last_updated": keywords[0].get("updatedAt") if keywords else None
        }

    def _calculate_change(self, current: int, previous: int) -> dict:
        """Calculate position change and direction."""
        if current == 0 or previous == 0:
            return {"value": 0, "direction": "none"}

        diff = previous - current  # Positive = improvement (moved up)

        if diff > 0:
            return {"value": diff, "direction": "up"}
        elif diff < 0:
            return {"value": abs(diff), "direction": "down"}
        else:
            return {"value": 0, "direction": "same"}

    async def health_check(self) -> bool:
        """Check if SerpBear is running and accessible."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}")
                return response.status_code == 200
        except Exception:
            return False


# Singleton client instance
serpbear_client = SerpBearClient()


# Convenience functions
async def get_seo_rankings() -> dict:
    """Get SEO rankings summary for the main domain."""
    domains = await serpbear_client.get_domains()
    if not domains:
        return {"error": "No domains configured in SerpBear"}

    # Get first domain (main site)
    domain = domains[0]
    return await serpbear_client.get_rankings_summary(domain["id"])


async def is_serpbear_running() -> bool:
    """Check if SerpBear service is available."""
    return await serpbear_client.health_check()
