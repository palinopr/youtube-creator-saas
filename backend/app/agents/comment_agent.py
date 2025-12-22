"""
Comment Intelligence Agent

AI-powered comment analysis using LangGraph and GPT-4o for:
- Sentiment analysis (positive/neutral/negative breakdown)
- Question extraction (comments that need responses)
- Content idea mining (topics your audience wants)
- Notable commenter detection (potential collaborations)
"""

from typing import Annotated, TypedDict, Optional, List, Dict, Any
from datetime import datetime
import json
import logging
import re

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from googleapiclient.discovery import Resource

from ..config import get_settings
from ..services.youtube import YouTubeTools

settings = get_settings()
logger = logging.getLogger(__name__)


class CommentAnalysisResult(TypedDict):
    """Result of comment analysis."""
    sentiment_breakdown: Dict[str, Any]
    questions_to_answer: List[Dict[str, Any]]
    content_ideas: List[Dict[str, Any]]
    notable_commenters: List[Dict[str, Any]]
    summary: str
    analyzed_count: int
    generated_at: str


class CommentAgent:
    """
    AI agent for intelligent comment analysis.

    Uses GPT-4o for sentiment analysis, question detection, and content idea extraction.
    Identifies notable commenters (channels with 1K+ subscribers) for collaboration opportunities.
    """

    def __init__(self, youtube_service: Resource, analytics_service: Optional[Resource] = None):
        self.youtube_tools = YouTubeTools(youtube_service, analytics_service)
        self.llm = ChatOpenAI(
            model="gpt-4o",  # Use full GPT-4o for better sentiment analysis
            api_key=settings.openai_api_key,
            temperature=0.3  # Slightly creative but mostly consistent
        )

    async def analyze_comments(
        self,
        video_id: Optional[str] = None,
        limit: int = 50,
        include_notable_check: bool = True
    ) -> CommentAnalysisResult:
        """
        Analyze comments for a specific video or across the channel.

        Args:
            video_id: Optional video ID. If None, analyzes comments across recent videos.
            limit: Maximum number of comments to analyze
            include_notable_check: Whether to check commenter channel info (uses API quota)

        Returns:
            CommentAnalysisResult with sentiment, questions, ideas, and notable commenters
        """
        # Fetch comments
        if video_id:
            comments_data = self.youtube_tools.get_video_comments(video_id, max_results=limit)
        else:
            comments_data = self.youtube_tools.get_channel_comments(limit=limit, videos_to_check=5)

        if "error" in comments_data:
            return {
                "sentiment_breakdown": {"error": comments_data.get("error")},
                "questions_to_answer": [],
                "content_ideas": [],
                "notable_commenters": [],
                "summary": f"Error fetching comments: {comments_data.get('error')}",
                "analyzed_count": 0,
                "generated_at": datetime.now().isoformat(),
            }

        comments = comments_data.get("comments", [])

        if not comments:
            return {
                "sentiment_breakdown": {"positive": 0, "neutral": 0, "negative": 0, "total": 0},
                "questions_to_answer": [],
                "content_ideas": [],
                "notable_commenters": [],
                "summary": "No comments found to analyze.",
                "analyzed_count": 0,
                "generated_at": datetime.now().isoformat(),
            }

        # Run AI analysis on comments
        analysis = await self._analyze_with_ai(comments)

        # Find notable commenters if enabled
        notable_commenters = []
        if include_notable_check:
            notable_commenters = await self._find_notable_commenters(comments)

        # Generate summary
        summary = self._generate_summary(analysis, len(comments), notable_commenters)

        return {
            "sentiment_breakdown": analysis.get("sentiment", {}),
            "questions_to_answer": analysis.get("questions", []),
            "content_ideas": analysis.get("content_ideas", []),
            "notable_commenters": notable_commenters,
            "summary": summary,
            "analyzed_count": len(comments),
            "generated_at": datetime.now().isoformat(),
        }

    async def _analyze_with_ai(self, comments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Use GPT-4o to analyze comments for sentiment, questions, and content ideas.
        """
        # Prepare comments for analysis (limit text length)
        comment_texts = []
        for c in comments[:50]:  # Limit to 50 for token efficiency
            text = c.get("text", "")[:500]  # Truncate long comments
            likes = c.get("like_count", 0)
            author = c.get("author", "Unknown")
            video_title = c.get("video_title", "")

            comment_texts.append({
                "text": text,
                "likes": likes,
                "author": author,
                "video": video_title,
            })

        prompt = f"""Analyze these YouTube comments and provide insights in JSON format.

COMMENTS TO ANALYZE:
{json.dumps(comment_texts, indent=2)}

Provide your analysis in this exact JSON structure:
{{
    "sentiment": {{
        "positive": <number 0-100>,
        "neutral": <number 0-100>,
        "negative": <number 0-100>,
        "total": <total comments analyzed>,
        "overall_mood": "<one word: great/good/mixed/concerning/poor>",
        "key_positive_themes": ["theme1", "theme2"],
        "key_negative_themes": ["theme1", "theme2"]
    }},
    "questions": [
        {{
            "text": "<the question from comment>",
            "author": "<who asked>",
            "likes": <number>,
            "suggested_response": "<brief suggested answer>",
            "priority": "<high/medium/low based on likes and importance>"
        }}
    ],
    "content_ideas": [
        {{
            "topic": "<content idea extracted from comments>",
            "evidence": "<why this idea - what comments mentioned it>",
            "mentions": <approximate number of times mentioned>,
            "potential": "<high/medium/low>"
        }}
    ]
}}

Rules:
1. Questions should be actual questions from the comments that need answering
2. Content ideas should be topics/requests that multiple commenters mentioned
3. Be concise but insightful
4. Include only the top 5-7 questions (prioritize by likes and importance)
5. Include only top 3-5 content ideas
6. Percentages for sentiment should add up to 100"""

        try:
            response = self.llm.invoke([
                SystemMessage(content="You are an expert YouTube comment analyst. Analyze comments to help creators engage with their audience and find content opportunities. Always respond with valid JSON."),
                HumanMessage(content=prompt)
            ])

            # Extract JSON from response
            result = self._extract_json(response.content)
            return result

        except Exception as e:
            logger.error(f"AI analysis error: {e}")
            return {
                "sentiment": {
                    "positive": 50,
                    "neutral": 40,
                    "negative": 10,
                    "total": len(comments),
                    "overall_mood": "mixed",
                    "key_positive_themes": [],
                    "key_negative_themes": [],
                },
                "questions": [],
                "content_ideas": [],
            }

    async def _find_notable_commenters(self, comments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Find notable commenters - channels with significant subscriber counts.
        These are potential collaboration opportunities.
        """
        notable = []
        checked_channels = set()

        # Sort by likes to prioritize engaged commenters
        sorted_comments = sorted(comments, key=lambda x: x.get("like_count", 0), reverse=True)

        for comment in sorted_comments[:20]:  # Check top 20 to limit API calls
            channel_id = comment.get("author_channel_id")

            if not channel_id or channel_id in checked_channels:
                continue

            checked_channels.add(channel_id)

            # Get channel info
            channel_info = self.youtube_tools.get_commenter_channel_info(channel_id)

            if channel_info.get("found") and channel_info.get("is_creator"):
                subscriber_count = channel_info.get("subscriber_count", 0)

                # Only include channels with 1K+ subscribers
                if subscriber_count and subscriber_count >= 1000:
                    notable.append({
                        "channel_id": channel_id,
                        "channel_name": channel_info.get("title", comment.get("author")),
                        "subscriber_count": subscriber_count,
                        "video_count": channel_info.get("video_count", 0),
                        "thumbnail_url": channel_info.get("thumbnail_url", ""),
                        "comment_text": comment.get("text", "")[:200],
                        "comment_likes": comment.get("like_count", 0),
                        "video_commented_on": comment.get("video_title", ""),
                        "channel_url": f"https://www.youtube.com/channel/{channel_id}",
                    })

            # Limit to top 10 notable commenters
            if len(notable) >= 10:
                break

        # Sort by subscriber count
        notable.sort(key=lambda x: x.get("subscriber_count", 0), reverse=True)

        return notable

    def _extract_json(self, text: str) -> Dict[str, Any]:
        """Extract JSON from LLM response, handling markdown code blocks."""
        # Try to find JSON in code blocks
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
        if json_match:
            text = json_match.group(1)

        # Try to find JSON object
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass

        # If no valid JSON found, return empty structure
        return {
            "sentiment": {"positive": 50, "neutral": 40, "negative": 10, "total": 0},
            "questions": [],
            "content_ideas": [],
        }

    def _generate_summary(
        self,
        analysis: Dict[str, Any],
        comment_count: int,
        notable_commenters: List[Dict[str, Any]]
    ) -> str:
        """Generate a human-readable summary of the analysis."""
        sentiment = analysis.get("sentiment", {})
        questions = analysis.get("questions", [])
        ideas = analysis.get("content_ideas", [])

        mood = sentiment.get("overall_mood", "mixed")
        positive = sentiment.get("positive", 0)
        negative = sentiment.get("negative", 0)

        summary_parts = []

        # Sentiment summary
        if positive >= 70:
            summary_parts.append(f"Great news! Your audience is loving your content with {positive}% positive sentiment.")
        elif positive >= 50:
            summary_parts.append(f"Your audience sentiment is mostly positive ({positive}%) with some room for improvement.")
        elif negative >= 30:
            summary_parts.append(f"Heads up: {negative}% of comments show negative sentiment. Check the themes below.")
        else:
            summary_parts.append(f"Mixed sentiment across {comment_count} comments analyzed.")

        # Questions summary
        high_priority_q = len([q for q in questions if q.get("priority") == "high"])
        if high_priority_q > 0:
            summary_parts.append(f"{high_priority_q} high-priority questions need your attention!")
        elif questions:
            summary_parts.append(f"{len(questions)} questions from your audience to consider answering.")

        # Content ideas summary
        high_potential = len([i for i in ideas if i.get("potential") == "high"])
        if high_potential > 0:
            summary_parts.append(f"Found {high_potential} high-potential content ideas your audience is asking for.")

        # Notable commenters
        if notable_commenters:
            top_commenter = notable_commenters[0]
            subs = top_commenter.get("subscriber_count", 0)
            if subs >= 100000:
                summary_parts.append(f"A creator with {subs:,} subscribers commented on your video - potential collab opportunity!")
            elif subs >= 10000:
                summary_parts.append(f"{len(notable_commenters)} creators with 1K+ subscribers are engaging with your content.")

        return " ".join(summary_parts)

    async def get_sentiment_over_time(
        self,
        video_ids: List[str],
        comments_per_video: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Analyze sentiment trends across multiple videos.
        Useful for seeing how audience sentiment changes over time.
        """
        results = []

        for video_id in video_ids:
            comments_data = self.youtube_tools.get_video_comments(video_id, max_results=comments_per_video)

            if "error" in comments_data:
                continue

            comments = comments_data.get("comments", [])
            if not comments:
                continue

            # Quick sentiment analysis
            analysis = await self._analyze_with_ai(comments)
            sentiment = analysis.get("sentiment", {})

            results.append({
                "video_id": video_id,
                "video_title": comments_data.get("video_title", ""),
                "comment_count": len(comments),
                "sentiment": {
                    "positive": sentiment.get("positive", 0),
                    "neutral": sentiment.get("neutral", 0),
                    "negative": sentiment.get("negative", 0),
                    "mood": sentiment.get("overall_mood", "mixed"),
                }
            })

        return results
