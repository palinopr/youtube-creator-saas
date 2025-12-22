"""
Admin analytics endpoints - revenue, platform metrics, API costs.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy import func, desc
from sqlalchemy.orm import Session, joinedload

from ...auth.dependencies import require_admin, get_db
from ...db.models import (
    User, Subscription, YouTubeChannel, AdminActivityLog, AdminActionType,
    PlanTier, SubscriptionStatus, Job, JobType, JobStatus,
    APIUsage, AgentType, OPENAI_PRICING, IS_SQLITE
)
from ...services.serpbear import is_serpbear_running

router = APIRouter(tags=["admin-analytics"])


# =============================================================================
# Revenue Analytics
# =============================================================================

@router.get("/revenue/metrics")
async def get_revenue_metrics(
    period: str = Query("30d", regex="^(7d|30d|90d|1y|all)$"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get revenue metrics: MRR, subscribers by plan, etc.

    Note: Admin accounts are excluded from revenue calculations.
    """
    now = datetime.utcnow()
    month_ago = now - timedelta(days=30)

    # Get admin user IDs to exclude from revenue calculations
    admin_user_ids = [u.id for u in db.query(User.id).filter(User.is_admin == True).all()]

    # Count subscribers by plan (excluding admins)
    plan_counts_query = db.query(
        Subscription.plan_id,
        func.count(Subscription.id)
    ).filter(
        Subscription.status == SubscriptionStatus.ACTIVE
    )
    if admin_user_ids:
        plan_counts_query = plan_counts_query.filter(
            ~Subscription.user_id.in_(admin_user_ids)
        )
    plan_counts = plan_counts_query.group_by(Subscription.plan_id).all()

    subscribers_by_plan = {plan.value: count for plan, count in plan_counts}

    # Calculate MRR (Monthly Recurring Revenue) - excludes admin accounts
    # Prices: Free=$0, Starter=$19, Pro=$49, Agency=$149
    plan_prices = {"free": 0, "starter": 19, "pro": 49, "agency": 149}
    mrr = sum(subscribers_by_plan.get(plan, 0) * price for plan, price in plan_prices.items())

    # Total subscribers (excluding admins)
    total_subs_query = db.query(Subscription).filter(
        Subscription.status == SubscriptionStatus.ACTIVE
    )
    if admin_user_ids:
        total_subs_query = total_subs_query.filter(
            ~Subscription.user_id.in_(admin_user_ids)
        )
    total_subscribers = total_subs_query.count()

    # Paid subscribers (excluding admins)
    paid_subs_query = db.query(Subscription).filter(
        Subscription.status == SubscriptionStatus.ACTIVE,
        Subscription.plan_id != PlanTier.FREE
    )
    if admin_user_ids:
        paid_subs_query = paid_subs_query.filter(
            ~Subscription.user_id.in_(admin_user_ids)
        )
    paid_subscribers = paid_subs_query.count()

    # Trial subscribers count (excluding admins)
    trial_subs_query = db.query(Subscription).filter(
        Subscription.status == SubscriptionStatus.TRIALING
    )
    if admin_user_ids:
        trial_subs_query = trial_subs_query.filter(
            ~Subscription.user_id.in_(admin_user_ids)
        )
    trial_subscribers = trial_subs_query.count()

    # Churn: canceled in period
    period_days = {"7d": 7, "30d": 30, "90d": 90, "1y": 365, "all": 3650}
    days = period_days.get(period, 30)
    cutoff = now - timedelta(days=days)

    canceled_count = db.query(Subscription).filter(
        Subscription.status == SubscriptionStatus.CANCELED,
        Subscription.updated_at >= cutoff
    ).count()

    churn_rate = (canceled_count / total_subscribers * 100) if total_subscribers > 0 else 0

    # Calculate average revenue per user (ARPU)
    arpu = mrr / paid_subscribers if paid_subscribers > 0 else 0

    # Build plan_breakdown array for frontend
    plan_breakdown = []
    total_count = sum(subscribers_by_plan.values()) or 1  # Avoid division by zero
    for plan_name, price in plan_prices.items():
        count = subscribers_by_plan.get(plan_name, 0)
        revenue = count * price
        percentage = round((count / total_count) * 100, 1) if total_count > 0 else 0
        plan_breakdown.append({
            "plan": plan_name,
            "count": count,
            "revenue": revenue,
            "percentage": percentage,
        })

    # New subscriptions this month (excluding admins)
    new_subs_query = db.query(Subscription).filter(
        Subscription.created_at >= month_ago
    )
    if admin_user_ids:
        new_subs_query = new_subs_query.filter(
            ~Subscription.user_id.in_(admin_user_ids)
        )
    new_subs_this_month = new_subs_query.count()

    # Cancellations this month (excluding admins)
    cancellations_query = db.query(Subscription).filter(
        Subscription.status == SubscriptionStatus.CANCELED,
        Subscription.updated_at >= month_ago
    )
    if admin_user_ids:
        cancellations_query = cancellations_query.filter(
            ~Subscription.user_id.in_(admin_user_ids)
        )
    cancellations_this_month = cancellations_query.count()

    # Query AdminActivityLog for subscription changes to get real upgrade/downgrade counts
    plan_hierarchy = {"free": 0, "starter": 1, "pro": 2, "agency": 3}
    upgrades_this_month = 0
    downgrades_this_month = 0

    # Get subscription change logs from this month
    subscription_changes = db.query(AdminActivityLog).filter(
        AdminActivityLog.action_type == AdminActionType.SUBSCRIPTION_CHANGE,
        AdminActivityLog.created_at >= month_ago
    ).all()

    for log in subscription_changes:
        old_val = log.old_value or {}
        new_val = log.new_value or {}
        old_plan = old_val.get("plan_id", "free")
        new_plan = new_val.get("plan_id", "free")

        old_rank = plan_hierarchy.get(old_plan, 0)
        new_rank = plan_hierarchy.get(new_plan, 0)

        if new_rank > old_rank:
            upgrades_this_month += 1
        elif new_rank < old_rank:
            downgrades_this_month += 1

    # MRR change (simplified - based on new subs vs cancellations)
    avg_new_sub_value = 29  # Rough average between starter/pro/agency
    mrr_change_estimate = (new_subs_this_month - cancellations_this_month) * avg_new_sub_value
    mrr_change_percent = (mrr_change_estimate / mrr * 100) if mrr > 0 else 0

    return {
        "mrr": mrr,
        "arr": mrr * 12,
        "total_revenue": mrr,  # For simplicity, using MRR as total (would normally track cumulative)
        "active_subscriptions": total_subscribers,
        "paid_subscriptions": paid_subscribers,
        "trial_subscriptions": trial_subscribers,
        "churn_rate": round(churn_rate, 2),
        "average_revenue_per_user": round(arpu, 2),
        "plan_breakdown": plan_breakdown,
        "admin_excluded": len(admin_user_ids),  # Number of admin accounts excluded
        "trends": {
            "mrr_change": round(mrr_change_percent, 1),
            "new_subscriptions_this_month": new_subs_this_month,
            "cancellations_this_month": cancellations_this_month,
            "upgrades_this_month": upgrades_this_month,
            "downgrades_this_month": downgrades_this_month,
        },
    }


@router.get("/revenue/trends")
async def get_revenue_trends(
    period: str = Query("30d", regex="^(7d|30d|90d|1y)$"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get upgrade/downgrade trends."""
    period_days = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}
    days = period_days.get(period, 30)
    cutoff = datetime.utcnow() - timedelta(days=days)

    # New subscriptions in period
    new_subs = db.query(Subscription).filter(
        Subscription.created_at >= cutoff
    ).count()

    # Active subscriptions over time (simplified - count by plan)
    active_by_plan = db.query(
        Subscription.plan_id,
        func.count(Subscription.id)
    ).filter(
        Subscription.status == SubscriptionStatus.ACTIVE
    ).group_by(Subscription.plan_id).all()

    return {
        "new_subscriptions": new_subs,
        "active_by_plan": {plan.value: count for plan, count in active_by_plan},
        "period": period,
    }


# =============================================================================
# Platform Analytics
# =============================================================================

@router.get("/analytics/users")
async def get_user_analytics(
    period: str = Query("30d", regex="^(7d|30d|90d|1y)$"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get user analytics: DAU, MAU, WAU, new signups."""
    now = datetime.utcnow()
    day_ago = now - timedelta(days=1)
    two_days_ago = now - timedelta(days=2)
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)
    month_ago = now - timedelta(days=30)
    two_months_ago = now - timedelta(days=60)

    # Current period active users
    dau = db.query(User).filter(User.last_login_at >= day_ago).count()
    wau = db.query(User).filter(User.last_login_at >= week_ago).count()
    mau = db.query(User).filter(User.last_login_at >= month_ago).count()

    # Previous period active users (for change calculation)
    prev_dau = db.query(User).filter(
        User.last_login_at >= two_days_ago,
        User.last_login_at < day_ago
    ).count()
    prev_wau = db.query(User).filter(
        User.last_login_at >= two_weeks_ago,
        User.last_login_at < week_ago
    ).count()
    prev_mau = db.query(User).filter(
        User.last_login_at >= two_months_ago,
        User.last_login_at < month_ago
    ).count()

    # Calculate changes
    dau_change = ((dau - prev_dau) / prev_dau * 100) if prev_dau > 0 else 0
    wau_change = ((wau - prev_wau) / prev_wau * 100) if prev_wau > 0 else 0
    mau_change = ((mau - prev_mau) / prev_mau * 100) if prev_mau > 0 else 0

    # New signups
    new_today = db.query(User).filter(User.created_at >= day_ago).count()
    new_this_week = db.query(User).filter(User.created_at >= week_ago).count()
    new_this_month = db.query(User).filter(User.created_at >= month_ago).count()

    # Total users
    total_users = db.query(User).filter(User.deleted_at.is_(None)).count()

    # Calculate retention rate (users who logged in this month / users who signed up last month)
    last_month_signups = db.query(User).filter(
        User.created_at >= two_months_ago,
        User.created_at < month_ago
    ).count()
    retained_users = db.query(User).filter(
        User.created_at >= two_months_ago,
        User.created_at < month_ago,
        User.last_login_at >= month_ago
    ).count()
    retention_rate = (retained_users / last_month_signups * 100) if last_month_signups > 0 else 0

    # Growth rate (month over month)
    prev_month_total = db.query(User).filter(
        User.created_at < month_ago,
        User.deleted_at.is_(None)
    ).count()
    growth_rate = ((total_users - prev_month_total) / prev_month_total * 100) if prev_month_total > 0 else 0

    return {
        "dau": dau,
        "wau": wau,
        "mau": mau,
        "dau_change": round(dau_change, 1),
        "wau_change": round(wau_change, 1),
        "mau_change": round(mau_change, 1),
        "retention_rate": round(retention_rate, 1),
        "new_users_today": new_today,
        "new_users_this_week": new_this_week,
        "new_users_this_month": new_this_month,
        "total_users": total_users,
        "growth_rate": round(growth_rate, 1),
    }


@router.get("/analytics/features")
async def get_feature_usage(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get feature usage breakdown from Job table and subscription usage."""
    now = datetime.utcnow()
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    # Aggregate usage across all subscriptions
    usage = db.query(
        func.sum(Subscription.videos_analyzed_this_month).label("total_videos"),
        func.sum(Subscription.ai_queries_this_month).label("total_ai_queries"),
        func.sum(Subscription.clips_generated_this_month).label("total_clips"),
    ).first()

    total_seo = usage.total_videos or 0
    total_queries = usage.total_ai_queries or 0

    # Query real clip jobs from Job table
    clips_today = db.query(Job).filter(
        Job.job_type == JobType.RENDER_CLIP,
        Job.created_at >= day_ago
    ).count()

    clips_this_week = db.query(Job).filter(
        Job.job_type == JobType.RENDER_CLIP,
        Job.created_at >= week_ago
    ).count()

    clips_this_month = db.query(Job).filter(
        Job.job_type == JobType.RENDER_CLIP,
        Job.created_at >= month_ago
    ).count()

    total_clips = db.query(Job).filter(
        Job.job_type == JobType.RENDER_CLIP
    ).count()

    # Query real deep analysis jobs from Job table
    deep_analysis_today = db.query(Job).filter(
        Job.job_type == JobType.DEEP_ANALYSIS,
        Job.created_at >= day_ago
    ).count()

    deep_analysis_this_week = db.query(Job).filter(
        Job.job_type == JobType.DEEP_ANALYSIS,
        Job.created_at >= week_ago
    ).count()

    deep_analysis_this_month = db.query(Job).filter(
        Job.job_type == JobType.DEEP_ANALYSIS,
        Job.created_at >= month_ago
    ).count()

    total_deep_analysis = db.query(Job).filter(
        Job.job_type == JobType.DEEP_ANALYSIS
    ).count()

    # Channel stats
    total_channels = db.query(YouTubeChannel).filter(YouTubeChannel.is_active == True).count()
    new_channels_today = db.query(YouTubeChannel).filter(YouTubeChannel.created_at >= day_ago).count()

    return {
        "clips_generated": {
            "today": clips_today,
            "this_week": clips_this_week,
            "this_month": clips_this_month,
            "total": total_clips,
        },
        "seo_analyses": {
            "today": deep_analysis_today,
            "this_week": deep_analysis_this_week,
            "this_month": max(total_seo, deep_analysis_this_month),
            "total": max(total_seo, total_deep_analysis),
        },
        "agent_queries": {
            "today": 0,  # AI queries not tracked in Job table
            "this_week": 0,
            "this_month": total_queries,
            "total": total_queries,
        },
        "channels_connected": {
            "today": new_channels_today,
            "total": total_channels,
        },
    }


@router.get("/analytics/system")
async def get_system_health(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get system health metrics from Job table."""
    from sqlalchemy import text

    now = datetime.utcnow()
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    # Database connectivity check
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    # SerpBear status
    serpbear_running = await is_serpbear_running()

    # Query real job queue stats from Job table
    pending_jobs = db.query(Job).filter(
        Job.status == JobStatus.PENDING
    ).count()

    queued_jobs = db.query(Job).filter(
        Job.status == JobStatus.QUEUED
    ).count()

    processing_jobs = db.query(Job).filter(
        Job.status.in_([JobStatus.PROCESSING, JobStatus.RENDERING])
    ).count()

    completed_today = db.query(Job).filter(
        Job.status == JobStatus.COMPLETED,
        Job.completed_at >= day_ago
    ).count()

    failed_today = db.query(Job).filter(
        Job.status == JobStatus.FAILED,
        Job.updated_at >= day_ago
    ).count()

    # Total jobs for stats
    total_jobs_today = db.query(Job).filter(Job.created_at >= day_ago).count()
    total_jobs_this_week = db.query(Job).filter(Job.created_at >= week_ago).count()
    total_jobs_this_month = db.query(Job).filter(Job.created_at >= month_ago).count()

    return {
        "api_calls": {
            "today": total_jobs_today,
            "this_week": total_jobs_this_week,
            "this_month": total_jobs_this_month,
        },
        "job_queue": {
            "pending": pending_jobs + queued_jobs,
            "processing": processing_jobs,
            "completed_today": completed_today,
            "failed_today": failed_today,
        },
        "response_times": {
            "avg_ms": 0,  # Would need request timing middleware
            "p95_ms": 0,
            "p99_ms": 0,
        },
        "uptime": {
            "status": db_status,
            "uptime_percentage": 99.9 if db_status == "healthy" else 0,
            "last_incident": None,
        },
    }


# =============================================================================
# API Cost Tracking
# =============================================================================

@router.get("/api-costs/summary")
async def get_api_costs_summary(
    period: str = Query("30d", regex="^(7d|30d|90d|1y|all)$"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Get API cost summary: total costs, costs by agent, costs by model.
    """
    now = datetime.utcnow()
    period_days = {"7d": 7, "30d": 30, "90d": 90, "1y": 365, "all": 3650}
    days = period_days.get(period, 30)
    cutoff = now - timedelta(days=days)

    # Base query for the period
    base_query = db.query(APIUsage).filter(APIUsage.created_at >= cutoff)

    # Total costs
    totals = db.query(
        func.sum(APIUsage.cost_usd).label("total_cost"),
        func.sum(APIUsage.prompt_tokens).label("total_prompt_tokens"),
        func.sum(APIUsage.completion_tokens).label("total_completion_tokens"),
        func.sum(APIUsage.total_tokens).label("total_tokens"),
        func.count(APIUsage.id).label("total_requests"),
        func.avg(APIUsage.latency_ms).label("avg_latency"),
    ).filter(APIUsage.created_at >= cutoff).first()

    # Costs by agent type
    by_agent = db.query(
        APIUsage.agent_type,
        func.sum(APIUsage.cost_usd).label("cost"),
        func.sum(APIUsage.total_tokens).label("tokens"),
        func.count(APIUsage.id).label("requests"),
    ).filter(APIUsage.created_at >= cutoff).group_by(APIUsage.agent_type).all()

    # Costs by model
    by_model = db.query(
        APIUsage.model,
        func.sum(APIUsage.cost_usd).label("cost"),
        func.sum(APIUsage.total_tokens).label("tokens"),
        func.count(APIUsage.id).label("requests"),
    ).filter(APIUsage.created_at >= cutoff).group_by(APIUsage.model).all()

    # Success/failure rate
    success_count = db.query(APIUsage).filter(
        APIUsage.created_at >= cutoff,
        APIUsage.success == True
    ).count()
    failed_count = db.query(APIUsage).filter(
        APIUsage.created_at >= cutoff,
        APIUsage.success == False
    ).count()

    total_requests = totals.total_requests or 0
    success_rate = (success_count / total_requests * 100) if total_requests > 0 else 0

    # Compare to previous period
    prev_cutoff = cutoff - timedelta(days=days)
    prev_totals = db.query(
        func.sum(APIUsage.cost_usd).label("total_cost"),
        func.count(APIUsage.id).label("total_requests"),
    ).filter(
        APIUsage.created_at >= prev_cutoff,
        APIUsage.created_at < cutoff
    ).first()

    prev_cost = prev_totals.total_cost or 0
    current_cost = totals.total_cost or 0
    cost_change = ((current_cost - prev_cost) / prev_cost * 100) if prev_cost > 0 else 0

    return {
        "period": period,
        "totals": {
            "cost_usd": round(current_cost, 4) if current_cost else 0,
            "prompt_tokens": totals.total_prompt_tokens or 0,
            "completion_tokens": totals.total_completion_tokens or 0,
            "total_tokens": totals.total_tokens or 0,
            "requests": total_requests,
            "avg_latency_ms": round(totals.avg_latency, 1) if totals.avg_latency else 0,
            "success_rate": round(success_rate, 1),
            "failed_requests": failed_count,
        },
        "trends": {
            "cost_change_percent": round(cost_change, 1),
            "previous_period_cost": round(prev_cost, 4) if prev_cost else 0,
        },
        "by_agent": [
            {
                "agent_type": row.agent_type.value if row.agent_type else "unknown",
                "cost_usd": round(row.cost, 4) if row.cost else 0,
                "tokens": row.tokens or 0,
                "requests": row.requests or 0,
            }
            for row in by_agent
        ],
        "by_model": [
            {
                "model": row.model,
                "cost_usd": round(row.cost, 4) if row.cost else 0,
                "tokens": row.tokens or 0,
                "requests": row.requests or 0,
            }
            for row in by_model
        ],
        "pricing": OPENAI_PRICING,
    }


@router.get("/api-costs/breakdown")
async def get_api_costs_breakdown(
    period: str = Query("30d", regex="^(7d|30d|90d)$"),
    group_by: str = Query("day", regex="^(day|hour|agent|model)$"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Get API cost breakdown by time period or category.
    """
    now = datetime.utcnow()
    period_days = {"7d": 7, "30d": 30, "90d": 90}
    days = period_days.get(period, 30)
    cutoff = now - timedelta(days=days)

    if group_by == "day":
        # Group by date
        if IS_SQLITE:
            date_trunc = func.date(APIUsage.created_at)
        else:
            date_trunc = func.date_trunc('day', APIUsage.created_at)

        results = db.query(
            date_trunc.label("date"),
            func.sum(APIUsage.cost_usd).label("cost"),
            func.sum(APIUsage.total_tokens).label("tokens"),
            func.count(APIUsage.id).label("requests"),
        ).filter(
            APIUsage.created_at >= cutoff
        ).group_by(date_trunc).order_by(date_trunc).all()

        breakdown = [
            {
                "date": str(row.date),
                "cost_usd": round(row.cost, 4) if row.cost else 0,
                "tokens": row.tokens or 0,
                "requests": row.requests or 0,
            }
            for row in results
        ]
    elif group_by == "hour":
        # Group by hour (last 7 days only)
        if IS_SQLITE:
            hour_trunc = func.strftime('%Y-%m-%d %H:00', APIUsage.created_at)
        else:
            hour_trunc = func.date_trunc('hour', APIUsage.created_at)

        short_cutoff = now - timedelta(days=7)
        results = db.query(
            hour_trunc.label("hour"),
            func.sum(APIUsage.cost_usd).label("cost"),
            func.count(APIUsage.id).label("requests"),
        ).filter(
            APIUsage.created_at >= short_cutoff
        ).group_by(hour_trunc).order_by(hour_trunc).all()

        breakdown = [
            {
                "hour": str(row.hour),
                "cost_usd": round(row.cost, 4) if row.cost else 0,
                "requests": row.requests or 0,
            }
            for row in results
        ]
    elif group_by == "agent":
        # Group by agent and day
        if IS_SQLITE:
            date_trunc = func.date(APIUsage.created_at)
        else:
            date_trunc = func.date_trunc('day', APIUsage.created_at)

        results = db.query(
            date_trunc.label("date"),
            APIUsage.agent_type,
            func.sum(APIUsage.cost_usd).label("cost"),
            func.count(APIUsage.id).label("requests"),
        ).filter(
            APIUsage.created_at >= cutoff
        ).group_by(date_trunc, APIUsage.agent_type).order_by(date_trunc).all()

        breakdown = [
            {
                "date": str(row.date),
                "agent_type": row.agent_type.value if row.agent_type else "unknown",
                "cost_usd": round(row.cost, 4) if row.cost else 0,
                "requests": row.requests or 0,
            }
            for row in results
        ]
    else:  # model
        # Group by model and day
        if IS_SQLITE:
            date_trunc = func.date(APIUsage.created_at)
        else:
            date_trunc = func.date_trunc('day', APIUsage.created_at)

        results = db.query(
            date_trunc.label("date"),
            APIUsage.model,
            func.sum(APIUsage.cost_usd).label("cost"),
            func.count(APIUsage.id).label("requests"),
        ).filter(
            APIUsage.created_at >= cutoff
        ).group_by(date_trunc, APIUsage.model).order_by(date_trunc).all()

        breakdown = [
            {
                "date": str(row.date),
                "model": row.model,
                "cost_usd": round(row.cost, 4) if row.cost else 0,
                "requests": row.requests or 0,
            }
            for row in results
        ]

    return {
        "period": period,
        "group_by": group_by,
        "breakdown": breakdown,
    }


@router.get("/api-costs/recent")
async def get_recent_api_calls(
    agent_type: Optional[str] = None,
    model: Optional[str] = None,
    success: Optional[bool] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Get recent API calls with filtering.
    """
    query = db.query(APIUsage)

    if agent_type:
        try:
            agent = AgentType(agent_type)
            query = query.filter(APIUsage.agent_type == agent)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid agent_type: {agent_type}")

    if model:
        query = query.filter(APIUsage.model == model)

    if success is not None:
        query = query.filter(APIUsage.success == success)

    total = query.count()
    offset = (page - 1) * per_page
    calls = query.order_by(desc(APIUsage.created_at)).offset(offset).limit(per_page).all()

    return {
        "items": [call.to_dict() for call in calls],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
    }


@router.get("/api-costs/by-user")
async def get_api_costs_by_user(
    period: str = Query("30d", regex="^(7d|30d|90d|all)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Get API costs grouped by user.
    """
    now = datetime.utcnow()
    period_days = {"7d": 7, "30d": 30, "90d": 90, "all": 3650}
    days = period_days.get(period, 30)
    cutoff = now - timedelta(days=days)

    # Query costs by user
    results = db.query(
        APIUsage.user_id,
        func.sum(APIUsage.cost_usd).label("total_cost"),
        func.sum(APIUsage.total_tokens).label("total_tokens"),
        func.count(APIUsage.id).label("total_requests"),
    ).filter(
        APIUsage.created_at >= cutoff
    ).group_by(APIUsage.user_id).order_by(desc("total_cost")).all()

    total = len(results)
    offset = (page - 1) * per_page
    paginated = results[offset:offset + per_page]

    # Get user details
    user_ids = [r.user_id for r in paginated if r.user_id]
    users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}

    items = []
    for row in paginated:
        user = users.get(row.user_id)
        items.append({
            "user_id": row.user_id,
            "user_email": user.email if user else "anonymous",
            "user_name": user.name if user else "Anonymous",
            "cost_usd": round(row.total_cost, 4) if row.total_cost else 0,
            "tokens": row.total_tokens or 0,
            "requests": row.total_requests or 0,
        })

    return {
        "period": period,
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
    }
