"""
Deep Analytics - Advanced data analysis for YouTube channels.
Extracts every possible insight from video history.
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import statistics
import re
from googleapiclient.discovery import Resource


class DeepAnalytics:
    """Advanced analytics for deep channel insights."""
    
    def __init__(self, youtube_service: Resource):
        self.youtube = youtube_service
        self._channel_id: Optional[str] = None
    
    @property
    def channel_id(self) -> str:
        if not self._channel_id:
            response = self.youtube.channels().list(part="id", mine=True).execute()
            if response.get("items"):
                self._channel_id = response["items"][0]["id"]
        return self._channel_id
    
    def get_all_videos_extended(self, max_videos: int = 5000) -> List[Dict[str, Any]]:
        """Get all videos with extended metadata for deep analysis."""
        # Get uploads playlist
        channel_response = self.youtube.channels().list(
            part="contentDetails",
            mine=True
        ).execute()
        
        if not channel_response.get("items"):
            return []
        
        uploads_playlist_id = channel_response["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]
        
        # Get all video IDs
        all_video_ids = []
        next_page_token = None
        
        while len(all_video_ids) < max_videos:
            playlist_response = self.youtube.playlistItems().list(
                part="contentDetails",
                playlistId=uploads_playlist_id,
                maxResults=50,
                pageToken=next_page_token
            ).execute()
            
            video_ids = [item["contentDetails"]["videoId"] for item in playlist_response.get("items", [])]
            all_video_ids.extend(video_ids)
            
            next_page_token = playlist_response.get("nextPageToken")
            if not next_page_token:
                break
        
        all_video_ids = all_video_ids[:max_videos]
        
        # Get full video details in batches
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
                published_at = snippet.get("publishedAt", "")
                
                # Parse published date
                try:
                    pub_date = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
                except:
                    pub_date = datetime.now()
                
                # Parse duration
                duration_str = content.get("duration", "PT0S")
                duration_seconds = self._parse_duration(duration_str)
                
                # Extract title words
                title_words = self._extract_words(title)
                
                # Calculate engagement metrics
                views = int(stats.get("viewCount", 0))
                likes = int(stats.get("likeCount", 0))
                comments = int(stats.get("commentCount", 0))
                
                like_ratio = (likes / views * 100) if views > 0 else 0
                comment_ratio = (comments / views * 100) if views > 0 else 0
                engagement_score = like_ratio + (comment_ratio * 2)  # Comments weighted more
                
                # Detect content type from title
                content_type = self._detect_content_type(title, duration_seconds)
                
                all_videos.append({
                    "video_id": video["id"],
                    "title": title,
                    "title_length": len(title),
                    "title_words": title_words,
                    "title_word_count": len(title_words),
                    "description": description,
                    "description_length": len(description),
                    "tags": tags,
                    "tags_count": len(tags),
                    "published_at": published_at,
                    "pub_date": pub_date,
                    "pub_year": pub_date.year,
                    "pub_month": pub_date.month,
                    "pub_day_of_week": pub_date.weekday(),  # 0=Monday, 6=Sunday
                    "pub_hour": pub_date.hour,
                    "duration_seconds": duration_seconds,
                    "duration_minutes": duration_seconds / 60,
                    "view_count": views,
                    "like_count": likes,
                    "comment_count": comments,
                    "like_ratio": round(like_ratio, 2),
                    "comment_ratio": round(comment_ratio, 4),
                    "engagement_score": round(engagement_score, 2),
                    "content_type": content_type,
                    "has_emoji": bool(re.search(r'[\U0001F300-\U0001F9FF]', title)),
                    "has_numbers": bool(re.search(r'\d', title)),
                    "has_question": "?" in title,
                    "is_all_caps_start": title[:20].isupper() if len(title) >= 20 else False,
                    "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
                })
        
        return all_videos
    
    def _parse_duration(self, duration_str: str) -> int:
        match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration_str)
        if not match:
            return 0
        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)
        return hours * 3600 + minutes * 60 + seconds
    
    def _extract_words(self, text: str) -> List[str]:
        """Extract meaningful words from text."""
        # Remove emojis, special chars
        clean = re.sub(r'[^\w\s]', ' ', text.lower())
        words = clean.split()
        # Filter short words and common stopwords
        stopwords = {'el', 'la', 'de', 'en', 'y', 'a', 'que', 'los', 'las', 'del', 'con', 'un', 'una', 
                     'the', 'and', 'or', 'to', 'in', 'of', 'for', 'is', 'on', 'at', 'por', 'su', 'se'}
        return [w for w in words if len(w) > 2 and w not in stopwords]
    
    def _detect_content_type(self, title: str, duration_seconds: int) -> str:
        """Detect content type from title and duration."""
        title_lower = title.lower()
        
        if duration_seconds < 60:
            return "short"
        elif "entrevista" in title_lower or "interview" in title_lower:
            return "interview"
        elif "tendencia" in title_lower:
            return "tendencia"
        elif "refugio" in title_lower:
            return "el_refugio"
        elif "#shorts" in title_lower or "shorts" in title_lower:
            return "short"
        elif "palabreo" in title_lower:
            return "el_palabreo"
        elif "en vivo" in title_lower or "live" in title_lower:
            return "live"
        elif duration_seconds > 3600:  # > 1 hour
            return "long_form"
        elif duration_seconds > 1200:  # > 20 min
            return "medium_form"
        else:
            return "standard"
    
    # ========== TIME ANALYSIS ==========
    
    def analyze_posting_times(self, videos: List[Dict]) -> Dict[str, Any]:
        """Analyze best posting times."""
        if not videos:
            return {}
        
        # Group by day of week
        by_day = defaultdict(list)
        for v in videos:
            by_day[v["pub_day_of_week"]].append(v["view_count"])
        
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        day_performance = []
        for day_num in range(7):
            views_list = by_day.get(day_num, [])
            if views_list:
                day_performance.append({
                    "day": day_names[day_num],
                    "day_num": day_num,
                    "video_count": len(views_list),
                    "avg_views": round(statistics.mean(views_list)),
                    "median_views": round(statistics.median(views_list)),
                    "total_views": sum(views_list),
                })
        
        # Sort by avg views
        day_performance.sort(key=lambda x: x["avg_views"], reverse=True)
        
        # Group by hour
        by_hour = defaultdict(list)
        for v in videos:
            by_hour[v["pub_hour"]].append(v["view_count"])
        
        hour_performance = []
        for hour in range(24):
            views_list = by_hour.get(hour, [])
            if views_list:
                hour_performance.append({
                    "hour": hour,
                    "hour_label": f"{hour:02d}:00",
                    "video_count": len(views_list),
                    "avg_views": round(statistics.mean(views_list)),
                })
        
        hour_performance.sort(key=lambda x: x["avg_views"], reverse=True)
        
        # Group by month
        by_month = defaultdict(list)
        for v in videos:
            by_month[v["pub_month"]].append(v["view_count"])
        
        month_names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        month_performance = []
        for month in range(1, 13):
            views_list = by_month.get(month, [])
            if views_list:
                month_performance.append({
                    "month": month,
                    "month_name": month_names[month],
                    "video_count": len(views_list),
                    "avg_views": round(statistics.mean(views_list)),
                })
        
        month_performance.sort(key=lambda x: x["avg_views"], reverse=True)
        
        # Group by year
        by_year = defaultdict(list)
        for v in videos:
            by_year[v["pub_year"]].append(v)
        
        year_performance = []
        for year in sorted(by_year.keys()):
            year_videos = by_year[year]
            views_list = [v["view_count"] for v in year_videos]
            year_performance.append({
                "year": year,
                "video_count": len(year_videos),
                "avg_views": round(statistics.mean(views_list)),
                "total_views": sum(views_list),
                "avg_duration_min": round(statistics.mean([v["duration_minutes"] for v in year_videos]), 1),
            })
        
        return {
            "best_days": day_performance[:3],
            "worst_days": day_performance[-3:] if len(day_performance) >= 3 else [],
            "all_days": day_performance,
            "best_hours": hour_performance[:5],
            "all_hours": hour_performance,
            "best_months": month_performance[:3],
            "all_months": month_performance,
            "yearly_trend": year_performance,
        }
    
    # ========== TITLE ANALYSIS ==========
    
    def analyze_title_patterns(self, videos: List[Dict]) -> Dict[str, Any]:
        """Analyze which words/phrases in titles correlate with high views."""
        if not videos:
            return {}
        
        # Sort by views
        sorted_videos = sorted(videos, key=lambda x: x["view_count"], reverse=True)
        top_20_percent = sorted_videos[:len(sorted_videos) // 5]
        bottom_20_percent = sorted_videos[-len(sorted_videos) // 5:]
        
        # Count words in top videos
        top_word_counts = Counter()
        for v in top_20_percent:
            for word in v["title_words"]:
                top_word_counts[word] += 1
        
        # Count words in bottom videos
        bottom_word_counts = Counter()
        for v in bottom_20_percent:
            for word in v["title_words"]:
                bottom_word_counts[word] += 1
        
        # Count words in all videos
        all_word_counts = Counter()
        for v in videos:
            for word in v["title_words"]:
                all_word_counts[word] += 1
        
        # Find words that appear more in top videos
        power_words = []
        for word, count in top_word_counts.most_common(100):
            if count >= 3:  # At least 3 occurrences in top videos
                top_percent = (count / len(top_20_percent)) * 100
                bottom_count = bottom_word_counts.get(word, 0)
                bottom_percent = (bottom_count / len(bottom_20_percent)) * 100 if len(bottom_20_percent) > 0 else 0
                
                # Calculate lift (how much better top performs)
                lift = (top_percent / bottom_percent) if bottom_percent > 0 else 10
                
                if lift > 1.2:  # At least 20% more common in top videos
                    power_words.append({
                        "word": word,
                        "top_video_count": count,
                        "bottom_video_count": bottom_count,
                        "top_percent": round(top_percent, 1),
                        "bottom_percent": round(bottom_percent, 1),
                        "lift": round(lift, 2),
                    })
        
        # Sort by lift
        power_words.sort(key=lambda x: x["lift"], reverse=True)
        
        # Find words to AVOID (more common in bottom videos)
        avoid_words = []
        for word, count in bottom_word_counts.most_common(100):
            if count >= 3:
                bottom_percent = (count / len(bottom_20_percent)) * 100
                top_count = top_word_counts.get(word, 0)
                top_percent = (top_count / len(top_20_percent)) * 100 if len(top_20_percent) > 0 else 0
                
                if bottom_percent > top_percent * 1.5:  # 50% more common in bottom
                    avoid_words.append({
                        "word": word,
                        "bottom_video_count": count,
                        "top_video_count": top_count,
                        "bottom_percent": round(bottom_percent, 1),
                        "top_percent": round(top_percent, 1),
                    })
        
        avoid_words.sort(key=lambda x: x["bottom_percent"], reverse=True)
        
        # Analyze title characteristics
        emoji_analysis = self._analyze_boolean_factor(videos, "has_emoji", "view_count")
        numbers_analysis = self._analyze_boolean_factor(videos, "has_numbers", "view_count")
        question_analysis = self._analyze_boolean_factor(videos, "has_question", "view_count")
        
        # Find most common bigrams in top videos
        top_bigrams = self._extract_bigrams(top_20_percent)
        
        return {
            "power_words": power_words[:30],
            "avoid_words": avoid_words[:20],
            "title_characteristics": {
                "emoji_effect": emoji_analysis,
                "numbers_effect": numbers_analysis,
                "question_effect": question_analysis,
            },
            "top_phrases": top_bigrams[:20],
        }
    
    def _extract_bigrams(self, videos: List[Dict]) -> List[Dict]:
        """Extract common two-word phrases from titles."""
        bigram_counts = Counter()
        bigram_views = defaultdict(list)
        
        for v in videos:
            words = v["title_words"]
            for i in range(len(words) - 1):
                bigram = f"{words[i]} {words[i+1]}"
                bigram_counts[bigram] += 1
                bigram_views[bigram].append(v["view_count"])
        
        result = []
        for bigram, count in bigram_counts.most_common(50):
            if count >= 3:
                result.append({
                    "phrase": bigram,
                    "count": count,
                    "avg_views": round(statistics.mean(bigram_views[bigram])),
                })
        
        return result
    
    def _analyze_boolean_factor(self, videos: List[Dict], field: str, metric: str) -> Dict:
        """Analyze how a boolean factor affects a metric."""
        with_factor = [v[metric] for v in videos if v.get(field)]
        without_factor = [v[metric] for v in videos if not v.get(field)]
        
        with_avg = statistics.mean(with_factor) if with_factor else 0
        without_avg = statistics.mean(without_factor) if without_factor else 0
        
        diff_percent = ((with_avg - without_avg) / without_avg * 100) if without_avg > 0 else 0
        
        return {
            "with_factor_count": len(with_factor),
            "without_factor_count": len(without_factor),
            "with_factor_avg": round(with_avg),
            "without_factor_avg": round(without_avg),
            "difference_percent": round(diff_percent, 1),
            "recommendation": "use" if diff_percent > 10 else "avoid" if diff_percent < -10 else "neutral",
        }
    
    # ========== ENGAGEMENT ANALYSIS ==========
    
    def analyze_engagement(self, videos: List[Dict]) -> Dict[str, Any]:
        """Analyze engagement patterns (likes, comments, ratios)."""
        if not videos:
            return {}
        
        # Filter videos with views > 0
        valid_videos = [v for v in videos if v["view_count"] > 0]
        
        # Overall engagement stats
        avg_like_ratio = statistics.mean([v["like_ratio"] for v in valid_videos])
        avg_comment_ratio = statistics.mean([v["comment_ratio"] for v in valid_videos])
        avg_engagement = statistics.mean([v["engagement_score"] for v in valid_videos])
        
        # Find most engaging videos (highest engagement score)
        sorted_by_engagement = sorted(valid_videos, key=lambda x: x["engagement_score"], reverse=True)
        
        most_engaging = [{
            "title": v["title"][:60],
            "video_id": v["video_id"],
            "views": v["view_count"],
            "likes": v["like_count"],
            "comments": v["comment_count"],
            "like_ratio": v["like_ratio"],
            "engagement_score": v["engagement_score"],
        } for v in sorted_by_engagement[:10]]
        
        # Engagement by duration
        duration_buckets = {
            "shorts": {"range": (0, 60), "videos": []},
            "1-10 min": {"range": (60, 600), "videos": []},
            "10-30 min": {"range": (600, 1800), "videos": []},
            "30-60 min": {"range": (1800, 3600), "videos": []},
            "1-2 hours": {"range": (3600, 7200), "videos": []},
            "2+ hours": {"range": (7200, float('inf')), "videos": []},
        }
        
        for v in valid_videos:
            duration = v["duration_seconds"]
            for bucket_name, bucket_data in duration_buckets.items():
                if bucket_data["range"][0] <= duration < bucket_data["range"][1]:
                    bucket_data["videos"].append(v)
                    break
        
        engagement_by_duration = []
        for bucket_name, bucket_data in duration_buckets.items():
            bucket_videos = bucket_data["videos"]
            if bucket_videos:
                engagement_by_duration.append({
                    "duration_range": bucket_name,
                    "video_count": len(bucket_videos),
                    "avg_views": round(statistics.mean([v["view_count"] for v in bucket_videos])),
                    "avg_like_ratio": round(statistics.mean([v["like_ratio"] for v in bucket_videos]), 2),
                    "avg_engagement": round(statistics.mean([v["engagement_score"] for v in bucket_videos]), 2),
                })
        
        # Correlation between views and engagement
        # Videos with high views tend to have lower like ratio (normal)
        sorted_by_views = sorted(valid_videos, key=lambda x: x["view_count"], reverse=True)
        top_viewed = sorted_by_views[:len(sorted_by_views) // 5]
        bottom_viewed = sorted_by_views[-len(sorted_by_views) // 5:]
        
        return {
            "overall_stats": {
                "avg_like_ratio": round(avg_like_ratio, 2),
                "avg_comment_ratio": round(avg_comment_ratio, 4),
                "avg_engagement_score": round(avg_engagement, 2),
                "total_videos_analyzed": len(valid_videos),
            },
            "most_engaging_videos": most_engaging,
            "engagement_by_duration": engagement_by_duration,
            "view_engagement_correlation": {
                "top_viewed_avg_like_ratio": round(statistics.mean([v["like_ratio"] for v in top_viewed]), 2),
                "bottom_viewed_avg_like_ratio": round(statistics.mean([v["like_ratio"] for v in bottom_viewed]), 2),
                "insight": "Higher viewed videos typically have lower like ratios (normal pattern)",
            },
        }
    
    # ========== CONTENT TYPE ANALYSIS ==========
    
    def analyze_content_types(self, videos: List[Dict]) -> Dict[str, Any]:
        """Analyze performance by content type."""
        if not videos:
            return {}
        
        # Group by content type
        by_type = defaultdict(list)
        for v in videos:
            by_type[v["content_type"]].append(v)
        
        type_performance = []
        for content_type, type_videos in by_type.items():
            if type_videos:
                views = [v["view_count"] for v in type_videos]
                type_performance.append({
                    "content_type": content_type,
                    "video_count": len(type_videos),
                    "total_views": sum(views),
                    "avg_views": round(statistics.mean(views)),
                    "median_views": round(statistics.median(views)),
                    "max_views": max(views),
                    "avg_duration_min": round(statistics.mean([v["duration_minutes"] for v in type_videos]), 1),
                    "avg_engagement": round(statistics.mean([v["engagement_score"] for v in type_videos]), 2),
                })
        
        # Sort by avg views
        type_performance.sort(key=lambda x: x["avg_views"], reverse=True)
        
        return {
            "by_content_type": type_performance,
            "best_performing_type": type_performance[0] if type_performance else None,
            "total_types": len(type_performance),
        }
    
    # ========== GROWTH TRENDS ==========
    
    def analyze_growth_trends(self, videos: List[Dict]) -> Dict[str, Any]:
        """Analyze channel growth and trends over time."""
        if not videos:
            return {}
        
        # Group by year-month
        by_month = defaultdict(list)
        for v in videos:
            month_key = f"{v['pub_year']}-{v['pub_month']:02d}"
            by_month[month_key].append(v)
        
        monthly_stats = []
        for month_key in sorted(by_month.keys()):
            month_videos = by_month[month_key]
            views = [v["view_count"] for v in month_videos]
            monthly_stats.append({
                "month": month_key,
                "video_count": len(month_videos),
                "total_views": sum(views),
                "avg_views": round(statistics.mean(views)),
                "avg_duration_min": round(statistics.mean([v["duration_minutes"] for v in month_videos]), 1),
            })
        
        # Calculate growth rate (last 6 months vs previous 6 months)
        if len(monthly_stats) >= 12:
            recent_6 = monthly_stats[-6:]
            previous_6 = monthly_stats[-12:-6]
            
            recent_avg = statistics.mean([m["avg_views"] for m in recent_6])
            previous_avg = statistics.mean([m["avg_views"] for m in previous_6])
            
            growth_rate = ((recent_avg - previous_avg) / previous_avg * 100) if previous_avg > 0 else 0
        else:
            growth_rate = 0
        
        # Find breakout videos (10x above average for their month)
        breakout_videos = []
        for month_key, month_videos in by_month.items():
            avg_views = statistics.mean([v["view_count"] for v in month_videos])
            for v in month_videos:
                if v["view_count"] > avg_views * 5:  # 5x above month average
                    breakout_videos.append({
                        "title": v["title"][:60],
                        "video_id": v["video_id"],
                        "views": v["view_count"],
                        "month": month_key,
                        "multiplier": round(v["view_count"] / avg_views, 1),
                    })
        
        breakout_videos.sort(key=lambda x: x["views"], reverse=True)
        
        return {
            "monthly_stats": monthly_stats,
            "growth_rate_6m": round(growth_rate, 1),
            "breakout_videos": breakout_videos[:20],
            "total_months_analyzed": len(monthly_stats),
        }
    
    # ========== FULL DEEP ANALYSIS ==========
    
    def run_full_analysis(self, max_videos: int = 5000) -> Dict[str, Any]:
        """Run comprehensive deep analysis on all videos."""
        # Get all videos
        videos = self.get_all_videos_extended(max_videos=max_videos)
        
        if len(videos) < 10:
            return {"error": f"Need at least 10 videos, found {len(videos)}"}
        
        # Run all analyses
        time_analysis = self.analyze_posting_times(videos)
        title_analysis = self.analyze_title_patterns(videos)
        engagement_analysis = self.analyze_engagement(videos)
        content_analysis = self.analyze_content_types(videos)
        growth_analysis = self.analyze_growth_trends(videos)
        
        # Generate executive summary
        sorted_by_views = sorted(videos, key=lambda x: x["view_count"], reverse=True)
        
        summary = {
            "total_videos": len(videos),
            "total_views": sum(v["view_count"] for v in videos),
            "avg_views": round(statistics.mean([v["view_count"] for v in videos])),
            "top_video": {
                "title": sorted_by_views[0]["title"],
                "views": sorted_by_views[0]["view_count"],
            },
            "date_range": {
                "earliest": min(v["published_at"] for v in videos)[:10],
                "latest": max(v["published_at"] for v in videos)[:10],
            },
        }
        
        return {
            "summary": summary,
            "posting_times": time_analysis,
            "title_patterns": title_analysis,
            "engagement": engagement_analysis,
            "content_types": content_analysis,
            "growth_trends": growth_analysis,
        }

