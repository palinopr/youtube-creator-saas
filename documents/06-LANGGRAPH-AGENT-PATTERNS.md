# LangGraph Agent Patterns for YouTube Analytics - Complete Reference

## Overview

This document outlines design patterns for building LangGraph agents that leverage YouTube APIs to provide analytics insights, automate tasks, and enhance creator productivity.

---

## Agent Architecture Overview

### Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                      LangGraph Agent                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  State       │  │  Tools       │  │  Memory      │          │
│  │  Management  │  │  (YouTube    │  │  (Context &  │          │
│  │              │  │   API calls) │  │   History)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│                         Nodes                                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Fetch   │→│ Analyze │→│ Compare │→│ Generate│→│ Report  │  │
│  │ Data    │ │ Metrics │ │ Trends  │ │ Insights│ │ Output  │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pattern 1: Analytics Dashboard Agent

### Purpose
Provide real-time analytics insights and answer questions about channel performance.

### State Definition

```python
from typing import TypedDict, List, Optional, Any
from datetime import datetime

class AnalyticsDashboardState(TypedDict):
    # User context
    user_id: str
    channel_id: str
    access_token: str
    refresh_token: str

    # Query context
    user_query: str
    date_range: dict  # {start: str, end: str}
    videos_filter: Optional[List[str]]

    # Fetched data
    channel_data: Optional[dict]
    video_stats: Optional[List[dict]]
    analytics_data: Optional[dict]
    historical_data: Optional[dict]

    # Analysis results
    insights: List[str]
    recommendations: List[str]
    anomalies: List[dict]

    # Output
    response: str
    visualizations: List[dict]
```

### Tools

```python
from langchain.tools import tool
from googleapiclient.discovery import build

@tool
def get_channel_overview(channel_id: str, access_token: str) -> dict:
    """Fetch channel overview statistics."""
    youtube = build('youtube', 'v3', credentials=get_credentials(access_token))

    response = youtube.channels().list(
        part='snippet,statistics,contentDetails',
        id=channel_id
    ).execute()

    if response['items']:
        channel = response['items'][0]
        return {
            'title': channel['snippet']['title'],
            'subscribers': int(channel['statistics'].get('subscriberCount', 0)),
            'total_views': int(channel['statistics'].get('viewCount', 0)),
            'video_count': int(channel['statistics'].get('videoCount', 0)),
            'uploads_playlist': channel['contentDetails']['relatedPlaylists']['uploads']
        }
    return {}

@tool
def get_video_analytics(
    channel_id: str,
    access_token: str,
    start_date: str,
    end_date: str,
    video_ids: Optional[List[str]] = None
) -> dict:
    """Fetch video analytics from YouTube Analytics API."""
    analytics = build('youtubeAnalytics', 'v2', credentials=get_credentials(access_token))

    metrics = 'views,estimatedMinutesWatched,averageViewDuration,likes,comments,shares,subscribersGained'
    dimensions = 'video'

    filters = None
    if video_ids:
        filters = f"video=={','.join(video_ids)}"

    response = analytics.reports().query(
        ids=f'channel=={channel_id}',
        startDate=start_date,
        endDate=end_date,
        metrics=metrics,
        dimensions=dimensions,
        filters=filters,
        sort='-views',
        maxResults=50
    ).execute()

    return response

@tool
def get_traffic_sources(
    channel_id: str,
    access_token: str,
    start_date: str,
    end_date: str
) -> dict:
    """Fetch traffic source breakdown."""
    analytics = build('youtubeAnalytics', 'v2', credentials=get_credentials(access_token))

    response = analytics.reports().query(
        ids=f'channel=={channel_id}',
        startDate=start_date,
        endDate=end_date,
        metrics='views,estimatedMinutesWatched',
        dimensions='insightTrafficSourceType',
        sort='-views'
    ).execute()

    return response

@tool
def get_audience_demographics(
    channel_id: str,
    access_token: str,
    start_date: str,
    end_date: str
) -> dict:
    """Fetch audience demographics data."""
    analytics = build('youtubeAnalytics', 'v2', credentials=get_credentials(access_token))

    response = analytics.reports().query(
        ids=f'channel=={channel_id}',
        startDate=start_date,
        endDate=end_date,
        metrics='viewerPercentage',
        dimensions='ageGroup,gender'
    ).execute()

    return response

@tool
def get_daily_trends(
    channel_id: str,
    access_token: str,
    start_date: str,
    end_date: str
) -> dict:
    """Fetch daily performance trends."""
    analytics = build('youtubeAnalytics', 'v2', credentials=get_credentials(access_token))

    response = analytics.reports().query(
        ids=f'channel=={channel_id}',
        startDate=start_date,
        endDate=end_date,
        metrics='views,estimatedMinutesWatched,subscribersGained,subscribersLost',
        dimensions='day',
        sort='day'
    ).execute()

    return response
```

### Graph Definition

```python
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver

def parse_user_query(state: AnalyticsDashboardState) -> AnalyticsDashboardState:
    """Parse user query to determine intent and required data."""
    query = state['user_query'].lower()

    # Determine date range
    if 'today' in query:
        state['date_range'] = get_today_range()
    elif 'week' in query:
        state['date_range'] = get_week_range()
    elif 'month' in query:
        state['date_range'] = get_month_range()
    else:
        state['date_range'] = get_default_range()  # Last 28 days

    return state

def fetch_channel_data(state: AnalyticsDashboardState) -> AnalyticsDashboardState:
    """Fetch channel overview data."""
    state['channel_data'] = get_channel_overview(
        state['channel_id'],
        state['access_token']
    )
    return state

def fetch_analytics(state: AnalyticsDashboardState) -> AnalyticsDashboardState:
    """Fetch analytics data based on query context."""
    state['analytics_data'] = get_video_analytics(
        state['channel_id'],
        state['access_token'],
        state['date_range']['start'],
        state['date_range']['end'],
        state.get('videos_filter')
    )

    state['historical_data'] = get_daily_trends(
        state['channel_id'],
        state['access_token'],
        state['date_range']['start'],
        state['date_range']['end']
    )

    return state

def analyze_performance(state: AnalyticsDashboardState) -> AnalyticsDashboardState:
    """Analyze fetched data and generate insights."""
    insights = []
    recommendations = []
    anomalies = []

    # Analyze view trends
    if state['historical_data']:
        trend = calculate_trend(state['historical_data'])
        if trend > 0.1:
            insights.append(f"Views are up {trend*100:.1f}% this period")
        elif trend < -0.1:
            insights.append(f"Views are down {abs(trend)*100:.1f}% this period")
            recommendations.append("Consider reviewing recent content strategy")

    # Detect anomalies
    anomalies = detect_anomalies(state['historical_data'])
    if anomalies:
        state['anomalies'] = anomalies

    state['insights'] = insights
    state['recommendations'] = recommendations

    return state

def generate_response(state: AnalyticsDashboardState) -> AnalyticsDashboardState:
    """Generate natural language response."""
    response_parts = []

    # Channel overview
    if state['channel_data']:
        ch = state['channel_data']
        response_parts.append(
            f"**{ch['title']}** has {ch['subscribers']:,} subscribers "
            f"and {ch['total_views']:,} total views across {ch['video_count']} videos."
        )

    # Insights
    if state['insights']:
        response_parts.append("\n**Key Insights:**")
        for insight in state['insights']:
            response_parts.append(f"- {insight}")

    # Recommendations
    if state['recommendations']:
        response_parts.append("\n**Recommendations:**")
        for rec in state['recommendations']:
            response_parts.append(f"- {rec}")

    state['response'] = "\n".join(response_parts)
    return state

# Build the graph
def build_analytics_agent():
    graph = StateGraph(AnalyticsDashboardState)

    # Add nodes
    graph.add_node("parse_query", parse_user_query)
    graph.add_node("fetch_channel", fetch_channel_data)
    graph.add_node("fetch_analytics", fetch_analytics)
    graph.add_node("analyze", analyze_performance)
    graph.add_node("respond", generate_response)

    # Define edges
    graph.set_entry_point("parse_query")
    graph.add_edge("parse_query", "fetch_channel")
    graph.add_edge("fetch_channel", "fetch_analytics")
    graph.add_edge("fetch_analytics", "analyze")
    graph.add_edge("analyze", "respond")
    graph.add_edge("respond", END)

    # Add checkpointing for conversation memory
    memory = SqliteSaver.from_conn_string(":memory:")
    return graph.compile(checkpointer=memory)
```

---

## Pattern 2: Content Strategy Agent

### Purpose
Analyze video performance to recommend content strategies and optimal posting times.

### State Definition

```python
class ContentStrategyState(TypedDict):
    # Auth
    channel_id: str
    access_token: str

    # Analysis scope
    analysis_period_days: int
    competitor_channels: Optional[List[str]]

    # Fetched data
    videos: List[dict]
    video_analytics: List[dict]
    traffic_sources: dict
    posting_times: List[dict]

    # Analysis results
    top_performing_topics: List[dict]
    optimal_posting_times: dict
    content_gaps: List[str]
    competitor_insights: List[dict]

    # Output
    content_calendar: List[dict]
    recommendations: List[str]
```

### Key Tools

```python
@tool
def analyze_video_performance(videos: List[dict]) -> dict:
    """Analyze which video characteristics correlate with high performance."""
    analysis = {
        'duration_correlation': {},
        'title_patterns': [],
        'thumbnail_patterns': [],
        'topic_clusters': []
    }

    # Group by performance quartiles
    sorted_videos = sorted(videos, key=lambda v: v['views'], reverse=True)
    top_25_percent = sorted_videos[:len(sorted_videos)//4]

    # Analyze common patterns in top performers
    for video in top_25_percent:
        # Title length analysis
        title_length = len(video['title'])
        # Duration analysis
        duration = video['duration']
        # Topic extraction (simplified)
        topics = extract_topics(video['title'], video['description'])
        analysis['topic_clusters'].extend(topics)

    return analysis

@tool
def find_optimal_posting_time(
    channel_id: str,
    access_token: str,
    days: int = 90
) -> dict:
    """Analyze when videos perform best to find optimal posting times."""
    # Fetch video posting times and performance
    videos = get_recent_videos(channel_id, access_token, days)

    performance_by_hour = defaultdict(list)
    performance_by_day = defaultdict(list)

    for video in videos:
        publish_hour = video['publishedAt'].hour
        publish_day = video['publishedAt'].strftime('%A')

        # Normalize by video age for fair comparison
        views_per_day = video['views'] / max(video['age_days'], 1)

        performance_by_hour[publish_hour].append(views_per_day)
        performance_by_day[publish_day].append(views_per_day)

    return {
        'best_hours': get_top_n_by_average(performance_by_hour, 3),
        'best_days': get_top_n_by_average(performance_by_day, 3),
        'avoid_hours': get_bottom_n_by_average(performance_by_hour, 3)
    }

@tool
def identify_content_gaps(
    channel_videos: List[dict],
    trending_topics: List[str],
    competitor_topics: List[str]
) -> List[str]:
    """Identify content topics the channel hasn't covered."""
    channel_topics = set()
    for video in channel_videos:
        channel_topics.update(extract_topics(video['title'], video['description']))

    all_potential_topics = set(trending_topics + competitor_topics)
    gaps = all_potential_topics - channel_topics

    return list(gaps)
```

### Graph with Conditional Routing

```python
def should_analyze_competitors(state: ContentStrategyState) -> str:
    """Determine if competitor analysis is needed."""
    if state.get('competitor_channels') and len(state['competitor_channels']) > 0:
        return "analyze_competitors"
    return "generate_strategy"

def build_content_strategy_agent():
    graph = StateGraph(ContentStrategyState)

    # Nodes
    graph.add_node("fetch_videos", fetch_channel_videos)
    graph.add_node("analyze_performance", analyze_video_performance_node)
    graph.add_node("find_posting_times", find_optimal_posting_times_node)
    graph.add_node("analyze_competitors", analyze_competitor_channels)
    graph.add_node("identify_gaps", identify_content_gaps_node)
    graph.add_node("generate_strategy", generate_content_strategy)

    # Edges
    graph.set_entry_point("fetch_videos")
    graph.add_edge("fetch_videos", "analyze_performance")
    graph.add_edge("analyze_performance", "find_posting_times")

    # Conditional routing
    graph.add_conditional_edges(
        "find_posting_times",
        should_analyze_competitors,
        {
            "analyze_competitors": "analyze_competitors",
            "generate_strategy": "generate_strategy"
        }
    )

    graph.add_edge("analyze_competitors", "identify_gaps")
    graph.add_edge("identify_gaps", "generate_strategy")
    graph.add_edge("generate_strategy", END)

    return graph.compile()
```

---

## Pattern 3: Real-Time Alert Agent

### Purpose
Monitor channel metrics and send alerts for significant events.

### State Definition

```python
class AlertAgentState(TypedDict):
    # Config
    channel_id: str
    access_token: str
    alert_thresholds: dict

    # Monitoring
    last_check: datetime
    baseline_metrics: dict
    current_metrics: dict

    # Alerts
    triggered_alerts: List[dict]
    alert_history: List[dict]

    # Actions
    notifications_sent: List[dict]
```

### Alert Types and Thresholds

```python
DEFAULT_ALERT_THRESHOLDS = {
    'views_spike': {
        'metric': 'views',
        'threshold_percent': 200,  # 2x normal
        'window_hours': 24
    },
    'views_drop': {
        'metric': 'views',
        'threshold_percent': -50,  # 50% below normal
        'window_hours': 24
    },
    'subscriber_milestone': {
        'metric': 'subscribers',
        'milestones': [1000, 10000, 100000, 1000000]
    },
    'viral_video': {
        'metric': 'video_views',
        'threshold_percent': 500,  # 5x average
        'window_hours': 48
    },
    'comment_surge': {
        'metric': 'comments',
        'threshold_percent': 300,
        'window_hours': 12
    },
    'negative_engagement': {
        'metric': 'like_ratio',
        'threshold_percent': -20,
        'window_hours': 24
    }
}

def check_for_alerts(state: AlertAgentState) -> AlertAgentState:
    """Check current metrics against thresholds."""
    alerts = []

    for alert_name, config in state['alert_thresholds'].items():
        metric = config['metric']
        current = state['current_metrics'].get(metric)
        baseline = state['baseline_metrics'].get(metric)

        if current is None or baseline is None:
            continue

        # Calculate percent change
        if baseline > 0:
            change_percent = ((current - baseline) / baseline) * 100
        else:
            change_percent = 100 if current > 0 else 0

        # Check threshold
        threshold = config.get('threshold_percent')
        if threshold:
            if threshold > 0 and change_percent >= threshold:
                alerts.append({
                    'type': alert_name,
                    'message': f"{metric} increased by {change_percent:.1f}%",
                    'severity': 'high' if change_percent > threshold * 1.5 else 'medium',
                    'current_value': current,
                    'baseline_value': baseline,
                    'timestamp': datetime.now()
                })
            elif threshold < 0 and change_percent <= threshold:
                alerts.append({
                    'type': alert_name,
                    'message': f"{metric} decreased by {abs(change_percent):.1f}%",
                    'severity': 'high' if change_percent < threshold * 1.5 else 'medium',
                    'current_value': current,
                    'baseline_value': baseline,
                    'timestamp': datetime.now()
                })

        # Check milestones
        milestones = config.get('milestones', [])
        for milestone in milestones:
            if baseline < milestone <= current:
                alerts.append({
                    'type': 'milestone',
                    'message': f"Reached {milestone:,} {metric}!",
                    'severity': 'info',
                    'milestone': milestone,
                    'timestamp': datetime.now()
                })

    state['triggered_alerts'] = alerts
    return state
```

### Continuous Monitoring Loop

```python
async def monitoring_loop(agent, channel_id: str, interval_minutes: int = 60):
    """Continuous monitoring loop for the alert agent."""
    while True:
        try:
            # Run agent check
            result = await agent.ainvoke({
                'channel_id': channel_id,
                'alert_thresholds': DEFAULT_ALERT_THRESHOLDS
            })

            # Process any triggered alerts
            for alert in result.get('triggered_alerts', []):
                await send_notification(alert)

            # Wait for next check
            await asyncio.sleep(interval_minutes * 60)

        except Exception as e:
            logger.error(f"Monitoring error: {e}")
            await asyncio.sleep(60)  # Brief pause before retry
```

---

## Pattern 4: Comment Analysis Agent

### Purpose
Analyze video comments for sentiment, questions, and engagement opportunities.

### State Definition

```python
class CommentAnalysisState(TypedDict):
    # Input
    video_id: str
    access_token: str
    max_comments: int

    # Fetched data
    comments: List[dict]
    comment_threads: List[dict]

    # Analysis
    sentiment_breakdown: dict
    common_questions: List[str]
    feature_requests: List[str]
    influencer_comments: List[dict]
    negative_feedback: List[dict]

    # Actions
    suggested_responses: List[dict]
    engagement_opportunities: List[dict]
```

### Analysis Nodes

```python
def analyze_sentiment(state: CommentAnalysisState) -> CommentAnalysisState:
    """Analyze sentiment of comments."""
    from textblob import TextBlob

    sentiments = {'positive': 0, 'neutral': 0, 'negative': 0}
    negative_comments = []

    for comment in state['comments']:
        text = comment['snippet']['textDisplay']
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity

        if polarity > 0.1:
            sentiments['positive'] += 1
        elif polarity < -0.1:
            sentiments['negative'] += 1
            negative_comments.append({
                'text': text,
                'author': comment['snippet']['authorDisplayName'],
                'polarity': polarity
            })
        else:
            sentiments['neutral'] += 1

    state['sentiment_breakdown'] = sentiments
    state['negative_feedback'] = negative_comments
    return state

def extract_questions(state: CommentAnalysisState) -> CommentAnalysisState:
    """Extract questions from comments."""
    questions = []

    question_patterns = [
        r'\?$',  # Ends with question mark
        r'^(how|what|when|where|why|can|could|would|will|is|are|do|does)',
        r'anyone know',
        r'can someone explain'
    ]

    for comment in state['comments']:
        text = comment['snippet']['textDisplay']

        for pattern in question_patterns:
            if re.search(pattern, text.lower()):
                questions.append({
                    'text': text,
                    'author': comment['snippet']['authorDisplayName'],
                    'likes': comment['snippet'].get('likeCount', 0)
                })
                break

    # Sort by likes (popular questions first)
    state['common_questions'] = sorted(
        questions,
        key=lambda q: q['likes'],
        reverse=True
    )[:20]

    return state

def identify_engagement_opportunities(state: CommentAnalysisState) -> CommentAnalysisState:
    """Identify high-value comments to respond to."""
    opportunities = []

    for comment in state['comments']:
        score = 0
        reasons = []

        # High like count
        likes = comment['snippet'].get('likeCount', 0)
        if likes > 10:
            score += 3
            reasons.append(f"Popular comment ({likes} likes)")

        # Is a question
        if comment in [q['text'] for q in state.get('common_questions', [])]:
            score += 2
            reasons.append("Question from viewer")

        # From verified/notable account
        if comment['snippet'].get('authorChannelId'):
            # Check subscriber count of commenter
            subscriber_count = get_channel_subscribers(
                comment['snippet']['authorChannelId']['value']
            )
            if subscriber_count > 10000:
                score += 3
                reasons.append(f"From creator with {subscriber_count:,} subs")

        if score >= 3:
            opportunities.append({
                'comment': comment['snippet']['textDisplay'],
                'author': comment['snippet']['authorDisplayName'],
                'score': score,
                'reasons': reasons,
                'comment_id': comment['id']
            })

    state['engagement_opportunities'] = sorted(
        opportunities,
        key=lambda o: o['score'],
        reverse=True
    )[:10]

    return state
```

---

## Pattern 5: Revenue Optimization Agent

### Purpose
Analyze monetization metrics and suggest optimizations.

### State Definition

```python
class RevenueOptimizationState(TypedDict):
    # Auth
    channel_id: str
    access_token: str

    # Date range
    start_date: str
    end_date: str

    # Monetization data
    revenue_data: dict
    cpm_by_country: dict
    cpm_by_video: dict
    ad_formats_performance: dict

    # Analysis
    revenue_trends: dict
    top_revenue_videos: List[dict]
    underperforming_videos: List[dict]
    geographic_opportunities: List[dict]

    # Recommendations
    monetization_recommendations: List[str]
    content_type_insights: dict
```

### Revenue Analysis Tools

```python
@tool
def get_revenue_breakdown(
    channel_id: str,
    access_token: str,
    start_date: str,
    end_date: str
) -> dict:
    """Fetch detailed revenue breakdown."""
    analytics = build('youtubeAnalytics', 'v2', credentials=get_credentials(access_token))

    # Overall revenue
    overall = analytics.reports().query(
        ids=f'channel=={channel_id}',
        startDate=start_date,
        endDate=end_date,
        metrics='estimatedRevenue,estimatedAdRevenue,estimatedRedPartnerRevenue,cpm,monetizedPlaybacks',
        currency='USD'
    ).execute()

    # Revenue by video
    by_video = analytics.reports().query(
        ids=f'channel=={channel_id}',
        startDate=start_date,
        endDate=end_date,
        metrics='estimatedRevenue,cpm,monetizedPlaybacks,views',
        dimensions='video',
        sort='-estimatedRevenue',
        maxResults=50
    ).execute()

    # Revenue by country
    by_country = analytics.reports().query(
        ids=f'channel=={channel_id}',
        startDate=start_date,
        endDate=end_date,
        metrics='estimatedRevenue,cpm,views',
        dimensions='country',
        sort='-cpm',
        maxResults=25
    ).execute()

    return {
        'overall': overall,
        'by_video': by_video,
        'by_country': by_country
    }

def analyze_revenue_opportunities(state: RevenueOptimizationState) -> RevenueOptimizationState:
    """Analyze data to find revenue optimization opportunities."""
    recommendations = []

    # Analyze CPM variations
    cpm_data = state['cpm_by_country']
    high_cpm_countries = [c for c in cpm_data if c['cpm'] > 10]
    low_cpm_countries = [c for c in cpm_data if c['cpm'] < 2]

    if high_cpm_countries:
        recommendations.append(
            f"Focus content on high-CPM regions: {', '.join([c['country'] for c in high_cpm_countries[:5]])}"
        )

    # Analyze video performance vs monetization
    for video in state['cpm_by_video']:
        views = video['views']
        revenue = video['revenue']
        rpm = (revenue / views * 1000) if views > 0 else 0

        if views > 100000 and rpm < 1:
            recommendations.append(
                f"Video '{video['title'][:50]}' has high views but low RPM. "
                "Consider reviewing ad placement settings."
            )

    # Content length analysis
    # Longer videos (8+ minutes) can have mid-roll ads
    short_videos = [v for v in state['top_revenue_videos'] if v['duration'] < 480]
    if short_videos:
        recommendations.append(
            f"{len(short_videos)} top videos are under 8 minutes. "
            "Consider longer content to enable mid-roll ads."
        )

    state['monetization_recommendations'] = recommendations
    return state
```

---

## Agent Communication Patterns

### Multi-Agent Orchestration

```python
from langgraph.graph import StateGraph

class OrchestratorState(TypedDict):
    user_request: str
    channel_id: str
    access_token: str

    # Sub-agent results
    analytics_result: Optional[dict]
    content_result: Optional[dict]
    revenue_result: Optional[dict]

    # Final output
    combined_insights: List[str]
    action_items: List[str]

def route_to_agents(state: OrchestratorState) -> List[str]:
    """Determine which agents to invoke based on user request."""
    request = state['user_request'].lower()
    agents = []

    if any(word in request for word in ['performance', 'stats', 'views', 'analytics']):
        agents.append('analytics_agent')

    if any(word in request for word in ['content', 'strategy', 'topics', 'posting']):
        agents.append('content_agent')

    if any(word in request for word in ['revenue', 'money', 'monetization', 'cpm']):
        agents.append('revenue_agent')

    return agents if agents else ['analytics_agent']  # Default

def build_orchestrator():
    graph = StateGraph(OrchestratorState)

    graph.add_node("router", route_to_agents_node)
    graph.add_node("analytics_agent", run_analytics_agent)
    graph.add_node("content_agent", run_content_agent)
    graph.add_node("revenue_agent", run_revenue_agent)
    graph.add_node("synthesizer", synthesize_results)

    graph.set_entry_point("router")

    # Conditional parallel execution
    graph.add_conditional_edges(
        "router",
        route_to_agents,
        {
            "analytics_agent": "analytics_agent",
            "content_agent": "content_agent",
            "revenue_agent": "revenue_agent"
        }
    )

    # All paths lead to synthesizer
    graph.add_edge("analytics_agent", "synthesizer")
    graph.add_edge("content_agent", "synthesizer")
    graph.add_edge("revenue_agent", "synthesizer")
    graph.add_edge("synthesizer", END)

    return graph.compile()
```

---

## Best Practices

### 1. Quota-Aware Design
- Track quota usage across all API calls
- Implement caching for frequently accessed data
- Use bulk endpoints where possible

### 2. Error Handling
```python
def safe_api_call(func, *args, **kwargs):
    """Wrapper for safe API calls with retry logic."""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            return func(*args, **kwargs)
        except HttpError as e:
            if e.resp.status == 403 and 'quotaExceeded' in str(e):
                raise QuotaExceededException("Daily quota exceeded")
            elif e.resp.status == 429:
                time.sleep(2 ** attempt)
                continue
            else:
                raise
    raise MaxRetriesExceeded()
```

### 3. State Persistence
- Use checkpointing for long conversations
- Store user preferences and historical analyses
- Enable resumable workflows

### 4. Streaming Responses
```python
async def stream_analysis(state: AnalyticsDashboardState):
    """Stream analysis results as they become available."""
    yield {"type": "status", "message": "Fetching channel data..."}
    state = await fetch_channel_data(state)

    yield {"type": "status", "message": "Analyzing performance..."}
    state = await analyze_performance(state)

    for insight in state['insights']:
        yield {"type": "insight", "content": insight}

    yield {"type": "complete", "summary": state['response']}
```

---

## Next Steps

- Implement these patterns in your SaaS application
- Customize agents for your specific use cases
- Add more sophisticated ML models for predictions
- Build custom tools for your unique features
