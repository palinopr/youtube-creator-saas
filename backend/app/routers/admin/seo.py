"""
Admin SEO tracking endpoints (SerpBear integration).
"""

from fastapi import APIRouter, Depends, HTTPException

from ...auth.dependencies import require_admin
from ...db.models import User
from ...services.serpbear import (
    serpbear_client,
    get_seo_rankings,
    is_serpbear_running
)
from .base import AddDomainRequest, AddKeywordRequest, AddKeywordsBulkRequest

router = APIRouter(tags=["admin-seo"])


@router.get("/seo/rankings")
async def get_rankings(user: User = Depends(require_admin)):
    """
    Get current SEO rankings summary.

    Returns all tracked keywords with their positions and changes.
    """
    if not await is_serpbear_running():
        return {
            "error": "SerpBear is not running",
            "message": "Start SerpBear with: cd serpbear && docker compose up -d",
            "keywords": [],
            "total_keywords": 0
        }

    rankings = await get_seo_rankings()
    return rankings


@router.get("/seo/domains")
async def get_domains(user: User = Depends(require_admin)):
    """Get all tracked domains."""
    if not await is_serpbear_running():
        raise HTTPException(status_code=503, detail="SerpBear is not running")

    domains = await serpbear_client.get_domains()
    return {"domains": domains}


@router.post("/seo/domains")
async def add_domain(request: AddDomainRequest, user: User = Depends(require_admin)):
    """Add a new domain to track."""
    if not await is_serpbear_running():
        raise HTTPException(status_code=503, detail="SerpBear is not running")

    domain = await serpbear_client.add_domain(request.domain)
    if not domain:
        raise HTTPException(status_code=400, detail="Failed to add domain")

    return {"domain": domain, "message": f"Domain '{request.domain}' added successfully"}


@router.get("/seo/domains/{domain_id}/keywords")
async def get_keywords(domain_id: int, user: User = Depends(require_admin)):
    """Get all keywords for a domain."""
    if not await is_serpbear_running():
        raise HTTPException(status_code=503, detail="SerpBear is not running")

    keywords = await serpbear_client.get_keywords(domain_id)
    return {"keywords": keywords, "total": len(keywords)}


@router.post("/seo/keywords")
async def add_keyword(request: AddKeywordRequest, user: User = Depends(require_admin)):
    """Add a keyword to track."""
    if not await is_serpbear_running():
        raise HTTPException(status_code=503, detail="SerpBear is not running")

    keyword = await serpbear_client.add_keyword(
        request.domain_id,
        request.keyword,
        request.device,
        request.country
    )

    if not keyword:
        raise HTTPException(status_code=400, detail="Failed to add keyword")

    return {"keyword": keyword, "message": f"Keyword '{request.keyword}' added successfully"}


@router.post("/seo/keywords/bulk")
async def add_keywords_bulk(request: AddKeywordsBulkRequest, user: User = Depends(require_admin)):
    """Add multiple keywords at once."""
    if not await is_serpbear_running():
        raise HTTPException(status_code=503, detail="SerpBear is not running")

    keywords = await serpbear_client.add_keywords_bulk(
        request.domain_id,
        request.keywords,
        request.device,
        request.country
    )

    return {
        "added": len(keywords),
        "total_requested": len(request.keywords),
        "keywords": keywords
    }


@router.get("/seo/domains/{domain_id}/keywords/{keyword_id}/history")
async def get_keyword_history(domain_id: int, keyword_id: int, user: User = Depends(require_admin)):
    """Get ranking history for a keyword."""
    if not await is_serpbear_running():
        raise HTTPException(status_code=503, detail="SerpBear is not running")

    history = await serpbear_client.get_keyword_history(domain_id, keyword_id)
    return {"history": history}


@router.post("/seo/domains/{domain_id}/refresh")
async def refresh_rankings(domain_id: int, user: User = Depends(require_admin)):
    """Trigger a refresh of keyword rankings."""
    if not await is_serpbear_running():
        raise HTTPException(status_code=503, detail="SerpBear is not running")

    success = await serpbear_client.refresh_keywords(domain_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to trigger refresh")

    return {"message": "Refresh triggered. Rankings will update shortly."}


@router.delete("/seo/domains/{domain_id}/keywords/{keyword_id}")
async def delete_keyword(domain_id: int, keyword_id: int, user: User = Depends(require_admin)):
    """Delete a keyword from tracking."""
    if not await is_serpbear_running():
        raise HTTPException(status_code=503, detail="SerpBear is not running")

    success = await serpbear_client.delete_keyword(domain_id, keyword_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete keyword")

    return {"message": "Keyword deleted successfully"}


@router.get("/seo/suggested-keywords")
async def get_suggested_keywords(user: User = Depends(require_admin)):
    """
    Get suggested keywords to track for TubeGrow.

    These are pre-defined keywords relevant to YouTube creator tools.
    """
    return {
        "product_keywords": [
            "youtube analytics tool",
            "youtube seo tool",
            "viral clips generator",
            "youtube growth tool",
            "youtube thumbnail analyzer",
            "youtube video optimizer",
            "youtube keyword research tool",
            "youtube channel analyzer",
            "ai youtube tools",
            "youtube creator tools",
        ],
        "content_keywords": [
            "how to grow youtube channel",
            "youtube algorithm tips",
            "best time to post on youtube",
            "how to get more views on youtube",
            "youtube seo tips",
            "how to make viral youtube videos",
            "youtube shorts tips",
            "youtube monetization tips",
            "youtube thumbnail tips",
            "youtube title optimization",
        ],
        "competitor_keywords": [
            "tubics alternative",
            "vidiq alternative",
            "tubebuddy alternative",
            "morningfame alternative",
        ]
    }
