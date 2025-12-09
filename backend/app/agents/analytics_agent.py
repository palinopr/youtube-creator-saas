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
from ..tools.youtube_tools import YouTubeTools

settings = get_settings()


class AgentState(TypedDict):
    """State for the analytics agent."""
    messages: Annotated[list, add_messages]
    channel_context: Optional[dict]


class AnalyticsAgent:
    """LangGraph-powered analytics agent for YouTube channels."""
    
    def __init__(self, youtube_service: Resource, analytics_service: Optional[Resource] = None):
        self.youtube_tools = YouTubeTools(youtube_service, analytics_service)
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=settings.openai_api_key,
            temperature=0  # Deterministic: same input = same output
        )
        self.graph = self._build_graph()
    
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
        
        return [
            get_channel_statistics,
            get_recent_videos,
            get_video_details,
            get_analytics_overview,
            get_top_performing_videos,
            search_channel_videos,
        ]
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow."""
        tools = self._create_tools()
        llm_with_tools = self.llm.bind_tools(tools)
        
        # System prompt for the agent
        system_prompt = """You are a friendly YouTube analytics expert and personal assistant. Talk like a knowledgeable friend, not a robot.

IMPORTANT RULES FOR YOUR RESPONSES:
1. Be conversational and natural - write like you're texting a friend
2. DO NOT use markdown formatting (no **, no ###, no bullet points with -)
3. DO NOT create lists with headers like "Key Metrics:" or "Recommendations:"
4. Use casual language, contractions, and be enthusiastic
5. Share insights as if you're chatting over coffee
6. Keep responses concise - get to the point quickly
7. Use emojis sparingly but naturally (1-2 max per response)
8. When sharing numbers, weave them into sentences naturally

GOOD EXAMPLE:
"Wow, your video about the Miss Universe interview is crushing it! 324K views in 30 days and people are watching almost 19 minutes on average - that's insane engagement. The 6.7K likes and 1K+ comments show your audience is really connecting with this content. You should definitely do more interviews like this one, it's clearly what your viewers want to see!"

BAD EXAMPLE (don't do this):
"### Video Performance
**Views:** 324,078
**Likes:** 6,701
### Recommendations:
- Create more content
- Engage with comments"

Always use the tools to get real data, then share insights like a friend who's genuinely excited to help grow the channel."""
        
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

