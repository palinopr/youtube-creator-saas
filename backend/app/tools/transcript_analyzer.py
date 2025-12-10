"""
Transcript Analyzer - Analyzes video transcripts to understand what CONTENT drives views.
Uses YouTube's Innertube API with browser impersonation to bypass IP restrictions.
Falls back to Whisper transcription if YouTube captions unavailable.
"""

from typing import List, Dict, Any, Optional
from collections import Counter, defaultdict
from datetime import datetime
import re
import json
import time
import os
import tempfile
from googleapiclient.discovery import Resource
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from openai import OpenAI
from ..config import get_settings


class TranscriptAnalyzer:
    """Analyzes video transcripts to find what content actually drives views."""
    
    def __init__(self, youtube_service: Resource):
        self.youtube = youtube_service
        settings = get_settings()
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0,  # Deterministic: same transcript = same suggestions
            api_key=settings.openai_api_key
        )
        
        # Celebrity names to look for in transcripts
        self.celebrity_keywords = [
            "daddy yankee", "don omar", "bad bunny", "anuel", "ozuna", "residente",
            "nicky jam", "wisin", "yandel", "pitbull", "j balvin", "maluma",
            "arcangel", "farruko", "6ix9ine", "tekashi", "karol g", "becky g",
            "alofoke", "pina", "gallo", "gringo", "molusco", "marc anthony",
            "romeo santos", "prince royce", "shakira", "jennifer lopez", "jlo",
            "ricky martin", "enrique iglesias", "chayanne", "luis fonsi",
            "rauw alejandro", "myke towers", "sech", "el alfa", "tokischa",
            "bryant myers", "noriel", "jhay cortez", "eladio carrion",
            "feid", "ryan castro", "blessd", "ovy on the drums"
        ]
        
        # Topic keywords to categorize content
        self.topic_keywords = {
            "drama": ["pelea", "problema", "conflicto", "drama", "tiraera", "beef", "responde", "ataca"],
            "money": ["dinero", "millones", "contrato", "rico", "plata", "fortuna", "patrimonio"],
            "relationships": ["novia", "novio", "esposa", "casado", "divorc", "amor", "relacion"],
            "career": ["carrera", "disco", "album", "cancion", "concierto", "gira", "tour"],
            "politics": ["politica", "gobierno", "trump", "biden", "eleccion", "partido"],
            "crime": ["carcel", "demanda", "arresto", "federal", "caso", "juicio", "crimen"],
            "personal": ["familia", "hijo", "padre", "madre", "vida", "historia", "infancia"],
            "controversy": ["escandalo", "polemic", "contro", "viral", "revela", "secreto", "verdad"],
        }
    
    async def get_transcript(self, video_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch transcript using multiple methods:
        1. youtube-transcript-api (works on production servers, no cookies needed)
        2. YouTube's Innertube API with browser impersonation (fallback)
        """
        # Method 1: Try youtube-transcript-api first (production-friendly)
        try:
            from youtube_transcript_api import YouTubeTranscriptApi
            from youtube_transcript_api._errors import (
                TranscriptsDisabled, 
                NoTranscriptFound,
                VideoUnavailable
            )
            
            try:
                # Try to get Spanish transcript first, then any available
                transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                
                # Priority: Spanish manual > Spanish auto > English > any
                transcript = None
                for lang in ['es', 'en']:
                    try:
                        transcript = transcript_list.find_transcript([lang])
                        break
                    except:
                        continue
                
                if not transcript:
                    # Get any available transcript
                    transcript = transcript_list.find_generated_transcript(['es', 'en'])
                
                if transcript:
                    transcript_data = transcript.fetch()
                    full_text = ' '.join([entry['text'] for entry in transcript_data])
                    full_text = re.sub(r'\s+', ' ', full_text).strip()
                    
                    return {
                        "video_id": video_id,
                        "status": "success",
                        "language": transcript.language_code,
                        "is_generated": transcript.is_generated,
                        "full_text": full_text,
                        "word_count": len(full_text.split()),
                        "source": "youtube_transcript_api"
                    }
                    
            except TranscriptsDisabled:
                print(f"[TRANSCRIPT] Transcripts disabled for video {video_id}")
            except NoTranscriptFound:
                print(f"[TRANSCRIPT] No transcript found for video {video_id}")
            except VideoUnavailable:
                print(f"[TRANSCRIPT] Video unavailable: {video_id}")
            except Exception as e:
                print(f"[TRANSCRIPT] youtube-transcript-api error: {e}")
                
        except ImportError:
            print("[TRANSCRIPT] youtube-transcript-api not installed, trying fallback...")
        
        # Method 2: Fallback to Innertube API with curl_cffi
        try:
            from curl_cffi import requests as curl_requests
        except ImportError:
            return {
                "video_id": video_id,
                "status": "error",
                "error": "No transcript method available. Install: pip install youtube-transcript-api",
                "full_text": None
            }
        
        try:
            url = f'https://www.youtube.com/watch?v={video_id}'
            
            # Create session with Chrome impersonation
            session = curl_requests.Session(impersonate="chrome120")
            
            # Add small delay to be respectful
            time.sleep(0.5)
            
            # Fetch the video page
            response = session.get(url)
            
            if response.status_code != 200:
                return {
                    "video_id": video_id,
                    "status": "error",
                    "error": f"Failed to fetch video page: {response.status_code}",
                    "full_text": None
                }
            
            # Extract API key
            api_key_match = re.search(r'"INNERTUBE_API_KEY":"([^"]+)"', response.text)
            if not api_key_match:
                return {
                    "video_id": video_id,
                    "status": "error",
                    "error": "Could not extract API key from page",
                    "full_text": None
                }
            api_key = api_key_match.group(1)
            
            # Extract client version
            client_version_match = re.search(r'"INNERTUBE_CLIENT_VERSION":"([^"]+)"', response.text)
            client_version = client_version_match.group(1) if client_version_match else "2.20231219.04.00"
            
            # Find transcript params in ytInitialData
            init_data_match = re.search(r'var ytInitialData\s*=\s*(\{.+?\});', response.text)
            if not init_data_match:
                return {
                    "video_id": video_id,
                    "status": "error",
                    "error": "Could not find ytInitialData",
                    "full_text": None
                }
            
            init_data = json.loads(init_data_match.group(1))
            
            # Find transcript panel
            params = None
            for panel in init_data.get('engagementPanels', []):
                panel_renderer = panel.get('engagementPanelSectionListRenderer', {})
                if 'transcript' in panel_renderer.get('panelIdentifier', '').lower():
                    content = panel_renderer.get('content', {})
                    cont_item = content.get('continuationItemRenderer', {})
                    endpoint = cont_item.get('continuationEndpoint', {})
                    transcript_endpoint = endpoint.get('getTranscriptEndpoint', {})
                    params = transcript_endpoint.get('params', '')
                    break
            
            if not params:
                return {
                    "video_id": video_id,
                    "status": "no_transcript",
                    "error": "Video does not have a transcript available",
                    "full_text": None
                }
            
            # Make the transcript continuation request
            cont_url = f'https://www.youtube.com/youtubei/v1/get_transcript?key={api_key}&prettyPrint=false'
            
            payload = {
                "context": {
                    "client": {
                        "hl": "es",
                        "gl": "PR",
                        "clientName": "WEB",
                        "clientVersion": client_version,
                        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                        "platform": "DESKTOP"
                    }
                },
                "params": params
            }
            
            time.sleep(0.5)  # Small delay
            
            cont_response = session.post(
                cont_url, 
                json=payload,
                headers={
                    'Content-Type': 'application/json',
                    'Origin': 'https://www.youtube.com',
                    'Referer': url,
                    'X-Youtube-Client-Name': '1',
                    'X-Youtube-Client-Version': client_version,
                }
            )
            
            if cont_response.status_code != 200:
                return {
                    "video_id": video_id,
                    "status": "error",
                    "error": f"Transcript API returned {cont_response.status_code}",
                    "full_text": None
                }
            
            data = cont_response.json()
            
            # Extract transcript text from response
            full_text = self._extract_transcript_text(data)
            
            if full_text:
                return {
                    "video_id": video_id,
                    "status": "success",
                    "language": "es",
                    "is_generated": True,
                    "full_text": full_text,
                    "word_count": len(full_text.split()),
                }
            else:
                return {
                    "video_id": video_id,
                    "status": "error",
                    "error": "Could not extract transcript text from response",
                    "full_text": None
                }
                
        except json.JSONDecodeError as e:
            return {
                "video_id": video_id,
                "status": "error",
                "error": f"JSON decode error: {str(e)}",
                "full_text": None
            }
        except Exception as e:
            return {
                "video_id": video_id,
                "status": "error",
                "error": str(e),
                "full_text": None
            }
    
    def _extract_transcript_text(self, data: Dict) -> Optional[str]:
        """Extract text from YouTube transcript API response."""
        try:
            actions = data.get('actions', [])
            for action in actions:
                update = action.get('updateEngagementPanelAction', {})
                content = update.get('content', {})
                transcript = content.get('transcriptRenderer', {})
                body = transcript.get('content', {}).get('transcriptSearchPanelRenderer', {}).get('body', {})
                segment_list = body.get('transcriptSegmentListRenderer', {})
                segments = segment_list.get('initialSegments', [])
                
                if segments:
                    texts = []
                    for seg in segments:
                        renderer = seg.get('transcriptSegmentRenderer', {})
                        snippet = renderer.get('snippet', {})
                        for run in snippet.get('runs', []):
                            text = run.get('text', '').strip()
                            if text:
                                texts.append(text)
                    
                    full_text = ' '.join(texts)
                    full_text = re.sub(r'\s+', ' ', full_text)
                    return full_text
            
            return None
        except Exception:
            return None
    
    async def transcribe_with_whisper(self, video_id: str, max_duration_minutes: int = 15) -> Optional[Dict[str, Any]]:
        """
        Fallback: Download audio and transcribe with OpenAI Whisper.
        Only downloads first N minutes to save costs and time.
        
        Args:
            video_id: YouTube video ID
            max_duration_minutes: Max minutes to transcribe (default 15 to stay under 25MB)
            
        Returns:
            Dict with transcript or error
        """
        settings = get_settings()
        
        if not settings.openai_api_key:
            return {
                "video_id": video_id,
                "status": "error",
                "error": "OpenAI API key not configured for Whisper",
                "full_text": None
            }
        
        temp_audio_path = None
        
        try:
            import yt_dlp
            
            # Create temp file for audio
            temp_dir = tempfile.gettempdir()
            temp_audio_path = os.path.join(temp_dir, f"yt_audio_{video_id}.mp3")
            
            # yt-dlp options - download audio only, limit duration
            # NO cookies needed - uses mobile client APIs
            ydl_opts = {
                'format': 'worstaudio/worst',  # Smallest audio = smaller file size
                'outtmpl': temp_audio_path.replace('.mp3', '.%(ext)s'),
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '32',  # Very low quality = much smaller file (enough for speech)
                }],
                'quiet': True,
                'no_warnings': True,
                # Limit to first N minutes to stay under 25MB Whisper limit
                'download_ranges': lambda info, ydl: [{'start_time': 0, 'end_time': max_duration_minutes * 60}],
                'force_keyframes_at_cuts': True,
            }
            
            url = f"https://www.youtube.com/watch?v={video_id}"
            
            # Try multiple download strategies (NO cookies - works on production)
            download_success = False
            last_error = None
            
            # All strategies work without browser cookies
            strategies = [
                # Mobile clients often bypass bot detection
                {
                    'extractor_args': {'youtube': {'player_client': ['android', 'ios']}},
                    'desc': 'Mobile client (Android/iOS)'
                },
                {
                    'extractor_args': {'youtube': {'player_client': ['mweb', 'web']}},
                    'desc': 'Mobile web client'
                },
                # TV clients as last resort
                {
                    'extractor_args': {'youtube': {'player_client': ['tv_embedded']}},
                    'desc': 'TV embedded client'
                },
            ]
            
            for strategy in strategies:
                try:
                    desc = strategy.pop('desc', 'unknown')
                    current_opts = {**ydl_opts, **strategy}
                    print(f"[TRANSCRIPT] Trying download strategy: {desc}")
                    
                    with yt_dlp.YoutubeDL(current_opts) as ydl:
                        ydl.download([url])
                    
                    # Check if file was created
                    for ext in ['.mp3', '.m4a', '.webm', '.opus']:
                        test_path = temp_audio_path.replace('.mp3', ext)
                        if os.path.exists(test_path) and os.path.getsize(test_path) > 1000:
                            download_success = True
                            break
                    
                    if download_success:
                        print(f"[TRANSCRIPT] ✓ Download succeeded with: {desc}")
                        break
                        
                except Exception as e:
                    last_error = str(e)
                    print(f"[TRANSCRIPT] Strategy '{desc}' failed: {str(e)[:100]}")
                    continue
            
            if not download_success:
                return {
                    "video_id": video_id,
                    "status": "error",
                    "error": f"All download strategies failed. Last error: {last_error}",
                    "full_text": None
                }
            
            # Find the actual output file (might have different extension)
            actual_path = temp_audio_path
            if not os.path.exists(actual_path):
                # Try to find the file
                for ext in ['.mp3', '.m4a', '.webm', '.opus']:
                    test_path = temp_audio_path.replace('.mp3', ext)
                    if os.path.exists(test_path):
                        actual_path = test_path
                        break
            
            if not os.path.exists(actual_path):
                return {
                    "video_id": video_id,
                    "status": "error",
                    "error": "Failed to download audio",
                    "full_text": None
                }
            
            # Check file size (Whisper limit is 25MB)
            file_size = os.path.getsize(actual_path)
            if file_size > 25 * 1024 * 1024:
                return {
                    "video_id": video_id,
                    "status": "error",
                    "error": f"Audio file too large ({file_size / 1024 / 1024:.1f}MB). Max is 25MB.",
                    "full_text": None
                }
            
            # Transcribe with Whisper
            client = OpenAI(api_key=settings.openai_api_key)
            
            with open(actual_path, "rb") as audio_file:
                transcript_response = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="es",  # Spanish
                    response_format="text"
                )
            
            transcript_text = transcript_response if isinstance(transcript_response, str) else str(transcript_response)
            
            return {
                "video_id": video_id,
                "status": "success",
                "source": "whisper",
                "language": "es",
                "is_generated": True,
                "full_text": transcript_text,
                "text": transcript_text,  # Alias for compatibility
                "word_count": len(transcript_text.split()),
                "duration_transcribed_minutes": max_duration_minutes,
            }
            
        except Exception as e:
            return {
                "video_id": video_id,
                "status": "error",
                "error": f"Whisper transcription failed: {str(e)}",
                "full_text": None
            }
        finally:
            # Cleanup temp files
            if temp_audio_path:
                for ext in ['.mp3', '.m4a', '.webm', '.opus', '']:
                    try:
                        test_path = temp_audio_path.replace('.mp3', ext) if ext else temp_audio_path
                        if os.path.exists(test_path):
                            os.remove(test_path)
                    except:
                        pass
    
    async def get_transcript_with_fallback(self, video_id: str, use_whisper_fallback: bool = True) -> Optional[Dict[str, Any]]:
        """
        Get transcript with Whisper fallback if YouTube captions unavailable.
        
        Args:
            video_id: YouTube video ID
            use_whisper_fallback: Whether to use Whisper if YouTube transcript unavailable
            
        Returns:
            Transcript dict with 'full_text' or 'text' field
        """
        print(f"[TRANSCRIPT] Starting get_transcript_with_fallback for {video_id}")
        
        # Try YouTube transcript first (free, fast)
        result = await self.get_transcript(video_id)
        
        if result and result.get("status") == "success" and result.get("full_text"):
            print(f"[TRANSCRIPT] ✓ YouTube captions found for {video_id}")
            result["source"] = "youtube_captions"
            return result
        
        print(f"[TRANSCRIPT] No YouTube captions for {video_id}. Status: {result.get('status') if result else 'None'}")
        
        # Fallback to Whisper if enabled
        if use_whisper_fallback:
            print(f"[TRANSCRIPT] Attempting Whisper transcription for {video_id}...")
            try:
                whisper_result = await self.transcribe_with_whisper(video_id)
                if whisper_result and whisper_result.get("status") == "success":
                    print(f"[TRANSCRIPT] ✓ Whisper transcription successful for {video_id}")
                else:
                    print(f"[TRANSCRIPT] ✗ Whisper failed: {whisper_result.get('error') if whisper_result else 'Unknown error'}")
                return whisper_result
            except Exception as e:
                print(f"[TRANSCRIPT] ✗ Whisper exception: {str(e)}")
                return result
        
        return result
    
    async def analyze_transcript_content(self, transcript: Dict[str, Any], video_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze a single transcript to extract content insights.
        """
        if not transcript.get("full_text"):
            return {"error": "No transcript available", "video_id": transcript.get("video_id")}
        
        text = transcript["full_text"].lower()
        
        # 1. Find celebrities mentioned IN the transcript (not just title)
        celebrities_mentioned = []
        for celeb in self.celebrity_keywords:
            count = text.count(celeb.lower())
            if count > 0:
                celebrities_mentioned.append({"name": celeb, "mentions": count})
        
        celebrities_mentioned = sorted(celebrities_mentioned, key=lambda x: x["mentions"], reverse=True)
        
        # 2. Categorize topics discussed
        topics_found = {}
        for topic, keywords in self.topic_keywords.items():
            topic_count = sum(text.count(kw.lower()) for kw in keywords)
            if topic_count > 0:
                topics_found[topic] = topic_count
        
        topics_found = dict(sorted(topics_found.items(), key=lambda x: x[1], reverse=True))
        
        # 3. Extract first 500 chars as opening hook
        opening_text = transcript["full_text"][:500]
        
        return {
            "video_id": transcript["video_id"],
            "view_count": video_data.get("view_count", 0),
            "like_count": video_data.get("like_count", 0),
            "title": video_data.get("title", ""),
            "word_count": transcript.get("word_count", 0),
            "celebrities_in_transcript": celebrities_mentioned[:10],
            "main_topics": topics_found,
            "opening_hook": opening_text,
            "is_auto_generated": transcript.get("is_generated", True),
        }
    
    async def deep_analyze_video_transcript(self, video_id: str) -> Dict[str, Any]:
        """
        Deep analysis of a single video's transcript using AI.
        """
        # Get video data
        video_response = self.youtube.videos().list(
            part="snippet,statistics",
            id=video_id
        ).execute()
        
        if not video_response.get("items"):
            return {"error": "Video not found"}
        
        video = video_response["items"][0]
        video_data = {
            "video_id": video_id,
            "title": video["snippet"]["title"],
            "description": video["snippet"]["description"][:500],
            "view_count": int(video["statistics"].get("viewCount", 0)),
            "like_count": int(video["statistics"].get("likeCount", 0)),
            "comment_count": int(video["statistics"].get("commentCount", 0)),
        }
        
        # Get transcript
        transcript = await self.get_transcript(video_id)
        
        if not transcript or transcript.get("status") != "success":
            return {
                "error": transcript.get("error", "Transcript not available"),
                "video_data": video_data,
                "transcript_status": transcript.get("status", "unknown")
            }
        
        # Basic analysis
        basic_analysis = await self.analyze_transcript_content(transcript, video_data)
        
        # Use AI to deeply analyze content
        ai_analysis = await self._ai_analyze_transcript(transcript["full_text"], video_data)
        
        return {
            "video_data": video_data,
            "transcript_info": {
                "word_count": transcript["word_count"],
                "is_auto_generated": transcript.get("is_generated", True),
                "language": transcript.get("language", "unknown"),
            },
            "basic_analysis": basic_analysis,
            "ai_analysis": ai_analysis,
        }
    
    async def _ai_analyze_transcript(self, text: str, video_data: Dict[str, Any]) -> Dict[str, Any]:
        """Use GPT-4 to deeply analyze transcript content."""
        
        # Truncate if too long (keep first 10000 chars for context)
        truncated_text = text[:10000] if len(text) > 10000 else text
        
        system_prompt = """You are an expert content analyst and SEO optimizer for MoluscoTV, a Puerto Rican entertainment YouTube channel with 2.8M subscribers.

Analyze this video transcript and provide:

1. CONTENT ANALYSIS:
- MAIN TOPICS: What are the main subjects discussed?
- CELEBRITIES DISCUSSED: Who is mentioned and in what context?
- EMOTIONAL HOOKS: What parts would grab viewer attention?
- CONTROVERSY LEVEL: Rate 1-10 how controversial the content is
- ENGAGEMENT TRIGGERS: What makes viewers want to comment/share?
- CONTENT STRUCTURE: How is the conversation structured?
- KEY QUOTES: Most impactful or viral-worthy quotes (in Spanish)
- IMPROVEMENT SUGGESTIONS: How could this content be better?

2. SEO OPTIMIZATION (based on what's ACTUALLY in the video):
- OPTIMIZED TITLES: 5 title options (70-90 chars, use emojis 🔥💀😱, include celebrity names, create curiosity/controversy)
- OPTIMIZED DESCRIPTION: A compelling description (200-500 chars) that summarizes the content, includes timestamps for key moments, and has calls to action
- OPTIMIZED TAGS: 15-20 relevant tags based on the actual content discussed

Respond in JSON format:
{
    "main_topics": ["topic1", "topic2"],
    "celebrities_discussed": [{"name": "...", "context": "..."}],
    "emotional_hooks": ["hook1", "hook2"],
    "controversy_score": 8,
    "engagement_triggers": ["trigger1", "trigger2"],
    "content_structure": "...",
    "key_quotes": ["quote1", "quote2"],
    "improvement_suggestions": ["suggestion1"],
    "overall_content_rating": "A/B/C/D",
    "why_it_worked_or_didnt": "...",
    "seo_optimization": {
        "optimized_titles": [
            {"title": "...", "why": "reason this title works"},
            {"title": "...", "why": "..."}
        ],
        "optimized_description": "...",
        "optimized_tags": ["tag1", "tag2", "tag3"]
    }
}"""
        
        human_msg = f"""Video Title: {video_data['title']}
Views: {video_data['view_count']:,}
Likes: {video_data['like_count']:,}

TRANSCRIPT:
{truncated_text}"""
        
        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=human_msg)
            ])
            
            # Try to parse JSON
            try:
                content = response.content
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                
                return json.loads(content)
            except:
                return {"raw_analysis": response.content}
                
        except Exception as e:
            return {"error": str(e)}
    
    async def _get_top_videos(self, max_videos: int = 100) -> List[Dict[str, Any]]:
        """Fetch top videos by view count."""
        all_videos = []
        next_page_token = None
        
        # Get channel ID
        channels_response = self.youtube.channels().list(
            part="contentDetails",
            mine=True
        ).execute()
        
        if not channels_response.get("items"):
            return []
        
        uploads_playlist_id = channels_response["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]
        
        while len(all_videos) < max_videos:
            playlist_response = self.youtube.playlistItems().list(
                playlistId=uploads_playlist_id,
                part="contentDetails",
                maxResults=50,
                pageToken=next_page_token
            ).execute()
            
            video_ids = [item["contentDetails"]["videoId"] for item in playlist_response.get("items", [])]
            
            if not video_ids:
                break
            
            # Get video details
            videos_response = self.youtube.videos().list(
                part="snippet,statistics",
                id=",".join(video_ids)
            ).execute()
            
            for item in videos_response.get("items", []):
                all_videos.append({
                    "video_id": item["id"],
                    "title": item["snippet"]["title"],
                    "view_count": int(item["statistics"].get("viewCount", 0)),
                    "like_count": int(item["statistics"].get("likeCount", 0)),
                    "comment_count": int(item["statistics"].get("commentCount", 0)),
                    "published_at": item["snippet"]["publishedAt"],
                })
            
            next_page_token = playlist_response.get("nextPageToken")
            if not next_page_token:
                break
        
        # Sort by views
        return sorted(all_videos, key=lambda x: x["view_count"], reverse=True)[:max_videos]
    
    async def analyze_top_videos_transcripts(self, max_videos: int = 20) -> Dict[str, Any]:
        """
        Analyze transcripts from top-performing videos to find what content works.
        """
        # Get top videos
        videos = await self._get_top_videos(max_videos * 2)
        
        if not videos:
            return {"error": "Could not fetch videos"}
        
        # Get transcripts for top videos
        analyzed_videos = []
        transcripts_fetched = 0
        errors = 0
        
        for video in videos[:max_videos]:
            print(f"Fetching transcript for: {video['title'][:50]}...")
            
            transcript = await self.get_transcript(video["video_id"])
            
            if transcript and transcript.get("status") == "success":
                analysis = await self.analyze_transcript_content(transcript, video)
                analyzed_videos.append(analysis)
                transcripts_fetched += 1
            else:
                errors += 1
            
            # Rate limit protection
            time.sleep(1)
        
        if not analyzed_videos:
            return {"error": "Could not fetch any transcripts", "errors": errors}
        
        # Aggregate insights
        insights = await self._aggregate_transcript_insights(analyzed_videos)
        
        return {
            "summary": {
                "videos_analyzed": len(analyzed_videos),
                "transcripts_fetched": transcripts_fetched,
                "errors": errors,
            },
            "insights": insights,
            "top_video_analyses": analyzed_videos[:10],
        }
    
    async def _aggregate_transcript_insights(self, analyzed_videos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Aggregate insights from all analyzed transcripts.
        """
        # Sort by views
        sorted_videos = sorted(analyzed_videos, key=lambda x: x.get("view_count", 0), reverse=True)
        
        # Top performers vs average
        top_20_percent = sorted_videos[:len(sorted_videos) // 5] if len(sorted_videos) >= 5 else sorted_videos
        bottom_20_percent = sorted_videos[-(len(sorted_videos) // 5):] if len(sorted_videos) >= 5 else []
        
        # 1. Celebrity mentions correlation
        top_celebrities = Counter()
        for video in top_20_percent:
            for celeb in video.get("celebrities_in_transcript", []):
                top_celebrities[celeb["name"]] += celeb["mentions"]
        
        bottom_celebrities = Counter()
        for video in bottom_20_percent:
            for celeb in video.get("celebrities_in_transcript", []):
                bottom_celebrities[celeb["name"]] += celeb["mentions"]
        
        # 2. Topic correlation
        top_topics = Counter()
        for video in top_20_percent:
            for topic, count in video.get("main_topics", {}).items():
                top_topics[topic] += count
        
        bottom_topics = Counter()
        for video in bottom_20_percent:
            for topic, count in video.get("main_topics", {}).items():
                bottom_topics[topic] += count
        
        # 3. Word count correlation
        avg_words_top = sum(v.get("word_count", 0) for v in top_20_percent) / len(top_20_percent) if top_20_percent else 0
        avg_words_bottom = sum(v.get("word_count", 0) for v in bottom_20_percent) / len(bottom_20_percent) if bottom_20_percent else 0
        
        # 4. Find unique patterns in top performers
        unique_to_top = set(top_celebrities.keys()) - set(bottom_celebrities.keys())
        
        return {
            "celebrity_content_impact": {
                "celebrities_in_top_videos": top_celebrities.most_common(15),
                "celebrities_in_bottom_videos": bottom_celebrities.most_common(15),
                "unique_to_top_performers": list(unique_to_top),
                "insight": "These celebrities DISCUSSED in content (not just titles) correlate with high views"
            },
            "topic_content_impact": {
                "topics_in_top_videos": dict(top_topics.most_common(10)),
                "topics_in_bottom_videos": dict(bottom_topics.most_common(10)),
                "insight": "These topics when DISCUSSED (not just mentioned in title) drive views"
            },
            "content_depth": {
                "avg_words_top_videos": round(avg_words_top),
                "avg_words_bottom_videos": round(avg_words_bottom),
                "insight": f"Top videos have {'more' if avg_words_top > avg_words_bottom else 'less'} content depth"
            },
        }
    
    async def find_content_patterns(self, max_videos: int = 50) -> Dict[str, Any]:
        """
        Compare transcripts of top vs bottom performing videos to find content patterns.
        """
        videos = await self._get_top_videos(max_videos * 2)
        
        if len(videos) < 10:
            return {"error": "Not enough videos for analysis"}
        
        # Top 10 vs Bottom 10
        top_videos = videos[:10]
        bottom_videos = videos[-10:]
        
        top_transcripts = []
        bottom_transcripts = []
        
        print("Analyzing TOP performing videos...")
        for video in top_videos:
            t = await self.get_transcript(video["video_id"])
            if t and t.get("status") == "success":
                analysis = await self.analyze_transcript_content(t, video)
                top_transcripts.append(analysis)
            time.sleep(1)
        
        print("Analyzing BOTTOM performing videos...")
        for video in bottom_videos:
            t = await self.get_transcript(video["video_id"])
            if t and t.get("status") == "success":
                analysis = await self.analyze_transcript_content(t, video)
                bottom_transcripts.append(analysis)
            time.sleep(1)
        
        if not top_transcripts or not bottom_transcripts:
            return {"error": "Could not fetch enough transcripts"}
        
        # Compare patterns
        comparison = {
            "top_videos": {
                "avg_views": round(sum(v["view_count"] for v in top_transcripts) / len(top_transcripts)),
                "common_celebrities": self._get_common_items([v.get("celebrities_in_transcript", []) for v in top_transcripts]),
                "common_topics": self._get_common_topics([v.get("main_topics", {}) for v in top_transcripts]),
                "avg_word_count": round(sum(v.get("word_count", 0) for v in top_transcripts) / len(top_transcripts)),
            },
            "bottom_videos": {
                "avg_views": round(sum(v["view_count"] for v in bottom_transcripts) / len(bottom_transcripts)),
                "common_celebrities": self._get_common_items([v.get("celebrities_in_transcript", []) for v in bottom_transcripts]),
                "common_topics": self._get_common_topics([v.get("main_topics", {}) for v in bottom_transcripts]),
                "avg_word_count": round(sum(v.get("word_count", 0) for v in bottom_transcripts) / len(bottom_transcripts)),
            },
        }
        
        # Generate insights
        insights = []
        
        # Celebrity comparison
        top_celebs = set(comparison["top_videos"]["common_celebrities"])
        bottom_celebs = set(comparison["bottom_videos"]["common_celebrities"])
        unique_to_top = top_celebs - bottom_celebs
        if unique_to_top:
            insights.append(f"🌟 These celebrities appear MORE in top videos: {', '.join(unique_to_top)}")
        
        # Topic comparison
        top_topics = set(comparison["top_videos"]["common_topics"])
        bottom_topics = set(comparison["bottom_videos"]["common_topics"])
        unique_top_topics = top_topics - bottom_topics
        if unique_top_topics:
            insights.append(f"🎯 Top videos discuss these topics more: {', '.join(unique_top_topics)}")
        
        # Word count
        if comparison["top_videos"]["avg_word_count"] > comparison["bottom_videos"]["avg_word_count"] * 1.2:
            insights.append(f"📝 Top videos have {comparison['top_videos']['avg_word_count']:,} words vs {comparison['bottom_videos']['avg_word_count']:,} - longer content wins!")
        
        return {
            "comparison": comparison,
            "insights": insights,
            "recommendation": "Focus on the celebrities and topics that appear in TOP videos but not in bottom videos"
        }
    
    def _get_common_items(self, celebrity_lists: List[List[Dict]]) -> List[str]:
        """Get most common celebrities across lists."""
        counter = Counter()
        for celebs in celebrity_lists:
            for celeb in celebs:
                counter[celeb.get("name", "")] += 1
        return [name for name, _ in counter.most_common(10)]
    
    def _get_common_topics(self, topic_dicts: List[Dict]) -> List[str]:
        """Get most common topics."""
        counter = Counter()
        for topics in topic_dicts:
            for topic in topics.keys():
                counter[topic] += 1
        return [topic for topic, _ in counter.most_common(5)]
