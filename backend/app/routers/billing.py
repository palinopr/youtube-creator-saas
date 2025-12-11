"""
Billing router for Stripe subscription management.

Endpoints:
- GET /api/billing/plans - Get available plans
- GET /api/billing/subscription - Get current subscription
- POST /api/billing/checkout - Create checkout session
- POST /api/billing/portal - Create customer portal session
- POST /api/billing/webhook - Handle Stripe webhooks
- GET /api/billing/invoices - Get invoice history
- GET /api/billing/payment-method - Get payment method on file
"""

from fastapi import APIRouter, HTTPException, Depends, Request, Header, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import logging
import stripe

from ..auth.dependencies import get_current_user, get_user_subscription
from ..db.models import User, Subscription, PlanTier, SubscriptionStatus
from ..billing.plans import PLANS, get_plan, get_plan_features, get_usage_limit
from ..billing.stripe_service import stripe_service
from ..config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/billing", tags=["billing"])
settings = get_settings()

# Initialize Stripe with API key
stripe.api_key = settings.stripe_secret_key


# Request/Response Models

class CheckoutRequest(BaseModel):
    """Request model for creating a checkout session."""
    plan_id: str = Field(..., description="Plan ID to subscribe to (starter, pro, agency)")
    success_url: Optional[str] = Field(None, description="URL to redirect to on success")
    cancel_url: Optional[str] = Field(None, description="URL to redirect to on cancel")


class PortalRequest(BaseModel):
    """Request model for creating a customer portal session."""
    return_url: Optional[str] = Field(None, description="URL to return to after portal")


class CheckoutResponse(BaseModel):
    """Response model for checkout session."""
    checkout_url: str
    plan_id: str
    plan_name: str


class PortalResponse(BaseModel):
    """Response model for portal session."""
    portal_url: str


class PlanResponse(BaseModel):
    """Response model for a single plan."""
    id: str
    name: str
    description: str
    price_monthly: int
    features: dict
    highlights: list[str]
    is_current: bool = False


class SubscriptionResponse(BaseModel):
    """Response model for subscription status."""
    plan_id: str
    plan_name: str
    status: str
    is_active: bool
    current_period_end: Optional[datetime]
    cancel_at_period_end: bool
    usage: dict
    limits: dict


# Endpoints

@router.get("/plans")
async def get_plans(
    user: Optional[User] = Depends(get_current_user),
    subscription: Optional[Subscription] = Depends(get_user_subscription),
):
    """
    Get all available subscription plans with features.
    Marks the user's current plan if authenticated.
    """
    plans = []
    current_plan = subscription.plan_id.value if subscription else "free"

    for plan_id, plan_data in PLANS.items():
        plans.append({
            "id": plan_id,
            "name": plan_data["name"],
            "description": plan_data["description"],
            "price_monthly": plan_data["price_monthly"],
            "features": plan_data["features"],
            "highlights": plan_data["highlights"],
            "is_current": plan_id == current_plan,
        })

    return {"plans": plans}


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription_status(
    user: User = Depends(get_current_user),
    subscription: Subscription = Depends(get_user_subscription),
):
    """
    Get current subscription status and usage.
    """
    plan = get_plan(subscription.plan_id.value)
    plan_name = plan["name"] if plan else "Unknown"

    is_active = subscription.status in [
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.TRIALING,
    ]

    # Get usage info
    usage = {
        "videos_analyzed": subscription.videos_analyzed_this_month,
        "ai_queries": subscription.ai_queries_this_month,
        "clips_generated": subscription.clips_generated_this_month,
    }

    # Get limits from plan
    limits = {
        "videos_per_month": get_usage_limit(subscription.plan_id.value, "videos_per_month"),
        "ai_queries_per_month": get_usage_limit(subscription.plan_id.value, "ai_queries_per_month"),
        "clips_per_month": get_usage_limit(subscription.plan_id.value, "clips_per_month"),
    }

    return {
        "plan_id": subscription.plan_id.value,
        "plan_name": plan_name,
        "status": subscription.status.value,
        "is_active": is_active,
        "current_period_end": subscription.current_period_end,
        "cancel_at_period_end": subscription.cancel_at_period_end or False,
        "usage": usage,
        "limits": limits,
    }


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    checkout_request: CheckoutRequest,
    user: User = Depends(get_current_user),
    subscription: Subscription = Depends(get_user_subscription),
):
    """
    Create a Stripe Checkout session for subscription.
    Returns the checkout URL to redirect the user to.
    """
    plan_id = checkout_request.plan_id

    # Validate plan
    if plan_id not in PLANS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid plan ID. Available plans: {list(PLANS.keys())}"
        )

    plan = PLANS[plan_id]

    # Check if plan is free (no checkout needed)
    if plan["price_monthly"] == 0:
        raise HTTPException(
            status_code=400,
            detail="Free plan does not require checkout. Use /api/billing/downgrade instead."
        )

    # Check if already on this plan
    if subscription.plan_id.value == plan_id and subscription.status == SubscriptionStatus.ACTIVE:
        raise HTTPException(
            status_code=400,
            detail=f"You are already subscribed to the {plan['name']} plan."
        )

    # Build URLs
    success_url = checkout_request.success_url or f"{settings.frontend_url}/settings/billing?success=true"
    cancel_url = checkout_request.cancel_url or f"{settings.frontend_url}/settings/billing?canceled=true"

    # Create checkout session
    checkout_url = stripe_service.create_checkout_session(
        user=user,
        subscription=subscription,
        plan_id=plan_id,
        success_url=success_url,
        cancel_url=cancel_url,
    )

    if not checkout_url:
        raise HTTPException(
            status_code=500,
            detail="Failed to create checkout session. Please try again."
        )

    logger.info(f"Created checkout session for user {user.id}, plan {plan_id}")

    return {
        "checkout_url": checkout_url,
        "plan_id": plan_id,
        "plan_name": plan["name"],
    }


@router.post("/portal", response_model=PortalResponse)
async def create_portal(
    portal_request: PortalRequest,
    user: User = Depends(get_current_user),
    subscription: Subscription = Depends(get_user_subscription),
):
    """
    Create a Stripe Customer Portal session for managing subscription.
    Allows users to update payment methods, view invoices, and cancel.
    """
    if not subscription.stripe_customer_id:
        raise HTTPException(
            status_code=400,
            detail="No active subscription to manage. Please subscribe first."
        )

    return_url = portal_request.return_url or f"{settings.frontend_url}/settings/billing"

    portal_url = stripe_service.create_portal_session(
        user=user,
        subscription=subscription,
        return_url=return_url,
    )

    if not portal_url:
        raise HTTPException(
            status_code=500,
            detail="Failed to create portal session. Please try again."
        )

    logger.info(f"Created portal session for user {user.id}")

    return {"portal_url": portal_url}


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
):
    """
    Handle Stripe webhook events.

    Events handled:
    - checkout.session.completed: Subscription created
    - customer.subscription.created: New subscription
    - customer.subscription.updated: Plan changed, status changed
    - customer.subscription.deleted: Subscription canceled
    - invoice.payment_failed: Payment failed
    """
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")

    # Get raw body for signature verification
    payload = await request.body()

    success = stripe_service.handle_webhook_event(payload, stripe_signature)

    if not success:
        raise HTTPException(status_code=400, detail="Webhook processing failed")

    return {"status": "success"}


@router.post("/downgrade")
async def downgrade_to_free(
    user: User = Depends(get_current_user),
    subscription: Subscription = Depends(get_user_subscription),
):
    """
    Downgrade to free plan.
    If there's an active Stripe subscription, redirects to portal for cancellation.
    """
    if subscription.plan_id == PlanTier.FREE:
        raise HTTPException(
            status_code=400,
            detail="You are already on the free plan."
        )

    # If they have an active Stripe subscription, they need to cancel via portal
    if subscription.stripe_subscription_id:
        return {
            "action": "redirect_to_portal",
            "message": "Please use the customer portal to cancel your subscription.",
            "portal_url": f"{settings.frontend_url}/api/billing/portal",
        }

    # Otherwise, just downgrade directly (shouldn't normally happen)
    from ..db.models import get_db_session

    with get_db_session() as session:
        sub = session.query(Subscription).filter(
            Subscription.id == subscription.id
        ).first()

        if sub:
            sub.plan_id = PlanTier.FREE
            sub.updated_at = datetime.utcnow()
            session.commit()

    logger.info(f"User {user.id} downgraded to free plan")

    return {
        "status": "success",
        "message": "Successfully downgraded to free plan.",
        "plan_id": "free",
    }


@router.get("/usage")
async def get_usage(
    user: User = Depends(get_current_user),
    subscription: Subscription = Depends(get_user_subscription),
):
    """
    Get detailed usage information for the current billing period.
    """
    limits = get_plan_features(subscription.plan_id.value)

    usage_data = {
        "period_start": subscription.current_period_start,
        "period_end": subscription.current_period_end,
        "resources": {
            "videos_analyzed": {
                "used": subscription.videos_analyzed_this_month,
                "limit": limits.get("videos_per_month", 0),
                "unlimited": limits.get("videos_per_month", 0) == -1,
            },
            "ai_queries": {
                "used": subscription.ai_queries_this_month,
                "limit": limits.get("ai_queries_per_month", 0),
                "unlimited": limits.get("ai_queries_per_month", 0) == -1,
            },
            "clips_generated": {
                "used": subscription.clips_generated_this_month,
                "limit": limits.get("clips_per_month", 0),
                "unlimited": limits.get("clips_per_month", 0) == -1,
            },
        },
    }

    return usage_data


@router.get("/invoices")
async def get_invoices(
    user: User = Depends(get_current_user),
    subscription: Subscription = Depends(get_user_subscription),
    limit: int = Query(10, ge=1, le=100, description="Number of invoices to return"),
):
    """
    Get invoice history from Stripe.
    Returns past invoices with amounts, dates, and PDF links.
    """
    if not subscription.stripe_customer_id:
        return {"invoices": [], "has_more": False}

    try:
        invoices = stripe.Invoice.list(
            customer=subscription.stripe_customer_id,
            limit=limit,
        )

        formatted_invoices = []
        for inv in invoices.data:
            formatted_invoices.append({
                "id": inv.id,
                "number": inv.number,
                "status": inv.status,
                "amount_due": inv.amount_due,
                "amount_paid": inv.amount_paid,
                "currency": inv.currency,
                "created": datetime.fromtimestamp(inv.created).isoformat() if inv.created else None,
                "period_start": datetime.fromtimestamp(inv.period_start).isoformat() if inv.period_start else None,
                "period_end": datetime.fromtimestamp(inv.period_end).isoformat() if inv.period_end else None,
                "invoice_pdf": inv.invoice_pdf,
                "hosted_invoice_url": inv.hosted_invoice_url,
            })

        return {
            "invoices": formatted_invoices,
            "has_more": invoices.has_more,
        }

    except stripe.StripeError as e:
        logger.error(f"Failed to fetch invoices for user {user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch invoices")


@router.get("/payment-method")
async def get_payment_method(
    user: User = Depends(get_current_user),
    subscription: Subscription = Depends(get_user_subscription),
):
    """
    Get the default payment method on file.
    Returns card brand, last 4 digits, and expiry.
    """
    if not subscription.stripe_customer_id:
        return {"payment_method": None}

    try:
        customer = stripe.Customer.retrieve(
            subscription.stripe_customer_id,
            expand=["invoice_settings.default_payment_method"]
        )

        pm = customer.invoice_settings.default_payment_method if customer.invoice_settings else None

        if pm and hasattr(pm, 'card') and pm.card:
            return {
                "payment_method": {
                    "type": pm.type,
                    "card": {
                        "brand": pm.card.brand,
                        "last4": pm.card.last4,
                        "exp_month": pm.card.exp_month,
                        "exp_year": pm.card.exp_year,
                    },
                }
            }

        return {"payment_method": None}

    except stripe.StripeError as e:
        logger.error(f"Failed to fetch payment method for user {user.id}: {e}")
        return {"payment_method": None}


@router.get("/next-billing")
async def get_next_billing(
    user: User = Depends(get_current_user),
    subscription: Subscription = Depends(get_user_subscription),
):
    """
    Get next billing date and amount.
    """
    if not subscription.stripe_subscription_id:
        return {
            "next_billing_date": None,
            "amount": 0,
            "currency": "usd",
        }

    try:
        stripe_sub = stripe.Subscription.retrieve(subscription.stripe_subscription_id)

        return {
            "next_billing_date": datetime.fromtimestamp(stripe_sub.current_period_end).isoformat() if stripe_sub.current_period_end else None,
            "amount": stripe_sub.items.data[0].price.unit_amount if stripe_sub.items.data else 0,
            "currency": stripe_sub.currency,
            "cancel_at_period_end": stripe_sub.cancel_at_period_end,
        }

    except stripe.StripeError as e:
        logger.error(f"Failed to fetch next billing for user {user.id}: {e}")
        return {
            "next_billing_date": subscription.current_period_end.isoformat() if subscription.current_period_end else None,
            "amount": 0,
            "currency": "usd",
        }
