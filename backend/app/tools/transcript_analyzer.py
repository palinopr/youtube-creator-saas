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

    def __init__(self, youtube_service: Resource, channel_profile: Optional[Dict[str, Any]] = None):
        """
        Initialize the transcript analyzer.

        Args:
            youtube_service: Authenticated YouTube API service
            channel_profile: Optional channel profile dict from profile_channel().
                            Contains niche, language, common_tags, etc.
        """
        self.youtube = youtube_service
        self.channel_profile = channel_profile or {}
        settings = get_settings()
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0,  # Deterministic: same transcript = same suggestions
            api_key=settings.openai_api_key
        )

        # Get channel-specific context
        self.niche = self.channel_profile.get("niche", "general")
        self.language = self.channel_profile.get("language", "en")
        self.common_tags = self.channel_profile.get("common_tags", [])

        # Build keyword lists dynamically from channel profile
        # These are used for pattern detection in transcripts
        self.content_keywords = self._build_content_keywords()

        # Topic keywords - language-aware defaults with niche-specific additions
        self.topic_keywords = self._build_topic_keywords()

    def _build_content_keywords(self) -> List[str]:
        """Build content keywords from channel's common tags and niche."""
        keywords = []

        # Add common tags from channel profile
        keywords.extend(self.common_tags)

        # Add niche-specific common terms
        niche_terms = {
            "gaming": ["game", "gameplay", "stream", "live", "win", "lose", "match", "round", "level"],
            "music": ["song", "track", "beat", "album", "remix", "cover", "lyrics", "artist"],
            "podcast": ["episode", "interview", "guest", "talk", "discuss", "story", "experience"],
            "tech": ["review", "unbox", "specs", "features", "camera", "battery", "performance"],
            "education": ["learn", "tutorial", "explain", "how to", "step", "guide", "tips"],
            "cooking": ["recipe", "ingredient", "cook", "bake", "taste", "delicious", "chef"],
            "fitness": ["workout", "exercise", "reps", "sets", "muscle", "cardio", "stretch"],
            "vlog": ["day", "life", "routine", "travel", "experience", "adventure"],
            "entertainment": ["funny", "reaction", "challenge", "prank", "comedy", "moments"],
            "beauty": ["makeup", "skincare", "tutorial", "routine", "product", "review"],
        }

        if self.niche in niche_terms:
            keywords.extend(niche_terms[self.niche])

        return list(set(keywords))  # Remove duplicates

    def _build_topic_keywords(self) -> Dict[str, List[str]]:
        """Build topic keywords based on channel language and niche."""
        # Universal topic categories with multi-language support
        if self.language == "es":
            return {
                "drama": ["pelea", "problema", "conflicto", "drama", "beef", "responde", "ataca"],
                "money": ["dinero", "millones", "contrato", "rico", "plata", "fortuna"],
                "relationships": ["novia", "novio", "esposa", "casado", "amor", "relacion"],
                "career": ["carrera", "disco", "album", "cancion", "concierto", "gira", "tour"],
                "politics": ["politica", "gobierno", "eleccion", "partido", "presidente"],
                "crime": ["carcel", "demanda", "arresto", "federal", "caso", "juicio", "crimen"],
                "personal": ["familia", "hijo", "padre", "madre", "vida", "historia", "infancia"],
                "controversy": ["escandalo", "polemico", "controversia", "viral", "revela", "secreto"],
            }
        else:
            # English defaults
            return {
                "drama": ["fight", "problem", "conflict", "drama", "beef", "respond", "attack", "feud"],
                "money": ["money", "million", "contract", "rich", "fortune", "salary", "worth"],
                "relationships": ["girlfriend", "boyfriend", "wife", "husband", "married", "dating", "love"],
                "career": ["career", "album", "song", "concert", "tour", "project", "release"],
                "politics": ["politics", "government", "election", "party", "president", "vote"],
                "crime": ["jail", "lawsuit", "arrest", "federal", "case", "trial", "crime", "charged"],
                "personal": ["family", "son", "daughter", "father", "mother", "life", "story", "childhood"],
                "controversy": ["scandal", "controversial", "viral", "reveal", "secret", "truth", "expose"],
            }

    def _build_channel_context(self) -> str:
        """Build channel context string for AI prompts."""
        niche_descriptions = {
            "gaming": "This is a gaming channel focused on gameplay, streams, and gaming content.",
            "music": "This is a music channel featuring songs, artists, and music-related content.",
            "podcast": "This is a podcast channel with interviews, discussions, and conversations.",
            "tech": "This is a tech channel with reviews, unboxings, and technology content.",
            "education": "This is an educational channel with tutorials, guides, and learning content.",
            "cooking": "This is a cooking/food channel with recipes and culinary content.",
            "fitness": "This is a fitness channel with workouts, exercises, and health content.",
            "vlog": "This is a vlog channel with personal stories, daily life, and lifestyle content.",
            "entertainment": "This is an entertainment channel with comedy, reactions, and fun content.",
            "beauty": "This is a beauty/fashion channel with makeup, skincare, and style content.",
            "news": "This is a news/commentary channel covering current events and topics.",
            "sports": "This is a sports channel covering games, highlights, and athletic content.",
            "general": "This is a general content YouTube channel.",
        }

        niche_desc = niche_descriptions.get(self.niche, niche_descriptions["general"])

        # Build title patterns info
        title_patterns = self.channel_profile.get("title_patterns", [])
        patterns_str = ", ".join(title_patterns) if title_patterns else "varied styles"

        # Build common tags info
        tags_str = ", ".join(self.common_tags[:10]) if self.common_tags else "various topics"

        context = f"""CHANNEL CONTEXT:
{niche_desc}
- Content niche: {self.niche}
- Primary language: {self.language}
- Common title patterns: {patterns_str}
- Frequently used tags: {tags_str}
- Average title length: {self.channel_profile.get('avg_title_length', 50)} characters

When optimizing, match this channel's existing style and language."""

        return context

    async def get_transcript(self, video_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch transcript using the authenticated YouTube API (user's OAuth token).
        This works because the user owns the videos.
        """
        # Method 1: Use YouTube Captions API (authenticated - works for owned videos)
        try:
            print(f"[TRANSCRIPT] Trying YouTube Captions API for {video_id}")
            
            # List available captions for this video
            captions_response = self.youtube.captions().list(
                part="snippet",
                videoId=video_id
            ).execute()
            
            captions = captions_response.get("items", [])
            
            if captions:
                # Find best caption track (prefer Spanish, then English, then any)
                selected_caption = None
                for lang_pref in ['es', 'en']:
                    for caption in captions:
                        if caption['snippet']['language'] == lang_pref:
                            selected_caption = caption
                            break
                    if selected_caption:
                        break
                
                if not selected_caption:
                    selected_caption = captions[0]  # Use first available
                
                caption_id = selected_caption['id']
                language = selected_caption['snippet']['language']
                is_auto = selected_caption['snippet'].get('trackKind') == 'asr'
                
                print(f"[TRANSCRIPT] Found caption: {language} (auto={is_auto})")
                
                # Download the caption track
                caption_response = self.youtube.captions().download(
                    id=caption_id,
                    tfmt='srt'  # Get as SRT format
                ).execute()
                
                # Parse SRT
                srt_content = caption_response.decode('utf-8')
                segments = self._parse_srt_to_segments(srt_content)
                full_text = ' '.join(s["text"] for s in segments)
                
                if full_text:
                    return {
                        "video_id": video_id,
                        "status": "success",
                        "language": language,
                        "is_generated": is_auto,
                        "full_text": full_text,
                        "segments": segments,
                        "word_count": len(full_text.split()),
                        "source": "youtube_captions_api"
                    }
            else:
                print(f"[TRANSCRIPT] No captions available via API for {video_id}")
                
        except Exception as e:
            print(f"[TRANSCRIPT] YouTube Captions API error: {e}")
        
        # Method 2: Fallback to Innertube API (for non-owned videos)
        try:
            from curl_cffi import requests as curl_requests
        except ImportError:
            return {
                "video_id": video_id,
                "status": "no_transcript",
                "error": "No captions available for this video",
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
            
            # Extract transcript segments
            segments = self._extract_transcript_segments(data)
            
            if segments:
                full_text = ' '.join(s["text"] for s in segments)
                return {
                    "video_id": video_id,
                    "status": "success",
                    "language": "es",
                    "is_generated": True,
                    "full_text": full_text,
                    "segments": segments,
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
    
    def _parse_srt_to_segments(self, srt_content: str) -> List[Dict[str, Any]]:
        """Parse SRT subtitle format to segments with timestamps."""
        segments = []
        try:
            blocks = srt_content.strip().split('\n\n')
            
            for block in blocks:
                lines = block.strip().split('\n')
                if len(lines) < 3:
                    continue
                    
                # Parse timestamp: 00:00:01,000 --> 00:00:04,000
                time_line = lines[1]
                if '-->' not in time_line:
                    continue
                    
                start_str, end_str = time_line.split(' --> ')
                
                # Convert to seconds
                def time_to_seconds(t_str):
                    t_str = t_str.replace(',', '.')
                    h, m, s = t_str.split(':')
                    return int(h) * 3600 + int(m) * 60 + float(s)
                
                start = time_to_seconds(start_str)
                end = time_to_seconds(end_str)
                
                # Join text lines
                text = ' '.join(lines[2:])
                text = re.sub(r'\s+', ' ', text).strip()
                
                if text:
                    segments.append({
                        "text": text,
                        "start": start,
                        "end": end
                    })
            
            return segments
        except Exception as e:
            print(f"[TRANSCRIPT] SRT segment parse error: {e}")
            return []

    def _parse_srt_to_text(self, srt_content: str) -> Optional[str]:
        """Parse SRT subtitle format to plain text."""
        try:
            segments = self._parse_srt_to_segments(srt_content)
            full_text = ' '.join(s["text"] for s in segments)
            return full_text
        except Exception as e:
            print(f"[TRANSCRIPT] SRT parse error: {e}")
            return None
    
    def _extract_transcript_segments(self, data: Dict) -> List[Dict[str, Any]]:
        """Extract segments from YouTube transcript API response."""
        segments_out = []
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
                    for seg in segments:
                        renderer = seg.get('transcriptSegmentRenderer', {})
                        
                        # Get timing
                        start_ms = int(renderer.get('startMs', 0))
                        end_ms = int(renderer.get('endMs', start_ms))
                        
                        # Get text
                        snippet = renderer.get('snippet', {})
                        texts = []
                        for run in snippet.get('runs', []):
                            text = run.get('text', '').strip()
                            if text:
                                texts.append(text)
                        
                        text = ' '.join(texts)
                        text = re.sub(r'\s+', ' ', text).strip()
                        
                        if text:
                            segments_out.append({
                                "text": text,
                                "start": start_ms / 1000.0,
                                "end": end_ms / 1000.0
                            })
            
            return segments_out
        except Exception as e:
            print(f"[TRANSCRIPT] Segment extraction error: {e}")
            return []

    def _extract_transcript_text(self, data: Dict) -> Optional[str]:
        """Extract text from YouTube transcript API response."""
        try:
            segments = self._extract_transcript_segments(data)
            if segments:
                full_text = ' '.join(s["text"] for s in segments)
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
        Get transcript with cache support.
        
        1. Check cache first (FREE, instant)
        2. If not cached, use YouTube Captions API (costs quota)
        3. Cache result for future requests
        """
        print(f"[TRANSCRIPT] Starting get_transcript_with_fallback for {video_id}")
        
        # STEP 1: Check cache first (transcripts never change)
        try:
            from ..db.models import TranscriptCache, get_db_session
            with get_db_session() as session:
                cached = session.query(TranscriptCache).filter_by(video_id=video_id).first()
                if cached:
                    print(f"[TRANSCRIPT] ✓ Cache HIT for {video_id}")
                    return {
                        "video_id": video_id,
                        "status": "success",
                        "full_text": cached.transcript_text,
                        "segments": cached.transcript_segments or [],
                        "language": cached.language,
                        "source": "cache",
                    }
        except Exception as e:
            print(f"[TRANSCRIPT] Cache check error: {e}")
        
        # STEP 2: Fetch from YouTube API
        print(f"[TRANSCRIPT] Fetching from YouTube API for {video_id}")
        result = await self.get_transcript(video_id)
        
        if result and result.get("status") == "success" and result.get("full_text"):
            print(f"[TRANSCRIPT] ✓ YouTube API success for {video_id}")
            
            # STEP 3: Cache for future use
            try:
                from ..db.models import TranscriptCache, get_db_session
                with get_db_session() as session:
                    if not session.query(TranscriptCache).filter_by(video_id=video_id).first():
                        session.add(TranscriptCache(
                            video_id=video_id,
                            transcript_text=result.get("full_text", ""),
                            transcript_segments=result.get("segments", []),
                            language=result.get("language", "es"),
                            source="youtube_api",
                        ))
                        print(f"[TRANSCRIPT] ✓ Cached for future use")
            except Exception as e:
                print(f"[TRANSCRIPT] Cache save error: {e}")
            
            return result
        
        print(f"[TRANSCRIPT] ✗ No transcript available for {video_id}")
        return result
    
    async def analyze_transcript_content(self, transcript: Dict[str, Any], video_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze a single transcript to extract content insights.
        Now channel-aware: uses channel profile for relevant keyword detection.
        """
        if not transcript.get("full_text"):
            return {"error": "No transcript available", "video_id": transcript.get("video_id")}

        text = transcript["full_text"].lower()

        # 1. Find content keywords mentioned IN the transcript
        # Uses channel-specific keywords from profile (tags, niche terms)
        keywords_mentioned = []
        for keyword in self.content_keywords:
            count = text.count(keyword.lower())
            if count > 0:
                keywords_mentioned.append({"keyword": keyword, "mentions": count})

        keywords_mentioned = sorted(keywords_mentioned, key=lambda x: x["mentions"], reverse=True)

        # 2. Categorize topics discussed (language-aware)
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
            "keywords_in_transcript": keywords_mentioned[:15],
            "main_topics": topics_found,
            "opening_hook": opening_text,
            "is_auto_generated": transcript.get("is_generated", True),
            "channel_niche": self.niche,
            "channel_language": self.language,
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
        """Use GPT-4 to deeply analyze transcript content. Channel-aware prompts."""

        # Truncate if too long (keep first 10000 chars for context)
        truncated_text = text[:10000] if len(text) > 10000 else text

        # Build channel-aware context
        channel_context = self._build_channel_context()

        system_prompt = f"""You are an expert content analyst and SEO optimizer for a YouTube channel.

{channel_context}

Analyze this video transcript and provide:

1. CONTENT ANALYSIS:
- MAIN TOPICS: What are the main subjects discussed?
- KEY PEOPLE/ENTITIES: Who or what is mentioned and in what context?
- EMOTIONAL HOOKS: What parts would grab viewer attention?
- ENGAGEMENT LEVEL: Rate 1-10 how engaging the content is for the target audience
- ENGAGEMENT TRIGGERS: What makes viewers want to comment/share?
- CONTENT STRUCTURE: How is the content structured?
- KEY QUOTES: Most impactful or viral-worthy quotes
- IMPROVEMENT SUGGESTIONS: How could this content be better?

2. SEO OPTIMIZATION (based on what's ACTUALLY in the video):
- OPTIMIZED TITLES: 5 title options (70-90 chars, follow the channel's title patterns, create curiosity)
- OPTIMIZED DESCRIPTION: A compelling description (200-500 chars) that summarizes the content, includes timestamps for key moments, and has calls to action
- OPTIMIZED TAGS: 15-20 relevant tags based on the actual content discussed

Respond in JSON format:
{{
    "main_topics": ["topic1", "topic2"],
    "key_entities": [{{"name": "...", "context": "..."}}],
    "emotional_hooks": ["hook1", "hook2"],
    "engagement_score": 8,
    "engagement_triggers": ["trigger1", "trigger2"],
    "content_structure": "...",
    "key_quotes": ["quote1", "quote2"],
    "improvement_suggestions": ["suggestion1"],
    "overall_content_rating": "A/B/C/D",
    "why_it_worked_or_didnt": "...",
    "seo_optimization": {{
        "optimized_titles": [
            {{"title": "...", "why": "reason this title works"}},
            {{"title": "...", "why": "..."}}
        ],
        "optimized_description": "...",
        "optimized_tags": ["tag1", "tag2", "tag3"]
    }}
}}"""
        
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
        Channel-aware: uses keywords instead of hardcoded celebrity names.
        """
        # Sort by views
        sorted_videos = sorted(analyzed_videos, key=lambda x: x.get("view_count", 0), reverse=True)

        # Top performers vs average
        top_20_percent = sorted_videos[:len(sorted_videos) // 5] if len(sorted_videos) >= 5 else sorted_videos
        bottom_20_percent = sorted_videos[-(len(sorted_videos) // 5):] if len(sorted_videos) >= 5 else []

        # 1. Keyword mentions correlation (channel-specific keywords)
        top_keywords = Counter()
        for video in top_20_percent:
            for kw in video.get("keywords_in_transcript", []):
                top_keywords[kw["keyword"]] += kw["mentions"]

        bottom_keywords = Counter()
        for video in bottom_20_percent:
            for kw in video.get("keywords_in_transcript", []):
                bottom_keywords[kw["keyword"]] += kw["mentions"]

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
        unique_to_top = set(top_keywords.keys()) - set(bottom_keywords.keys())

        return {
            "keyword_content_impact": {
                "keywords_in_top_videos": top_keywords.most_common(15),
                "keywords_in_bottom_videos": bottom_keywords.most_common(15),
                "unique_to_top_performers": list(unique_to_top),
                "insight": "These keywords DISCUSSED in content (not just titles) correlate with high views"
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
            "channel_context": {
                "niche": self.niche,
                "language": self.language,
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
                "common_keywords": self._get_common_keywords([v.get("keywords_in_transcript", []) for v in top_transcripts]),
                "common_topics": self._get_common_topics([v.get("main_topics", {}) for v in top_transcripts]),
                "avg_word_count": round(sum(v.get("word_count", 0) for v in top_transcripts) / len(top_transcripts)),
            },
            "bottom_videos": {
                "avg_views": round(sum(v["view_count"] for v in bottom_transcripts) / len(bottom_transcripts)),
                "common_keywords": self._get_common_keywords([v.get("keywords_in_transcript", []) for v in bottom_transcripts]),
                "common_topics": self._get_common_topics([v.get("main_topics", {}) for v in bottom_transcripts]),
                "avg_word_count": round(sum(v.get("word_count", 0) for v in bottom_transcripts) / len(bottom_transcripts)),
            },
            "channel_context": {
                "niche": self.niche,
                "language": self.language,
            },
        }

        # Generate insights
        insights = []

        # Keywords comparison
        top_kws = set(comparison["top_videos"]["common_keywords"])
        bottom_kws = set(comparison["bottom_videos"]["common_keywords"])
        unique_to_top = top_kws - bottom_kws
        if unique_to_top:
            insights.append(f"🌟 These keywords appear MORE in top videos: {', '.join(unique_to_top)}")
        
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
    
    def _get_common_keywords(self, keyword_lists: List[List[Dict]]) -> List[str]:
        """Get most common keywords across lists."""
        counter = Counter()
        for keywords in keyword_lists:
            for kw in keywords:
                counter[kw.get("keyword", "")] += 1
        return [name for name, _ in counter.most_common(10)]
    
    def _get_common_topics(self, topic_dicts: List[Dict]) -> List[str]:
        """Get most common topics."""
        counter = Counter()
        for topics in topic_dicts:
            for topic in topics.keys():
                counter[topic] += 1
        return [topic for topic, _ in counter.most_common(5)]


# ============================================================
# Standalone helper function for getting transcripts
# ============================================================

def get_transcript_with_timestamps(video_id: str) -> Dict[str, Any]:
    """
    Standalone function to get transcript with word-level timestamps.
    Uses youtube_transcript_api which doesn't require OAuth.

    Returns:
        Dict with keys:
        - transcript: Full transcript text
        - word_timestamps: List of {text, start, duration} segments
        - error: Error message if failed
    """
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        from youtube_transcript_api._errors import (
            TranscriptsDisabled,
            NoTranscriptFound,
            VideoUnavailable
        )
    except ImportError:
        return {"error": "youtube_transcript_api not installed"}

    try:
        # Try to get transcript (prefer Spanish, then English, then any)
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

        # Try to find preferred language
        transcript = None
        for lang in ['es', 'en']:
            try:
                transcript = transcript_list.find_transcript([lang])
                break
            except:
                continue

        if not transcript:
            # Get any available transcript
            try:
                transcript = transcript_list.find_generated_transcript(['es', 'en'])
            except:
                # Get first available
                for t in transcript_list:
                    transcript = t
                    break

        if not transcript:
            return {"error": "No transcript available for this video"}

        # Fetch the actual transcript data
        transcript_data = transcript.fetch()

        # Build full text and word timestamps
        full_text = " ".join([segment["text"] for segment in transcript_data])
        word_timestamps = [
            {
                "text": segment["text"],
                "start": segment["start"],
                "duration": segment.get("duration", 0)
            }
            for segment in transcript_data
        ]

        return {
            "transcript": full_text,
            "word_timestamps": word_timestamps,
            "language": transcript.language_code,
            "is_generated": transcript.is_generated,
        }

    except TranscriptsDisabled:
        return {"error": "Transcripts are disabled for this video"}
    except NoTranscriptFound:
        return {"error": "No transcript found for this video"}
    except VideoUnavailable:
        return {"error": "Video is unavailable"}
    except Exception as e:
        return {"error": f"Failed to fetch transcript: {str(e)}"}
