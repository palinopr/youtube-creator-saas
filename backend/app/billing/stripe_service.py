"""
Stripe billing service for subscription management.

Handles:
- Customer creation
- Checkout session creation
- Customer portal sessions
- Webhook event processing
"""

import stripe
import logging
from datetime import datetime
from typing import Optional

from ..config import get_settings
from ..db.models import User, Subscription, SubscriptionStatus, PlanTier, get_db_session
from .plans import PLANS

logger = logging.getLogger(__name__)
settings = get_settings()

# Initialize Stripe
stripe.api_key = settings.stripe_secret_key


class StripeService:
    """Service for Stripe billing operations."""

    def __init__(self):
        """Initialize with Stripe API key from settings."""
        if not settings.stripe_secret_key:
            logger.warning("Stripe secret key not configured. Billing features disabled.")

    def create_customer(self, user: User) -> Optional[str]:
        """
        Create a Stripe customer for a user.
        Returns the Stripe customer ID.
        """
        if not settings.stripe_secret_key:
            logger.error("Cannot create customer: Stripe not configured")
            return None

        try:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.name,
                metadata={
                    "user_id": user.id,
                }
            )
            logger.info(f"Created Stripe customer {customer.id} for user {user.id}")
            return customer.id

        except stripe.StripeError as e:
            logger.error(f"Failed to create Stripe customer: {e}")
            return None

    def get_or_create_customer(self, user: User, subscription: Subscription) -> Optional[str]:
        """Get existing customer or create new one."""
        if subscription.stripe_customer_id:
            return subscription.stripe_customer_id

        customer_id = self.create_customer(user)

        if customer_id:
            # Save customer ID to subscription
            with get_db_session() as session:
                sub = session.query(Subscription).filter(
                    Subscription.id == subscription.id
                ).first()
                if sub:
                    sub.stripe_customer_id = customer_id
                    session.commit()

        return customer_id

    def create_checkout_session(
        self,
        user: User,
        subscription: Subscription,
        plan_id: str,
        success_url: str,
        cancel_url: str,
    ) -> Optional[str]:
        """
        Create a Stripe Checkout session for subscription.
        Returns the checkout session URL.
        """
        if not settings.stripe_secret_key:
            logger.error("Cannot create checkout: Stripe not configured")
            return None

        plan = PLANS.get(plan_id)
        if not plan or not plan.get("stripe_price_id"):
            logger.error(f"Invalid plan or no Stripe price ID: {plan_id}")
            return None

        customer_id = self.get_or_create_customer(user, subscription)
        if not customer_id:
            return None

        try:
            checkout_session = stripe.checkout.Session.create(
                customer=customer_id,
                mode="subscription",
                line_items=[
                    {
                        "price": plan["stripe_price_id"],
                        "quantity": 1,
                    }
                ],
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    "user_id": user.id,
                    "plan_id": plan_id,
                },
                subscription_data={
                    "metadata": {
                        "user_id": user.id,
                        "plan_id": plan_id,
                    }
                },
            )

            logger.info(f"Created checkout session {checkout_session.id} for user {user.id}")
            return checkout_session.url

        except stripe.StripeError as e:
            logger.error(f"Failed to create checkout session: {e}")
            return None

    def create_portal_session(
        self,
        user: User,
        subscription: Subscription,
        return_url: str,
    ) -> Optional[str]:
        """
        Create a Stripe Customer Portal session.
        Returns the portal session URL.
        """
        if not settings.stripe_secret_key:
            logger.error("Cannot create portal: Stripe not configured")
            return None

        if not subscription.stripe_customer_id:
            logger.error(f"No Stripe customer for user {user.id}")
            return None

        try:
            portal_session = stripe.billing_portal.Session.create(
                customer=subscription.stripe_customer_id,
                return_url=return_url,
            )

            logger.info(f"Created portal session for user {user.id}")
            return portal_session.url

        except stripe.StripeError as e:
            logger.error(f"Failed to create portal session: {e}")
            return None

    def handle_webhook_event(self, payload: bytes, sig_header: str) -> bool:
        """
        Handle Stripe webhook events.
        Returns True if event was processed successfully.
        """
        if not settings.stripe_webhook_secret:
            logger.error("Stripe webhook secret not configured")
            return False

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.stripe_webhook_secret
            )
        except ValueError:
            logger.error("Invalid webhook payload")
            return False
        except stripe.SignatureVerificationError:
            logger.error("Invalid webhook signature")
            return False

        logger.info(f"Processing Stripe event: {event['type']}")

        # Handle the event
        if event["type"] == "checkout.session.completed":
            return self._handle_checkout_completed(event["data"]["object"])

        elif event["type"] == "customer.subscription.created":
            return self._handle_subscription_created(event["data"]["object"])

        elif event["type"] == "customer.subscription.updated":
            return self._handle_subscription_updated(event["data"]["object"])

        elif event["type"] == "customer.subscription.deleted":
            return self._handle_subscription_deleted(event["data"]["object"])

        elif event["type"] == "invoice.payment_failed":
            return self._handle_payment_failed(event["data"]["object"])

        else:
            logger.info(f"Unhandled event type: {event['type']}")
            return True

    def _handle_checkout_completed(self, session: dict) -> bool:
        """Handle successful checkout completion."""
        user_id = session.get("metadata", {}).get("user_id")
        plan_id = session.get("metadata", {}).get("plan_id")

        if not user_id:
            logger.error("No user_id in checkout session metadata")
            return False

        stripe_subscription_id = session.get("subscription")
        stripe_customer_id = session.get("customer")

        logger.info(f"Checkout completed for user {user_id}, plan {plan_id}")

        with get_db_session() as db_session:
            subscription = db_session.query(Subscription).filter(
                Subscription.user_id == user_id
            ).first()

            if subscription:
                subscription.stripe_subscription_id = stripe_subscription_id
                subscription.stripe_customer_id = stripe_customer_id
                subscription.plan_id = PlanTier(plan_id) if plan_id else PlanTier.STARTER
                subscription.status = SubscriptionStatus.ACTIVE
                subscription.updated_at = datetime.utcnow()
                db_session.commit()
                logger.info(f"Updated subscription for user {user_id}")

        return True

    def _handle_subscription_created(self, stripe_sub: dict) -> bool:
        """Handle subscription creation."""
        user_id = stripe_sub.get("metadata", {}).get("user_id")
        plan_id = stripe_sub.get("metadata", {}).get("plan_id")

        if not user_id:
            logger.warning("No user_id in subscription metadata")
            return True  # Not an error, just might be created outside our system

        with get_db_session() as session:
            subscription = session.query(Subscription).filter(
                Subscription.user_id == user_id
            ).first()

            if subscription:
                subscription.stripe_subscription_id = stripe_sub["id"]
                subscription.plan_id = PlanTier(plan_id) if plan_id else subscription.plan_id
                subscription.status = self._map_stripe_status(stripe_sub["status"])
                subscription.current_period_start = datetime.fromtimestamp(
                    stripe_sub["current_period_start"]
                )
                subscription.current_period_end = datetime.fromtimestamp(
                    stripe_sub["current_period_end"]
                )
                subscription.updated_at = datetime.utcnow()
                session.commit()

        return True

    def _handle_subscription_updated(self, stripe_sub: dict) -> bool:
        """Handle subscription updates (plan changes, status changes)."""
        stripe_sub_id = stripe_sub["id"]

        with get_db_session() as session:
            subscription = session.query(Subscription).filter(
                Subscription.stripe_subscription_id == stripe_sub_id
            ).first()

            if not subscription:
                logger.warning(f"No subscription found for Stripe ID {stripe_sub_id}")
                return True

            # Update status
            subscription.status = self._map_stripe_status(stripe_sub["status"])

            # Update period
            subscription.current_period_start = datetime.fromtimestamp(
                stripe_sub["current_period_start"]
            )
            subscription.current_period_end = datetime.fromtimestamp(
                stripe_sub["current_period_end"]
            )

            # Check cancel at period end
            subscription.cancel_at_period_end = stripe_sub.get("cancel_at_period_end", False)

            # Update plan if price changed
            if stripe_sub.get("items", {}).get("data"):
                price_id = stripe_sub["items"]["data"][0]["price"]["id"]
                new_plan = self._get_plan_from_price_id(price_id)
                if new_plan:
                    subscription.plan_id = PlanTier(new_plan)

            subscription.updated_at = datetime.utcnow()
            session.commit()

            logger.info(f"Updated subscription {stripe_sub_id}")

        return True

    def _handle_subscription_deleted(self, stripe_sub: dict) -> bool:
        """Handle subscription cancellation."""
        stripe_sub_id = stripe_sub["id"]

        with get_db_session() as session:
            subscription = session.query(Subscription).filter(
                Subscription.stripe_subscription_id == stripe_sub_id
            ).first()

            if subscription:
                # Downgrade to free plan
                subscription.plan_id = PlanTier.FREE
                subscription.status = SubscriptionStatus.CANCELED
                subscription.stripe_subscription_id = None
                subscription.current_period_end = None
                subscription.updated_at = datetime.utcnow()
                session.commit()

                logger.info(f"Subscription {stripe_sub_id} cancelled, downgraded to free")

        return True

    def _handle_payment_failed(self, invoice: dict) -> bool:
        """Handle failed payment."""
        stripe_sub_id = invoice.get("subscription")

        if not stripe_sub_id:
            return True

        with get_db_session() as session:
            subscription = session.query(Subscription).filter(
                Subscription.stripe_subscription_id == stripe_sub_id
            ).first()

            if subscription:
                subscription.status = SubscriptionStatus.PAST_DUE
                subscription.updated_at = datetime.utcnow()
                session.commit()

                logger.warning(f"Payment failed for subscription {stripe_sub_id}")

        return True

    def _map_stripe_status(self, stripe_status: str) -> SubscriptionStatus:
        """Map Stripe subscription status to our enum."""
        status_map = {
            "active": SubscriptionStatus.ACTIVE,
            "canceled": SubscriptionStatus.CANCELED,
            "past_due": SubscriptionStatus.PAST_DUE,
            "trialing": SubscriptionStatus.TRIALING,
            "unpaid": SubscriptionStatus.UNPAID,
        }
        return status_map.get(stripe_status, SubscriptionStatus.ACTIVE)

    def _get_plan_from_price_id(self, price_id: str) -> Optional[str]:
        """Get plan ID from Stripe price ID."""
        for plan_id, plan in PLANS.items():
            if plan.get("stripe_price_id") == price_id:
                return plan_id
        return None


# Global instance
stripe_service = StripeService()
