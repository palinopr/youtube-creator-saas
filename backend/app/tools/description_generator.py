"""
Description Generator - 4-Zone Architecture for High-Performance YouTube Descriptions

Zone 1: The Hook (Above the fold - first 140-200 chars)
Zone 2: The Context (SEO keywords)
Zone 3: The Navigation (Timestamps/Chapters)
Zone 4: The Funnel (Static links, hashtags)
"""

from typing import Dict, Any, Optional, List
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
import json
import re
from ..config import get_settings


class DescriptionGenerator:
    """Generates SEO-optimized YouTube descriptions using 4-zone architecture."""
    
    SYSTEM_PROMPT = """**ROLE:**
You are an expert YouTube SEO Strategist for MoluscoTV, a Puerto Rican entertainment channel.

**TASK:**
Generate a YouTube description optimized for High CTR and SEO using the 4-zone architecture.

**OUTPUT FORMAT (JSON):**
{
  "hook": "Write 2 sentences (max 200 chars). Start with a conflict, a secret revealed, or a high-value promise. Do NOT use 'In this video' or 'Welcome back'. Make it IRRESISTIBLE to click.",
  "summary": "Write a 100-word summary using natural language. Include keywords related to the main topic naturally. This is for SEO.",
  "chapters": [
    {"time": "00:00", "title": "Intro"},
    {"time": "MM:SS", "title": "Clickbaity descriptive title for this section"},
    ...
  ],
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}

**CONSTRAINTS:**
- Tone: Exciting but professional.
- Language: MUST be in Spanish (Puerto Rican Spanish preferred).
- Hook: Must create curiosity or urgency. Use power words.
- Chapters: Identify 4-6 key moments from the transcript. Make titles clickbaity but accurate.
- Hashtags: Only 3, relevant to the content.

**EXAMPLES OF GOOD HOOKS:**
- "Lugaro finalmente rompe el silencio sobre la controversia con Gallo. Revela el mensaje que lo cambió todo..."
- "Lo que Bad Bunny confesó en privado NUNCA debió salir a la luz. Molusco reacciona..."
- "La VERDAD detrás de la pelea entre Daddy Yankee y Don Omar. Esto nadie lo sabía..."

**EXAMPLES OF BAD HOOKS (NEVER DO THIS):**
- "En este video hablamos de..." ❌
- "Bienvenidos a otro episodio..." ❌
- "Hoy vamos a discutir..." ❌"""

    def __init__(self):
        settings = get_settings()
        # temperature=0 for deterministic output
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0,
            api_key=settings.openai_api_key
        )
    
    async def generate_description(
        self,
        title: str,
        transcript: str,
        social_links: Optional[Dict[str, str]] = None,
        original_description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a 4-zone optimized description.
        
        Args:
            title: Video title
            transcript: Full video transcript with timestamps if available
            social_links: Dict with instagram, twitter, tiktok, website URLs
            original_description: The current video description (to extract existing links)
            
        Returns:
            Dict with hook, summary, chapters, hashtags, and full_description
        """
        
        # Truncate transcript if too long (keep first 15000 chars for context)
        truncated_transcript = transcript[:15000] if len(transcript) > 15000 else transcript
        
        human_msg = f"""**Video Title:** {title}

**Transcript:**
{truncated_transcript}

Generate the 4-zone description in JSON format."""

        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=self.SYSTEM_PROMPT),
                HumanMessage(content=human_msg)
            ])
            
            # Parse the JSON response
            content = response.content
            # Clean up markdown code blocks if present
            content = re.sub(r'```json\n?|```', '', content).strip()
            
            data = json.loads(content)
            
            # Build Zone 4 - prefer extracted links from original description
            if original_description:
                extracted_links = self._extract_links_from_description(original_description)
                if extracted_links:
                    # Use extracted links + standard CTAs
                    zone4 = f"{extracted_links}\n\n👍 Dale LIKE si te gustó el contenido\n🔔 SUSCRÍBETE y activa la campanita\n💬 Comenta tu opinión abajo"
                else:
                    zone4 = self._build_zone4(social_links)
            else:
                zone4 = self._build_zone4(social_links)
            
            # Assemble full description
            full_description = self._assemble_description(data, zone4)
            
            return {
                "zone1_hook": data.get("hook", ""),
                "zone2_summary": data.get("summary", ""),
                "zone3_chapters": data.get("chapters", []),
                "zone4_funnel": zone4,
                "hashtags": data.get("hashtags", []),
                "full_description": full_description,
                "success": True
            }
            
        except json.JSONDecodeError as e:
            # Fallback if JSON parsing fails
            return {
                "error": f"Failed to parse AI response: {str(e)}",
                "success": False,
                "full_description": self._build_fallback_description(title, social_links)
            }
        except Exception as e:
            return {
                "error": str(e),
                "success": False,
                "full_description": self._build_fallback_description(title, social_links)
            }
    
    def _build_zone4(self, social_links: Optional[Dict[str, str]] = None) -> str:
        """Build Zone 4 - The static funnel section."""
        lines = []
        
        # Social links
        if social_links:
            links = []
            if social_links.get("instagram"):
                links.append(f"📸 Instagram: {social_links['instagram']}")
            if social_links.get("twitter"):
                links.append(f"🐦 Twitter/X: {social_links['twitter']}")
            if social_links.get("tiktok"):
                links.append(f"🎵 TikTok: {social_links['tiktok']}")
            if social_links.get("website"):
                links.append(f"🌐 Web: {social_links['website']}")
            
            if links:
                lines.append("🔗 SÍGUENOS:")
                lines.extend(links)
                lines.append("")
        
        # Call to action
        lines.append("👍 Dale LIKE si te gustó el contenido")
        lines.append("🔔 SUSCRÍBETE y activa la campanita")
        lines.append("💬 Comenta tu opinión abajo")
        
        return "\n".join(lines)
    
    def _extract_links_from_description(self, original_description: str) -> str:
        """Extract the links/social section from the original description to preserve it."""
        if not original_description:
            return ""
        
        # Common patterns that indicate the start of links section
        link_section_markers = [
            "redes sociales",
            "social",
            "síguenos",
            "follow",
            "facebook:",
            "instagram:",
            "twitter:",
            "tiktok:",
            "https://www.facebook",
            "https://www.instagram",
            "https://www.twitter",
            "https://www.youtube",
            "para mas contenido",
            "más contenido",
        ]
        
        lines = original_description.split('\n')
        links_section_lines = []
        in_links_section = False
        
        for line in lines:
            line_lower = line.lower().strip()
            
            # Check if this line starts a links section
            if any(marker in line_lower for marker in link_section_markers):
                in_links_section = True
            
            # If we're in links section, capture the line
            if in_links_section:
                # Skip empty lines at the start
                if links_section_lines or line.strip():
                    links_section_lines.append(line)
            
            # Also capture lines that look like URLs or social handles
            if not in_links_section and ('http' in line_lower or '@' in line_lower):
                links_section_lines.append(line)
        
        # Clean up - remove hashtag lines (we'll generate our own)
        links_section_lines = [l for l in links_section_lines if not l.strip().startswith('#')]
        
        return '\n'.join(links_section_lines).strip()
    
    def _assemble_description(self, data: Dict[str, Any], zone4: str) -> str:
        """Assemble all zones into the final description."""
        parts = []
        
        # Zone 1: Hook (Above the fold)
        if data.get("hook"):
            parts.append(data["hook"])
            parts.append("")
        
        # Zone 2: Summary (SEO)
        if data.get("summary"):
            parts.append(data["summary"])
            parts.append("")
        
        # Zone 3: Chapters
        chapters = data.get("chapters", [])
        if chapters:
            parts.append("⏱️ TIMESTAMPS:")
            for chapter in chapters:
                if isinstance(chapter, dict):
                    parts.append(f"{chapter.get('time', '00:00')} - {chapter.get('title', '')}")
                elif isinstance(chapter, str):
                    parts.append(chapter)
            parts.append("")
        
        # Zone 4: Funnel
        parts.append(zone4)
        parts.append("")
        
        # Hashtags (max 3)
        hashtags = data.get("hashtags", [])[:3]
        if hashtags:
            # Ensure hashtags have # prefix
            formatted_hashtags = [f"#{h.lstrip('#')}" for h in hashtags]
            parts.append(" ".join(formatted_hashtags))
        
        return "\n".join(parts)
    
    async def generate_from_title_only(
        self,
        title: str,
        social_links: Optional[Dict[str, str]] = None,
        original_description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate description from title when transcript is not available."""
        
        title_prompt = """**ROLE:**
You are an expert YouTube SEO Strategist for MoluscoTV, a Puerto Rican entertainment channel.

**TASK:**
Generate a YouTube description based ONLY on the video title (no transcript available).

**OUTPUT FORMAT (JSON):**
{
  "hook": "Write 2 compelling sentences (max 200 chars) that create curiosity about the video. Start with conflict, intrigue, or a promise. Do NOT use 'In this video' or 'Welcome back'.",
  "summary": "Write a 50-word teaser about what viewers can expect, using natural language with relevant keywords.",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}

**CONSTRAINTS:**
- Language: Spanish (Puerto Rican)
- Tone: Exciting, create FOMO
- Extract celebrities/topics from title for keywords"""

        human_msg = f"**Video Title:** {title}\n\nGenerate description in JSON format."
        
        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=title_prompt),
                HumanMessage(content=human_msg)
            ])
            
            content = re.sub(r'```json\n?|```', '', response.content).strip()
            data = json.loads(content)
            
            # Build Zone 4 - prefer extracted links from original description
            if original_description:
                extracted_links = self._extract_links_from_description(original_description)
                if extracted_links:
                    zone4 = f"{extracted_links}\n\n👍 Dale LIKE si te gustó el contenido\n🔔 SUSCRÍBETE y activa la campanita\n💬 Comenta tu opinión abajo"
                else:
                    zone4 = self._build_zone4(social_links)
            else:
                zone4 = self._build_zone4(social_links)
            
            # Assemble description (no chapters since no transcript)
            parts = []
            if data.get("hook"):
                parts.append(data["hook"])
                parts.append("")
            if data.get("summary"):
                parts.append(data["summary"])
                parts.append("")
            parts.append(zone4)
            parts.append("")
            
            hashtags = data.get("hashtags", ["MoluscoTV", "Podcast", "Entretenimiento"])[:3]
            formatted_hashtags = [f"#{h.lstrip('#')}" for h in hashtags]
            parts.append(" ".join(formatted_hashtags))
            
            return {
                "zone1_hook": data.get("hook", ""),
                "zone2_summary": data.get("summary", ""),
                "zone3_chapters": [],  # No chapters without transcript
                "zone4_funnel": zone4,
                "hashtags": hashtags,
                "full_description": "\n".join(parts),
                "success": True,
                "note": "Generated from title only (no transcript available)"
            }
            
        except Exception as e:
            # Ultimate fallback
            zone4 = self._build_zone4(social_links)
            return {
                "zone1_hook": f"🔥 {title}",
                "zone2_summary": "",
                "zone3_chapters": [],
                "zone4_funnel": zone4,
                "hashtags": ["MoluscoTV", "Podcast", "Entretenimiento"],
                "full_description": f"🔥 {title}\n\n{zone4}\n\n#MoluscoTV #Podcast #Entretenimiento",
                "success": False,
                "error": str(e)
            }
    
    def _build_fallback_description(
        self, 
        title: str, 
        social_links: Optional[Dict[str, str]] = None
    ) -> str:
        """Build a simple fallback description if all else fails."""
        parts = [
            f"🔥 {title}",
            "",
        ]
        
        parts.append(self._build_zone4(social_links))
        parts.append("")
        parts.append("#MoluscoTV #Podcast #Entretenimiento")
        
        return "\n".join(parts)


# Quick test function
async def test_generator():
    gen = DescriptionGenerator()
    result = await gen.generate_description(
        title="Lugaro decide quien se queda con ella en 'La Real' ¿Quién entrevista mejor, Molusco o Gallo?",
        transcript="Hoy en La Real tenemos a Lugaro... ella va a decidir quién es mejor entrevistador...",
        social_links={"instagram": "https://instagram.com/moluscotv"}
    )
    print(result)

