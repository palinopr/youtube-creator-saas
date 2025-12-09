"""
Causal Analytics - Deep analysis to understand WHY videos succeed or fail.
Goes beyond correlation to find actual drivers of success.

REFACTORED: Replaced hardcoded KNOWN_CELEBRITIES with dynamic NER using OpenAI.
- Entities are now extracted dynamically from video titles and descriptions
- Works for any channel, not just specific test cases
- Uses OpenAI GPT for intelligent entity recognition
"""

from typing import List, Dict, Any, Optional, Tuple, Set
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import statistics
import re
import os
import json
from googleapiclient.discovery import Resource
import openai


class EntityExtractor:
    """
    Dynamic Named Entity Recognition using OpenAI.
    Replaces hardcoded celebrity lists with intelligent extraction.
    """
    
    def __init__(self, openai_api_key: Optional[str] = None):
        self.api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        self._entity_cache: Dict[str, List[str]] = {}
        self._channel_entities: Set[str] = set()
        
    def extract_entities_batch(self, texts: List[str], batch_size: int = 20) -> Dict[str, List[str]]:
        """
        Extract named entities from a batch of texts using OpenAI.
        Returns a dict mapping text -> list of entities found.
        """
        if not self.api_key:
            print("[EntityExtractor] No API key, falling back to regex-based extraction")
            return {text: self._extract_entities_regex(text) for text in texts}
        
        results = {}
        
        # Process in batches to avoid token limits
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i+batch_size]
            batch_results = self._extract_batch_openai(batch)
            results.update(batch_results)
        
        return results
    
    def _extract_batch_openai(self, texts: List[str]) -> Dict[str, List[str]]:
        """Use OpenAI to extract entities from a batch of texts."""
        try:
            client = openai.OpenAI(api_key=self.api_key)
            
            # Create a numbered list of texts for batch processing
            numbered_texts = "\n".join([f"{i+1}. {text[:200]}" for i, text in enumerate(texts)])
            
            prompt = f"""Extract named entities (people, celebrities, influencers, brands, organizations, places) from these video titles/descriptions.

For each numbered text, return a JSON array of entities found. Only include specific, notable entities - not generic words.

Texts:
{numbered_texts}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{{
  "1": ["Entity1", "Entity2"],
  "2": ["Entity1"],
  ...
}}

If no entities found for a text, use an empty array: []"""

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an expert at named entity recognition. Extract only notable people, celebrities, brands, and organizations. Return valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content.strip()
            
            # Clean up response - remove markdown code blocks if present
            if content.startswith("```"):
                content = re.sub(r'^```\w*\n?', '', content)
                content = re.sub(r'\n?```$', '', content)
            
            # Parse JSON response
            parsed = json.loads(content)
            
            # Map back to original texts
            results = {}
            for i, text in enumerate(texts):
                key = str(i + 1)
                entities = parsed.get(key, [])
                # Normalize entities to lowercase for consistency
                normalized = [e.lower().strip() for e in entities if isinstance(e, str) and len(e) > 1]
                results[text] = normalized
                # Add to channel entity cache
                self._channel_entities.update(normalized)
                self._entity_cache[text] = normalized
            
            return results
            
        except json.JSONDecodeError as e:
            print(f"[EntityExtractor] JSON parse error: {e}")
            return {text: self._extract_entities_regex(text) for text in texts}
        except Exception as e:
            print(f"[EntityExtractor] OpenAI error: {e}")
            return {text: self._extract_entities_regex(text) for text in texts}
    
    def _extract_entities_regex(self, text: str) -> List[str]:
        """
        Fallback regex-based entity extraction.
        Looks for capitalized multi-word phrases that might be names.
        """
        entities = []
        
        # Find capitalized word sequences (potential names)
        name_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b'
        matches = re.findall(name_pattern, text)
        entities.extend([m.lower() for m in matches])
        
        # Find @mentions (social handles often = notable people)
        mention_pattern = r'@(\w+)'
        mentions = re.findall(mention_pattern, text)
        entities.extend([m.lower() for m in mentions])
        
        # Find quoted names
        quote_pattern = r'"([^"]+)"'
        quotes = re.findall(quote_pattern, text)
        entities.extend([q.lower() for q in quotes if len(q.split()) <= 4])
        
        return list(set(entities))[:5]
    
    def get_channel_entities(self) -> Set[str]:
        """Get all unique entities found across the channel's content."""
        return self._channel_entities
    
    def extract_from_cache_or_new(self, text: str) -> List[str]:
        """Get entities from cache or extract if not cached."""
        if text in self._entity_cache:
            return self._entity_cache[text]
        
        # Single text extraction
        result = self.extract_entities_batch([text])
        return result.get(text, [])


class CausalAnalytics:
    """Deep causal analysis for understanding video success factors."""
    
    def __init__(self, youtube_service: Resource, openai_api_key: Optional[str] = None):
        self.youtube = youtube_service
        self.entity_extractor = EntityExtractor(openai_api_key)
        self._videos_cache: List[Dict] = []
    
    def get_videos_with_full_data(self, max_videos: int = 500) -> List[Dict[str, Any]]:
        """
        Get videos with comprehensive data for causal analysis.
        
        PRODUCTION NOTE: Capped at 500 for real-time requests.
        For full analysis, use the async ETL pattern.
        """
        # Safety cap
        max_videos = min(max_videos, 500)
        
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
        all_texts_for_ner = []  # Collect texts for batch NER
        
        for i in range(0, len(all_video_ids), 50):
            batch_ids = all_video_ids[i:i+50]
            
            videos_response = self.youtube.videos().list(
                part="snippet,statistics,contentDetails,topicDetails",
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
                
                # Analyze description structure
                desc_analysis = self._analyze_description(description)
                
                # Calculate engagement metrics
                views = int(stats.get("viewCount", 0))
                likes = int(stats.get("likeCount", 0))
                comments = int(stats.get("commentCount", 0))
                
                like_ratio = (likes / views * 100) if views > 0 else 0
                comment_ratio = (comments / views * 100) if views > 0 else 0
                
                # Detect content type
                content_type = self._detect_content_type(title, description, duration_seconds)
                
                # Extract title patterns
                title_analysis = self._analyze_title(title)
                
                # Prepare text for NER (will be processed in batch)
                ner_text = f"{title} {description[:500]}"
                all_texts_for_ner.append(ner_text)
                
                all_videos.append({
                    "video_id": video["id"],
                    "title": title,
                    "description": description,
                    "tags": tags,
                    "published_at": published_at,
                    "pub_date": pub_date,
                    "pub_year": pub_date.year,
                    "pub_month": pub_date.month,
                    "pub_day_of_week": pub_date.weekday(),
                    "pub_hour": pub_date.hour,
                    "duration_seconds": duration_seconds,
                    "duration_minutes": round(duration_seconds / 60, 1),
                    "view_count": views,
                    "like_count": likes,
                    "comment_count": comments,
                    "like_ratio": round(like_ratio, 2),
                    "comment_ratio": round(comment_ratio, 4),
                    
                    # Placeholder for entity analysis (will be filled after batch NER)
                    "_ner_text": ner_text,
                    "celebrities_mentioned": [],
                    "celebrity_count": 0,
                    "has_celebrity": False,
                    "primary_celebrity": None,
                    
                    # Title analysis
                    "title_length": len(title),
                    "title_word_count": len(title.split()),
                    "has_emoji": title_analysis["has_emoji"],
                    "has_numbers": title_analysis["has_numbers"],
                    "has_question": title_analysis["has_question"],
                    "has_fire_emoji": "🔥" in title,
                    "is_all_caps": title_analysis["is_all_caps"],
                    "has_quotes": '"' in title or "'" in title,
                    "title_sentiment": title_analysis["sentiment"],
                    
                    # Description analysis
                    "description_length": len(description),
                    "desc_link_count": desc_analysis["link_count"],
                    "desc_has_timestamps": desc_analysis["has_timestamps"],
                    "desc_has_social_links": desc_analysis["has_social_links"],
                    "desc_hashtag_count": desc_analysis["hashtag_count"],
                    "desc_has_call_to_action": desc_analysis["has_call_to_action"],
                    "desc_paragraph_count": desc_analysis["paragraph_count"],
                    
                    # Content type
                    "content_type": content_type,
                    
                    # Tags
                    "tags_count": len(tags),
                    
                    "thumbnail_url": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
                })
        
        # Batch NER processing - extract entities from all texts at once
        print(f"[CausalAnalytics] Running NER on {len(all_texts_for_ner)} video texts...")
        entity_results = self.entity_extractor.extract_entities_batch(all_texts_for_ner)
        
        # Update videos with entity data
        for video in all_videos:
            ner_text = video.pop("_ner_text")
            entities = entity_results.get(ner_text, [])
            video["celebrities_mentioned"] = entities
            video["celebrity_count"] = len(entities)
            video["has_celebrity"] = len(entities) > 0
            video["primary_celebrity"] = entities[0] if entities else None
        
        # Cache for later use
        self._videos_cache = all_videos
        
        return all_videos
    
    def _parse_duration(self, duration_str: str) -> int:
        match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration_str)
        if not match:
            return 0
        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)
        return hours * 3600 + minutes * 60 + seconds
    
    def _analyze_description(self, description: str) -> Dict[str, Any]:
        """Analyze description structure and content."""
        # Count links
        link_pattern = r'https?://[^\s]+'
        links = re.findall(link_pattern, description)
        
        # Check for timestamps (e.g., 0:00, 1:23:45)
        timestamp_pattern = r'\d{1,2}:\d{2}(?::\d{2})?'
        has_timestamps = bool(re.search(timestamp_pattern, description))
        
        # Check for social links
        social_patterns = ['instagram', 'twitter', 'tiktok', 'facebook', 'snapchat', 'twitch']
        has_social = any(social in description.lower() for social in social_patterns)
        
        # Count hashtags
        hashtags = re.findall(r'#\w+', description)
        
        # Check for call to action
        cta_patterns = ['suscr', 'subscribe', 'like', 'comenta', 'comment', 'share', 'comparte', 
                        'activa la campana', 'notification', 'follow', 'sigue']
        has_cta = any(cta in description.lower() for cta in cta_patterns)
        
        # Count paragraphs
        paragraphs = [p for p in description.split('\n\n') if p.strip()]
        
        return {
            "link_count": len(links),
            "has_timestamps": has_timestamps,
            "has_social_links": has_social,
            "hashtag_count": len(hashtags),
            "has_call_to_action": has_cta,
            "paragraph_count": len(paragraphs),
        }
    
    def _analyze_title(self, title: str) -> Dict[str, Any]:
        """Analyze title patterns."""
        # Emoji detection
        emoji_pattern = re.compile("["
            u"\U0001F600-\U0001F64F"  # emoticons
            u"\U0001F300-\U0001F5FF"  # symbols & pictographs
            u"\U0001F680-\U0001F6FF"  # transport & map symbols
            u"\U0001F1E0-\U0001F1FF"  # flags
            u"\U00002702-\U000027B0"
            u"\U000024C2-\U0001F251"
            "]+", flags=re.UNICODE)
        
        has_emoji = bool(emoji_pattern.search(title))
        has_numbers = bool(re.search(r'\d', title))
        has_question = '?' in title
        
        # Check for ALL CAPS sections
        words = title.split()
        caps_words = sum(1 for w in words if w.isupper() and len(w) > 2)
        is_all_caps = caps_words >= 3
        
        # Simple sentiment based on words
        positive_words = ['mejor', 'increible', 'exclusiv', 'epic', 'amazing', 'verdad', 'revela', 'best', 'awesome']
        negative_words = ['drama', 'pelea', 'problema', 'escandalo', 'contra', 'destroza', 'descarga', 'fight', 'controversy']
        
        title_lower = title.lower()
        pos_count = sum(1 for w in positive_words if w in title_lower)
        neg_count = sum(1 for w in negative_words if w in title_lower)
        
        if neg_count > pos_count:
            sentiment = "controversial"
        elif pos_count > neg_count:
            sentiment = "positive"
        else:
            sentiment = "neutral"
        
        return {
            "has_emoji": has_emoji,
            "has_numbers": has_numbers,
            "has_question": has_question,
            "is_all_caps": is_all_caps,
            "sentiment": sentiment,
        }
    
    def _detect_content_type(self, title: str, description: str, duration: int) -> str:
        """Detect content type from title, description, and duration."""
        title_lower = title.lower()
        
        if duration < 60:
            return "short"
        elif "entrevista" in title_lower or "interview" in title_lower:
            return "interview"
        elif "tendencia" in title_lower or "trend" in title_lower:
            return "trending"
        elif "en vivo" in title_lower or "live" in title_lower:
            return "live"
        elif "reaccion" in title_lower or "react" in title_lower:
            return "reaction"
        elif "podcast" in title_lower:
            return "podcast"
        elif "tutorial" in title_lower or "how to" in title_lower:
            return "tutorial"
        elif "review" in title_lower or "reseña" in title_lower:
            return "review"
        elif duration > 3600:
            return "long_form"
        elif duration > 1200:
            return "medium_form"
        else:
            return "standard"
    
    # ========== CELEBRITY/ENTITY IMPACT ANALYSIS ==========
    
    def analyze_celebrity_impact(self, videos: List[Dict]) -> Dict[str, Any]:
        """Analyze which celebrities/people drive the most views."""
        if not videos:
            return {}
        
        # Group videos by celebrity
        celebrity_videos = defaultdict(list)
        no_celebrity_videos = []
        
        for v in videos:
            if v["has_celebrity"]:
                for celeb in v["celebrities_mentioned"]:
                    celebrity_videos[celeb].append(v)
            else:
                no_celebrity_videos.append(v)
        
        # Calculate stats per celebrity
        celebrity_stats = []
        for celeb, celeb_vids in celebrity_videos.items():
            if len(celeb_vids) >= 2:  # At least 2 videos
                views = [v["view_count"] for v in celeb_vids]
                celebrity_stats.append({
                    "celebrity": celeb,
                    "video_count": len(celeb_vids),
                    "total_views": sum(views),
                    "avg_views": round(statistics.mean(views)),
                    "median_views": round(statistics.median(views)),
                    "max_views": max(views),
                    "min_views": min(views),
                    "avg_like_ratio": round(statistics.mean([v["like_ratio"] for v in celeb_vids]), 2),
                    "sample_titles": [v["title"][:60] for v in sorted(celeb_vids, key=lambda x: x["view_count"], reverse=True)[:3]],
                })
        
        # Sort by avg views
        celebrity_stats.sort(key=lambda x: x["avg_views"], reverse=True)
        
        # Calculate baseline (videos without celebrities)
        if no_celebrity_videos:
            no_celeb_views = [v["view_count"] for v in no_celebrity_videos]
            baseline = {
                "video_count": len(no_celebrity_videos),
                "avg_views": round(statistics.mean(no_celeb_views)),
                "median_views": round(statistics.median(no_celeb_views)),
            }
        else:
            baseline = {"video_count": 0, "avg_views": 0, "median_views": 0}
        
        # Calculate celebrity lift (vs baseline)
        for stat in celebrity_stats:
            if baseline["avg_views"] > 0:
                stat["lift_vs_baseline"] = round((stat["avg_views"] / baseline["avg_views"] - 1) * 100, 1)
            else:
                stat["lift_vs_baseline"] = 0
        
        # Get all unique entities found in the channel
        all_entities = self.entity_extractor.get_channel_entities()
        
        return {
            "top_celebrities": celebrity_stats[:20],
            "baseline_no_celebrity": baseline,
            "celebrity_vs_no_celebrity": {
                "with_celebrity_avg": round(statistics.mean([v["view_count"] for v in videos if v["has_celebrity"]])) if any(v["has_celebrity"] for v in videos) else 0,
                "without_celebrity_avg": baseline["avg_views"],
            },
            "total_unique_entities_found": len(all_entities),
            "extraction_method": "openai_ner" if self.entity_extractor.api_key else "regex_fallback",
        }
    
    # ========== TITLE VS CONTENT ANALYSIS ==========
    
    def analyze_title_vs_content(self, videos: List[Dict]) -> Dict[str, Any]:
        """Try to separate title SEO effect from content/person effect."""
        if not videos:
            return {}
        
        # Group by whether video has celebrity
        with_celeb = [v for v in videos if v["has_celebrity"]]
        without_celeb = [v for v in videos if not v["has_celebrity"]]
        
        # For videos WITHOUT celebrities, title matters more
        # Analyze title factors for non-celebrity videos
        title_factors = {}
        
        if len(without_celeb) >= 20:
            # Title length impact (for non-celebrity videos)
            short_titles = [v for v in without_celeb if v["title_length"] < 50]
            medium_titles = [v for v in without_celeb if 50 <= v["title_length"] < 80]
            long_titles = [v for v in without_celeb if v["title_length"] >= 80]
            
            title_factors["title_length_impact"] = {
                "short_under_50": {"count": len(short_titles), "avg_views": round(statistics.mean([v["view_count"] for v in short_titles])) if short_titles else 0},
                "medium_50_80": {"count": len(medium_titles), "avg_views": round(statistics.mean([v["view_count"] for v in medium_titles])) if medium_titles else 0},
                "long_over_80": {"count": len(long_titles), "avg_views": round(statistics.mean([v["view_count"] for v in long_titles])) if long_titles else 0},
            }
            
            # Emoji impact (for non-celebrity videos)
            with_emoji = [v for v in without_celeb if v["has_emoji"]]
            without_emoji = [v for v in without_celeb if not v["has_emoji"]]
            
            title_factors["emoji_impact_no_celeb"] = {
                "with_emoji": {"count": len(with_emoji), "avg_views": round(statistics.mean([v["view_count"] for v in with_emoji])) if with_emoji else 0},
                "without_emoji": {"count": len(without_emoji), "avg_views": round(statistics.mean([v["view_count"] for v in without_emoji])) if without_emoji else 0},
            }
            
            # Controversial titles (for non-celebrity videos)
            controversial = [v for v in without_celeb if v["title_sentiment"] == "controversial"]
            non_controversial = [v for v in without_celeb if v["title_sentiment"] != "controversial"]
            
            title_factors["controversy_impact_no_celeb"] = {
                "controversial": {"count": len(controversial), "avg_views": round(statistics.mean([v["view_count"] for v in controversial])) if controversial else 0},
                "non_controversial": {"count": len(non_controversial), "avg_views": round(statistics.mean([v["view_count"] for v in non_controversial])) if non_controversial else 0},
            }
        
        # For videos WITH celebrities, compare same celebrity different title styles
        celeb_title_analysis = {}
        if len(with_celeb) >= 20:
            # Same celebrity, different title styles
            celeb_emoji = [v for v in with_celeb if v["has_emoji"]]
            celeb_no_emoji = [v for v in with_celeb if not v["has_emoji"]]
            
            celeb_title_analysis["celebrity_video_title_impact"] = {
                "with_emoji": {"count": len(celeb_emoji), "avg_views": round(statistics.mean([v["view_count"] for v in celeb_emoji])) if celeb_emoji else 0},
                "without_emoji": {"count": len(celeb_no_emoji), "avg_views": round(statistics.mean([v["view_count"] for v in celeb_no_emoji])) if celeb_no_emoji else 0},
            }
        
        # Calculate overall: What % of success is celebrity vs title?
        overall_avg = statistics.mean([v["view_count"] for v in videos])
        celeb_avg = statistics.mean([v["view_count"] for v in with_celeb]) if with_celeb else 0
        no_celeb_avg = statistics.mean([v["view_count"] for v in without_celeb]) if without_celeb else 0
        
        celebrity_lift = ((celeb_avg - no_celeb_avg) / no_celeb_avg * 100) if no_celeb_avg > 0 else 0
        
        return {
            "title_factors_non_celebrity": title_factors,
            "celebrity_video_title_analysis": celeb_title_analysis,
            "celebrity_contribution": {
                "videos_with_celebrity": len(with_celeb),
                "videos_without_celebrity": len(without_celeb),
                "celebrity_lift_percent": round(celebrity_lift, 1),
                "insight": f"Celebrity mentions add ~{round(celebrity_lift)}% more views on average" if celebrity_lift > 0 else "No significant celebrity lift",
            }
        }
    
    # ========== DESCRIPTION IMPACT ANALYSIS ==========
    
    def analyze_description_impact(self, videos: List[Dict]) -> Dict[str, Any]:
        """Deep dive into description patterns and their impact."""
        if not videos:
            return {}
        
        # Timestamps impact
        with_timestamps = [v for v in videos if v["desc_has_timestamps"]]
        without_timestamps = [v for v in videos if not v["desc_has_timestamps"]]
        
        timestamps_impact = {
            "with_timestamps": {
                "count": len(with_timestamps),
                "avg_views": round(statistics.mean([v["view_count"] for v in with_timestamps])) if with_timestamps else 0,
                "avg_duration_min": round(statistics.mean([v["duration_minutes"] for v in with_timestamps]), 1) if with_timestamps else 0,
            },
            "without_timestamps": {
                "count": len(without_timestamps),
                "avg_views": round(statistics.mean([v["view_count"] for v in without_timestamps])) if without_timestamps else 0,
            },
        }
        
        # Social links impact
        with_social = [v for v in videos if v["desc_has_social_links"]]
        without_social = [v for v in videos if not v["desc_has_social_links"]]
        
        social_links_impact = {
            "with_social_links": {"count": len(with_social), "avg_views": round(statistics.mean([v["view_count"] for v in with_social])) if with_social else 0},
            "without_social_links": {"count": len(without_social), "avg_views": round(statistics.mean([v["view_count"] for v in without_social])) if without_social else 0},
        }
        
        # Call to action impact
        with_cta = [v for v in videos if v["desc_has_call_to_action"]]
        without_cta = [v for v in videos if not v["desc_has_call_to_action"]]
        
        cta_impact = {
            "with_call_to_action": {"count": len(with_cta), "avg_views": round(statistics.mean([v["view_count"] for v in with_cta])) if with_cta else 0},
            "without_call_to_action": {"count": len(without_cta), "avg_views": round(statistics.mean([v["view_count"] for v in without_cta])) if without_cta else 0},
        }
        
        # Description length buckets
        short_desc = [v for v in videos if v["description_length"] < 200]
        medium_desc = [v for v in videos if 200 <= v["description_length"] < 500]
        long_desc = [v for v in videos if 500 <= v["description_length"] < 1000]
        very_long_desc = [v for v in videos if v["description_length"] >= 1000]
        
        desc_length_impact = {
            "short_under_200": {"count": len(short_desc), "avg_views": round(statistics.mean([v["view_count"] for v in short_desc])) if short_desc else 0},
            "medium_200_500": {"count": len(medium_desc), "avg_views": round(statistics.mean([v["view_count"] for v in medium_desc])) if medium_desc else 0},
            "long_500_1000": {"count": len(long_desc), "avg_views": round(statistics.mean([v["view_count"] for v in long_desc])) if long_desc else 0},
            "very_long_over_1000": {"count": len(very_long_desc), "avg_views": round(statistics.mean([v["view_count"] for v in very_long_desc])) if very_long_desc else 0},
        }
        
        # Hashtags impact
        no_hashtags = [v for v in videos if v["desc_hashtag_count"] == 0]
        few_hashtags = [v for v in videos if 1 <= v["desc_hashtag_count"] <= 3]
        many_hashtags = [v for v in videos if v["desc_hashtag_count"] > 3]
        
        hashtags_impact = {
            "no_hashtags": {"count": len(no_hashtags), "avg_views": round(statistics.mean([v["view_count"] for v in no_hashtags])) if no_hashtags else 0},
            "1_to_3_hashtags": {"count": len(few_hashtags), "avg_views": round(statistics.mean([v["view_count"] for v in few_hashtags])) if few_hashtags else 0},
            "more_than_3_hashtags": {"count": len(many_hashtags), "avg_views": round(statistics.mean([v["view_count"] for v in many_hashtags])) if many_hashtags else 0},
        }
        
        return {
            "timestamps": timestamps_impact,
            "social_links": social_links_impact,
            "call_to_action": cta_impact,
            "description_length": desc_length_impact,
            "hashtags": hashtags_impact,
        }
    
    # ========== SUCCESS FACTOR BREAKDOWN ==========
    
    def analyze_success_factors(self, videos: List[Dict]) -> Dict[str, Any]:
        """Break down what factors contribute to video success."""
        if not videos:
            return {}
        
        # Sort by views
        sorted_videos = sorted(videos, key=lambda x: x["view_count"], reverse=True)
        top_10_percent = sorted_videos[:len(sorted_videos) // 10]
        bottom_10_percent = sorted_videos[-len(sorted_videos) // 10:]
        
        def calculate_percentage(videos_list, field):
            return round(sum(1 for v in videos_list if v.get(field)) / len(videos_list) * 100, 1) if videos_list else 0
        
        # Compare top vs bottom
        comparison = {
            "has_celebrity": {
                "top_10%": calculate_percentage(top_10_percent, "has_celebrity"),
                "bottom_10%": calculate_percentage(bottom_10_percent, "has_celebrity"),
            },
            "has_emoji": {
                "top_10%": calculate_percentage(top_10_percent, "has_emoji"),
                "bottom_10%": calculate_percentage(bottom_10_percent, "has_emoji"),
            },
            "has_question": {
                "top_10%": calculate_percentage(top_10_percent, "has_question"),
                "bottom_10%": calculate_percentage(bottom_10_percent, "has_question"),
            },
            "has_timestamps": {
                "top_10%": calculate_percentage(top_10_percent, "desc_has_timestamps"),
                "bottom_10%": calculate_percentage(bottom_10_percent, "desc_has_timestamps"),
            },
            "controversial_title": {
                "top_10%": round(sum(1 for v in top_10_percent if v.get("title_sentiment") == "controversial") / len(top_10_percent) * 100, 1) if top_10_percent else 0,
                "bottom_10%": round(sum(1 for v in bottom_10_percent if v.get("title_sentiment") == "controversial") / len(bottom_10_percent) * 100, 1) if bottom_10_percent else 0,
            },
            "avg_title_length": {
                "top_10%": round(statistics.mean([v["title_length"] for v in top_10_percent])) if top_10_percent else 0,
                "bottom_10%": round(statistics.mean([v["title_length"] for v in bottom_10_percent])) if bottom_10_percent else 0,
            },
            "avg_description_length": {
                "top_10%": round(statistics.mean([v["description_length"] for v in top_10_percent])) if top_10_percent else 0,
                "bottom_10%": round(statistics.mean([v["description_length"] for v in bottom_10_percent])) if bottom_10_percent else 0,
            },
            "avg_duration_minutes": {
                "top_10%": round(statistics.mean([v["duration_minutes"] for v in top_10_percent]), 1) if top_10_percent else 0,
                "bottom_10%": round(statistics.mean([v["duration_minutes"] for v in bottom_10_percent]), 1) if bottom_10_percent else 0,
            },
        }
        
        # Calculate factor importance (difference between top and bottom)
        factor_importance = []
        for factor, values in comparison.items():
            diff = values["top_10%"] - values["bottom_10%"]
            factor_importance.append({
                "factor": factor,
                "top_10_percent": values["top_10%"],
                "bottom_10_percent": values["bottom_10%"],
                "difference": round(diff, 1),
                "direction": "higher in top" if diff > 0 else "higher in bottom" if diff < 0 else "no difference",
            })
        
        # Sort by absolute difference
        factor_importance.sort(key=lambda x: abs(x["difference"]), reverse=True)
        
        return {
            "factor_comparison": comparison,
            "factor_importance_ranking": factor_importance,
            "top_10_percent_count": len(top_10_percent),
            "bottom_10_percent_count": len(bottom_10_percent),
        }
    
    # ========== CONTENT TYPE DEEP ANALYSIS ==========
    
    def analyze_content_types_deep(self, videos: List[Dict]) -> Dict[str, Any]:
        """Deep analysis of content types."""
        if not videos:
            return {}
        
        # Group by content type
        by_type = defaultdict(list)
        for v in videos:
            by_type[v["content_type"]].append(v)
        
        type_analysis = []
        for content_type, type_videos in by_type.items():
            if len(type_videos) >= 3:
                views = [v["view_count"] for v in type_videos]
                
                # What makes this content type successful?
                top_videos = sorted(type_videos, key=lambda x: x["view_count"], reverse=True)[:5]
                
                # Common celebrities in this content type
                all_celebs = []
                for v in type_videos:
                    all_celebs.extend(v["celebrities_mentioned"])
                top_celebs = Counter(all_celebs).most_common(5)
                
                type_analysis.append({
                    "content_type": content_type,
                    "video_count": len(type_videos),
                    "total_views": sum(views),
                    "avg_views": round(statistics.mean(views)),
                    "median_views": round(statistics.median(views)),
                    "avg_duration_min": round(statistics.mean([v["duration_minutes"] for v in type_videos]), 1),
                    "avg_like_ratio": round(statistics.mean([v["like_ratio"] for v in type_videos]), 2),
                    "celebrity_frequency": round(sum(1 for v in type_videos if v["has_celebrity"]) / len(type_videos) * 100, 1),
                    "top_celebrities": [c[0] for c in top_celebs],
                    "top_video_titles": [v["title"][:60] for v in top_videos],
                })
        
        # Sort by avg views
        type_analysis.sort(key=lambda x: x["avg_views"], reverse=True)
        
        return {
            "content_type_analysis": type_analysis,
            "total_content_types": len(type_analysis),
        }
    
    # ========== FULL CAUSAL ANALYSIS ==========
    
    def run_full_causal_analysis(self, max_videos: int = 500) -> Dict[str, Any]:
        """
        Run comprehensive causal analysis on videos.
        
        PRODUCTION NOTE: Capped at 500 videos for real-time requests.
        For full analysis of larger datasets, use the async ETL endpoints.
        """
        # Safety cap
        max_videos = min(max_videos, 500)
        
        # Get all videos with full data
        videos = self.get_videos_with_full_data(max_videos=max_videos)
        
        if len(videos) < 20:
            return {"error": f"Need at least 20 videos, found {len(videos)}"}
        
        # Run all analyses
        celebrity_analysis = self.analyze_celebrity_impact(videos)
        title_vs_content = self.analyze_title_vs_content(videos)
        description_analysis = self.analyze_description_impact(videos)
        success_factors = self.analyze_success_factors(videos)
        content_types = self.analyze_content_types_deep(videos)
        
        # Summary
        sorted_videos = sorted(videos, key=lambda x: x["view_count"], reverse=True)
        
        summary = {
            "total_videos_analyzed": len(videos),
            "total_views": sum(v["view_count"] for v in videos),
            "avg_views": round(statistics.mean([v["view_count"] for v in videos])),
            "date_range": {
                "earliest": min(v["published_at"] for v in videos)[:10],
                "latest": max(v["published_at"] for v in videos)[:10],
            },
            "top_video": {
                "title": sorted_videos[0]["title"],
                "views": sorted_videos[0]["view_count"],
                "celebrities": sorted_videos[0]["celebrities_mentioned"],
            },
            "entity_extraction_method": "openai_ner" if self.entity_extractor.api_key else "regex_fallback",
        }
        
        return {
            "summary": summary,
            "celebrity_impact": celebrity_analysis,
            "title_vs_content": title_vs_content,
            "description_impact": description_analysis,
            "success_factors": success_factors,
            "content_types": content_types,
        }
