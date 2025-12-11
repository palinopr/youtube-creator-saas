import json
import uuid
import logging
import asyncio
from typing import List, Dict, Any, Optional, TypedDict, Annotated, Literal
from dataclasses import asdict

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, END

from ..config import get_settings
from ..tools.clips_generator import ClipSuggestion, ClipSegment

# Define the state for the graph
class ClipState(TypedDict):
    video_title: str
    transcript: str
    word_timestamps: List[Dict]
    transcript_segments: Optional[List[Dict]]  # Original YouTube segments for better boundaries
    max_clips: int
    language: str
    candidates: List[Dict[str, Any]]
    final_clips: List[ClipSuggestion]

class ViralClipsAgent:
    """
    Simplified viral clips agent.

    NEW APPROACH: Find CONTIGUOUS 25-40 second segments that are viral.
    No more franken-biting random parts together.

    Workflow: Finder -> Refiner -> END
    """

    def __init__(self):
        settings = get_settings()
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.3,  # Lower temp for more consistent viral patterns
            api_key=settings.openai_api_key
        )
        self.workflow = self._build_graph()

    def _build_graph(self):
        """Build the simplified LangGraph workflow."""
        workflow = StateGraph(ClipState)

        # Only 2 nodes now
        workflow.add_node("finder", self.finder_node)
        workflow.add_node("refiner", self.refiner_node)

        # Simple linear flow
        workflow.set_entry_point("finder")
        workflow.add_edge("finder", "refiner")
        workflow.add_edge("refiner", END)

        return workflow.compile()

    async def generate_clips(
        self,
        transcript: str,
        video_title: str,
        word_timestamps: List[Dict],
        max_clips: int = 5,
        transcript_segments: Optional[List[Dict]] = None
    ) -> List[ClipSuggestion]:
        """Run the agent workflow to generate clips."""
        import time
        start_time = time.time()

        print(f"🤖 [AGENT] ========== STARTING WORKFLOW ==========")
        print(f"🤖 [AGENT] Transcript: {len(transcript)} chars")
        print(f"🤖 [AGENT] Word timestamps: {len(word_timestamps)} items")
        print(f"🤖 [AGENT] Transcript segments: {len(transcript_segments) if transcript_segments else 0} items")
        print(f"🤖 [AGENT] Max clips: {max_clips}")

        initial_state = {
            "video_title": video_title,
            "transcript": transcript,
            "word_timestamps": word_timestamps,
            "transcript_segments": transcript_segments,  # Pass original segments for better boundaries
            "max_clips": max_clips,
            "language": "es",  # Default, will be detected
            "candidates": [],
            "final_clips": []
        }

        print(f"🤖 [AGENT] Invoking workflow...")
        try:
            result = await self.workflow.ainvoke(initial_state)
            elapsed = time.time() - start_time
            print(f"🤖 [AGENT] ✅ Workflow completed in {elapsed:.1f}s")
            print(f"🤖 [AGENT] Final clips count: {len(result.get('final_clips', []))}")
            return result["final_clips"]
        except Exception as e:
            elapsed = time.time() - start_time
            print(f"🤖 [AGENT] ❌ Workflow FAILED after {elapsed:.1f}s: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            raise

    # --- NODES ---

    async def finder_node(self, state: ClipState) -> Dict:
        """
        Finder: Analyzes the FULL transcript and finds viral segments.

        KEY RULE: Each clip is ONE CONTIGUOUS 25-40 second segment.
        No franken-biting. Just find the best moments as they exist.
        """
        import time
        node_start = time.time()
        print("🔵 [FINDER] Starting viral segment search...")

        transcript = state['transcript']
        max_clips = state['max_clips']

        # Process transcript in chunks but look for contiguous segments
        chunk_size = 15000
        all_candidates = []

        for chunk_start in range(0, len(transcript), chunk_size - 1000):
            chunk = transcript[chunk_start:chunk_start + chunk_size]
            chunk_idx = chunk_start // chunk_size

            print(f"🔵 [FINDER] Analyzing chunk {chunk_idx + 1} (chars {chunk_start}-{chunk_start + len(chunk)})...")

            prompt = f"""You are an Elite Viral Clip Editor trained on 60 real viral shorts from top podcast channels.
Find {max_clips} CONTIGUOUS clips that will STOP THE SCROLL.

DURATION: 20-90 SECONDS - Let the content decide!
- Short punchy point? 20-30s
- Story with payoff? 40-60s
- Complex explanation? 60-90s
NEVER cut arbitrarily - END AT NATURAL CONCLUSION!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 HOOK PATTERNS - RANKED BY REAL VIRAL DATA (60 clips analyzed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🥇 CONTRARIAN (Avg Score: 78) - Challenge common beliefs IMMEDIATELY
   REAL EXAMPLES:
   ✓ "Poor people stay poor because they want a fast way to get rich." (Score: 80)
   ✓ "Chris Rock has a great saying: follow your dreams, if they're hiring." (Score: 82)
   ✓ "People want to protect your feelings... They don't want you to hear the truth." (Score: 79)

🥈 NUMBER_HOOK (Avg Score: 69) - Lead with specific number
   REAL EXAMPLES:
   ✓ "50 cent has been working on this documentary for almost two years..."
   ✓ "100%, that's what changed my life"

🥉 STATEMENT (Avg Score: 67) - Bold claim or famous quote
   REAL EXAMPLES:
   ✓ "The market does not care. And if you want truth, the market will give you the truth."
   ✓ "Ilhan Omar says Trump supporters might attack Somalis..."

🏅 QUESTION (Avg Score: 66) - Provocative question implying surprise
   REAL EXAMPLES:
   ✓ "How old are you? I'm 30." (then roast follows - 11M views)
   ✓ "Any piece of advice for someone about to graduate?"
   ✓ "Is it true that microwave safe just means the plastic won't melt?"

🏅 STORY_OPENER (Avg Score: 63) - Start mid-story about someone
   REAL EXAMPLES:
   ✓ "When Bill Gates married Melinda Gates, in his prenup..."
   ✓ "One of the scariest conversations I was privy to was a friend of mine..."

⚠️ DIRECT_ADDRESS (Avg Score: 60) - "If you..." hooks score lower
   ✓ "If you're a control freak, your automatic response will be..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 EMOTIONAL TONE - What makes content RESONATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRIORITY 1 - INSPIRATION (52% of viral): Motivates action, personal growth
   "resonates with aspiring [audience], encouraging self-improvement"

PRIORITY 2 - CURIOSITY (36% of viral): Makes viewer need to know more
   "challenges conventional wisdom, sparking curiosity"

AVOID: Pure controversy without value, negativity without resolution

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📺 CHANNEL STYLE GUIDE (Match content to these proven styles)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALEX HORMOZI STYLE (Avg: 76): Direct, confrontational. Challenges beliefs. Short punchy sentences. NO fluff.
CHRIS WILLIAMSON STYLE (Avg: 73): Philosophical insights. "You" focused. Self-improvement angles.
IMPAULSIVE STYLE (Avg: 70): Entertainment. Celebrity drama. High energy roasts.
PBD STYLE (Avg: 61): News commentary. Political/business hot takes. Story-based.
DIARY OF CEO STYLE (Avg: 57): Deep conversations. Vulnerable moments. Expert insights.
HUBERMAN STYLE (Avg: 53): Science-backed. Practical health tips. Research findings.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬 ENDINGS - 96% OF VIRAL CLIPS END WITH CONCLUSION!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ CONCLUSION (use 96% of the time!):
   - Delivers the payoff promised by hook
   - "And that's why...", "So the answer is...", "That's what I learned"
   - Viewer feels SATISFIED, shares because they got value

⚠️ PUNCHLINE (only 4%): Only if there's a perfect joke landing

DO NOT END with:
❌ Cliffhangers (frustrate viewers)
❌ Mid-sentence cuts
❌ Incomplete explanations
❌ Unanswered questions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 WHY CONTENT GOES VIRAL (pattern recognition)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VIRAL TRIGGERS:
✓ "Challenges a widely accepted belief, sparking debate"
✓ "Presents a thought-provoking perspective that resonates"
✓ "Offers a counterintuitive solution, prompting curiosity"
✓ "Addresses a common pain point with valuable insights"
✓ "Uses relatable analogy that engages viewers"

SKIP: Generic intros, admin talk ("subscribe before..."), rambling, setup without payoff

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{
    "segments": [
        {{
            "title": "Catchy title with emoji",
            "full_text": "EXACT continuous text from transcript - include complete thought!",
            "hook_text": "First 10-15 words",
            "hook_type": "CURIOSITY_GAP|QUESTION|BOLD_CLAIM|VALUE_BOMB|CONTRARIAN",
            "emotional_tone": "inspiration|curiosity|controversy|humor",
            "ending_signal": "CONCLUSION|PUNCHLINE",
            "ending_text": "Last 10-15 words - the exact ending phrase",
            "estimated_seconds": 20-90,
            "why_viral": "One sentence: what makes this resonate with viewers?",
            "viral_score": 1-10
        }}
    ]
}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 VIRAL SCORE CALIBRATION (Based on 60 real clips)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Score 8-10: Elite viral (CONTRARIAN hook + complete payoff + emotional peak)
Score 7-8: Excellent (Strong hook + good conclusion)
Score 6-7: Good (Decent hook, solid content)
Score 5-6: Average (Needs stronger hook or better ending)
Below 5: Skip (Weak hook or incomplete thought)

Average across 60 real viral clips: 6.5
Top 10% score: 7.5+

CRITICAL:
- full_text = EXACT quotes from transcript
- Include COMPLETE thoughts - don't cut mid-explanation
- Let content determine length
- Prioritize CONTRARIAN hooks - they score 18% higher than average
"""

            try:
                response = await self.llm.ainvoke([
                    SystemMessage(content=prompt),
                    HumanMessage(content=f"VIDEO: {state['video_title']}\n\nTRANSCRIPT CHUNK:\n{chunk}")
                ])

                data = self._parse_json(response.content)
                segments = data.get("segments", [])

                for seg in segments:
                    seg["chunk_start"] = chunk_start
                    all_candidates.append(seg)

            except Exception as e:
                print(f"🔵 [FINDER] ⚠️ Chunk {chunk_idx + 1} error: {e}")
                continue

        # Sort by viral_score and take top N
        all_candidates.sort(key=lambda x: x.get("viral_score", 0), reverse=True)
        top_candidates = all_candidates[:max_clips * 2]  # Get more than needed for filtering

        elapsed = time.time() - node_start
        print(f"🔵 [FINDER] ✅ Completed in {elapsed:.1f}s - Found {len(all_candidates)} candidates, selected top {len(top_candidates)}")

        return {"candidates": top_candidates}

    async def refiner_node(self, state: ClipState) -> Dict:
        """
        Refiner: Maps text to timestamps and validates.
        """
        import time
        node_start = time.time()
        print(f"🔴 [REFINER] Starting timestamp mapping for {len(state.get('candidates', []))} candidates...")

        from ..tools.clips_generator import FrankenBiteDetector
        detector = FrankenBiteDetector()

        final_clips = []
        used_time_ranges = []  # Track used timestamps to avoid duplicates
        word_timestamps = state.get("word_timestamps", [])
        transcript_segments = state.get("transcript_segments")  # Original segments for better boundaries
        max_clips = state.get("max_clips", 5)

        for i, candidate in enumerate(state.get("candidates", [])):
            if len(final_clips) >= max_clips:
                break

            print(f"🔴 [REFINER] Processing candidate {i+1}...")

            full_text = candidate.get("full_text", "")
            hook_text = candidate.get("hook_text", "")

            if not full_text or len(full_text) < 30:
                print(f"🔴 [REFINER] ❌ Candidate {i+1}: Text too short")
                continue

            # Find timestamps for the full text
            # Use the hook to anchor, then extend
            # Pass transcript_segments for better sentence boundary detection
            hook_timestamps = detector.find_timestamp_for_phrase(
                hook_text,
                word_timestamps,
                use_smart_padding=True,
                transcript_segments=transcript_segments
            )

            if not hook_timestamps:
                print(f"🔴 [REFINER] ❌ Candidate {i+1}: Could not find hook timestamps")
                continue

            hook_start, hook_end = hook_timestamps
            print(f"🔴 [REFINER] Hook found at {hook_start:.1f}s - {hook_end:.1f}s")

            # Check if this time range overlaps with any used range (duplicate detection)
            is_duplicate = False
            for used_start, used_end in used_time_ranges:
                # If hook_start is within 30 seconds of any used segment, it's a duplicate
                if abs(hook_start - used_start) < 30:
                    print(f"🔴 [REFINER] ❌ Candidate {i+1}: Duplicate (overlaps with segment at {used_start:.1f}s)")
                    is_duplicate = True
                    break
            if is_duplicate:
                continue

            # Get estimated duration and ending text from finder
            estimated_seconds = candidate.get("estimated_seconds", 40)
            ending_text = candidate.get("ending_text", "")

            # Try to find the ending_text timestamp first (most accurate)
            segment_end = None
            sentence_ends = []  # Initialize here to avoid scope issues
            if ending_text and len(ending_text) > 10:
                ending_timestamps = detector.find_timestamp_for_phrase(
                    ending_text,
                    word_timestamps,
                    use_smart_padding=True,
                    transcript_segments=transcript_segments
                )
                if ending_timestamps:
                    segment_end = ending_timestamps[1] + 0.3  # End of ending phrase + buffer
                    print(f"🔴 [REFINER] Found ending phrase at {segment_end:.1f}s")

            # If no ending found, use estimated duration with sentence boundary detection
            if not segment_end:
                segment_end_target = hook_start + estimated_seconds
                segment_end = hook_end

                # Build list of sentence boundaries in extended range (up to hook_start + 120s)
                sentence_ends = []
                for j, word in enumerate(word_timestamps):
                    word_text = word.get("word", "")
                    word_end = word.get("end", 0)

                    # Extended range - up to 2 minutes from hook
                    if word_end < hook_start or word_end > hook_start + 120:
                        continue

                    # Check for sentence-ending punctuation
                    is_sentence_end = any(p in word_text for p in ['.', '?', '!', '...'])

                    # Check for long pause after this word
                    has_long_pause = False
                    if j < len(word_timestamps) - 1:
                        next_start = word_timestamps[j + 1].get("start", 0)
                        gap = next_start - word_end
                        has_long_pause = gap > 0.5

                    if is_sentence_end or has_long_pause:
                        sentence_ends.append(word_end)

                # Find best sentence boundary near target (+/- 15 seconds flexibility)
                best_sentence_end = None
                # First look AFTER target (within +15s)
                for se in sentence_ends:
                    if se >= segment_end_target and se <= segment_end_target + 15:
                        best_sentence_end = se
                        break

                # If none after, look BEFORE target (but still > 20s total)
                if not best_sentence_end:
                    for se in reversed(sentence_ends):
                        if se >= hook_start + 20 and se < segment_end_target:
                            best_sentence_end = se
                            break

                if best_sentence_end:
                    segment_end = best_sentence_end + 0.3
                else:
                    # Fallback: extend to estimated target
                    for word in word_timestamps:
                        word_start = word.get("start", 0)
                        word_end = word.get("end", 0)
                        if word_start >= hook_start and word_end <= segment_end_target + 5:
                            segment_end = max(segment_end, word_end)

            # Validate duration - flexible range 15-90 seconds
            duration = segment_end - hook_start
            if duration < 15:
                print(f"🔴 [REFINER] ❌ Candidate {i+1}: Duration too short ({duration:.1f}s)")
                continue
            if duration > 95:
                # Find last sentence boundary before 90s
                for se in reversed(sentence_ends):
                    if se <= hook_start + 90 and se >= hook_start + 20:
                        segment_end = se + 0.3
                        break
                else:
                    segment_end = hook_start + 90
                duration = segment_end - hook_start

            print(f"🔴 [REFINER] ✅ Candidate {i+1}: {duration:.1f}s segment ({hook_start:.1f}s - {segment_end:.1f}s)")

            # Track this time range to prevent duplicates
            used_time_ranges.append((hook_start, segment_end))

            # Convert viral_score from 1-10 scale to 0-100 scale
            raw_score = candidate.get("viral_score", 7)
            viral_score_100 = min(100, max(0, int(raw_score * 10)))

            # Create the clip as ONE CONTIGUOUS segment
            # Define non-overlapping segments for hook/body/loop
            # The full clip plays from hook_start to segment_end (one continuous piece)
            # We just label the parts for the UI
            hook_duration = min(5, duration * 0.15)  # Hook is first 5s or 15% of clip
            loop_duration = min(3, duration * 0.10)  # Loop is last 3s or 10% of clip

            hook_end_time = hook_start + hook_duration
            loop_start_time = segment_end - loop_duration

            clip = ClipSuggestion(
                clip_id=str(uuid.uuid4())[:8],
                title=candidate.get("title", f"Clip {i+1}"),
                hook=ClipSegment(
                    start_time=hook_start,
                    end_time=hook_end_time,
                    text=hook_text,
                    segment_type="hook"
                ),
                body_segments=[
                    ClipSegment(
                        start_time=hook_end_time,  # Body starts AFTER hook ends
                        end_time=loop_start_time,   # Body ends BEFORE loop starts
                        text=full_text,
                        segment_type="body"
                    )
                ],
                loop_ending=ClipSegment(
                    start_time=loop_start_time,
                    end_time=segment_end,
                    text="",
                    segment_type="loop_ending"
                ),
                total_duration=duration,
                viral_score=viral_score_100,
                why_viral=candidate.get("why_viral", candidate.get("title", "High engagement potential"))
            )

            final_clips.append(clip)

        elapsed = time.time() - node_start
        print(f"🔴 [REFINER] ========== COMPLETED in {elapsed:.1f}s ==========")
        print(f"🔴 [REFINER] Final clips: {len(final_clips)}")

        return {"final_clips": final_clips}

    def _parse_json(self, text: str) -> dict:
        """Parse JSON from LLM response, handling markdown code blocks."""
        text = text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines)
        return json.loads(text)

    def _is_similar(self, text1: str, text2: str, threshold: float = 0.5) -> bool:
        """Check if two texts are similar using word overlap."""
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        if not words1 or not words2:
            return False
        intersection = len(words1 & words2)
        union = len(words1 | words2)
        return (intersection / union) > threshold if union > 0 else False


# Streaming wrapper for the agent
async def stream_clips_generation(
    transcript: str,
    video_title: str,
    word_timestamps: List[Dict],
    max_clips: int = 5
):
    """
    Stream clip generation events for real-time UI updates.
    """
    agent = ViralClipsAgent()

    # Use the compiled workflow with streaming
    initial_state = {
        "video_title": video_title,
        "transcript": transcript,
        "word_timestamps": word_timestamps,
        "max_clips": max_clips,
        "language": "es",
        "candidates": [],
        "final_clips": []
    }

    async for event in agent.workflow.astream(initial_state):
        # Event contains node outputs as they complete
        yield event
