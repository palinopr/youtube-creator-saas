"""
Clips detector - AI-powered Franken-bite clip detection using GPT-4o.

Identifies hooks, compresses body content, and creates loop endings
for viral short clips.
"""

import json
import re
import uuid
from typing import List, Dict, Tuple, Optional

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from openai import OpenAI

from ...config import get_settings
from .types import ClipSegment, ClipSuggestion


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

LANGUAGE INSTRUCTION:
- DETECT the language of the transcript (e.g., Spanish, English).
- OUTPUT the "title", "why_viral", and any generated text in the SAME LANGUAGE as the transcript.
- If the video is in Spanish, the titles and explanations MUST be in Spanish.

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

            # Convert to ClipSuggestion objects with ACTUAL TIMESTAMPS
            suggestions = []
            for i, clip in enumerate(clips):
                clip_id = str(uuid.uuid4())[:8]

                # Find actual timestamps for hook using search_phrase (more reliable)
                hook_data = clip["hook"]
                hook_text = hook_data["text"]
                hook_search = hook_data.get("search_phrase", hook_text)
                hook_start, hook_end = self.find_timestamp_for_phrase(hook_search, word_timestamps)
                print(f"[CLIPS] Hook '{hook_search[:30]}...' -> {hook_start:.1f}s - {hook_end:.1f}s")

                hook = ClipSegment(
                    start_time=hook_start,
                    end_time=hook_end,
                    text=hook_text,
                    segment_type="hook"
                )

                # Create body segments with actual timestamps
                body_segments = []
                for seg in clip.get("body_segments", []):
                    seg_text = seg.get("text", seg.get("original_text", ""))
                    seg_search = seg.get("search_phrase", seg.get("original_text", seg_text))
                    seg_start, seg_end = self.find_timestamp_for_phrase(seg_search, word_timestamps)
                    print(f"[CLIPS] Body '{seg_search[:30]}...' -> {seg_start:.1f}s - {seg_end:.1f}s")
                    body_segments.append(ClipSegment(
                        start_time=seg_start,
                        end_time=seg_end,
                        text=seg_text,
                        segment_type="body"
                    ))

                # Create loop ending with actual timestamps if present
                loop_ending = None
                loop_data = clip.get("loop_ending")
                if loop_data and loop_data.get("text"):
                    loop_text = loop_data["text"]
                    loop_search = loop_data.get("search_phrase", loop_text)
                    loop_start, loop_end = self.find_timestamp_for_phrase(loop_search, word_timestamps)
                    print(f"[CLIPS] Loop '{loop_search[:30]}...' -> {loop_start:.1f}s - {loop_end:.1f}s")
                    loop_ending = ClipSegment(
                        start_time=loop_start,
                        end_time=loop_end,
                        text=loop_text,
                        segment_type="loop_ending"
                    )

                # Calculate actual total duration from segments
                all_durations = [hook_end - hook_start]
                all_durations.extend([s.end_time - s.start_time for s in body_segments])
                if loop_ending:
                    all_durations.append(loop_ending.end_time - loop_ending.start_time)
                total_duration = sum(all_durations)

                print(f"[CLIPS] Clip {i+1} total duration: {total_duration:.1f}s from {len(body_segments)+1+(1 if loop_ending else 0)} segments")

                suggestion = ClipSuggestion(
                    clip_id=clip_id,
                    title=clip.get("title", f"Clip {i+1}"),
                    hook=hook,
                    body_segments=body_segments,
                    loop_ending=loop_ending,
                    total_duration=total_duration if total_duration > 0 else clip.get("estimated_duration_seconds", 30),
                    viral_score=clip.get("viral_score", 70),
                    why_viral=clip.get("why_viral", "")
                )
                suggestions.append(suggestion)

            return suggestions

        except Exception as e:
            print(f"[CLIPS] Error detecting clips: {e}")
            return []

    def find_sentence_boundaries(
        self,
        word_timestamps: List[Dict],
        transcript_segments: Optional[List[Dict]] = None
    ) -> List[Dict]:
        """
        Identify sentence boundaries based on:
        1. Original transcript segments (PREFERRED - most accurate)
        2. Punctuation (periods, ?, !)
        3. Long pauses (> 0.5s between words)

        Returns list of {start_idx, end_idx, start_time, end_time}
        """
        # PREFERRED: Use original transcript segments if available
        # These are the natural sentence/phrase boundaries from YouTube's ASR
        if transcript_segments:
            boundaries = []
            for seg in transcript_segments:
                seg_start = seg.get("start", 0)
                seg_duration = seg.get("duration", 0)
                seg_end = seg.get("end", seg_start + seg_duration)
                boundaries.append({
                    "start_idx": 0,  # Not used when we have direct times
                    "end_idx": 0,
                    "start_time": seg_start,
                    "end_time": seg_end
                })
            print(f"[CLIPS] Using {len(boundaries)} original transcript segments as sentence boundaries")
            return boundaries

        if not word_timestamps:
            return []

        boundaries = []
        current_start_idx = 0

        for i, wt in enumerate(word_timestamps):
            word = wt.get("word", "")
            end_time = wt.get("end", 0)

            # Check for sentence-ending punctuation
            is_sentence_end = any(p in word for p in ['.', '?', '!', '...'])

            # Check for long pause after this word
            has_long_pause = False
            if i < len(word_timestamps) - 1:
                next_start = word_timestamps[i + 1].get("start", 0)
                gap = next_start - end_time
                has_long_pause = gap > 0.5  # 0.5 second pause

            if is_sentence_end or has_long_pause or i == len(word_timestamps) - 1:
                boundaries.append({
                    "start_idx": current_start_idx,
                    "end_idx": i,
                    "start_time": word_timestamps[current_start_idx].get("start", 0),
                    "end_time": end_time
                })
                current_start_idx = i + 1

        return boundaries

    def find_nearest_sentence_boundary(
        self,
        time: float,
        boundaries: List[Dict],
        direction: str = "start"  # "start" or "end"
    ) -> float:
        """
        Find the nearest sentence boundary to a given time.

        Args:
            time: The time to snap to boundary
            boundaries: List of sentence boundaries
            direction: "start" to find nearest start, "end" to find nearest end

        Returns:
            The snapped time (or original if no close boundary)
        """
        if not boundaries:
            return time

        tolerance = 0.5  # Only snap if boundary is within 0.5s

        if direction == "start":
            # Find nearest sentence start
            for b in boundaries:
                if abs(b["start_time"] - time) < tolerance:
                    return b["start_time"]
        else:
            # Find nearest sentence end
            for b in boundaries:
                if abs(b["end_time"] - time) < tolerance:
                    return b["end_time"]

        return time

    def calculate_smart_padding(
        self,
        start_time: float,
        end_time: float,
        word_timestamps: List[Dict],
        boundaries: List[Dict]
    ) -> Tuple[float, float]:
        """
        Apply smart padding to timestamps:
        1. EXPAND to sentence boundary that CONTAINS the start (not just nearby)
        2. EXPAND to sentence boundary that CONTAINS the end
        3. Add small buffer for audio fade
        4. Ensure we don't cut within a word

        This prevents hooks from starting mid-sentence and loops from ending mid-sentence.

        Returns adjusted (start_time, end_time)
        """
        start_snapped = start_time
        end_snapped = end_time

        # CRITICAL FIX: Find the sentence that CONTAINS our start time
        # and expand backwards to capture the FULL sentence beginning
        for boundary in boundaries:
            b_start = boundary["start_time"]
            b_end = boundary["end_time"]

            # If our start_time falls within this sentence, expand to sentence start
            if b_start <= start_time <= b_end:
                # Only expand if we're not already at the start
                if start_time - b_start > 0.1:  # More than 0.1s into the sentence
                    print(f"[CLIPS] EXPANDING start from {start_time:.2f}s to sentence start {b_start:.2f}s")
                    start_snapped = b_start
                break

        # CRITICAL FIX: Find the sentence that CONTAINS our end time
        # and expand forward to capture the FULL sentence ending
        for boundary in boundaries:
            b_start = boundary["start_time"]
            b_end = boundary["end_time"]

            # If our end_time falls within this sentence, expand to sentence end
            if b_start <= end_time <= b_end:
                # Only expand if we're not already at the end
                if b_end - end_time > 0.1:  # More than 0.1s before sentence end
                    print(f"[CLIPS] EXPANDING end from {end_time:.2f}s to sentence end {b_end:.2f}s")
                    end_snapped = b_end
                break

        # Find word boundaries to avoid cutting mid-word
        for wt in word_timestamps:
            wt_start = wt.get("start", 0)
            wt_end = wt.get("end", 0)

            # If our start is in the middle of a word, snap to word start
            if wt_start < start_snapped < wt_end:
                start_snapped = wt_start
                break

        for wt in reversed(word_timestamps):
            wt_start = wt.get("start", 0)
            wt_end = wt.get("end", 0)

            # If our end is in the middle of a word, snap to word end
            if wt_start < end_snapped < wt_end:
                end_snapped = wt_end
                break

        # Add small buffer (0.15s before start, 0.2s after end)
        # This prevents abrupt cuts
        start_final = max(0, start_snapped - 0.15)
        end_final = end_snapped + 0.2

        return (start_final, end_final)

    def find_timestamp_for_phrase(
        self,
        phrase: str,
        word_timestamps: List[Dict],
        use_smart_padding: bool = True,
        transcript_segments: Optional[List[Dict]] = None
    ) -> Tuple[float, float]:
        """
        Find the start and end timestamps for a phrase in the word timestamps.
        Uses multiple strategies for robust matching + smart padding.

        Args:
            phrase: Text to search for
            word_timestamps: List of {word, start, end} dicts
            use_smart_padding: Whether to apply sentence-aware padding
            transcript_segments: Optional original YouTube transcript segments for better boundaries

        Returns:
            Tuple of (start_time, end_time) in seconds
        """
        if not word_timestamps or not phrase:
            return (0.0, 3.0)

        # Pre-compute sentence boundaries for smart padding
        # Use transcript_segments if available (more accurate than synthesized boundaries)
        boundaries = self.find_sentence_boundaries(word_timestamps, transcript_segments) if use_smart_padding else []

        # Clean and normalize phrase
        phrase_clean = re.sub(r'[^\w\s]', '', phrase.lower())
        phrase_words = phrase_clean.split()

        if not phrase_words:
            return (0.0, 3.0)

        # Build full transcript text with word indices
        full_text = ""
        word_positions = []  # (start_idx, end_idx, word_timestamp_idx)
        for idx, wt in enumerate(word_timestamps):
            word = wt.get("word", "")
            start_pos = len(full_text)
            full_text += word.lower() + " "
            word_positions.append((start_pos, len(full_text) - 1, idx))

        def apply_padding(start_time: float, end_time: float) -> Tuple[float, float]:
            """Apply smart padding if enabled, otherwise simple padding."""
            if use_smart_padding and boundaries:
                return self.calculate_smart_padding(start_time, end_time, word_timestamps, boundaries)
            else:
                # Simple padding: 0.15s before, 0.2s after
                return (max(0, start_time - 0.15), end_time + 0.2)

        # Strategy 1: Search for first 3-5 distinctive words
        search_words = phrase_words[:min(5, len(phrase_words))]
        search_pattern = r'\b' + r'[^\w]*'.join(re.escape(w) for w in search_words)

        match = re.search(search_pattern, full_text)
        if match:
            # Find which word timestamps correspond to this match
            match_start = match.start()
            match_end = match.end()

            start_idx = None
            end_idx = None
            for start_pos, end_pos, wt_idx in word_positions:
                if start_idx is None and start_pos <= match_start < end_pos + 1:
                    start_idx = wt_idx
                if start_pos < match_end:
                    end_idx = wt_idx

            if start_idx is not None and end_idx is not None:
                # Extend end to cover expected phrase duration
                expected_words = len(phrase_words)
                end_idx = min(start_idx + expected_words, len(word_timestamps) - 1)

                start_time = word_timestamps[start_idx].get("start", 0)
                end_time = word_timestamps[end_idx].get("end", start_time + 3)
                return apply_padding(start_time, end_time)

        # Strategy 2: Search for ANY 2-word sequence from the phrase
        for i in range(len(phrase_words) - 1):
            two_words = phrase_words[i:i+2]
            search_str = ' '.join(two_words)
            if len(search_str) >= 6:  # At least 6 chars
                # Search in full text
                if search_str in full_text:
                    pos = full_text.find(search_str)
                    for start_pos, end_pos, wt_idx in word_positions:
                        if start_pos <= pos <= end_pos:
                            start_time = word_timestamps[wt_idx].get("start", 0)
                            end_idx = min(wt_idx + len(phrase_words), len(word_timestamps) - 1)
                            end_time = word_timestamps[end_idx].get("end", start_time + 3)
                            print(f"[CLIPS] Found via 2-word match: '{search_str}' at {start_time:.1f}s")
                            return apply_padding(start_time, end_time)

        # Strategy 3: Search for any unique word (5+ chars) from the phrase
        for unique_word in phrase_words:
            if len(unique_word) >= 5:  # Skip short common words
                for idx, wt in enumerate(word_timestamps):
                    word_clean = re.sub(r'[^\w]', '', wt.get("word", "").lower())
                    if unique_word == word_clean or (len(unique_word) >= 6 and unique_word in word_clean):
                        start_time = wt.get("start", 0)
                        end_idx = min(idx + len(phrase_words), len(word_timestamps) - 1)
                        end_time = word_timestamps[end_idx].get("end", start_time + 3)
                        print(f"[CLIPS] Found via word match: '{unique_word}' at {start_time:.1f}s")
                        return apply_padding(start_time, end_time)

        # Strategy 4: Sliding window with fuzzy matching (relaxed)
        for i in range(len(word_timestamps) - min(3, len(phrase_words)) + 1):
            window = word_timestamps[i:i + min(5, len(phrase_words))]
            window_words = [re.sub(r'[^\w]', '', w.get("word", "").lower()) for w in window]

            # Check if at least 50% of first 5 words match
            matches = sum(1 for pw in phrase_words[:5] if any(pw in ww or ww in pw for ww in window_words))
            if matches >= 2:  # At least 2 matches
                start = window[0].get("start", 0)
                end_idx = min(i + len(phrase_words), len(word_timestamps) - 1)
                end = word_timestamps[end_idx].get("end", start + 3)
                print(f"[CLIPS] Found via fuzzy match ({matches}/5 words) at {start:.1f}s")
                return apply_padding(start, end)

        print(f"[CLIPS] Warning: Could not find timestamp for phrase: '{phrase[:50]}...'")
        return (0.0, 3.0)

    def _fuzzy_match(self, words1: List[str], words2: List[str]) -> bool:
        """Check if two word lists roughly match."""
        if len(words1) != len(words2):
            return False
        matches = sum(1 for w1, w2 in zip(words1, words2) if w1 == w2 or w1 in w2 or w2 in w1)
        return matches >= len(words1) * 0.7
