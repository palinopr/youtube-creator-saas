from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from googleapiclient.discovery import Resource


class YouTubeTools:
    """YouTube API wrapper tools for analytics and channel management."""
    
    def __init__(self, youtube_service: Resource, analytics_service: Optional[Resource] = None):
        self.youtube = youtube_service
        self.analytics = analytics_service
        self._channel_id: Optional[str] = None
    
    @property
    def channel_id(self) -> str:
        """Get the authenticated user's channel ID."""
        if not self._channel_id:
            response = self.youtube.channels().list(
                part="id",
                mine=True
            ).execute()
            
            if not response.get("items"):
                raise ValueError("No channel found for authenticated user")
            
            self._channel_id = response["items"][0]["id"]
        
        return self._channel_id
    
    def get_channel_stats(self) -> Dict[str, Any]:
        """Get channel statistics including subscribers, views, and video count."""
        response = self.youtube.channels().list(
            part="snippet,statistics,brandingSettings",
            mine=True
        ).execute()
        
        if not response.get("items"):
            raise ValueError("No channel found for authenticated user")
        
        channel = response["items"][0]
        snippet = channel["snippet"]
        stats = channel["statistics"]
        
        return {
            "channel_id": channel["id"],
            "title": snippet["title"],
            "description": snippet.get("description", ""),
            "subscriber_count": int(stats.get("subscriberCount", 0)),
            "view_count": int(stats.get("viewCount", 0)),
            "video_count": int(stats.get("videoCount", 0)),
            "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
        }
    
    def get_recent_videos(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent videos from the channel with their statistics."""
        # First, get the uploads playlist ID
        channel_response = self.youtube.channels().list(
            part="contentDetails",
            mine=True
        ).execute()
        
        if not channel_response.get("items"):
            return []
        
        uploads_playlist_id = channel_response["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]
        
        # Get videos from uploads playlist
        playlist_response = self.youtube.playlistItems().list(
            part="snippet,contentDetails",
            playlistId=uploads_playlist_id,
            maxResults=limit
        ).execute()
        
        video_ids = [item["contentDetails"]["videoId"] for item in playlist_response.get("items", [])]
        
        if not video_ids:
            return []
        
        # Get video statistics
        videos_response = self.youtube.videos().list(
            part="snippet,statistics",
            id=",".join(video_ids)
        ).execute()
        
        videos = []
        for video in videos_response.get("items", []):
            snippet = video["snippet"]
            stats = video.get("statistics", {})
            
            videos.append({
                "video_id": video["id"],
                "title": snippet["title"],
                "published_at": snippet["publishedAt"],
                "view_count": int(stats.get("viewCount", 0)),
                "like_count": int(stats.get("likeCount", 0)),
                "comment_count": int(stats.get("commentCount", 0)),
                "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
            })
        
        return videos
    
    def get_video_details(self, video_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific video."""
        response = self.youtube.videos().list(
            part="snippet,statistics,contentDetails",
            id=video_id
        ).execute()
        
        if not response.get("items"):
            raise ValueError(f"Video not found: {video_id}")
        
        video = response["items"][0]
        snippet = video["snippet"]
        stats = video.get("statistics", {})
        content = video.get("contentDetails", {})
        
        return {
            "video_id": video["id"],
            "title": snippet["title"],
            "description": snippet.get("description", ""),
            "published_at": snippet["publishedAt"],
            "channel_title": snippet["channelTitle"],
            "tags": snippet.get("tags", []),
            "category_id": snippet.get("categoryId", ""),
            "duration": content.get("duration", ""),
            "view_count": int(stats.get("viewCount", 0)),
            "like_count": int(stats.get("likeCount", 0)),
            "comment_count": int(stats.get("commentCount", 0)),
            "thumbnail_url": snippet.get("thumbnails", {}).get("maxres", 
                           snippet.get("thumbnails", {}).get("high", {})).get("url", ""),
        }
    
    def get_analytics_overview(self, days: int = 30) -> Dict[str, Any]:
        """Get analytics overview for the past N days."""
        if not self.analytics:
            return {"error": "Analytics service not available"}
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        try:
            response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date.strftime("%Y-%m-%d"),
                endDate=end_date.strftime("%Y-%m-%d"),
                metrics="views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,likes,dislikes,shares,comments",
                dimensions="day",
                sort="day"
            ).execute()
            
            rows = response.get("rows", [])
            
            # Aggregate totals
            totals = {
                "views": 0,
                "watch_time_minutes": 0,
                "avg_view_duration": 0,
                "subscribers_gained": 0,
                "subscribers_lost": 0,
                "likes": 0,
                "dislikes": 0,
                "shares": 0,
                "comments": 0,
            }
            
            daily_data = []
            for row in rows:
                date = row[0]
                daily = {
                    "date": date,
                    "views": row[1],
                    "watch_time_minutes": row[2],
                    "avg_view_duration": row[3],
                    "subscribers_gained": row[4],
                    "subscribers_lost": row[5],
                    "likes": row[6],
                    "dislikes": row[7],
                    "shares": row[8],
                    "comments": row[9],
                }
                daily_data.append(daily)
                
                totals["views"] += row[1]
                totals["watch_time_minutes"] += row[2]
                totals["subscribers_gained"] += row[4]
                totals["subscribers_lost"] += row[5]
                totals["likes"] += row[6]
                totals["dislikes"] += row[7]
                totals["shares"] += row[8]
                totals["comments"] += row[9]
            
            if rows:
                totals["avg_view_duration"] = totals["watch_time_minutes"] * 60 / totals["views"] if totals["views"] > 0 else 0
            
            return {
                "period": f"{days} days",
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
                "totals": totals,
                "daily_data": daily_data,
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    def get_top_videos(self, days: int = 30, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top performing videos by views in the past N days."""
        if not self.analytics:
            return []
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        try:
            response = self.analytics.reports().query(
                ids=f"channel=={self.channel_id}",
                startDate=start_date.strftime("%Y-%m-%d"),
                endDate=end_date.strftime("%Y-%m-%d"),
                metrics="views,estimatedMinutesWatched,averageViewDuration,likes,comments",
                dimensions="video",
                sort="-views",
                maxResults=limit
            ).execute()
            
            video_ids = [row[0] for row in response.get("rows", [])]
            
            if not video_ids:
                return []
            
            # Get video details
            videos_response = self.youtube.videos().list(
                part="snippet",
                id=",".join(video_ids)
            ).execute()
            
            video_titles = {
                v["id"]: v["snippet"]["title"] 
                for v in videos_response.get("items", [])
            }
            
            top_videos = []
            for row in response.get("rows", []):
                video_id = row[0]
                top_videos.append({
                    "video_id": video_id,
                    "title": video_titles.get(video_id, "Unknown"),
                    "views": row[1],
                    "watch_time_minutes": row[2],
                    "avg_view_duration": row[3],
                    "likes": row[4],
                    "comments": row[5],
                })
            
            return top_videos
            
        except Exception as e:
            return []
    
    def search_videos(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for videos on the channel."""
        response = self.youtube.search().list(
            part="snippet",
            channelId=self.channel_id,
            q=query,
            type="video",
            maxResults=limit
        ).execute()
        
        results = []
        for item in response.get("items", []):
            snippet = item["snippet"]
            results.append({
                "video_id": item["id"]["videoId"],
                "title": snippet["title"],
                "description": snippet.get("description", ""),
                "published_at": snippet["publishedAt"],
                "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
            })
        
        return results

    # ==================== SEO ANALYSIS TOOLS ====================
    
    def get_video_seo_data(self, video_id: str) -> Dict[str, Any]:
        """Get comprehensive SEO data for a video."""
        response = self.youtube.videos().list(
            part="snippet,statistics,contentDetails,topicDetails,status",
            id=video_id
        ).execute()
        
        if not response.get("items"):
            raise ValueError(f"Video not found: {video_id}")
        
        video = response["items"][0]
        snippet = video["snippet"]
        stats = video.get("statistics", {})
        content = video.get("contentDetails", {})
        topics = video.get("topicDetails", {})
        status = video.get("status", {})
        
        # Analyze title
        title = snippet.get("title", "")
        title_analysis = {
            "text": title,
            "length": len(title),
            "word_count": len(title.split()),
            "has_numbers": any(c.isdigit() for c in title),
            "has_brackets": "[" in title or "]" in title or "(" in title or ")" in title,
            "has_emoji": any(ord(c) > 127 for c in title),
            "is_all_caps": title.isupper(),
        }
        
        # Analyze description
        description = snippet.get("description", "")
        description_analysis = {
            "text": description[:500] + "..." if len(description) > 500 else description,
            "full_length": len(description),
            "word_count": len(description.split()),
            "has_links": "http" in description.lower(),
            "has_timestamps": any(c.isdigit() and ":" in description for c in description),
            "has_hashtags": "#" in description,
            "line_count": description.count("\n") + 1,
        }
        
        # Analyze tags
        tags = snippet.get("tags", [])
        tags_analysis = {
            "tags": tags,
            "count": len(tags),
            "total_characters": sum(len(tag) for tag in tags),
            "avg_tag_length": sum(len(tag) for tag in tags) / len(tags) if tags else 0,
        }
        
        return {
            "video_id": video_id,
            "title_analysis": title_analysis,
            "description_analysis": description_analysis,
            "tags_analysis": tags_analysis,
            "category_id": snippet.get("categoryId", ""),
            "default_language": snippet.get("defaultLanguage", ""),
            "default_audio_language": snippet.get("defaultAudioLanguage", ""),
            "duration": content.get("duration", ""),
            "definition": content.get("definition", ""),
            "caption": content.get("caption", "false"),
            "privacy_status": status.get("privacyStatus", ""),
            "made_for_kids": status.get("madeForKids", False),
            "topic_categories": topics.get("topicCategories", []),
            "statistics": {
                "views": int(stats.get("viewCount", 0)),
                "likes": int(stats.get("likeCount", 0)),
                "comments": int(stats.get("commentCount", 0)),
            },
            "thumbnail_url": snippet.get("thumbnails", {}).get("maxres", 
                           snippet.get("thumbnails", {}).get("high", {})).get("url", ""),
        }
    
    def get_channel_keywords(self) -> List[str]:
        """Get channel-level keywords from branding settings."""
        response = self.youtube.channels().list(
            part="brandingSettings",
            mine=True
        ).execute()
        
        if not response.get("items"):
            return []
        
        branding = response["items"][0].get("brandingSettings", {})
        channel_settings = branding.get("channel", {})
        keywords = channel_settings.get("keywords", "")
        
        # Parse keywords (they're space-separated, quotes for multi-word)
        if not keywords:
            return []
        
        import re
        # Match quoted strings or single words
        return re.findall(r'"([^"]+)"|(\S+)', keywords)
    
    def search_competitor_videos(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for competitor videos on YouTube (not limited to own channel)."""
        response = self.youtube.search().list(
            part="snippet",
            q=query,
            type="video",
            maxResults=limit,
            order="viewCount"
        ).execute()
        
        video_ids = [item["id"]["videoId"] for item in response.get("items", [])]
        
        if not video_ids:
            return []
        
        # Get video statistics
        videos_response = self.youtube.videos().list(
            part="snippet,statistics",
            id=",".join(video_ids)
        ).execute()
        
        results = []
        for video in videos_response.get("items", []):
            snippet = video["snippet"]
            stats = video.get("statistics", {})
            results.append({
                "video_id": video["id"],
                "title": snippet["title"],
                "description": snippet.get("description", "")[:200],
                "channel_title": snippet["channelTitle"],
                "published_at": snippet["publishedAt"],
                "tags": snippet.get("tags", [])[:10],  # First 10 tags
                "view_count": int(stats.get("viewCount", 0)),
                "like_count": int(stats.get("likeCount", 0)),
                "comment_count": int(stats.get("commentCount", 0)),
                "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
            })
        
        return results
    
    def get_videos_for_seo_audit(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent videos with SEO-relevant data for audit."""
        videos = self.get_recent_videos(limit=limit)
        
        if not videos:
            return []
        
        video_ids = [v["video_id"] for v in videos]
        
        # Get full video details including tags
        videos_response = self.youtube.videos().list(
            part="snippet,statistics",
            id=",".join(video_ids)
        ).execute()
        
        results = []
        for video in videos_response.get("items", []):
            snippet = video["snippet"]
            stats = video.get("statistics", {})
            
            title = snippet.get("title", "")
            description = snippet.get("description", "")
            tags = snippet.get("tags", [])
            
            # Calculate SEO score (simple heuristic)
            seo_score = 0
            seo_issues = []
            
            # Title checks
            if 30 <= len(title) <= 60:
                seo_score += 20
            else:
                seo_issues.append("Title length not optimal (aim for 30-60 chars)")
            
            # Description checks
            if len(description) >= 200:
                seo_score += 20
            else:
                seo_issues.append("Description too short (aim for 200+ chars)")
            
            if "http" in description.lower():
                seo_score += 10
            else:
                seo_issues.append("No links in description")
            
            # Tags checks
            if len(tags) >= 5:
                seo_score += 20
            else:
                seo_issues.append(f"Only {len(tags)} tags (aim for 5+)")
            
            if len(tags) >= 10:
                seo_score += 10
            
            # Hashtags check
            if "#" in description:
                seo_score += 10
            else:
                seo_issues.append("No hashtags in description")
            
            # Engagement rate
            views = int(stats.get("viewCount", 0))
            likes = int(stats.get("likeCount", 0))
            if views > 0:
                engagement_rate = (likes / views) * 100
                if engagement_rate > 4:
                    seo_score += 10
            
            results.append({
                "video_id": video["id"],
                "title": title,
                "title_length": len(title),
                "description_length": len(description),
                "tags_count": len(tags),
                "tags": tags[:5],  # First 5 tags
                "seo_score": min(seo_score, 100),
                "seo_issues": seo_issues,
                "view_count": views,
                "like_count": likes,
                "comment_count": int(stats.get("commentCount", 0)),
                "thumbnail_url": snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
            })
        
        # Sort by SEO score (lowest first - most improvement needed)
        results.sort(key=lambda x: x["seo_score"])
        
        return results

    # ==================== VIDEO UPDATE TOOLS ====================
    
    def update_video_metadata(
        self, 
        video_id: str, 
        title: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        category_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update video metadata (title, description, tags).
        
        Only updates the fields that are provided (not None).
        Returns the updated video data.
        """
        # First, get the current video data to preserve fields we're not updating
        current_response = self.youtube.videos().list(
            part="snippet,status",
            id=video_id
        ).execute()
        
        if not current_response.get("items"):
            raise ValueError(f"Video not found: {video_id}")
        
        current_video = current_response["items"][0]
        current_snippet = current_video["snippet"]
        
        # Build the update request body
        update_body = {
            "id": video_id,
            "snippet": {
                "title": title if title is not None else current_snippet["title"],
                "description": description if description is not None else current_snippet.get("description", ""),
                "tags": tags if tags is not None else current_snippet.get("tags", []),
                "categoryId": category_id if category_id is not None else current_snippet.get("categoryId", "22"),
            }
        }
        
        # Execute the update
        response = self.youtube.videos().update(
            part="snippet",
            body=update_body
        ).execute()
        
        updated_snippet = response["snippet"]
        
        return {
            "success": True,
            "video_id": video_id,
            "updated": {
                "title": updated_snippet["title"],
                "description": updated_snippet.get("description", "")[:200] + "..." if len(updated_snippet.get("description", "")) > 200 else updated_snippet.get("description", ""),
                "tags_count": len(updated_snippet.get("tags", [])),
                "category_id": updated_snippet.get("categoryId", ""),
            },
            "message": "Video metadata updated successfully!"
        }
    
    def get_video_for_editing(self, video_id: str) -> Dict[str, Any]:
        """Get video data in a format suitable for editing."""
        response = self.youtube.videos().list(
            part="snippet,status,statistics",
            id=video_id
        ).execute()
        
        if not response.get("items"):
            raise ValueError(f"Video not found: {video_id}")
        
        video = response["items"][0]
        snippet = video["snippet"]
        stats = video.get("statistics", {})
        
        return {
            "video_id": video_id,
            "title": snippet.get("title", ""),
            "description": snippet.get("description", ""),
            "tags": snippet.get("tags", []),
            "category_id": snippet.get("categoryId", "22"),
            "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
            "view_count": int(stats.get("viewCount", 0)),
            "like_count": int(stats.get("likeCount", 0)),
            "published_at": snippet.get("publishedAt", ""),
        }

