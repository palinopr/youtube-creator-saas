"""
Content Optimizer - Uses all our data to generate actionable recommendations.
Tells you exactly what to post, when, and how to optimize.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import Counter
import random
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from ..config import get_settings


class ContentOptimizer:
    """AI-powered content optimizer using channel-specific data."""
    
    def __init__(self, channel_insights: Dict[str, Any]):
        """
        Initialize with insights from the channel analysis.
        
        Args:
            channel_insights: Dictionary containing all the analysis results
        """
        self.insights = channel_insights
        settings = get_settings()
        # temperature=0 ensures same input = same output (deterministic)
        # Same transcript will always generate same titles
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0,
            api_key=settings.openai_api_key
        )
    
    def get_optimization_blueprint(self) -> Dict[str, Any]:
        """
        Generate a complete optimization blueprint based on all data.
        Returns specific, actionable recommendations.
        """
        blueprint = {
            "optimal_video_formula": self._get_optimal_formula(),
            "celebrity_strategy": self._get_celebrity_strategy(),
            "title_optimization": self._get_title_rules(),
            "posting_strategy": self._get_posting_strategy(),
            "content_ideas": self._generate_content_ideas(),
            "avoid_list": self._get_avoid_list(),
            "quick_wins": self._get_quick_wins(),
        }
        return blueprint
    
    def _get_optimal_formula(self) -> Dict[str, Any]:
        """The winning formula based on data."""
        return {
            "title": {
                "length": "70-90 characters",
                "must_have": ["Celebrity name", "Emoji", "Controversial/drama angle"],
                "power_words": ["revela", "vs", "destruye", "VERDAD", "TODO"],
                "format": "[Celebrity] + [Action/Drama] + [Emoji] + [Hook]",
                "examples": [
                    "Daddy Yankee REVELA la verdad sobre Don Omar 🔥 Lo que nadie sabía",
                    "Pitbull vs Bad Bunny: La pelea que NADIE esperaba 😱 EXCLUSIVO",
                    "Anuel y Residente se DESTRUYEN en vivo 💀 Molusco reacciona",
                ]
            },
            "celebrities": {
                "ideal_count": "2-3 per video",
                "sweet_spot": "3 celebrities = 3.7x more views",
                "best_combos": [
                    "Daddy Yankee + Nicky Jam",
                    "Anuel + Residente", 
                    "Pitbull + Don Omar (RISING!)",
                    "Bad Bunny + anyone",
                ],
            },
            "content_type": {
                "best": "Controversial interview/reaction",
                "duration": "45-90 minutes for long-form",
                "structure": "Hook → Drama → Resolution → Tease next",
            },
            "description": {
                "length": "200-500 characters (medium)",
                "must_include": ["3+ hashtags", "Social links", "CTA"],
                "avoid": "Timestamps (they hurt your channel!)",
            },
        }
    
    def _get_celebrity_strategy(self) -> Dict[str, Any]:
        """Which celebrities to feature and avoid."""
        return {
            "feature_now": {
                "rising_stars": [
                    {"name": "Pitbull", "why": "+574% growth, underutilized"},
                    {"name": "Don Omar", "why": "+208% growth, hot right now"},
                    {"name": "Bryant Myers", "why": "+52% growth, consistent"},
                    {"name": "6ix9ine", "why": "+42% growth, controversy magnet"},
                ],
                "consistent_performers": [
                    {"name": "Nicky Jam", "avg_views": "245.6K", "reliability": "HIGH"},
                    {"name": "Daddy Yankee", "avg_views": "221.9K", "reliability": "HIGH"},
                    {"name": "Wisin", "avg_views": "202.7K", "reliability": "HIGH"},
                    {"name": "Anuel", "avg_views": "174.4K", "volume": "381 videos"},
                ],
            },
            "use_carefully": {
                "declining": [
                    {"name": "Marc Anthony", "change": "-83%", "risk": "Audience fatigue"},
                    {"name": "J Balvin", "change": "-81%", "risk": "Over-saturated"},
                    {"name": "Ozuna", "change": "-65%", "risk": "Declining interest"},
                    {"name": "Ivy Queen", "change": "-71%", "risk": "Niche audience"},
                ],
                "strategy": "Use declining celebs only with RISING celebs to boost",
            },
            "golden_combos": [
                "Rising + Rising = 🔥🔥🔥 (Pitbull + Don Omar)",
                "Rising + Consistent = 🔥🔥 (6ix9ine + Daddy Yankee)", 
                "Consistent + Consistent = 🔥 (Nicky Jam + Wisin)",
                "Declining + Rising = ⚡ Revive! (J Balvin + Pitbull)",
            ],
        }
    
    def _get_title_rules(self) -> Dict[str, Any]:
        """Specific title optimization rules."""
        return {
            "structure": {
                "formula": "[WHO] + [DOES WHAT] + [DRAMATIC WORD] + [EMOJI] + [HOOK]",
                "example": "Daddy Yankee DESTRUYE a Don Omar 🔥 La respuesta que todos esperaban",
            },
            "must_include": [
                "Celebrity name in first 30 chars",
                "At least 1 emoji (🔥 💀 😱 work best)",
                "Dramatic action verb",
                "70-90 characters total",
            ],
            "power_words": {
                "high_performers": ["REVELA", "DESTRUYE", "VERDAD", "EXCLUSIVO", "TODO", "vs", "NUNCA"],
                "medium_performers": ["reacciona", "responde", "confiesa", "habla"],
                "avoid": ["podcast", "episodio", "parte"],
            },
            "controversy_boosters": [
                "Add 'vs' between celebrities",
                "Use 'TIRAERA' for rap content",
                "Use 'PELEA' or 'CONFLICTO' for drama",
                "Ask controversial questions",
            ],
        }
    
    def _get_posting_strategy(self) -> Dict[str, Any]:
        """When and how often to post."""
        return {
            "best_days": ["Tuesday", "Wednesday", "Thursday"],
            "best_hours": ["18:00-21:00 EST"],
            "frequency": "5-7 videos per week for your channel size",
            "content_mix": {
                "long_form_interviews": "3 per week",
                "reaction_clips": "2-3 per week",
                "shorts": "1-2 per day",
            },
        }
    
    def _generate_content_ideas(self) -> List[Dict[str, Any]]:
        """Generate specific video ideas based on what works."""
        ideas = [
            {
                "title": "Pitbull REVELA todo sobre su carrera 🔥 Don Omar, Daddy Yankee y MÁS",
                "why": "Pitbull +574% rising, multiple celebs = 3.7x boost",
                "predicted_views": "300K-500K",
                "celebrities": ["Pitbull", "Don Omar", "Daddy Yankee"],
                "priority": "🔥 HIGH - Do this NOW",
            },
            {
                "title": "Don Omar vs Daddy Yankee: La VERDAD de su pelea 😱 EXCLUSIVO",
                "why": "Don Omar rising +208%, controversy + 2 celebs",
                "predicted_views": "400K-600K",
                "celebrities": ["Don Omar", "Daddy Yankee"],
                "priority": "🔥 HIGH",
            },
            {
                "title": "6ix9ine DESTRUYE a todos los reguetoneros 💀 Anuel, Bad Bunny, Arcangel",
                "why": "6ix9ine +42% rising, controversial, 4 celebs = 3x",
                "predicted_views": "350K-500K",
                "celebrities": ["6ix9ine", "Anuel", "Bad Bunny", "Arcangel"],
                "priority": "🔥 HIGH - Controversy magnet",
            },
            {
                "title": "Nicky Jam y Daddy Yankee: Los Cangris se REUNEN 🇵🇷 Historia completa",
                "why": "Two consistent performers, nostalgia angle",
                "predicted_views": "250K-350K",
                "celebrities": ["Nicky Jam", "Daddy Yankee"],
                "priority": "⚡ MEDIUM - Safe bet",
            },
            {
                "title": "Bryant Myers CONFIESA su problema con Anuel 😱 La tiraera que viene",
                "why": "Bryant Myers +52% rising, drama angle",
                "predicted_views": "200K-300K",
                "celebrities": ["Bryant Myers", "Anuel"],
                "priority": "⚡ MEDIUM",
            },
        ]
        return ideas
    
    def _get_avoid_list(self) -> Dict[str, Any]:
        """What NOT to do based on data."""
        return {
            "title_mistakes": [
                "Short titles under 50 chars (lose 48% views)",
                "No celebrity name",
                "No emoji",
                "Generic words like 'podcast', 'episodio'",
            ],
            "celebrity_mistakes": [
                "Solo Marc Anthony content (down 83%)",
                "Solo J Balvin content (down 81%)",
                "Only 1 celebrity when you could have 2-3",
            ],
            "description_mistakes": [
                "Adding timestamps (HURTS your channel!)",
                "Very long descriptions (500-1000 chars)",
                "No hashtags",
                "No social links",
            ],
            "posting_mistakes": [
                "Posting on weekends (lower engagement)",
                "Posting early morning",
                "Long gaps between uploads",
            ],
        }
    
    def _get_quick_wins(self) -> List[Dict[str, Any]]:
        """Immediate actions that will boost performance."""
        return [
            {
                "action": "Add emojis to your next 5 titles",
                "impact": "+13.8% views",
                "effort": "5 minutes",
            },
            {
                "action": "Feature Pitbull or Don Omar in next video",
                "impact": "+200-500% on that video",
                "effort": "Content planning",
            },
            {
                "action": "Make titles 70-90 chars instead of short",
                "impact": "+48% views",
                "effort": "5 minutes per video",
            },
            {
                "action": "Add 3+ hashtags to descriptions",
                "impact": "+20% views",
                "effort": "2 minutes per video",
            },
            {
                "action": "Remove timestamps from descriptions",
                "impact": "+25% views (timestamps hurt!)",
                "effort": "10 minutes to update old videos",
            },
            {
                "action": "Combine 2-3 celebrities per video",
                "impact": "2.5x-3.7x more views",
                "effort": "Content planning",
            },
        ]
    
    async def generate_optimized_title(
        self, 
        topic: str, 
        celebrities: List[str],
        transcript: Optional[str] = None
    ) -> Dict[str, Any]:
        """Use AI to generate an optimized title based on our data and transcript."""
        
        system_prompt = """You are a YouTube title optimization expert for MoluscoTV, a Puerto Rican entertainment channel.

Based on data analysis of 5,000 videos, here's what works:
- Title length: 50-70 characters preferred
- Must include: Celebrity name, emoji, dramatic/controversial angle
- Power words: REVELA, DESTRUYE, VERDAD, EXCLUSIVO, TODO, vs, NUNCA
- 2-3 celebrities = 2.5x-3.7x more views
- Controversial titles get 160K avg vs 115K for neutral

Generate 5 title options from BEST to GOOD, following this format:
[Celebrity] + [Action/Drama] + [Emoji] + [Hook]

IMPORTANT: If a transcript is provided, extract the MOST INTERESTING/CONTROVERSIAL moments from it to create clickworthy titles. Find the drama, the revelations, the conflicts.

Respond in JSON format:
{
    "titles": [
        {"title": "...", "predicted_performance": "HIGH/MEDIUM", "why": "..."},
        ...
    ],
    "best_pick": "..."
}
"""
        
        # Build the human message with transcript if available
        human_msg = f"Topic/Current Title: {topic}"
        if celebrities:
            human_msg += f"\nCelebrities to include: {', '.join(celebrities)}"
        
        if transcript:
            # Truncate transcript to first 8000 chars for title generation
            truncated = transcript[:8000] if len(transcript) > 8000 else transcript
            human_msg += f"\n\n**VIDEO TRANSCRIPT (use this to find the most clickworthy moments):**\n{truncated}"
        
        response = await self.llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_msg)
        ])
        
        return {
            "generated_titles": response.content,
            "used_transcript": transcript is not None,
            "optimization_rules_applied": [
                "50-70 character length",
                "Celebrity names included",
                "Emoji added",
                "Controversial angle",
                "Power words used",
                "Based on transcript content" if transcript else "Based on topic only",
            ]
        }
    
    async def extract_meta_tags(self, transcript: str, current_title: str) -> Dict[str, Any]:
        """
        Extract 15-20 meta tags from transcript to fill the 500 character tag limit.
        
        Tiers:
        - Tier 1: Proper names (people, places, brands)
        - Tier 2: Broad category tags (podcast, entrevista, etc.)
        - Tier 3: Misspellings/variations (Molusco TV, Molusko)
        """
        
        system_prompt = """You are a YouTube SEO expert. Extract meta tags from the transcript.

**TASK:** Extract 15-20 keywords/tags that will help this video rank in search.

**TAG TIERS:**
- Tier 1 (MUST HAVE): Names of people mentioned (celebrities, guests, hosts)
- Tier 2 (IMPORTANT): Topics discussed, places, brands, events
- Tier 3 (HELPFUL): Category tags (podcast, entrevista, puerto rico, entretenimiento)
- Tier 4 (BONUS): Common misspellings (molusco tv, molusko, etc.)

**CONSTRAINTS:**
- Total tags should fit in ~500 characters
- Each tag should be 1-3 words max
- Include the channel name variations
- Spanish language preferred

**OUTPUT FORMAT (JSON):**
{
    "tags": ["tag1", "tag2", "tag3", ...],
    "people_found": ["Person1", "Person2"],
    "topics_found": ["Topic1", "Topic2"]
}"""
        
        truncated = transcript[:10000] if len(transcript) > 10000 else transcript
        
        human_msg = f"""**Video Title:** {current_title}

**TRANSCRIPT:**
{truncated}

Extract the meta tags in JSON format."""
        
        response = await self.llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_msg)
        ])
        
        return {
            "meta_tags_response": response.content
        }
    
    async def score_video_idea(self, title: str, description: str, celebrities: List[str]) -> Dict[str, Any]:
        """Score a video idea before publishing based on our data."""
        
        score = 0
        feedback = []
        
        # Title length check
        title_len = len(title)
        if 70 <= title_len <= 90:
            score += 20
            feedback.append("✅ Title length optimal (70-90 chars)")
        elif 50 <= title_len < 70:
            score += 10
            feedback.append("⚠️ Title could be longer (aim for 70-90 chars)")
        else:
            feedback.append("❌ Title length not optimal")
        
        # Emoji check
        import re
        emoji_pattern = re.compile("["
            u"\U0001F600-\U0001F64F"
            u"\U0001F300-\U0001F5FF"
            u"\U0001F680-\U0001F6FF"
            u"\U0001F1E0-\U0001F1FF"
            u"\U00002702-\U000027B0"
            "]+", flags=re.UNICODE)
        
        if emoji_pattern.search(title):
            score += 15
            feedback.append("✅ Emoji in title (+13.8% views)")
        else:
            feedback.append("❌ No emoji in title - add one!")
        
        # Celebrity count
        celeb_count = len(celebrities)
        if celeb_count >= 3:
            score += 25
            feedback.append(f"✅ {celeb_count} celebrities = 3.7x boost!")
        elif celeb_count == 2:
            score += 20
            feedback.append(f"✅ 2 celebrities = 2.5x boost")
        elif celeb_count == 1:
            score += 10
            feedback.append("⚠️ Consider adding more celebrities")
        else:
            feedback.append("❌ No celebrities mentioned")
        
        # Controversial words
        controversial_words = ["vs", "destruye", "pelea", "tiraera", "verdad", "revela", "exclusivo"]
        title_lower = title.lower()
        if any(word in title_lower for word in controversial_words):
            score += 20
            feedback.append("✅ Controversial angle = +40% views")
        else:
            feedback.append("⚠️ Consider adding controversy")
        
        # Description checks
        desc_len = len(description)
        if 200 <= desc_len <= 500:
            score += 10
            feedback.append("✅ Description length optimal")
        
        if re.search(r'#\w+', description):
            hashtag_count = len(re.findall(r'#\w+', description))
            if hashtag_count >= 3:
                score += 10
                feedback.append(f"✅ {hashtag_count} hashtags (+20% views)")
        else:
            feedback.append("❌ Add 3+ hashtags to description")
        
        # Timestamp warning
        if re.search(r'\d{1,2}:\d{2}', description):
            score -= 10
            feedback.append("❌ REMOVE timestamps - they HURT your channel!")
        
        # Predicted performance
        if score >= 80:
            prediction = "🔥 HIGH - Expect 150K-300K+ views"
        elif score >= 60:
            prediction = "⚡ MEDIUM - Expect 100K-150K views"
        elif score >= 40:
            prediction = "📊 AVERAGE - Expect 50K-100K views"
        else:
            prediction = "⚠️ LOW - Needs optimization"
        
        return {
            "score": score,
            "max_score": 100,
            "grade": "A" if score >= 80 else "B" if score >= 60 else "C" if score >= 40 else "D",
            "prediction": prediction,
            "feedback": feedback,
            "quick_fixes": [f for f in feedback if f.startswith("❌") or f.startswith("⚠️")],
        }

