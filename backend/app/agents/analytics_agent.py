from typing import Annotated, TypedDict, Optional
from datetime import datetime

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from googleapiclient.discovery import Resource

from ..config import get_settings
from ..services.youtube import YouTubeTools
from ..db.models import AgentType
from ..utils.cost_tracking import create_cost_tracking_callback
from ..agents.seo_agent import SEOAgent
from ..agents.comment_agent import CommentAgent
from ..tools.transcript_analyzer import get_transcript_with_timestamps

settings = get_settings()


class AgentState(TypedDict):
    """State for the analytics agent."""
    messages: Annotated[list, add_messages]
    channel_context: Optional[dict]


from typing import Dict, Any


class AnalyticsAgent:
    """LangGraph-powered analytics agent for YouTube channels."""

    def __init__(
        self,
        youtube_service: Resource,
        analytics_service: Optional[Resource] = None,
        user_id: Optional[str] = None,
        channel_profile: Optional[Dict[str, Any]] = None,
    ):
        self.youtube_service = youtube_service
        self.analytics_service = analytics_service
        self.user_id = user_id
        self.youtube_tools = YouTubeTools(youtube_service, analytics_service)
        self.channel_profile = channel_profile or {}
        self.niche = self.channel_profile.get("niche", "general")
        self.language = self.channel_profile.get("language", "en")

        # Initialize sub-agents for specialized tasks
        self.seo_agent = SEOAgent(
            youtube_service, analytics_service, user_id, channel_profile
        )
        self.comment_agent = CommentAgent(
            youtube_service, analytics_service, user_id, channel_profile
        )

        # Create cost tracking callback
        self.cost_callback = create_cost_tracking_callback(
            agent_type=AgentType.ANALYTICS,
            user_id=user_id,
            endpoint="/api/agent",
        )

        self.llm = ChatOpenAI(
            model="gpt-4o",  # Upgraded to GPT-4o for better tool use
            api_key=settings.openai_api_key,
            temperature=0,  # Deterministic: same input = same output
            callbacks=[self.cost_callback],
        )
        self.graph = self._build_graph()

    def _build_channel_context(self) -> str:
        """Build channel context for the system prompt."""
        if not self.channel_profile:
            return ""

        niche = self.niche
        language = self.language
        common_tags = self.channel_profile.get("common_tags", [])
        title_patterns = self.channel_profile.get("title_patterns", [])

        tags_str = ", ".join(common_tags[:8]) if common_tags else "various topics"
        patterns_str = ", ".join(title_patterns[:3]) if title_patterns else "varied styles"

        return f"""

CHANNEL CONTEXT (use this to give relevant insights):
- Content niche: {niche}
- Primary language: {language}
- Common topics: {tags_str}
- Typical title patterns: {patterns_str}

When analyzing this channel, keep in mind it's a {niche} channel. Tailor your insights to what matters most for {niche} creators."""

    def _create_tools(self):
        """Create LangChain tools from YouTube tools."""
        youtube_tools = self.youtube_tools
        
        @tool
        def get_channel_statistics() -> dict:
            """Get the channel's current statistics including subscriber count, total views, and video count."""
            return youtube_tools.get_channel_stats()
        
        @tool
        def get_recent_videos(limit: int = 10) -> list:
            """Get the most recent videos from the channel with their view counts, likes, and comments.
            
            Args:
                limit: Maximum number of videos to return (default 10)
            """
            return youtube_tools.get_recent_videos(limit=limit)
        
        @tool
        def get_video_details(video_id: str) -> dict:
            """Get detailed information about a specific video including title, description, tags, and statistics.
            
            Args:
                video_id: The YouTube video ID
            """
            return youtube_tools.get_video_details(video_id)
        
        @tool
        def get_analytics_overview(days: int = 30) -> dict:
            """Get analytics overview for the channel including views, watch time, subscribers gained/lost, and engagement metrics.
            
            Args:
                days: Number of days to look back (default 30)
            """
            return youtube_tools.get_analytics_overview(days=days)
        
        @tool
        def get_top_performing_videos(days: int = 30, limit: int = 10) -> list:
            """Get the top performing videos by views in a given time period.
            
            Args:
                days: Number of days to look back (default 30)
                limit: Maximum number of videos to return (default 10)
            """
            return youtube_tools.get_top_videos(days=days, limit=limit)
        
        @tool
        def search_channel_videos(query: str, limit: int = 10) -> list:
            """Search for videos on the channel by keyword.

            Args:
                query: Search query string
                limit: Maximum number of results (default 10)
            """
            return youtube_tools.search_videos(query=query, limit=limit)

        # ============================================================
        # NEW: YouTube Data Tools (Demographics, Traffic, etc.)
        # ============================================================

        @tool
        def get_demographics(days: int = 30) -> dict:
            """Get audience demographics including age groups and gender breakdown.

            Args:
                days: Number of days to analyze (default 30)
            """
            return youtube_tools.get_demographics(days=days)

        @tool
        def get_traffic_sources(days: int = 30) -> dict:
            """Get traffic source breakdown showing where viewers come from (YouTube search, suggested videos, external, etc.).

            Args:
                days: Number of days to analyze (default 30)
            """
            return youtube_tools.get_traffic_sources(days=days)

        @tool
        def get_geography(days: int = 30) -> dict:
            """Get geographic distribution showing top countries and regions where viewers are located.

            Args:
                days: Number of days to analyze (default 30)
            """
            return youtube_tools.get_geography(days=days)

        @tool
        def get_device_types(days: int = 30) -> dict:
            """Get device breakdown showing what devices viewers use (mobile, desktop, TV, tablet).

            Args:
                days: Number of days to analyze (default 30)
            """
            return youtube_tools.get_device_types(days=days)

        @tool
        def get_revenue_data(days: int = 30) -> dict:
            """Get revenue and monetization data including estimated earnings (only works if channel is monetized).

            Args:
                days: Number of days to analyze (default 30)
            """
            return youtube_tools.get_revenue_data(days=days)

        @tool
        def get_subscriber_sources(days: int = 30) -> dict:
            """Get subscriber gain/loss data showing where new subscribers come from.

            Args:
                days: Number of days to analyze (default 30)
            """
            return youtube_tools.get_subscriber_sources(days=days)

        # ============================================================
        # NEW: SEO Tools
        # ============================================================

        seo_agent = self.seo_agent

        @tool
        async def analyze_video_seo(video_id: str) -> dict:
            """Analyze a video's SEO and get recommendations for title, description, and tags.
            Returns SEO score (0-100), issues found, and specific suggestions for improvement.

            Args:
                video_id: The YouTube video ID to analyze
            """
            import asyncio
            result = await seo_agent.analyze_video_seo(video_id)
            return result

        @tool
        async def generate_seo_suggestions(topic: str, current_title: str = None) -> dict:
            """Generate optimized title, description, and tags for a video topic.
            Researches competitors and creates SEO-optimized metadata.

            Args:
                topic: The video topic or subject
                current_title: Optional current title to improve
            """
            import asyncio
            result = await seo_agent.generate_optimized_metadata(
                video_topic=topic,
                current_title=current_title
            )
            return result

        # ============================================================
        # NEW: Comment Analysis Tools
        # ============================================================

        comment_agent = self.comment_agent

        @tool
        async def analyze_comments(video_id: str = None, limit: int = 50) -> dict:
            """Analyze comments to get sentiment breakdown, find questions that need answers,
            and discover content ideas your audience wants.

            Args:
                video_id: Optional video ID. If not provided, analyzes comments across recent videos.
                limit: Maximum number of comments to analyze (default 50)
            """
            import asyncio
            result = await comment_agent.analyze_comments(
                video_id=video_id,
                limit=limit,
                include_notable_check=True
            )
            return result

        @tool
        async def find_notable_commenters(video_id: str = None) -> list:
            """Find notable commenters - channels with 1K+ subscribers who commented on your videos.
            These are potential collaboration opportunities.

            Args:
                video_id: Optional video ID. If not provided, checks recent videos.
            """
            import asyncio
            result = await comment_agent.analyze_comments(
                video_id=video_id,
                limit=30,
                include_notable_check=True
            )
            return result.get("notable_commenters", [])

        # ============================================================
        # NEW: Viral Clips Tool
        # ============================================================

        @tool
        async def find_viral_clips(video_id: str, max_clips: int = 5) -> list:
            """Find viral clip moments in a video's transcript. Returns timestamped suggestions
            for 20-90 second clips with hooks, why they'd go viral, and viral scores.

            Args:
                video_id: The YouTube video ID to analyze
                max_clips: Maximum number of clips to find (default 5)
            """
            from ..agents.clips_agent import ViralClipsAgent
            import asyncio

            # Get transcript with timestamps
            transcript_data = get_transcript_with_timestamps(video_id)

            if "error" in transcript_data:
                return {"error": transcript_data["error"]}

            # Get video title
            video_details = youtube_tools.get_video_details(video_id)
            video_title = video_details.get("title", "Untitled")

            # Create clips agent and find clips
            clips_agent = ViralClipsAgent(
                user_id=self.user_id,
                channel_profile=self.channel_profile
            )

            clips = await clips_agent.generate_clips(
                transcript=transcript_data.get("transcript", ""),
                video_title=video_title,
                word_timestamps=transcript_data.get("word_timestamps", []),
                max_clips=max_clips,
                transcript_segments=transcript_data.get("segments")
            )

            # Convert to simple dict format for the agent
            return [
                {
                    "clip_id": clip.clip_id,
                    "title": clip.title,
                    "start_time": clip.hook.start_time,
                    "end_time": clip.loop_ending.end_time,
                    "duration": clip.total_duration,
                    "viral_score": clip.viral_score,
                    "why_viral": clip.why_viral,
                    "hook_text": clip.hook.text,
                }
                for clip in clips
            ]

        # ============================================================
        # NEW: Action Tool - Update Video Metadata
        # ============================================================

        @tool
        def update_video_metadata(
            video_id: str,
            title: str = None,
            description: str = None,
            tags: list = None
        ) -> dict:
            """Update a video's title, description, and/or tags.
            IMPORTANT: Only use this when the user explicitly asks to apply/update changes.
            Always confirm with the user before using this tool.

            Args:
                video_id: The YouTube video ID to update
                title: New title (optional)
                description: New description (optional)
                tags: New tags as a list (optional)
            """
            return youtube_tools.update_video_metadata(
                video_id=video_id,
                title=title,
                description=description,
                tags=tags
            )

        return [
            # Original analytics tools
            get_channel_statistics,
            get_recent_videos,
            get_video_details,
            get_analytics_overview,
            get_top_performing_videos,
            search_channel_videos,
            # New YouTube data tools
            get_demographics,
            get_traffic_sources,
            get_geography,
            get_device_types,
            get_revenue_data,
            get_subscriber_sources,
            # SEO tools
            analyze_video_seo,
            generate_seo_suggestions,
            # Comment tools
            analyze_comments,
            find_notable_commenters,
            # Clips tool
            find_viral_clips,
            # Action tool
            update_video_metadata,
        ]
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow."""
        tools = self._create_tools()
        llm_with_tools = self.llm.bind_tools(tools)

        # Get channel context
        channel_context = self._build_channel_context()

        # System prompt for the agent
        system_prompt = f"""You are a YouTube growth assistant and personal copilot. You help creators understand their channel, optimize their content, and grow their audience.

YOUR CAPABILITIES:
- Analytics: Channel stats, video performance, demographics, traffic sources, geography, devices, revenue
- SEO: Analyze video SEO, suggest optimized titles/descriptions/tags, research keywords
- Viral Clips: Find viral moments in video transcripts with timestamps
- Comments: Sentiment analysis, find questions to answer, content ideas, notable commenters
- Actions: Update video metadata when the user asks (always confirm first!)

COMMUNICATION STYLE:
1. Be conversational and friendly - like a knowledgeable friend
2. Keep responses concise - get to the point quickly
3. Use natural language, not robotic lists
4. Share insights like you're genuinely excited to help
5. Use emojis sparingly (1-2 max)
6. Weave numbers into sentences naturally

IMPORTANT RULES:
- Always use your tools to get real data before answering
- For SEO suggestions, show the current vs suggested side by side
- For clip suggestions, always include timestamps and why it would go viral
- NEVER update video metadata without explicit user confirmation
- If a tool returns an error, explain what happened and suggest alternatives

GOOD RESPONSE EXAMPLE:
"Your Miss Universe interview is crushing it! 324K views with 19 min average watch time - that's insane engagement. Your audience clearly wants more interview content. Want me to analyze the SEO or find viral clip moments from it?"

BAD RESPONSE (avoid this):
"### Video Performance
**Views:** 324,078
**Recommendations:**
- Create more content"

{channel_context}"""
        
        def agent(state: AgentState):
            """Agent node that processes messages and decides on tool calls."""
            messages = state["messages"]
            
            # Add system message if not present
            if not any(isinstance(m, SystemMessage) for m in messages):
                messages = [SystemMessage(content=system_prompt)] + list(messages)
            
            response = llm_with_tools.invoke(messages)
            return {"messages": [response]}
        
        # Build the graph
        builder = StateGraph(AgentState)
        
        # Add nodes
        builder.add_node("agent", agent)
        builder.add_node("tools", ToolNode(tools=tools))
        
        # Add edges
        builder.add_edge(START, "agent")
        builder.add_conditional_edges(
            "agent",
            tools_condition,
            {"tools": "tools", "__end__": END}
        )
        builder.add_edge("tools", "agent")
        
        return builder.compile()
    
    async def query(self, question: str) -> str:
        """Process a natural language query about the channel."""
        initial_state = {
            "messages": [HumanMessage(content=question)],
            "channel_context": None,
        }
        
        # Run the graph
        result = self.graph.invoke(initial_state)
        
        # Extract the final response
        messages = result.get("messages", [])
        
        # Find the last AI message
        for message in reversed(messages):
            if isinstance(message, AIMessage) and message.content:
                return message.content
        
        return "I couldn't process your question. Please try again."
    
    def get_quick_insights(self) -> dict:
        """Get quick insights about the channel without a specific question."""
        try:
            channel_stats = self.youtube_tools.get_channel_stats()
            recent_videos = self.youtube_tools.get_recent_videos(limit=5)
            
            # Calculate some basic insights
            total_recent_views = sum(v["view_count"] for v in recent_videos)
            avg_views = total_recent_views / len(recent_videos) if recent_videos else 0
            
            best_video = max(recent_videos, key=lambda x: x["view_count"]) if recent_videos else None
            
            return {
                "channel": {
                    "name": channel_stats["title"],
                    "subscribers": channel_stats["subscriber_count"],
                    "total_views": channel_stats["view_count"],
                    "total_videos": channel_stats["video_count"],
                },
                "recent_performance": {
                    "videos_analyzed": len(recent_videos),
                    "total_views": total_recent_views,
                    "average_views": round(avg_views),
                },
                "top_recent_video": {
                    "title": best_video["title"] if best_video else None,
                    "views": best_video["view_count"] if best_video else None,
                } if best_video else None,
                "generated_at": datetime.now().isoformat(),
            }
        except Exception as e:
            return {"error": str(e)}

