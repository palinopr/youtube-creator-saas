"""
Clips Generator - AI-powered viral short clips using Franken-bite method.
Identifies hooks + solutions in transcripts and renders MP4s with Hormozi-style captions.

DYNAMIC EDITING FEATURES:
- Audio crossfades (100ms) to eliminate pops/clicks at cut points
- Zoom Jump technique (100% -> 115% -> 100%) to hide Franken-bite jump cuts
- Safe-zone captioning to avoid TikTok/Shorts UI overlap
"""

import os
import re
import json
import uuid
import tempfile
import subprocess
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from openai import OpenAI

from ..config import get_settings


class ZoomLevel(Enum):
    """Zoom levels for dynamic jump cut technique."""
    STANDARD = 1.0      # 100% - Hook and odd segments
    ZOOMED = 1.15       # 115% - Body segments (hides jump cuts)
    CLOSE = 1.25        # 125% - For dramatic emphasis (optional)


@dataclass
class ClipSegment:
    """Represents a segment of video to include in a clip."""
    start_time: float  # seconds
    end_time: float    # seconds
    text: str
    segment_type: str  # 'hook', 'body', 'loop_ending'
    zoom_level: float = field(default=1.0)  # Dynamic zoom for jump cut hiding


@dataclass
class ClipSuggestion:
    """A complete clip suggestion with all segments."""
    clip_id: str
    title: str
    hook: ClipSegment
    body_segments: List[ClipSegment]
    loop_ending: Optional[ClipSegment]
    total_duration: float
    viral_score: int  # 0-100
    why_viral: str


@dataclass
class WordTimestamp:
    """Word with its timing information."""
    word: str
    start: float
    end: float


class FrankenBiteDetector:
    """
    Uses GPT-4o to identify Franken-bite pairs in transcripts.
    Finds hooks, compresses body content, and creates loop endings.
    """
    
    def __init__(self):
        settings = get_settings()
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.3,  # Slight creativity for viral hooks
            api_key=settings.openai_api_key
        )
        self.openai_client = OpenAI(api_key=settings.openai_api_key)
    
    async def detect_clips(
        self, 
        transcript_text: str, 
        video_title: str,
        word_timestamps: Optional[List[Dict]] = None,
        max_clips: int = 5
    ) -> List[ClipSuggestion]:
        """
        Analyze transcript to find viral clip opportunities.
        
        Args:
            transcript_text: Full transcript text
            video_title: Original video title for context
            word_timestamps: Optional list of {word, start, end} for precise cutting
            max_clips: Maximum number of clips to suggest
            
        Returns:
            List of ClipSuggestion objects
        """
        
        system_prompt = """You are an expert viral content editor specializing in creating YouTube Shorts.
Your task is to find "Franken-bite" opportunities - taking a HOOK from one part of the video and combining it with the SOLUTION/PUNCHLINE from another part.

VIRAL SHORT FORMULA:
1. HOOK (0-3 seconds): An attention-grabbing statement that opens a "loop" in the viewer's mind
   - Questions ("Did you know...?", "What if I told you...?")
   - Controversial statements ("Everyone is wrong about...")
   - Emotional peaks (high energy, surprise, anger)
   - Pattern interrupts

2. BODY (3-45 seconds): The compressed core content
   - Remove ALL filler words (um, uh, you know, like, basically)
   - Remove rambling/tangents
   - Keep only essential information
   - Each sentence should advance the story

3. LOOP ENDING (last 2-5 seconds): A statement that flows back to make viewers rewatch
   - Cliffhanger that connects to the hook
   - "...and that's why..." type statements
   - Surprising conclusion that recontextualizes the hook

CONSTRAINTS:
- Total duration: 25-35 seconds (SWEET SPOT for retention)
- NEVER exceed 59 seconds
- The clip must make sense as a standalone piece
- Prefer controversial, emotional, or surprising content

OUTPUT FORMAT (JSON):
{
    "clips": [
        {
            "title": "Suggested title for the short (50-60 chars, include emoji)",
            "hook": {
                "text": "Exact quote from transcript",
                "approximate_position": "beginning/middle/end of video",
                "search_phrase": "unique 5-10 word phrase to locate this in transcript"
            },
            "body_segments": [
                {
                    "text": "Compressed/edited text (remove filler)",
                    "original_text": "Original quote from transcript",
                    "approximate_position": "where in video",
                    "search_phrase": "unique phrase to locate"
                }
            ],
            "loop_ending": {
                "text": "Exact quote or null if body ends naturally",
                "search_phrase": "unique phrase to locate"
            },
            "estimated_duration_seconds": 30,
            "viral_score": 85,
            "why_viral": "Brief explanation of why this will perform well"
        }
    ]
}

IMPORTANT: The "search_phrase" must be EXACT quotes from the transcript that can be used to find timestamps."""

        human_msg = f"""VIDEO TITLE: {video_title}

FULL TRANSCRIPT:
{transcript_text[:15000]}  # Truncate to avoid token limits

Find up to {max_clips} viral short clip opportunities using the Franken-bite method.
Focus on the most controversial, emotional, or surprising moments."""

        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=human_msg)
            ])
            
            # Parse JSON response
            content = response.content
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            data = json.loads(content)
            clips = data.get("clips", [])
            
            # Convert to ClipSuggestion objects
            suggestions = []
            for i, clip in enumerate(clips):
                clip_id = str(uuid.uuid4())[:8]
                
                # Create hook segment
                hook = ClipSegment(
                    start_time=0,  # Will be calculated from search_phrase
                    end_time=3,
                    text=clip["hook"]["text"],
                    segment_type="hook"
                )
                
                # Create body segments
                body_segments = []
                for seg in clip.get("body_segments", []):
                    body_segments.append(ClipSegment(
                        start_time=0,
                        end_time=0,
                        text=seg.get("text", seg.get("original_text", "")),
                        segment_type="body"
                    ))
                
                # Create loop ending if present
                loop_ending = None
                if clip.get("loop_ending") and clip["loop_ending"].get("text"):
                    loop_ending = ClipSegment(
                        start_time=0,
                        end_time=0,
                        text=clip["loop_ending"]["text"],
                        segment_type="loop_ending"
                    )
                
                suggestion = ClipSuggestion(
                    clip_id=clip_id,
                    title=clip.get("title", f"Clip {i+1}"),
                    hook=hook,
                    body_segments=body_segments,
                    loop_ending=loop_ending,
                    total_duration=clip.get("estimated_duration_seconds", 30),
                    viral_score=clip.get("viral_score", 70),
                    why_viral=clip.get("why_viral", "")
                )
                suggestions.append(suggestion)
            
            return suggestions
            
        except Exception as e:
            print(f"[CLIPS] Error detecting clips: {e}")
            return []
    
    def find_timestamp_for_phrase(
        self, 
        phrase: str, 
        word_timestamps: List[Dict]
    ) -> Tuple[float, float]:
        """
        Find the start and end timestamps for a phrase in the word timestamps.
        
        Args:
            phrase: Text to search for
            word_timestamps: List of {word, start, end} dicts
            
        Returns:
            Tuple of (start_time, end_time) in seconds
        """
        if not word_timestamps:
            return (0.0, 3.0)
        
        # Normalize phrase
        phrase_words = phrase.lower().split()
        
        # Sliding window search
        for i in range(len(word_timestamps) - len(phrase_words) + 1):
            window = word_timestamps[i:i + len(phrase_words)]
            window_words = [w.get("word", "").lower().strip(".,!?") for w in window]
            
            # Check if window matches phrase
            if self._fuzzy_match(window_words, phrase_words):
                start = window[0].get("start", 0)
                end = window[-1].get("end", start + 3)
                return (start, end)
        
        # Fallback: search for partial match
        for i, wt in enumerate(word_timestamps):
            if phrase_words[0] in wt.get("word", "").lower():
                start = wt.get("start", 0)
                end_idx = min(i + len(phrase_words), len(word_timestamps) - 1)
                end = word_timestamps[end_idx].get("end", start + 3)
                return (start, end)
        
        return (0.0, 3.0)
    
    def _fuzzy_match(self, words1: List[str], words2: List[str]) -> bool:
        """Check if two word lists roughly match."""
        if len(words1) != len(words2):
            return False
        matches = sum(1 for w1, w2 in zip(words1, words2) if w1 == w2 or w1 in w2 or w2 in w1)
        return matches >= len(words1) * 0.7


class ClipRenderer:
    """
    Renders video clips using FFmpeg with Hormozi-style animated captions.
    """
    
    def __init__(self):
        settings = get_settings()
        self.openai_client = OpenAI(api_key=settings.openai_api_key)
        self.temp_dir = tempfile.gettempdir()
        self.renders_dir = os.path.join(self.temp_dir, "clip_renders")
        os.makedirs(self.renders_dir, exist_ok=True)
    
    async def download_video(self, video_id: str) -> Optional[str]:
        """
        Download video from YouTube using yt-dlp.
        
        Args:
            video_id: YouTube video ID
            
        Returns:
            Path to downloaded video file or None on error
        """
        import yt_dlp
        import glob
        
        output_template = os.path.join(self.temp_dir, f"source_{video_id}")
        output_path = f"{output_template}.mp4"
        
        # Skip if already downloaded
        if os.path.exists(output_path):
            print(f"[CLIPS] Video already exists: {output_path}")
            return output_path
        
        # Check for any existing VIDEO file with this video_id (skip audio-only)
        existing = glob.glob(f"{output_template}.*")
        video_extensions = ['.mp4', '.mkv', '.webm', '.avi', '.mov']
        for f in existing:
            ext = os.path.splitext(f)[1].lower()
            if ext in video_extensions and os.path.getsize(f) > 0:
                print(f"[CLIPS] Found existing video file: {f}")
                return f
        # Clean up any audio-only or partial files
        for f in existing:
            ext = os.path.splitext(f)[1].lower()
            if ext in ['.m4a', '.mp3', '.aac', '.wav', '.webm'] or f.endswith('.part'):
                print(f"[CLIPS] Removing incomplete/audio-only file: {f}")
                try:
                    os.remove(f)
                except:
                    pass
        
        url = f"https://www.youtube.com/watch?v={video_id}"
        
        # Try multiple download strategies to work around YouTube's SABR streaming
        download_strategies = [
            # Strategy 1: Use mweb client (mobile web) which often has direct URLs
            {
                'format': 'bv*[height<=1080]+ba/b[height<=1080]/bv*+ba/b',
                'extractor_args': {'youtube': {'player_client': ['mweb', 'web']}},
            },
            # Strategy 2: Use android client (often bypasses SABR)
            {
                'format': 'bv*[height<=1080]+ba/b[height<=1080]/bv*+ba/b',
                'extractor_args': {'youtube': {'player_client': ['android', 'ios']}},
            },
            # Strategy 3: Use tv_embedded client (fallback)
            {
                'format': 'bv*+ba/b',
                'extractor_args': {'youtube': {'player_client': ['tv_embedded', 'tv']}},
            },
            # Strategy 4: Skip JS challenges entirely (may get lower quality)
            {
                'format': 'bv*[height<=720]+ba/b[height<=720]/bv*+ba/b',
                'extractor_args': {'youtube': {'player_skip': ['js'], 'player_client': ['mweb']}},
            },
        ]
        
        for i, strategy in enumerate(download_strategies):
            print(f"[CLIPS] Trying download strategy {i+1}/{len(download_strategies)}...")
            
            ydl_opts = {
                'format': strategy['format'],
                'outtmpl': f"{output_template}.%(ext)s",
                'merge_output_format': 'mp4',
                'quiet': False,
                'no_warnings': False,
                'extractor_args': strategy.get('extractor_args', {}),
                # Postprocessors to ensure we get mp4
                'postprocessors': [{
                    'key': 'FFmpegVideoConvertor',
                    'preferedformat': 'mp4',
                }],
            }
            
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=True)
                    if info:
                        downloaded_file = ydl.prepare_filename(info)
                        # Fix extension if converted
                        if downloaded_file and not downloaded_file.endswith('.mp4'):
                            mp4_path = os.path.splitext(downloaded_file)[0] + '.mp4'
                            if os.path.exists(mp4_path):
                                downloaded_file = mp4_path
                        
                        print(f"[CLIPS] yt-dlp says file is: {downloaded_file}")
                        if downloaded_file and os.path.exists(downloaded_file):
                            # Verify it's a valid video file (not just audio)
                            size = os.path.getsize(downloaded_file)
                            if size > 100000:  # More than 100KB = likely has video
                                print(f"[CLIPS] Successfully downloaded video ({size} bytes)")
                                return downloaded_file
                
                # Check for downloaded files
                possible_files = glob.glob(f"{output_template}.*")
                for f in possible_files:
                    ext = os.path.splitext(f)[1].lower()
                    if ext in video_extensions and os.path.exists(f):
                        size = os.path.getsize(f)
                        if size > 100000:
                            print(f"[CLIPS] Found video file: {f} ({size} bytes)")
                            return f
                            
            except Exception as e:
                print(f"[CLIPS] Strategy {i+1} failed: {e}")
                # Clean up any partial downloads
                for f in glob.glob(f"{output_template}.*"):
                    if f.endswith('.part') or os.path.getsize(f) < 100000:
                        try:
                            os.remove(f)
                        except:
                            pass
                continue
        
        # Final fallback: look for any video file that may have been downloaded
        possible_files = glob.glob(f"{output_template}.*")
        print(f"[CLIPS] Final check for files: {possible_files}")
        
        for f in possible_files:
            ext = os.path.splitext(f)[1].lower()
            if ext in video_extensions and os.path.exists(f) and os.path.getsize(f) > 100000:
                print(f"[CLIPS] Using video file: {f}")
                return f
        
        print(f"[CLIPS] All download strategies failed for video {video_id}")
        return None
    
    async def get_word_timestamps(
        self, 
        video_path: str, 
        start_time: float = 0, 
        duration: float = 60
    ) -> List[Dict]:
        """
        Extract word-level timestamps using Whisper.
        
        Args:
            video_path: Path to video file
            start_time: Start time in seconds
            duration: Duration to transcribe in seconds
            
        Returns:
            List of {word, start, end} dicts
        """
        # Extract audio segment
        audio_path = os.path.join(self.temp_dir, f"audio_{uuid.uuid4()}.mp3")
        
        try:
            subprocess.run([
                'ffmpeg', '-i', video_path,
                '-ss', str(start_time),
                '-t', str(duration),
                '-vn', '-acodec', 'libmp3lame', '-q:a', '4',
                audio_path, '-y'
            ], capture_output=True, check=True)
            
            # Transcribe with Whisper (word-level timestamps)
            with open(audio_path, "rb") as audio_file:
                response = self.openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="es",
                    response_format="verbose_json",
                    timestamp_granularities=["word"]
                )
            
            # Extract word timestamps
            words = []
            if hasattr(response, 'words') and response.words:
                for w in response.words:
                    words.append({
                        "word": w.word,
                        "start": w.start + start_time,  # Adjust for segment offset
                        "end": w.end + start_time
                    })
            
            return words
            
        except Exception as e:
            print(f"[CLIPS] Whisper error: {e}")
            return []
        finally:
            if os.path.exists(audio_path):
                os.remove(audio_path)
    
    def generate_ass_subtitles(
        self, 
        words: List[Dict], 
        output_path: str,
        style: str = "hormozi"
    ) -> str:
        """
        Generate ASS subtitle file with Hormozi-style animated captions.
        
        SAFE-ZONE CAPTIONING:
        - MarginV: 350px (clears TikTok/Shorts description area at bottom)
        - MarginL/MarginR: 100px (clears like/share buttons on sides)
        
        Args:
            words: List of {word, start, end} dicts
            output_path: Path to save .ass file
            style: Caption style ('hormozi', 'simple')
            
        Returns:
            Path to generated .ass file
        """
        # ASS header with Hormozi-style formatting
        # SAFE-ZONE MARGINS:
        # - MarginV=350: Clears TikTok description, comments, music info at bottom
        # - MarginL=100, MarginR=100: Clears like/share/comment buttons on right
        # - Alignment=2 (bottom center) ensures text stays in safe viewing area
        ass_content = """[Script Info]
Title: Viral Clip Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Impact,120,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,8,0,2,100,100,350,1
Style: Highlight,Impact,130,&H0000FFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,10,0,2,100,100,350,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        
        # Group words into 1-2 word chunks for Hormozi style
        chunks = []
        current_chunk = []
        
        for word in words:
            current_chunk.append(word)
            if len(current_chunk) >= 2 or word["word"].endswith((".", "!", "?", ",")):
                chunks.append(current_chunk)
                current_chunk = []
        
        if current_chunk:
            chunks.append(current_chunk)
        
        # Generate dialogue lines
        for i, chunk in enumerate(chunks):
            if not chunk:
                continue
                
            start_time = chunk[0]["start"]
            end_time = chunk[-1]["end"]
            text = " ".join(w["word"] for w in chunk).strip()
            
            # Format time as H:MM:SS.CC
            start_str = self._seconds_to_ass_time(start_time)
            end_str = self._seconds_to_ass_time(end_time)
            
            # Alternate between Main and Highlight style for emphasis
            style_name = "Highlight" if i % 3 == 0 else "Main"
            
            # Add dialogue line
            ass_content += f"Dialogue: 0,{start_str},{end_str},{style_name},,0,0,0,,{text}\n"
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(ass_content)
        
        return output_path
    
    def _seconds_to_ass_time(self, seconds: float) -> str:
        """Convert seconds to ASS time format (H:MM:SS.CC)."""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = seconds % 60
        centisecs = int((secs % 1) * 100)
        secs = int(secs)
        return f"{hours}:{minutes:02d}:{secs:02d}.{centisecs:02d}"
    
    def _get_zoom_level_for_segment(self, segment_index: int, total_segments: int) -> float:
        """
        Get the zoom level for a segment using the Zoom Jump technique.
        
        Pattern: STANDARD -> ZOOMED -> STANDARD -> ZOOMED...
        - Segment 0 (Hook): 100% (standard)
        - Segment 1 (Body): 115% (zoomed) - hides the jump cut from hook
        - Segment 2: 100% (standard)
        - Segment 3: 115% (zoomed)
        - etc.
        
        This alternating zoom creates visual variety and hides the jarring
        jump cuts that occur when Franken-biting clips together.
        """
        if segment_index == 0:
            # Hook is always standard zoom
            return ZoomLevel.STANDARD.value
        elif segment_index % 2 == 1:
            # Odd segments (1, 3, 5...) get zoom
            return ZoomLevel.ZOOMED.value
        else:
            # Even segments (2, 4, 6...) return to standard
            return ZoomLevel.STANDARD.value
    
    def _build_zoom_crop_filter(self, zoom: float, input_width: int = 1920, input_height: int = 1080) -> str:
        """
        Build FFmpeg filter for zoom effect with center crop.
        
        The zoom is achieved by:
        1. Scaling up the video by the zoom factor
        2. Cropping back to 9:16 from the center
        
        This creates a "push in" effect that hides jump cuts.
        """
        # For 9:16 output, we need to crop based on height
        # Target: 1080x1920 (width x height for vertical video)
        
        # Calculate zoomed dimensions
        if zoom == 1.0:
            # Standard: just crop to 9:16 and scale
            return "crop=ih*9/16:ih,scale=1080:1920"
        else:
            # Zoomed: scale up first, then crop to 9:16, then scale to output
            # The extra scale creates the zoom effect
            scale_factor = zoom
            return f"scale=iw*{scale_factor}:ih*{scale_factor},crop=ih*9/16:ih,scale=1080:1920"
    
    def _build_audio_crossfade_filter(self, num_segments: int, crossfade_duration: float = 0.1) -> str:
        """
        Build FFmpeg audio filter for crossfading between segments.
        
        Uses acrossfade to create smooth 100ms transitions between audio segments,
        eliminating the "pop" or "click" sound that occurs at hard cuts.
        
        Args:
            num_segments: Number of audio segments to join
            crossfade_duration: Duration of crossfade in seconds (default 0.1 = 100ms)
        
        Returns:
            FFmpeg filter_complex string for audio
        """
        if num_segments <= 1:
            return "[0:a]aformat=sample_rates=48000:channel_layouts=stereo[aout]"
        
        # Build chain of acrossfade filters
        # [0:a][1:a]acrossfade=d=0.1[a01]; [a01][2:a]acrossfade=d=0.1[a012]; ...
        filter_parts = []
        
        for i in range(num_segments - 1):
            if i == 0:
                # First crossfade: [0:a][1:a]
                input_a = "[0:a]"
                input_b = "[1:a]"
            else:
                # Subsequent: use previous output
                input_a = f"[a{i-1}]"
                input_b = f"[{i+1}:a]"
            
            if i == num_segments - 2:
                # Last output
                output = "[aout]"
            else:
                output = f"[a{i}]"
            
            filter_parts.append(
                f"{input_a}{input_b}acrossfade=d={crossfade_duration}:c1=tri:c2=tri{output}"
            )
        
        return ";".join(filter_parts)
    
    async def render_clip(
        self,
        video_id: str,
        clip_id: str,
        segments: List[Tuple[float, float]],  # List of (start, end) tuples
        output_filename: Optional[str] = None
    ) -> Optional[str]:
        """
        Render a clip from video segments with VIRAL POLISH editing.
        
        DYNAMIC EDITING FEATURES:
        1. Audio Crossfades: 100ms acrossfade between segments eliminates pops/clicks
        2. Zoom Jump Technique: Alternates 100%/115% zoom to hide Franken-bite cuts
        3. Safe-Zone Captions: Margins avoid TikTok/Shorts UI elements
        
        Args:
            video_id: YouTube video ID
            clip_id: Unique clip identifier
            segments: List of (start_time, end_time) tuples to include
            output_filename: Optional custom output filename
            
        Returns:
            Path to rendered MP4 file or None on error
        """
        print(f"[CLIPS] render_clip called: video_id={video_id}, clip_id={clip_id}, segments={segments}")
        
        # Download source video
        source_video = await self.download_video(video_id)
        if not source_video:
            print(f"[CLIPS] Failed to download video {video_id}")
            return None
        
        print(f"[CLIPS] Video downloaded to: {source_video}")
        
        output_path = os.path.join(
            self.renders_dir, 
            output_filename or f"clip_{clip_id}.mp4"
        )
        
        print(f"[CLIPS] Output path: {output_path}")
        
        try:
            # For simple single-segment clips
            if len(segments) == 1:
                return await self._render_single_segment(
                    source_video, clip_id, segments[0], output_path
                )
            else:
                # Multiple segments - use DYNAMIC EDITING with crossfades and zoom jumps
                return await self._render_multi_segment_viral(
                    source_video, clip_id, segments, output_path
                )
                
        except Exception as e:
            print(f"[CLIPS] Render error: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def _render_single_segment(
        self,
        source_video: str,
        clip_id: str,
        segment: Tuple[float, float],
        output_path: str
    ) -> Optional[str]:
        """Render a single segment clip with captions."""
        start, end = segment
        duration = end - start
        print(f"[CLIPS] Single segment: start={start}, end={end}, duration={duration}")
        
        # Get word timestamps for captions
        print(f"[CLIPS] Getting word timestamps...")
        words = await self.get_word_timestamps(source_video, start, duration)
        print(f"[CLIPS] Got {len(words)} words")
        
        # Generate ASS subtitles with safe-zone margins
        ass_path = os.path.join(self.temp_dir, f"subs_{clip_id}.ass")
        
        # Adjust word timestamps to start from 0
        adjusted_words = [
            {"word": w["word"], "start": w["start"] - start, "end": w["end"] - start}
            for w in words
        ]
        self.generate_ass_subtitles(adjusted_words, ass_path)
        
        # Build filter: crop to 9:16, scale to 1080x1920, burn subtitles
        filter_complex = (
            "crop=ih*9/16:ih,"
            "scale=1080:1920,"
            f"ass='{ass_path}'"
        )
        
        cmd = [
            'ffmpeg',
            '-ss', str(start),
            '-i', source_video,
            '-t', str(duration),
            '-vf', filter_complex,
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-ar', '48000',  # Standardize audio sample rate
            '-movflags', '+faststart',
            '-y',
            output_path
        ]
        
        print(f"[CLIPS] Running FFmpeg: {' '.join(cmd[:5])}...")
        result = subprocess.run(cmd, capture_output=True, text=True)
        print(f"[CLIPS] FFmpeg returned code: {result.returncode}")
        
        if result.returncode != 0:
            print(f"[CLIPS] FFmpeg error: {result.stderr[:500]}")
            # Try without subtitles as fallback
            cmd_fallback = [
                'ffmpeg',
                '-ss', str(start),
                '-i', source_video,
                '-t', str(duration),
                '-vf', 'crop=ih*9/16:ih,scale=1080:1920',
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '23',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-ar', '48000',
                '-movflags', '+faststart',
                '-y',
                output_path
            ]
            subprocess.run(cmd_fallback, capture_output=True)
        
        # Cleanup
        if os.path.exists(ass_path):
            os.remove(ass_path)
        
        return output_path if os.path.exists(output_path) else None
    
    async def _render_multi_segment_viral(
        self,
        source_video: str,
        clip_id: str,
        segments: List[Tuple[float, float]],
        output_path: str
    ) -> Optional[str]:
        """
        Render multiple segments with VIRAL POLISH dynamic editing.
        
        This is the upgraded Franken-bite rendering that implements:
        1. Audio crossfades (100ms) to eliminate pops at cut points
        2. Zoom Jump technique to hide visual jump cuts
        3. All segments merged in a single FFmpeg call for quality
        """
        print(f"[CLIPS] Multi-segment VIRAL render: {len(segments)} segments")
        
        num_segments = len(segments)
        segment_files = []
        ass_files = []
        all_words = []
        cumulative_duration = 0.0
        crossfade_duration = 0.1  # 100ms audio crossfade
        
        # PHASE 1: Render each segment with its zoom level and captions
        for i, (start, end) in enumerate(segments):
            seg_path = os.path.join(self.temp_dir, f"seg_{clip_id}_{i}.mp4")
            duration = end - start
            
            # Get zoom level for this segment (Zoom Jump technique)
            zoom = self._get_zoom_level_for_segment(i, num_segments)
            zoom_label = "STANDARD" if zoom == 1.0 else f"ZOOMED {int(zoom*100)}%"
            print(f"[CLIPS] Segment {i}: {start:.1f}s-{end:.1f}s, zoom={zoom_label}")
            
            # Get word timestamps
            words = await self.get_word_timestamps(source_video, start, duration)
            
            # Adjust word timestamps for this segment's position in final clip
            # Account for crossfade overlap (each crossfade shortens total by crossfade_duration)
            crossfade_offset = i * crossfade_duration if i > 0 else 0
            segment_start_in_output = cumulative_duration - crossfade_offset
            
            adjusted_words = [
                {
                    "word": w["word"], 
                    "start": (w["start"] - start) + segment_start_in_output, 
                    "end": (w["end"] - start) + segment_start_in_output
                }
                for w in words
            ]
            all_words.extend(adjusted_words)
            cumulative_duration += duration
            
            # Build video filter with zoom
            video_filter = self._build_zoom_crop_filter(zoom)
            
            # Render segment (without captions - we'll add unified captions at the end)
            cmd = [
                'ffmpeg',
                '-ss', str(start),
                '-i', source_video,
                '-t', str(duration),
                '-vf', video_filter,
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '23',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-ar', '48000',  # Standardize sample rate for crossfade compatibility
                '-ac', '2',      # Stereo
                '-y',
                seg_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                print(f"[CLIPS] Segment {i} render failed: {result.stderr[:200]}")
                # Fallback without zoom
                cmd_fallback = [
                    'ffmpeg',
                    '-ss', str(start),
                    '-i', source_video,
                    '-t', str(duration),
                    '-vf', 'crop=ih*9/16:ih,scale=1080:1920',
                    '-c:v', 'libx264',
                    '-preset', 'fast',
                    '-crf', '23',
                    '-c:a', 'aac',
                    '-b:a', '128k',
                    '-ar', '48000',
                    '-ac', '2',
                    '-y',
                    seg_path
                ]
                subprocess.run(cmd_fallback, capture_output=True)
            
            if os.path.exists(seg_path):
                segment_files.append(seg_path)
            else:
                print(f"[CLIPS] Warning: Segment {i} file not created")
        
        if not segment_files:
            print("[CLIPS] No segments rendered successfully")
            return None
        
        # PHASE 2: Merge segments with AUDIO CROSSFADES
        # This eliminates the "pop" sound at Franken-bite cut points
        
        merged_no_subs = os.path.join(self.temp_dir, f"merged_{clip_id}.mp4")
        
        if len(segment_files) == 1:
            # Only one segment, just rename
            os.rename(segment_files[0], merged_no_subs)
        else:
            # Build FFmpeg command with audio crossfades
            # We need to use filter_complex for proper crossfading
            
            # Input files
            inputs = []
            for seg in segment_files:
                inputs.extend(['-i', seg])
            
            # Build complex filter for video concat and audio crossfade
            video_filter_parts = []
            audio_filter_parts = []
            
            # Video: simple concat (zoom already applied per-segment)
            video_inputs = "".join(f"[{i}:v]" for i in range(len(segment_files)))
            video_filter_parts.append(
                f"{video_inputs}concat=n={len(segment_files)}:v=1:a=0[vout]"
            )
            
            # Audio: chain of acrossfade filters for smooth transitions
            # This is the KEY fix for audio pops!
            if len(segment_files) == 2:
                # Simple case: just one crossfade
                audio_filter_parts.append(
                    f"[0:a][1:a]acrossfade=d={crossfade_duration}:c1=tri:c2=tri[aout]"
                )
            else:
                # Multiple crossfades chained together
                for i in range(len(segment_files) - 1):
                    if i == 0:
                        in_a = "[0:a]"
                        in_b = "[1:a]"
                        out_label = "[a01]"
                    else:
                        in_a = f"[a{str(i-1).zfill(2)}]" if i == 1 else f"[a{i-1:02d}]"
                        in_b = f"[{i+1}:a]"
                        out_label = f"[a{i:02d}]"
                    
                    # Last crossfade outputs to [aout]
                    if i == len(segment_files) - 2:
                        out_label = "[aout]"
                    
                    audio_filter_parts.append(
                        f"{in_a}{in_b}acrossfade=d={crossfade_duration}:c1=tri:c2=tri{out_label}"
                    )
            
            # Combine video and audio filters
            filter_complex = ";".join(video_filter_parts + audio_filter_parts)
            
            cmd = [
                'ffmpeg',
                *inputs,
                '-filter_complex', filter_complex,
                '-map', '[vout]',
                '-map', '[aout]',
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '23',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-movflags', '+faststart',
                '-y',
                merged_no_subs
            ]
            
            print(f"[CLIPS] Running crossfade merge with {len(segment_files)} segments...")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                print(f"[CLIPS] Crossfade merge failed: {result.stderr[:500]}")
                # Fallback: simple concat without crossfade (better than nothing)
                print("[CLIPS] Falling back to simple concat...")
                concat_file = os.path.join(self.temp_dir, f"concat_{clip_id}.txt")
                with open(concat_file, 'w') as f:
                    for seg in segment_files:
                        f.write(f"file '{seg}'\n")
                
                cmd_fallback = [
                    'ffmpeg',
                    '-f', 'concat',
                    '-safe', '0',
                    '-i', concat_file,
                    '-c:v', 'libx264',
                    '-preset', 'fast',
                    '-crf', '23',
                    '-c:a', 'aac',
                    '-b:a', '128k',
                    '-y',
                    merged_no_subs
                ]
                subprocess.run(cmd_fallback, capture_output=True)
                
                if os.path.exists(concat_file):
                    os.remove(concat_file)
        
        # Cleanup segment files
        for seg in segment_files:
            if os.path.exists(seg):
                os.remove(seg)
        
        if not os.path.exists(merged_no_subs):
            print("[CLIPS] Merged file not created")
            return None
        
        # PHASE 3: Add unified captions with safe-zone positioning
        ass_path = os.path.join(self.temp_dir, f"subs_{clip_id}_final.ass")
        
        # Re-adjust word timings to account for crossfade compression
        # Each crossfade reduces total duration by crossfade_duration
        total_crossfade_reduction = (len(segments) - 1) * crossfade_duration
        
        self.generate_ass_subtitles(all_words, ass_path)
        
        # Burn in captions
        cmd = [
            'ffmpeg',
            '-i', merged_no_subs,
            '-vf', f"ass='{ass_path}'",
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-c:a', 'copy',  # Audio already processed
            '-movflags', '+faststart',
            '-y',
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"[CLIPS] Caption burn failed: {result.stderr[:300]}")
            # Use merged file without captions
            os.rename(merged_no_subs, output_path)
        else:
            # Cleanup merged file
            if os.path.exists(merged_no_subs):
                os.remove(merged_no_subs)
        
        # Cleanup ASS file
        if os.path.exists(ass_path):
            os.remove(ass_path)
        
        if os.path.exists(output_path):
            file_size = os.path.getsize(output_path)
            print(f"[CLIPS] VIRAL clip rendered successfully: {output_path} ({file_size} bytes)")
            return output_path
        
        return None
    
    def cleanup_old_renders(self, max_age_hours: int = 24):
        """Remove rendered clips older than max_age_hours."""
        now = datetime.now().timestamp()
        max_age_seconds = max_age_hours * 3600
        
        for filename in os.listdir(self.renders_dir):
            filepath = os.path.join(self.renders_dir, filename)
            if os.path.isfile(filepath):
                file_age = now - os.path.getmtime(filepath)
                if file_age > max_age_seconds:
                    try:
                        os.remove(filepath)
                    except:
                        pass

