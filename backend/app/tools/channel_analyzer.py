"""
Channel Analyzer - Data-driven SEO analysis based on your channel's actual performance.
Analyzes patterns from your video history to build custom scoring models.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import statistics
import re
from googleapiclient.discovery import Resource


class ChannelAnalyzer:
    """Analyze channel data to build custom SEO scoring models."""
    
    def __init__(self, youtube_service: Resource):
        self.youtube = youtube_service
        self._channel_id: Optional[str] = None
    
    @property
    def channel_id(self) -> str:
        """Get the authenticated user's channel ID."""
        if not self._channel_id:
            response = self.youtube.channels().list(
                part="id",
                mine=True
            ).execute()
            if response.get("items"):
                self._channel_id = response["items"][0]["id"]
        return self._channel_id
    
    def get_all_videos(self, max_videos: int = 5000) -> List[Dict[str, Any]]:
        """
        Get all videos from the channel with full metadata.
        Uses pagination to get large amounts of videos.
        """
        # Get uploads playlist ID
        channel_response = self.youtube.channels().list(
            part="contentDetails",
            mine=True
        ).execute()
        
        if not channel_response.get("items"):
            return []
        
        uploads_playlist_id = channel_response["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]
        
        # Paginate through all videos
        all_video_ids = []
        next_page_token = None
        
        while len(all_video_ids) < max_videos:
            playlist_response = self.youtube.playlistItems().list(
                part="contentDetails",
                playlistId=uploads_playlist_id,
                maxResults=50,  # Max allowed per request
                pageToken=next_page_token
            ).execute()
            
            video_ids = [item["contentDetails"]["videoId"] for item in playlist_response.get("items", [])]
            all_video_ids.extend(video_ids)
            
            next_page_token = playlist_response.get("nextPageToken")
            if not next_page_token:
                break
        
        # Trim to max_videos
        all_video_ids = all_video_ids[:max_videos]
        
        # Get full video details in batches of 50
        all_videos = []
        for i in range(0, len(all_video_ids), 50):
            batch_ids = all_video_ids[i:i+50]
            
            videos_response = self.youtube.videos().list(
                part="snippet,statistics,contentDetails",
                id=",".join(batch_ids)
            ).execute()
            
            for video in videos_response.get("items", []):
                snippet = video["snippet"]
                stats = video.get("statistics", {})
                content = video.get("contentDetails", {})
                
                title = snippet.get("title", "")
                description = snippet.get("description", "")
                tags = snippet.get("tags", [])
                
                # Parse duration to seconds
                duration_str = content.get("duration", "PT0S")
                duration_seconds = self._parse_duration(duration_str)
                
                all_videos.append({
                    "video_id": video["id"],
                    "title": title,
                    "title_length": len(title),
                    "title_word_count": len(title.split()),
                    "description": description,
                    "description_length": len(description),
                    "has_links": "http" in description.lower(),
                    "has_hashtags": "#" in description,
                    "hashtag_count": description.count("#"),
                    "tags": tags,
                    "tags_count": len(tags),
                    "published_at": snippet.get("publishedAt", ""),
                    "duration_seconds": duration_seconds,
                    "view_count": int(stats.get("viewCount", 0)),
                    "like_count": int(stats.get("likeCount", 0)),
                    "comment_count": int(stats.get("commentCount", 0)),
                    "thumbnail_url": snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
                })
        
        return all_videos
    
    def _parse_duration(self, duration_str: str) -> int:
        """Parse ISO 8601 duration to seconds."""
        match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration_str)
        if not match:
            return 0
        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)
        return hours * 3600 + minutes * 60 + seconds
    
    def analyze_performance_patterns(self, videos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze patterns between video metadata and performance.
        Returns insights about what works for this specific channel.
        """
        if len(videos) < 10:
            return {"error": "Need at least 10 videos for analysis"}
        
        # Sort videos by views
        sorted_by_views = sorted(videos, key=lambda x: x["view_count"], reverse=True)
        
        # Define top and bottom performers (top 20% vs bottom 20%)
        cutoff = max(len(videos) // 5, 5)
        top_performers = sorted_by_views[:cutoff]
        bottom_performers = sorted_by_views[-cutoff:]
        all_videos = videos
        
        # Analyze title length
        title_analysis = self._analyze_numeric_factor(
            all_videos, top_performers, bottom_performers, "title_length"
        )
        
        # Analyze title word count
        word_count_analysis = self._analyze_numeric_factor(
            all_videos, top_performers, bottom_performers, "title_word_count"
        )
        
        # Analyze description length
        desc_analysis = self._analyze_numeric_factor(
            all_videos, top_performers, bottom_performers, "description_length"
        )
        
        # Analyze tags count
        tags_analysis = self._analyze_numeric_factor(
            all_videos, top_performers, bottom_performers, "tags_count"
        )
        
        # Analyze duration
        duration_analysis = self._analyze_numeric_factor(
            all_videos, top_performers, bottom_performers, "duration_seconds"
        )
        
        # Analyze boolean factors
        links_analysis = self._analyze_boolean_factor(
            all_videos, top_performers, bottom_performers, "has_links"
        )
        
        hashtags_analysis = self._analyze_boolean_factor(
            all_videos, top_performers, bottom_performers, "has_hashtags"
        )
        
        # Find top performing tags
        tag_performance = self._analyze_tags(videos)
        
        # Calculate average performance
        avg_views = statistics.mean([v["view_count"] for v in all_videos])
        median_views = statistics.median([v["view_count"] for v in all_videos])
        top_avg_views = statistics.mean([v["view_count"] for v in top_performers])
        
        return {
            "total_videos_analyzed": len(videos),
            "performance_summary": {
                "average_views": round(avg_views),
                "median_views": round(median_views),
                "top_20_percent_avg_views": round(top_avg_views),
                "top_video_views": sorted_by_views[0]["view_count"],
                "top_video_title": sorted_by_views[0]["title"],
            },
            "title_length": {
                **title_analysis,
                "recommendation": self._get_range_recommendation(title_analysis, "characters"),
            },
            "title_word_count": {
                **word_count_analysis,
                "recommendation": self._get_range_recommendation(word_count_analysis, "words"),
            },
            "description_length": {
                **desc_analysis,
                "recommendation": self._get_range_recommendation(desc_analysis, "characters"),
            },
            "tags_count": {
                **tags_analysis,
                "recommendation": self._get_range_recommendation(tags_analysis, "tags"),
            },
            "video_duration": {
                **duration_analysis,
                "top_avg_minutes": round(duration_analysis["top_performers_avg"] / 60, 1),
                "all_avg_minutes": round(duration_analysis["all_videos_avg"] / 60, 1),
            },
            "has_links": links_analysis,
            "has_hashtags": hashtags_analysis,
            "top_performing_tags": tag_performance[:20],
            "insights": self._generate_insights(
                title_analysis, desc_analysis, tags_analysis, 
                links_analysis, hashtags_analysis, duration_analysis
            ),
        }
    
    def _analyze_numeric_factor(
        self, 
        all_videos: List[Dict], 
        top: List[Dict], 
        bottom: List[Dict], 
        field: str
    ) -> Dict[str, Any]:
        """Analyze a numeric factor's correlation with performance."""
        all_values = [v[field] for v in all_videos]
        top_values = [v[field] for v in top]
        bottom_values = [v[field] for v in bottom]
        
        all_avg = statistics.mean(all_values) if all_values else 0
        top_avg = statistics.mean(top_values) if top_values else 0
        bottom_avg = statistics.mean(bottom_values) if bottom_values else 0
        
        # Calculate if there's a significant difference
        diff_percent = ((top_avg - bottom_avg) / bottom_avg * 100) if bottom_avg > 0 else 0
        
        return {
            "all_videos_avg": round(all_avg, 1),
            "top_performers_avg": round(top_avg, 1),
            "bottom_performers_avg": round(bottom_avg, 1),
            "top_vs_bottom_diff_percent": round(diff_percent, 1),
            "all_videos_min": min(all_values) if all_values else 0,
            "all_videos_max": max(all_values) if all_values else 0,
            "top_performers_range": {
                "min": min(top_values) if top_values else 0,
                "max": max(top_values) if top_values else 0,
            },
        }
    
    def _analyze_boolean_factor(
        self, 
        all_videos: List[Dict], 
        top: List[Dict], 
        bottom: List[Dict], 
        field: str
    ) -> Dict[str, Any]:
        """Analyze a boolean factor's correlation with performance."""
        all_true = sum(1 for v in all_videos if v[field])
        top_true = sum(1 for v in top if v[field])
        bottom_true = sum(1 for v in bottom if v[field])
        
        all_percent = (all_true / len(all_videos) * 100) if all_videos else 0
        top_percent = (top_true / len(top) * 100) if top else 0
        bottom_percent = (bottom_true / len(bottom) * 100) if bottom else 0
        
        return {
            "all_videos_percent": round(all_percent, 1),
            "top_performers_percent": round(top_percent, 1),
            "bottom_performers_percent": round(bottom_percent, 1),
            "correlation": "positive" if top_percent > bottom_percent + 10 else 
                          "negative" if bottom_percent > top_percent + 10 else "neutral",
        }
    
    def _analyze_tags(self, videos: List[Dict]) -> List[Dict[str, Any]]:
        """Find which tags appear most in top performing videos."""
        # Sort by views
        sorted_videos = sorted(videos, key=lambda x: x["view_count"], reverse=True)
        top_videos = sorted_videos[:len(sorted_videos) // 5]  # Top 20%
        
        # Count tag occurrences weighted by video performance
        tag_scores = {}
        for video in videos:
            weight = video["view_count"]
            for tag in video.get("tags", []):
                tag_lower = tag.lower()
                if tag_lower not in tag_scores:
                    tag_scores[tag_lower] = {"count": 0, "weighted_score": 0, "tag": tag}
                tag_scores[tag_lower]["count"] += 1
                tag_scores[tag_lower]["weighted_score"] += weight
        
        # Sort by weighted score
        sorted_tags = sorted(
            tag_scores.values(), 
            key=lambda x: x["weighted_score"], 
            reverse=True
        )
        
        return [
            {
                "tag": t["tag"],
                "video_count": t["count"],
                "avg_views_per_video": round(t["weighted_score"] / t["count"]),
            }
            for t in sorted_tags
        ]
    
    def _get_range_recommendation(self, analysis: Dict, unit: str) -> str:
        """Generate a recommendation based on analysis."""
        top_min = analysis["top_performers_range"]["min"]
        top_max = analysis["top_performers_range"]["max"]
        top_avg = analysis["top_performers_avg"]
        
        return f"Aim for {int(top_avg)} {unit} (your top videos range from {int(top_min)} to {int(top_max)})"
    
    def _generate_insights(
        self, 
        title: Dict, 
        desc: Dict, 
        tags: Dict, 
        links: Dict,
        hashtags: Dict,
        duration: Dict
    ) -> List[str]:
        """Generate human-readable insights from the analysis."""
        insights = []
        
        # Title insights
        if title["top_vs_bottom_diff_percent"] > 10:
            insights.append(
                f"📊 Your top videos have {title['top_vs_bottom_diff_percent']:.0f}% longer titles "
                f"({title['top_performers_avg']:.0f} vs {title['bottom_performers_avg']:.0f} chars)"
            )
        elif title["top_vs_bottom_diff_percent"] < -10:
            insights.append(
                f"📊 Your top videos have {abs(title['top_vs_bottom_diff_percent']):.0f}% shorter titles "
                f"({title['top_performers_avg']:.0f} vs {title['bottom_performers_avg']:.0f} chars)"
            )
        
        # Tags insights
        if tags["top_vs_bottom_diff_percent"] > 20:
            insights.append(
                f"🏷️ Top videos use {tags['top_vs_bottom_diff_percent']:.0f}% more tags "
                f"({tags['top_performers_avg']:.0f} vs {tags['bottom_performers_avg']:.0f})"
            )
        
        # Links insights
        if links["correlation"] == "positive":
            insights.append(
                f"🔗 Videos with links in description perform better "
                f"({links['top_performers_percent']:.0f}% of top videos vs {links['bottom_performers_percent']:.0f}% of bottom)"
            )
        
        # Duration insights
        duration_diff_percent = ((duration["top_performers_avg"] - duration["bottom_performers_avg"]) 
                                 / duration["bottom_performers_avg"] * 100) if duration["bottom_performers_avg"] > 0 else 0
        if abs(duration_diff_percent) > 20:
            top_mins = duration["top_performers_avg"] / 60
            bottom_mins = duration["bottom_performers_avg"] / 60
            if duration_diff_percent > 0:
                insights.append(
                    f"⏱️ Longer videos perform better for you "
                    f"(top: {top_mins:.0f} min avg vs bottom: {bottom_mins:.0f} min avg)"
                )
            else:
                insights.append(
                    f"⏱️ Shorter videos perform better for you "
                    f"(top: {top_mins:.0f} min avg vs bottom: {bottom_mins:.0f} min avg)"
                )
        
        return insights
    
    def build_custom_score_model(self, analysis: Dict) -> Dict[str, Any]:
        """
        Build a custom scoring model based on the channel analysis.
        Returns weights and thresholds for each factor.
        """
        model = {
            "channel_specific": True,
            "based_on_videos": analysis.get("total_videos_analyzed", 0),
            "factors": {}
        }
        
        # Title length scoring
        title_data = analysis.get("title_length", {})
        optimal_title = title_data.get("top_performers_avg", 60)
        model["factors"]["title_length"] = {
            "optimal_range": [
                max(10, int(optimal_title * 0.7)),
                int(optimal_title * 1.3)
            ],
            "weight": 20,
            "your_top_videos_avg": optimal_title,
        }
        
        # Tags scoring
        tags_data = analysis.get("tags_count", {})
        optimal_tags = tags_data.get("top_performers_avg", 15)
        model["factors"]["tags_count"] = {
            "minimum_recommended": max(5, int(optimal_tags * 0.7)),
            "optimal": int(optimal_tags),
            "weight": 20,
            "your_top_videos_avg": optimal_tags,
        }
        
        # Description scoring
        desc_data = analysis.get("description_length", {})
        optimal_desc = desc_data.get("top_performers_avg", 500)
        model["factors"]["description_length"] = {
            "minimum_recommended": max(100, int(optimal_desc * 0.5)),
            "optimal": int(optimal_desc),
            "weight": 15,
        }
        
        # Links factor
        links_data = analysis.get("has_links", {})
        model["factors"]["has_links"] = {
            "weight": 10 if links_data.get("correlation") == "positive" else 5,
            "correlation": links_data.get("correlation", "neutral"),
        }
        
        # Hashtags factor  
        hashtags_data = analysis.get("has_hashtags", {})
        model["factors"]["has_hashtags"] = {
            "weight": 10 if hashtags_data.get("correlation") == "positive" else 5,
            "correlation": hashtags_data.get("correlation", "neutral"),
        }
        
        return model

