"""
SEO Optimizer Agent using LangGraph.
Analyzes YouTube videos and provides SEO recommendations.
"""

from typing import Annotated, TypedDict, List, Dict, Any, Optional
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI
from googleapiclient.discovery import Resource
import json
import os
from dotenv import load_dotenv

from ..tools.youtube_tools import YouTubeTools
from ..config import get_settings

# Load environment variables
load_dotenv()


class SEOAgent:
    """LangGraph-based SEO optimization agent for YouTube videos."""
    
    SYSTEM_PROMPT = """You are an expert YouTube SEO specialist. Your job is to analyze videos and provide actionable SEO recommendations to improve discoverability and engagement.

When analyzing videos, consider:
1. **Title Optimization**: 
   - Ideal length: 50-60 characters
   - Include primary keyword early
   - Use power words and numbers when relevant
   - Create curiosity or urgency

2. **Description Optimization**:
   - First 150 characters are crucial (shown in search)
   - Include primary and secondary keywords naturally
   - Add timestamps for longer videos
   - Include relevant links and CTAs
   - Use 2-3 relevant hashtags

3. **Tags Strategy**:
   - Use 10-15 relevant tags
   - Mix broad and specific tags
   - Include common misspellings
   - Use competitor tags research

4. **Engagement Signals**:
   - Encourage likes, comments, shares
   - Add end screens and cards
   - Optimize for watch time

Provide specific, actionable recommendations. Be concise but thorough.
Always format your recommendations clearly with bullet points or numbered lists.
Include the EXACT suggested title/description/tags when making recommendations."""

    def __init__(self, youtube_service: Resource, analytics_service: Optional[Resource] = None):
        self.tools = YouTubeTools(youtube_service, analytics_service)
        settings = get_settings()
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0,  # Deterministic: same video = same suggestions
            api_key=settings.openai_api_key
        )
    
    async def analyze_video_seo(self, video_id: str) -> Dict[str, Any]:
        """Analyze a single video's SEO and provide recommendations."""
        try:
            # Get SEO data
            seo_data = self.tools.get_video_seo_data(video_id)
            
            # Create analysis prompt
            analysis_prompt = f"""Analyze this YouTube video's SEO and provide specific recommendations:

**Current Title**: {seo_data['title_analysis']['text']}
- Length: {seo_data['title_analysis']['length']} characters
- Word count: {seo_data['title_analysis']['word_count']}

**Current Description** (first 500 chars): 
{seo_data['description_analysis']['text']}
- Total length: {seo_data['description_analysis']['full_length']} characters
- Has links: {seo_data['description_analysis']['has_links']}
- Has hashtags: {seo_data['description_analysis']['has_hashtags']}

**Current Tags** ({seo_data['tags_analysis']['count']} tags):
{', '.join(seo_data['tags_analysis']['tags'][:15]) if seo_data['tags_analysis']['tags'] else 'No tags'}

**Performance**:
- Views: {seo_data['statistics']['views']:,}
- Likes: {seo_data['statistics']['likes']:,}
- Comments: {seo_data['statistics']['comments']:,}

**Additional Info**:
- Category: {seo_data['category_id']}
- Has captions: {seo_data['caption']}
- Duration: {seo_data['duration']}

Please provide:
1. An SEO score (0-100) with explanation
2. Top 3 priority improvements
3. Suggested optimized title (keep the essence but improve SEO)
4. Suggested first paragraph of description (first 150 chars optimized for search)
5. 10 recommended tags to add

Format your response as JSON with these keys:
- seo_score: number
- score_explanation: string
- priority_improvements: list of strings
- suggested_title: string
- suggested_description_intro: string
- suggested_tags: list of strings
- detailed_analysis: string"""

            messages = [
                SystemMessage(content=self.SYSTEM_PROMPT),
                HumanMessage(content=analysis_prompt)
            ]
            
            response = await self.llm.ainvoke(messages)
            
            # Parse JSON response
            try:
                # Try to extract JSON from response
                content = response.content
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                
                recommendations = json.loads(content)
            except json.JSONDecodeError:
                # If JSON parsing fails, return raw analysis
                recommendations = {
                    "seo_score": 50,
                    "score_explanation": "Unable to parse detailed analysis",
                    "priority_improvements": ["See detailed analysis"],
                    "suggested_title": seo_data['title_analysis']['text'],
                    "suggested_description_intro": "",
                    "suggested_tags": [],
                    "detailed_analysis": response.content
                }
            
            return {
                "video_id": video_id,
                "current_data": seo_data,
                "recommendations": recommendations,
                "thumbnail_url": seo_data.get("thumbnail_url", "")
            }
            
        except Exception as e:
            return {"error": str(e), "video_id": video_id}
    
    async def audit_channel_seo(self, limit: int = 10) -> Dict[str, Any]:
        """Audit multiple videos and provide channel-wide SEO insights."""
        try:
            # Get videos for audit
            videos = self.tools.get_videos_for_seo_audit(limit=limit)
            
            if not videos:
                return {"error": "No videos found for audit"}
            
            # Calculate channel averages
            avg_seo_score = sum(v["seo_score"] for v in videos) / len(videos)
            avg_title_length = sum(v["title_length"] for v in videos) / len(videos)
            avg_tags_count = sum(v["tags_count"] for v in videos) / len(videos)
            
            # Find common issues
            all_issues = []
            for v in videos:
                all_issues.extend(v["seo_issues"])
            
            issue_counts = {}
            for issue in all_issues:
                issue_counts[issue] = issue_counts.get(issue, 0) + 1
            
            common_issues = sorted(issue_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            
            # Get AI summary
            audit_prompt = f"""Based on this channel SEO audit data, provide a brief summary and top 3 action items:

**Channel SEO Overview**:
- Videos analyzed: {len(videos)}
- Average SEO score: {avg_seo_score:.1f}/100
- Average title length: {avg_title_length:.0f} characters
- Average tags per video: {avg_tags_count:.1f}

**Most Common Issues**:
{chr(10).join(f"- {issue}: {count} videos" for issue, count in common_issues)}

**Videos Needing Most Attention** (lowest SEO scores):
{chr(10).join(f"- '{v['title'][:50]}...' (Score: {v['seo_score']})" for v in videos[:3])}

Provide a brief 2-3 sentence summary and top 3 action items the channel should focus on."""

            messages = [
                SystemMessage(content=self.SYSTEM_PROMPT),
                HumanMessage(content=audit_prompt)
            ]
            
            response = await self.llm.ainvoke(messages)
            
            return {
                "summary": {
                    "videos_analyzed": len(videos),
                    "average_seo_score": round(avg_seo_score, 1),
                    "average_title_length": round(avg_title_length, 0),
                    "average_tags_count": round(avg_tags_count, 1),
                },
                "common_issues": [{"issue": issue, "count": count} for issue, count in common_issues],
                "videos": videos,
                "ai_summary": response.content,
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def research_keywords(self, topic: str, limit: int = 10) -> Dict[str, Any]:
        """Research competitor videos and extract keyword ideas."""
        try:
            # Search for competitor videos
            competitors = self.tools.search_competitor_videos(topic, limit=limit)
            
            if not competitors:
                return {"error": "No competitor videos found"}
            
            # Collect all tags
            all_tags = []
            for video in competitors:
                all_tags.extend(video.get("tags", []))
            
            # Count tag frequency
            tag_counts = {}
            for tag in all_tags:
                tag_lower = tag.lower()
                tag_counts[tag_lower] = tag_counts.get(tag_lower, 0) + 1
            
            # Sort by frequency
            popular_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:20]
            
            # Get AI analysis
            research_prompt = f"""Analyze these top-performing videos about "{topic}" and suggest keywords:

**Top Performing Videos**:
{chr(10).join(f"- '{v['title']}' ({v['view_count']:,} views) - Tags: {', '.join(v['tags'][:5])}" for v in competitors[:5])}

**Most Common Tags** (from {len(competitors)} videos):
{', '.join(f"{tag} ({count})" for tag, count in popular_tags[:15])}

Based on this research:
1. What are the top 10 keywords to target for this topic?
2. Suggest 3 video title ideas that could compete
3. What content angle seems to perform best?

Be specific and actionable."""

            messages = [
                SystemMessage(content=self.SYSTEM_PROMPT),
                HumanMessage(content=research_prompt)
            ]
            
            response = await self.llm.ainvoke(messages)
            
            return {
                "topic": topic,
                "competitor_videos": competitors,
                "popular_tags": [{"tag": tag, "count": count} for tag, count in popular_tags],
                "ai_analysis": response.content,
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    async def generate_optimized_metadata(
        self, 
        video_topic: str, 
        current_title: Optional[str] = None,
        current_description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate optimized title, description, and tags for a video topic."""
        try:
            # Research competitors first
            competitors = self.tools.search_competitor_videos(video_topic, limit=5)
            
            competitor_info = ""
            if competitors:
                competitor_info = f"""
**Top Competitor Videos**:
{chr(10).join(f"- '{v['title']}' ({v['view_count']:,} views)" for v in competitors[:3])}
"""
            
            generation_prompt = f"""Generate optimized YouTube metadata for a video about: "{video_topic}"

{f"Current title: {current_title}" if current_title else ""}
{f"Current description: {current_description[:200]}..." if current_description else ""}
{competitor_info}

Generate:
1. **3 Title Options** (50-60 chars each, SEO-optimized)
2. **Full Description** (300-500 words with proper structure):
   - Hook in first 150 chars
   - Key points with timestamps placeholder
   - Call to action
   - Relevant links section
   - 3 hashtags
3. **15 Tags** (mix of broad and specific)

Format as JSON:
{{
    "titles": ["title1", "title2", "title3"],
    "description": "full description text",
    "tags": ["tag1", "tag2", ...],
    "hashtags": ["#hash1", "#hash2", "#hash3"]
}}"""

            messages = [
                SystemMessage(content=self.SYSTEM_PROMPT),
                HumanMessage(content=generation_prompt)
            ]
            
            response = await self.llm.ainvoke(messages)
            
            # Parse JSON response
            try:
                content = response.content
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                
                metadata = json.loads(content)
            except json.JSONDecodeError:
                metadata = {
                    "titles": [],
                    "description": response.content,
                    "tags": [],
                    "hashtags": [],
                    "raw_response": response.content
                }
            
            return {
                "topic": video_topic,
                "generated_metadata": metadata,
                "competitor_research": competitors[:3] if competitors else [],
            }
            
        except Exception as e:
            return {"error": str(e)}

