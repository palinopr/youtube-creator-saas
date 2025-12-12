import re
from dataclasses import dataclass
from typing import List, Optional, Sequence, Set

from ..contracts.review import (
    Confidence,
    ConservativeSuggestion,
    ReviewChangeInput,
    ReviewChangeOutput,
    ReviewVerdict,
    RiskLevel,
)


_WORD_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9']+")

_STOPWORDS: Set[str] = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "but",
    "by",
    "for",
    "from",
    "how",
    "i",
    "if",
    "in",
    "into",
    "is",
    "it",
    "its",
    "my",
    "of",
    "on",
    "or",
    "our",
    "so",
    "that",
    "the",
    "their",
    "then",
    "this",
    "to",
    "was",
    "we",
    "what",
    "when",
    "where",
    "why",
    "with",
    "you",
    "your",
}


def _tokens(text: str) -> List[str]:
    return [m.group(0).lower() for m in _WORD_RE.finditer(text or "")]


def _key_tokens(text: str) -> Set[str]:
    keys: Set[str] = set()
    for token in _tokens(text):
        if token in _STOPWORDS:
            continue
        if token.isdigit():
            if len(token) >= 2:
                keys.add(token)
            continue
        if len(token) >= 4:
            keys.add(token)
    return keys


def _summarize_removed(removed: Sequence[str], max_items: int = 6) -> str:
    items = sorted(set([t for t in removed if t]))
    if not items:
        return ""
    shown = items[:max_items]
    suffix = "" if len(items) <= max_items else "..."
    return ", ".join(shown) + suffix


@dataclass(frozen=True)
class _HeuristicThresholds:
    min_title_chars_block: int = 8
    min_title_tokens_block: int = 2
    current_desc_len_warn_if_cleared: int = 200
    min_key_tokens_to_check: int = 4
    removed_key_ratio_warn: float = 0.5
    removed_key_min_warn: int = 2


class ReviewService:
    """Deterministic reviewer (placeholder; swap for LLM later)."""

    def __init__(self, *, thresholds: Optional[_HeuristicThresholds] = None):
        self._t = thresholds or _HeuristicThresholds()

    def review_change(self, request: ReviewChangeInput) -> ReviewChangeOutput:
        reasons: List[str] = []

        proposed_title = (request.proposed_title or "").strip()
        current_title = (request.current_title or "").strip()
        proposed_desc = (request.proposed_description or "").strip()
        current_desc = (request.current_description or "").strip()

        title_token_count = len(_tokens(proposed_title))
        if len(proposed_title) < self._t.min_title_chars_block or title_token_count < self._t.min_title_tokens_block:
            reasons.append("Proposed title is too short to preserve the original intent.")
            return ReviewChangeOutput(
                verdict=ReviewVerdict.block,
                risk_level=RiskLevel.high,
                confidence=Confidence.high,
                reasons=reasons[:3],
                conservative_suggestion=ConservativeSuggestion(
                    title=current_title or None,
                    description=current_desc or None,
                ),
            )

        if current_desc and not proposed_desc and len(current_desc) >= self._t.current_desc_len_warn_if_cleared:
            reasons.append("Proposed description removes most of the current description.")

        title_removed_reason = self._maybe_warn_on_removed_key_tokens(
            label="title",
            current_text=current_title,
            proposed_text=proposed_title,
        )
        if title_removed_reason:
            reasons.append(title_removed_reason)

        desc_removed_reason = self._maybe_warn_on_removed_key_tokens(
            label="description",
            current_text=current_desc,
            proposed_text=proposed_desc,
        )
        if desc_removed_reason:
            reasons.append(desc_removed_reason)

        reasons = [r for r in reasons if r][:3]
        if reasons:
            return ReviewChangeOutput(
                verdict=ReviewVerdict.warn,
                risk_level=RiskLevel.medium,
                confidence=Confidence.medium,
                reasons=reasons,
                conservative_suggestion=ConservativeSuggestion(
                    title=current_title or None,
                    description=current_desc or None,
                ),
            )

        return ReviewChangeOutput(
            verdict=ReviewVerdict.approve,
            risk_level=RiskLevel.low,
            confidence=Confidence.high,
            reasons=["Proposed changes appear consistent with the current title and description."],
            conservative_suggestion=None,
        )

    def _maybe_warn_on_removed_key_tokens(self, *, label: str, current_text: str, proposed_text: str) -> Optional[str]:
        current_keys = _key_tokens(current_text)
        if len(current_keys) < self._t.min_key_tokens_to_check:
            return None

        proposed_keys = _key_tokens(proposed_text)
        removed = sorted(current_keys - proposed_keys)
        if not removed:
            return None

        removed_ratio = len(removed) / max(1, len(current_keys))
        if len(removed) < self._t.removed_key_min_warn or removed_ratio < self._t.removed_key_ratio_warn:
            return None

        removed_summary = _summarize_removed(removed)
        if removed_summary:
            return f"Proposed {label} drops key terms from the current {label}: {removed_summary}."
        return f"Proposed {label} drops key terms from the current {label}."
