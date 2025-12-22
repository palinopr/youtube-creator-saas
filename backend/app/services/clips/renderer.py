"""
Clips renderer - FFmpeg video rendering with Hormozi-style captions.

DYNAMIC EDITING FEATURES:
- Audio crossfades (100ms) to eliminate pops/clicks at cut points
- Zoom Jump technique (100% -> 115% -> 100%) to hide Franken-bite jump cuts
- Safe-zone captioning to avoid TikTok/Shorts UI overlap
- Smart Face Detection: Crops around detected faces, not dead center
"""

import os
import shutil
import subprocess
import tempfile
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple, Callable

from openai import OpenAI

from ...config import get_settings
from ...tools.youtube_api import get_youtube_client, YouTubeAPIClient
from .types import VideoSource, ZoomLevel, OPENCV_AVAILABLE

# Import OpenCV components only if available
if OPENCV_AVAILABLE:
    import cv2
    import numpy as np


class ClipRenderer:
    """
    Renders video clips using FFmpeg with Hormozi-style animated captions.

    For SaaS operation, this supports multiple video sources:
    1. YouTube OAuth: Download user's OWN videos via their OAuth credentials (preferred)
    2. YouTube Public: Download via yt-dlp (for testing/fallback only)
    3. Local File: Process pre-downloaded/uploaded files
    """

    def __init__(self, credentials_data: Optional[Dict[str, Any]] = None):
        settings = get_settings()
        self.openai_client = OpenAI(api_key=settings.openai_api_key)
        self.temp_dir = tempfile.gettempdir()
        self.renders_dir = os.path.join(self.temp_dir, "clip_renders")
        os.makedirs(self.renders_dir, exist_ok=True)
        self._youtube_client: Optional[YouTubeAPIClient] = None
        self._credentials_data = credentials_data

    @property
    def youtube_client(self) -> YouTubeAPIClient:
        """Get YouTube API client (lazy initialization)."""
        if self._youtube_client is None:
            self._youtube_client = get_youtube_client(credentials_data=self._credentials_data)
        return self._youtube_client

    async def download_video_oauth(self, video_id: str) -> Optional[str]:
        """
        Download video using user's OAuth credentials (SaaS mode).

        This is the PREFERRED method for production SaaS because:
        - No bot detection issues (user is accessing their own content)
        - Legal (user owns the video)
        - Higher reliability than yt-dlp

        Args:
            video_id: YouTube video ID

        Returns:
            Path to downloaded video or None
        """
        try:
            print(f"[CLIPS] Attempting OAuth download for video {video_id}")

            # First verify the user owns this video
            is_owner = self.youtube_client.verify_video_ownership(video_id)
            if not is_owner:
                print(f"[CLIPS] User does not own video {video_id}, falling back to public download")
                return None

            # Download using OAuth credentials
            download_path = self.youtube_client.download_user_video(video_id, self.temp_dir)

            if download_path and os.path.exists(download_path):
                print(f"[CLIPS] OAuth download successful: {download_path}")
                return download_path

            print(f"[CLIPS] OAuth download failed for {video_id}")
            return None

        except Exception as e:
            print(f"[CLIPS] OAuth download error: {e}")
            return None

    async def get_video_source(
        self,
        video_id: str,
        local_path: Optional[str] = None,
        prefer_oauth: bool = True
    ) -> Tuple[Optional[str], VideoSource]:
        """
        Get video file from the best available source.

        Priority order:
        1. Local file (if provided)
        2. OAuth download (if authenticated and owns video)
        3. yt-dlp public download (fallback)

        Args:
            video_id: YouTube video ID
            local_path: Optional path to pre-downloaded file
            prefer_oauth: Try OAuth first (recommended for SaaS)

        Returns:
            Tuple of (video_path, source_type) or (None, source_type)
        """
        # Option 1: Use provided local file
        if local_path and os.path.exists(local_path):
            print(f"[CLIPS] Using local file: {local_path}")
            return local_path, VideoSource.LOCAL_FILE

        # Check cache first
        cached_path = os.path.join(self.temp_dir, f"source_{video_id}.mp4")
        if os.path.exists(cached_path) and os.path.getsize(cached_path) > 100000:
            print(f"[CLIPS] Using cached video: {cached_path}")
            return cached_path, VideoSource.LOCAL_FILE

        # Option 2: Try OAuth download (SaaS preferred)
        if prefer_oauth:
            oauth_path = await self.download_video_oauth(video_id)
            if oauth_path:
                return oauth_path, VideoSource.YOUTUBE_OAUTH

        # Option 3: Fallback to yt-dlp (for testing/unauth users)
        print(f"[CLIPS] Falling back to yt-dlp public download")
        public_path = await self.download_video(video_id)
        if public_path:
            return public_path, VideoSource.YOUTUBE_PUBLIC

        return None, VideoSource.YOUTUBE_PUBLIC

    async def download_video(self, video_id: str) -> Optional[str]:
        """
        Download video from YouTube using yt-dlp CLI with remote-components.

        Uses subprocess to call yt-dlp directly with --remote-components ejs:github
        which is REQUIRED as of late 2024 to solve YouTube's JavaScript challenges.

        Args:
            video_id: YouTube video ID

        Returns:
            Path to downloaded video file or None on error
        """
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

        # Find yt-dlp executable
        yt_dlp_path = shutil.which("yt-dlp")
        if not yt_dlp_path:
            # Try common locations
            possible_paths = [
                "/usr/local/bin/yt-dlp",
                "/opt/homebrew/bin/yt-dlp",
                os.path.expanduser("~/.local/bin/yt-dlp"),
            ]
            for p in possible_paths:
                if os.path.exists(p):
                    yt_dlp_path = p
                    break

        if not yt_dlp_path:
            print("[CLIPS] ERROR: yt-dlp not found in PATH!")
            return None

        print(f"[CLIPS] Using yt-dlp at: {yt_dlp_path}")

        # Strategy 1: Use CLI with --remote-components (REQUIRED for YouTube JS challenges)
        cmd = [
            yt_dlp_path,
            "--remote-components", "ejs:github",  # KEY: Solves YouTube JS challenges
            "-f", "bv*[height<=1080]+ba/b[height<=1080]/bv*+ba/b",
            "--merge-output-format", "mp4",
            "--no-playlist",
            "-o", f"{output_template}.%(ext)s",
            url
        ]

        print(f"[CLIPS] Running: yt-dlp --remote-components ejs:github ...")

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )

            if result.returncode == 0:
                # Check for downloaded file
                possible_files = glob.glob(f"{output_template}.*")
                for f in possible_files:
                    ext = os.path.splitext(f)[1].lower()
                    if ext in video_extensions and os.path.exists(f):
                        size = os.path.getsize(f)
                        if size > 100000:
                            print(f"[CLIPS] Successfully downloaded: {f} ({size} bytes)")
                            return f
            else:
                print(f"[CLIPS] yt-dlp stderr: {result.stderr[:500]}")

        except subprocess.TimeoutExpired:
            print("[CLIPS] yt-dlp download timed out after 5 minutes")
        except Exception as e:
            print(f"[CLIPS] yt-dlp subprocess error: {e}")

        # Strategy 2: Fallback with different format (720p max)
        print("[CLIPS] Trying fallback strategy with 720p...")
        cmd_fallback = [
            yt_dlp_path,
            "--remote-components", "ejs:github",
            "-f", "best[height<=720]",
            "--no-playlist",
            "-o", f"{output_template}.%(ext)s",
            url
        ]

        try:
            result = subprocess.run(
                cmd_fallback,
                capture_output=True,
                text=True,
                timeout=300
            )

            if result.returncode == 0:
                possible_files = glob.glob(f"{output_template}.*")
                for f in possible_files:
                    ext = os.path.splitext(f)[1].lower()
                    if ext in video_extensions and os.path.exists(f):
                        size = os.path.getsize(f)
                        if size > 100000:
                            print(f"[CLIPS] Fallback download successful: {f} ({size} bytes)")
                            return f
            else:
                print(f"[CLIPS] Fallback yt-dlp stderr: {result.stderr[:500]}")

        except subprocess.TimeoutExpired:
            print("[CLIPS] Fallback download timed out")
        except Exception as e:
            print(f"[CLIPS] Fallback error: {e}")

        # Strategy 3: Try using Python yt-dlp library with tv client (doesn't need JS solver)
        print("[CLIPS] Trying Python yt-dlp library with TV client...")
        try:
            import yt_dlp

            ydl_opts = {
                'format': 'bv*[height<=720]+ba/b[height<=720]',
                'outtmpl': f"{output_template}.%(ext)s",
                'merge_output_format': 'mp4',
                'quiet': True,
                'extractor_args': {'youtube': {'player_client': ['tv_embedded', 'tv']}},
            }

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                if info:
                    possible_files = glob.glob(f"{output_template}.*")
                    for f in possible_files:
                        ext = os.path.splitext(f)[1].lower()
                        if ext in video_extensions and os.path.exists(f):
                            size = os.path.getsize(f)
                            if size > 100000:
                                print(f"[CLIPS] Python yt-dlp success: {f} ({size} bytes)")
                                return f

        except Exception as e:
            print(f"[CLIPS] Python yt-dlp failed: {e}")

        # Final check for any downloaded files
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
        style: str = "hormozi",
        aspect_ratio: str = "9:16"
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
            aspect_ratio: Output aspect ratio ('9:16' or '1:1')

        Returns:
            Path to generated .ass file
        """
        # Get dimensions based on aspect ratio
        width, height, _ = self._get_aspect_dimensions(aspect_ratio)

        # Adjust margins for 1:1 (square) format - less vertical margin needed
        margin_v = 200 if aspect_ratio == "1:1" else 350
        font_size_main = 100 if aspect_ratio == "1:1" else 120
        font_size_highlight = 110 if aspect_ratio == "1:1" else 130

        # ASS header with Hormozi-style formatting
        # SAFE-ZONE MARGINS:
        # - MarginV: Clears TikTok description, comments, music info at bottom
        # - MarginL=100, MarginR=100: Clears like/share/comment buttons on right
        # - Alignment=2 (bottom center) ensures text stays in safe viewing area
        ass_content = f"""[Script Info]
Title: Viral Clip Captions
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Impact,{font_size_main},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,8,0,2,100,100,{margin_v},1
Style: Highlight,Impact,{font_size_highlight},&H0000FFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,10,0,2,100,100,{margin_v},1

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

    def _build_zoom_crop_filter(self, zoom: float, aspect_ratio: str = "9:16", input_width: int = 1920, input_height: int = 1080) -> str:
        """
        Build FFmpeg filter for zoom effect with center crop.

        The zoom is achieved by:
        1. Scaling up the video by the zoom factor
        2. Cropping back to target aspect ratio from the center

        This creates a "push in" effect that hides jump cuts.

        Args:
            zoom: Zoom factor (1.0 = no zoom, 1.15 = 15% zoom in)
            aspect_ratio: Output aspect ratio ('9:16' or '1:1')
        """
        # Get target dimensions based on aspect ratio
        width, height, crop_ratio = self._get_aspect_dimensions(aspect_ratio)

        # Calculate zoomed dimensions
        if zoom == 1.0:
            # Standard: just crop and scale
            return self._build_crop_scale_filter(aspect_ratio)
        else:
            # Zoomed: scale up first, then crop, then scale to output
            scale_factor = zoom
            if aspect_ratio == "1:1":
                return f"scale=iw*{scale_factor}:ih*{scale_factor},crop=ih:ih,scale={width}:{height}"
            else:
                return f"scale=iw*{scale_factor}:ih*{scale_factor},crop=ih*{crop_ratio}:ih,scale={width}:{height}"

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
        output_filename: Optional[str] = None,
        local_video_path: Optional[str] = None,
        prefer_oauth: bool = True,
        progress_callback: Optional[Callable[[int, str], None]] = None,
        layout: str = "auto",  # 'auto', 'center', 'split', or 'smart'
        aspect_ratio: str = "9:16"  # '9:16' for TikTok/Reels, '1:1' for Instagram
    ) -> Optional[str]:
        """
        Render a clip from video segments with VIRAL POLISH editing.

        DYNAMIC EDITING FEATURES:
        1. Audio Crossfades: 100ms acrossfade between segments eliminates pops/clicks
        2. Zoom Jump Technique: Alternates 100%/115% zoom to hide Franken-bite cuts
        3. Safe-Zone Captions: Margins avoid TikTok/Shorts UI elements
        4. Smart Face Detection: Auto-detects faces and crops around them (NEW!)
        5. Split Screen: Auto-enabled for 2-person interview layouts

        VIDEO SOURCE PRIORITY (SaaS mode):
        1. local_video_path if provided (for uploaded videos)
        2. OAuth download if user owns the video (preferred for SaaS)
        3. yt-dlp fallback (for testing only)

        Args:
            video_id: YouTube video ID
            clip_id: Unique clip identifier
            segments: List of (start_time, end_time) tuples to include
            output_filename: Optional custom output filename
            local_video_path: Optional path to pre-downloaded/uploaded video
            prefer_oauth: Try OAuth download first (recommended for SaaS)
            progress_callback: Optional function(progress_percent, message) to report status
            layout: 'center' (default) or 'split' (for podcasts)
            aspect_ratio: '9:16' (TikTok/Reels vertical) or '1:1' (Instagram square)

        Returns:
            Path to rendered MP4 file or None on error
        """
        print(f"[CLIPS] render_clip called: video_id={video_id}, clip_id={clip_id}, layout={layout}, aspect_ratio={aspect_ratio}")

        if progress_callback:
            progress_callback(35, "Acquiring video source...")

        # Get video from best available source
        source_video, source_type = await self.get_video_source(
            video_id=video_id,
            local_path=local_video_path,
            prefer_oauth=prefer_oauth
        )

        if not source_video:
            print(f"[CLIPS] Failed to obtain video {video_id} from any source")
            return None

        print(f"[CLIPS] Video source: {source_type.value} -> {source_video}")

        output_path = os.path.join(
            self.renders_dir,
            output_filename or f"clip_{clip_id}.mp4"
        )

        print(f"[CLIPS] Output path: {output_path}")

        if progress_callback:
            progress_callback(45, "Processing segments...")

        try:
            # For simple single-segment clips
            if len(segments) == 1:
                return await self._render_single_segment(
                    source_video, clip_id, segments[0], output_path, progress_callback, layout, aspect_ratio
                )
            else:
                # Multiple segments - use DYNAMIC EDITING with crossfades and zoom jumps
                return await self._render_multi_segment_viral(
                    source_video, clip_id, segments, output_path, progress_callback, layout, aspect_ratio
                )

        except Exception as e:
            print(f"[CLIPS] Render error: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _build_split_screen_filter(self, aspect_ratio: str = "9:16") -> str:
        """
        Build FFmpeg filter for podcast split screen (Left Speaker / Right Speaker).
        Top half = Left 50% of source.
        Bottom half = Right 50% of source.
        """
        if aspect_ratio == "1:1":
            # Square: 1080x1080, each half is 1080x540
            return (
                "[0:v]crop=iw/2:ih:0:0,scale=1080:540[top];"
                "[0:v]crop=iw/2:ih:iw/2:0,scale=1080:540[bottom];"
                "[top][bottom]vstack"
            )
        else:
            # 9:16 vertical: 1080x1920, each half is 1080x960
            return (
                "[0:v]crop=iw/2:ih:0:0,scale=1080:960[top];"
                "[0:v]crop=iw/2:ih:iw/2:0,scale=1080:960[bottom];"
                "[top][bottom]vstack"
            )

    def _get_aspect_dimensions(self, aspect_ratio: str = "9:16") -> Tuple[int, int, str]:
        """
        Get output dimensions and crop ratio based on aspect ratio.

        Args:
            aspect_ratio: '9:16' for TikTok/Reels or '1:1' for Instagram

        Returns:
            (width, height, crop_ratio) - e.g. (1080, 1920, "9/16") or (1080, 1080, "1")
        """
        if aspect_ratio == "1:1":
            return (1080, 1080, "1")  # Square: crop to square aspect ratio
        else:
            return (1080, 1920, "9/16")  # 9:16 vertical (default)

    def _build_crop_scale_filter(self, aspect_ratio: str = "9:16", face_center_x: Optional[int] = None) -> str:
        """
        Build FFmpeg crop and scale filter based on aspect ratio.

        Args:
            aspect_ratio: '9:16' or '1:1'
            face_center_x: Optional face center X position for smart cropping

        Returns:
            FFmpeg filter string for cropping and scaling
        """
        width, height, crop_ratio = self._get_aspect_dimensions(aspect_ratio)

        if face_center_x is not None:
            # Smart crop centered on face
            if aspect_ratio == "1:1":
                return f"crop=ih:ih:{face_center_x}-ih/2:0,scale={width}:{height}"
            else:
                return f"crop=ih*{crop_ratio}:ih:{face_center_x}-ih*{crop_ratio}/2:0,scale={width}:{height}"
        else:
            # Center crop
            if aspect_ratio == "1:1":
                return f"crop=ih:ih,scale={width}:{height}"
            else:
                return f"crop=ih*{crop_ratio}:ih,scale={width}:{height}"

    def detect_faces_in_frame(self, video_path: str, timestamp: float = 1.0) -> List[Dict]:
        """
        Detect faces in a video frame using OpenCV.

        Args:
            video_path: Path to video file
            timestamp: Time in seconds to extract frame from

        Returns:
            List of face bounding boxes: [{"x": int, "y": int, "w": int, "h": int, "center_x": int}]
        """
        if not OPENCV_AVAILABLE:
            return []

        try:
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS) or 30
            frame_num = int(timestamp * fps)
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)

            ret, frame = cap.read()
            cap.release()

            if not ret:
                return []

            # Use Haar cascade for face detection (fast, works well for frontal faces)
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            face_cascade = cv2.CascadeClassifier(cascade_path)

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))

            result = []
            for (x, y, w, h) in faces:
                result.append({
                    "x": int(x),
                    "y": int(y),
                    "w": int(w),
                    "h": int(h),
                    "center_x": int(x + w // 2)
                })

            print(f"[CLIPS] Detected {len(result)} faces at t={timestamp}s: {result}")
            return result

        except Exception as e:
            print(f"[CLIPS] Face detection error: {e}")
            return []

    def detect_video_layout(self, video_path: str) -> str:
        """
        Automatically detect video layout (single speaker, interview, etc.).

        Returns:
            'single': One person (center crop is fine)
            'interview': Two people on sides (use split screen or smart crop)
            'group': Three or more people (use wide crop or select one)
        """
        if not OPENCV_AVAILABLE:
            return 'single'  # Default to center crop

        # Sample multiple frames to get consistent results
        faces_by_frame = []
        for t in [1.0, 3.0, 5.0, 10.0]:
            faces = self.detect_faces_in_frame(video_path, t)
            if faces:
                faces_by_frame.append(faces)

        if not faces_by_frame:
            print("[CLIPS] No faces detected, using center crop")
            return 'single'

        # Count most common number of faces
        face_counts = [len(f) for f in faces_by_frame]
        avg_faces = sum(face_counts) / len(face_counts)

        if avg_faces < 1.5:
            layout = 'single'
        elif avg_faces < 2.5:
            layout = 'interview'
        else:
            layout = 'group'

        print(f"[CLIPS] Detected layout: {layout} (avg {avg_faces:.1f} faces)")
        return layout

    def get_smart_crop_position(self, video_path: str, timestamp: float, aspect_ratio: str = "9:16", video_width: int = 1920) -> str:
        """
        Get FFmpeg crop filter that focuses on detected faces.

        For interview videos with 2 people on sides:
        - If one person is speaking (detected), crop around them
        - If both visible, use split screen or pick the left speaker

        Args:
            video_path: Path to video file
            timestamp: Time in seconds to sample for face detection
            aspect_ratio: Output aspect ratio ('9:16' or '1:1')
            video_width: Width of source video (default 1920)

        Returns:
            FFmpeg crop filter string (e.g., "crop=ih*9/16:ih:500:0,scale=1080:1920")
        """
        faces = self.detect_faces_in_frame(video_path, timestamp)

        # Get dimensions for the target aspect ratio
        width, height, crop_ratio = self._get_aspect_dimensions(aspect_ratio)

        # Calculate crop offset factor (half of crop ratio for centering)
        if aspect_ratio == "1:1":
            offset_factor = "1/2"  # ih * 1/2 for square crop offset
        else:
            offset_factor = "9/32"  # ih * 9/32 for 9:16 crop offset

        if not faces:
            # No faces detected, use center crop
            return self._build_crop_scale_filter(aspect_ratio)

        if len(faces) == 1:
            # Single face: center crop around that person
            face = faces[0]
            crop_center_x = face["center_x"]
            # Build filter centered on face
            if aspect_ratio == "1:1":
                return f"crop=ih:ih:{crop_center_x}-ih/2:0,scale={width}:{height}"
            else:
                return f"crop=ih*{crop_ratio}:ih:{crop_center_x}-ih*{offset_factor}:0,scale={width}:{height}"

        elif len(faces) == 2:
            # Two faces: focus on the person on left (usually interviewer/main speaker)
            # Sort by x position
            faces_sorted = sorted(faces, key=lambda f: f["center_x"])
            left_face = faces_sorted[0]
            right_face = faces_sorted[1]

            # Check if they're on opposite sides (interview layout)
            left_third = video_width // 3
            right_third = video_width * 2 // 3

            if left_face["center_x"] < left_third and right_face["center_x"] > right_third:
                # Classic interview setup - use split screen
                print("[CLIPS] Interview layout detected - using split screen")
                return "SPLIT_SCREEN"
            else:
                # Both on same side or center, crop around the group center
                group_center = (left_face["center_x"] + right_face["center_x"]) // 2
                if aspect_ratio == "1:1":
                    return f"crop=ih:ih:{group_center}-ih/2:0,scale={width}:{height}"
                else:
                    return f"crop=ih*{crop_ratio}:ih:{group_center}-ih*{offset_factor}:0,scale={width}:{height}"

        else:
            # 3+ faces: crop around the center of the group
            avg_x = sum(f["center_x"] for f in faces) // len(faces)
            if aspect_ratio == "1:1":
                return f"crop=ih:ih:{avg_x}-ih/2:0,scale={width}:{height}"
            else:
                return f"crop=ih*{crop_ratio}:ih:{avg_x}-ih*{offset_factor}:0,scale={width}:{height}"

    async def _render_single_segment(
        self,
        source_video: str,
        clip_id: str,
        segment: Tuple[float, float],
        output_path: str,
        progress_callback: Optional[Callable] = None,
        layout: str = "auto",  # 'auto', 'center', 'split', or 'smart'
        aspect_ratio: str = "9:16"  # '9:16' for TikTok/Reels, '1:1' for Instagram
    ) -> Optional[str]:
        """Render a single segment clip with captions."""
        start, end = segment
        duration = end - start

        if progress_callback:
            progress_callback(10, "Extracting word timestamps...")

        # Get word timestamps for this segment
        words = await self.get_word_timestamps(source_video, start, duration)

        # Filter words to be relative to segment start (0-based for subtitle timing)
        segment_words = []
        for w in words:
            # Adjust times to be relative to the segment start
            segment_words.append({
                "word": w["word"],
                "start": w["start"] - start,  # Make relative to segment
                "end": w["end"] - start
            })

        if progress_callback:
            progress_callback(30, "Generating captions...")

        # Generate ASS subtitle file
        ass_path = os.path.join(self.temp_dir, f"subs_{clip_id}.ass")
        if segment_words:
            self.generate_ass_subtitles(segment_words, ass_path, aspect_ratio=aspect_ratio)
        else:
            # Create empty ASS file if no words (prevents file not found)
            ass_path = None

        if progress_callback:
            progress_callback(50, "Rendering video...")

        # Build filter - now with smart face detection and aspect ratio support
        if layout == "split":
            video_filter = self._build_split_screen_filter(aspect_ratio)
        elif layout == "auto" or layout == "smart":
            # Use smart cropping based on face detection
            smart_filter = self.get_smart_crop_position(source_video, start + 1.0, aspect_ratio)
            if smart_filter == "SPLIT_SCREEN":
                video_filter = self._build_split_screen_filter(aspect_ratio)
                print(f"[CLIPS] Auto-detected interview layout, using split screen")
            else:
                video_filter = smart_filter
                print(f"[CLIPS] Using smart crop filter: {video_filter[:50]}...")
        else:
            video_filter = self._build_crop_scale_filter(aspect_ratio)

        # Build filter - with or without subtitles
        if ass_path and os.path.exists(ass_path):
            filter_complex = f"{video_filter},ass='{ass_path}'"
        else:
            filter_complex = video_filter

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
            '-ar', '48000',
            '-movflags', '+faststart',
            '-y',
            output_path
        ]

        print(f"[CLIPS] Running FFmpeg: {' '.join(cmd[:8])}...")
        result = subprocess.run(cmd, capture_output=True, text=True)
        print(f"[CLIPS] FFmpeg returned code: {result.returncode}")

        if result.returncode != 0:
            print(f"[CLIPS] FFmpeg error: {result.stderr[:500]}")
            # Try without subtitles as fallback
            if progress_callback:
                progress_callback(80, "Retrying without captions...")

            # Use same smart filter for fallback (just without subtitles)
            fallback_filter = video_filter if "SPLIT" not in video_filter else self._build_crop_scale_filter(aspect_ratio)
            cmd_fallback = [
                'ffmpeg',
                '-ss', str(start),
                '-i', source_video,
                '-t', str(duration),
                '-vf', fallback_filter,
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

        # Cleanup ASS file if it was created
        if ass_path and os.path.exists(ass_path):
            os.remove(ass_path)

        if progress_callback:
            progress_callback(95, "Finalizing...")

        return output_path if os.path.exists(output_path) else None

    async def _render_multi_segment_viral(
        self,
        source_video: str,
        clip_id: str,
        segments: List[Tuple[float, float]],
        output_path: str,
        progress_callback: Optional[Callable] = None,
        layout: str = "auto",  # 'auto', 'center', 'split', or 'smart'
        aspect_ratio: str = "9:16"  # '9:16' for TikTok/Reels, '1:1' for Instagram
    ) -> Optional[str]:
        """
        Render multiple segments with VIRAL POLISH dynamic editing.
        """
        # Initialize segment tracking
        segment_files = []
        crossfade_duration = 0.1  # 100ms crossfade between segments

        # Detect layout ONCE at the start using the first segment
        detected_layout = layout
        if layout == "auto" or layout == "smart":
            first_start = segments[0][0] if segments else 0
            smart_filter = self.get_smart_crop_position(source_video, first_start + 1.0, aspect_ratio)
            if smart_filter == "SPLIT_SCREEN":
                detected_layout = "split"
                print(f"[CLIPS] Auto-detected interview layout for multi-segment, using split screen")
            else:
                detected_layout = "smart"
                print(f"[CLIPS] Using smart crop for multi-segment render")

        if progress_callback:
            progress_callback(10, "Rendering segments...")

        # PHASE 1: Render each segment with zoom effects
        for i, (start, end) in enumerate(segments):
            duration = end - start
            seg_path = os.path.join(self.temp_dir, f"seg_{clip_id}_{i}.mp4")

            # Get zoom level for this segment (alternates between 1.0 and 1.15)
            zoom = self._get_zoom_level_for_segment(i, len(segments))

            if progress_callback:
                progress = 10 + int((i / len(segments)) * 60)
                progress_callback(progress, f"Rendering segment {i+1}/{len(segments)}...")

            # Build video filter with zoom, split, or smart crop
            if detected_layout == "split":
                video_filter = self._build_split_screen_filter(aspect_ratio)
            elif detected_layout == "smart":
                # Use smart cropping for this segment's timestamp
                smart_filter = self.get_smart_crop_position(source_video, start + 0.5, aspect_ratio)
                if smart_filter == "SPLIT_SCREEN":
                    video_filter = self._build_split_screen_filter(aspect_ratio)
                else:
                    # Apply zoom to the smart crop filter
                    if zoom == 1.0:
                        video_filter = smart_filter
                    else:
                        # Add zoom by scaling up before crop
                        video_filter = f"scale=iw*{zoom}:ih*{zoom}," + smart_filter
            else:
                video_filter = self._build_zoom_crop_filter(zoom, aspect_ratio)

            # Render segment
            cmd = [
                'ffmpeg',
                '-ss', str(start),
                '-i', source_video,
                '-t', str(duration),
                '-filter_complex', video_filter,
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
                # Fallback without zoom - use aspect ratio aware filter
                fallback_filter = self._build_crop_scale_filter(aspect_ratio)
                cmd_fallback = [
                    'ffmpeg',
                    '-ss', str(start),
                    '-i', source_video,
                    '-t', str(duration),
                    '-vf', fallback_filter,
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

        if progress_callback:
            progress_callback(75, "Merging segments with audio crossfades...")

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
                # Force sample format to fltp to match acrossfade requirements
                audio_filter_parts.append(
                    f"[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[a0_fmt];"
                    f"[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[a1_fmt];"
                    f"[a0_fmt][a1_fmt]acrossfade=d={crossfade_duration}:c1=tri:c2=tri[aout]"
                )
            else:
                # Multiple crossfades chained together
                # Pre-format all audio streams first
                for i in range(len(segment_files)):
                    audio_filter_parts.append(
                        f"[{i}:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[af{i}];"
                    )

                for i in range(len(segment_files) - 1):
                    if i == 0:
                        in_a = "[af0]"
                        in_b = "[af1]"
                        out_label = "[a01]"
                    else:
                        in_a = f"[a{str(i-1).zfill(2)}]" if i == 1 else f"[a{i-1:02d}]"
                        in_b = f"[af{i+1}]"
                        out_label = f"[a{i:02d}]"

                    # Last crossfade outputs to [aout]
                    if i == len(segment_files) - 2:
                        out_label = "[aout]"

                    audio_filter_parts.append(
                        f"{in_a}{in_b}acrossfade=d={crossfade_duration}:c1=tri:c2=tri{out_label}"
                    )

            # Combine video and audio filters
            filter_complex = ";".join(video_filter_parts + audio_filter_parts)

            # NOTE: For filter_complex with mapped streams, we MUST map everything explicitly
            # vout and aout are the outputs from our filter chain
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
                '-ac', '2',      # Ensure stereo output
                '-ar', '48000',  # Ensure consistent sample rate
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

        # PHASE 3: Finalize output (skip captions for now - word timestamps not available in this context)
        if progress_callback:
            progress_callback(85, "Finalizing clip...")

        # Move merged file to output path
        shutil.move(merged_no_subs, output_path)

        if progress_callback:
            progress_callback(95, "Finalizing output...")

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
