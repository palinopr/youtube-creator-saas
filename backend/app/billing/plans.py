"""
Subscription plan definitions.

Defines feature limits and pricing for each plan tier.
Stripe price IDs should be configured in environment variables.
"""

import os
from typing import Any

# Plan definitions with features and limits
PLANS: dict[str, dict[str, Any]] = {
    "free": {
        "name": "Free",
        "description": "Get started with basic analytics",
        "price_monthly": 0,
        "stripe_price_id": None,  # No Stripe for free tier
        "features": {
            # Usage limits (-1 = unlimited)
            "videos_per_month": 10,
            "ai_queries_per_month": 20,
            "clips_per_month": 0,

            # Feature flags
            "clips_generation": False,
            "seo_optimization": False,
            "deep_analysis": False,
            "causal_analysis": False,
            "transcript_analysis": False,
            "export_reports": False,
            "priority_support": False,
            "api_access": False,
        },
        "highlights": [
            "10 video analyses/month",
            "20 AI queries/month",
            "Basic channel stats",
            "Community support",
        ],
    },
    "starter": {
        "name": "Starter",
        "description": "For growing creators",
        "price_monthly": 19,
        "stripe_price_id": os.getenv("STRIPE_STARTER_PRICE_ID"),
        "features": {
            # Usage limits
            "videos_per_month": 50,
            "ai_queries_per_month": 100,
            "clips_per_month": 10,

            # Feature flags
            "clips_generation": True,
            "seo_optimization": True,
            "deep_analysis": False,
            "causal_analysis": False,
            "transcript_analysis": True,
            "export_reports": False,
            "priority_support": False,
            "api_access": False,
        },
        "highlights": [
            "50 video analyses/month",
            "100 AI queries/month",
            "10 viral clips/month",
            "SEO optimization",
            "Transcript analysis",
            "Email support",
        ],
    },
    "pro": {
        "name": "Pro",
        "description": "For serious content creators",
        "price_monthly": 49,
        "stripe_price_id": os.getenv("STRIPE_PRO_PRICE_ID"),
        "features": {
            # Usage limits (-1 = unlimited)
            "videos_per_month": -1,
            "ai_queries_per_month": 500,
            "clips_per_month": 50,

            # Feature flags
            "clips_generation": True,
            "seo_optimization": True,
            "deep_analysis": True,
            "causal_analysis": True,
            "transcript_analysis": True,
            "export_reports": True,
            "priority_support": True,
            "api_access": False,
        },
        "highlights": [
            "Unlimited video analyses",
            "500 AI queries/month",
            "50 viral clips/month",
            "Deep channel analysis",
            "Causal analytics",
            "Export reports",
            "Priority support",
        ],
    },
    "agency": {
        "name": "Agency",
        "description": "For teams and agencies",
        "price_monthly": 149,
        "stripe_price_id": os.getenv("STRIPE_AGENCY_PRICE_ID"),
        "features": {
            # Usage limits (-1 = unlimited)
            "videos_per_month": -1,
            "ai_queries_per_month": -1,
            "clips_per_month": -1,

            # Feature flags
            "clips_generation": True,
            "seo_optimization": True,
            "deep_analysis": True,
            "causal_analysis": True,
            "transcript_analysis": True,
            "export_reports": True,
            "priority_support": True,
            "api_access": True,
        },
        "highlights": [
            "Everything in Pro",
            "Unlimited AI queries",
            "Unlimited viral clips",
            "API access",
            "Multiple channels",
            "Dedicated support",
        ],
    },
}


def get_plan(plan_id: str) -> dict[str, Any] | None:
    """Get plan details by ID."""
    return PLANS.get(plan_id)


def get_plan_features(plan_id: str) -> dict[str, Any]:
    """Get features for a plan (empty dict if plan not found)."""
    plan = PLANS.get(plan_id)
    if plan:
        return plan.get("features", {})
    return {}


def check_feature_access(plan_id: str, feature: str) -> bool:
    """Check if a plan has access to a feature."""
    features = get_plan_features(plan_id)
    return features.get(feature, False)


def get_usage_limit(plan_id: str, resource: str) -> int:
    """
    Get usage limit for a resource.
    Returns -1 for unlimited, 0 if not found.
    """
    features = get_plan_features(plan_id)
    return features.get(resource, 0)


def is_within_limit(plan_id: str, resource: str, current_usage: int) -> bool:
    """
    Check if current usage is within plan limits.
    Returns True if unlimited (-1) or under limit.
    """
    limit = get_usage_limit(plan_id, resource)
    if limit == -1:
        return True  # Unlimited
    return current_usage < limit
