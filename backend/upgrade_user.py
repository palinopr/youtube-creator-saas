#!/usr/bin/env python3
"""
One-time script to upgrade a user to PRO plan and make them admin.
Run from backend directory: python upgrade_user.py
"""

import sys
sys.path.insert(0, '.')

from app.db.models import get_db_session, User, Subscription, PlanTier
from datetime import datetime

EMAIL = "jaime@outletmedia.net"

def upgrade_user():
    with get_db_session() as session:
        # Find user
        user = session.query(User).filter(User.email == EMAIL).first()

        if not user:
            print(f"User not found: {EMAIL}")
            return False

        print(f"Found user: {user.email} (ID: {user.id})")

        # Make admin
        user.is_admin = True
        print(f"Set is_admin = True")

        # Find or create subscription
        subscription = session.query(Subscription).filter(
            Subscription.user_id == user.id
        ).first()

        if subscription:
            subscription.plan_id = PlanTier.PRO
            subscription.updated_at = datetime.utcnow()
            print(f"Updated subscription to PRO")
        else:
            subscription = Subscription(
                user_id=user.id,
                plan_id=PlanTier.PRO,
            )
            session.add(subscription)
            print(f"Created new PRO subscription")

        session.commit()
        print(f"\n✅ Successfully upgraded {EMAIL} to PRO + Admin!")
        return True

if __name__ == "__main__":
    upgrade_user()
