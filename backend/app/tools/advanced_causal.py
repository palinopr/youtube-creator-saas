"""
Advanced Causal Analytics - Deeper analysis combining multiple factors.
Analyzes combinations, trends over time, and multi-factor effects.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import statistics
import re
from .causal_analytics import CausalAnalytics


class AdvancedCausalAnalytics(CausalAnalytics):
    """Advanced causal analysis with deeper insights."""
    
    # ========== COMBINATION ANALYSIS ==========
    
    def analyze_factor_combinations(self, videos: List[Dict]) -> Dict[str, Any]:
        """Analyze what happens when you combine multiple success factors."""
        if not videos:
            return {}
        
        combinations = {
            "celebrity_only": [],
            "celebrity_emoji": [],
            "celebrity_emoji_long_title": [],
            "celebrity_controversial": [],
            "celebrity_question": [],
            "no_factors": [],
            "all_factors": [],  # celebrity + emoji + long title + controversial
        }
        
        for v in videos:
            has_celeb = v.get("has_celebrity", False)
            has_emoji = v.get("has_emoji", False)
            long_title = v.get("title_length", 0) >= 70
            is_controversial = v.get("title_sentiment") == "controversial"
            has_question = v.get("has_question", False)
            
            # Categorize
            if has_celeb and has_emoji and long_title and is_controversial:
                combinations["all_factors"].append(v)
            elif has_celeb and has_emoji and long_title:
                combinations["celebrity_emoji_long_title"].append(v)
            elif has_celeb and has_emoji:
                combinations["celebrity_emoji"].append(v)
            elif has_celeb and is_controversial:
                combinations["celebrity_controversial"].append(v)
            elif has_celeb and has_question:
                combinations["celebrity_question"].append(v)
            elif has_celeb:
                combinations["celebrity_only"].append(v)
            elif not has_celeb and not has_emoji and not long_title:
                combinations["no_factors"].append(v)
        
        results = {}
        for combo_name, combo_videos in combinations.items():
            if len(combo_videos) >= 3:
                views = [v["view_count"] for v in combo_videos]
                results[combo_name] = {
                    "video_count": len(combo_videos),
                    "avg_views": round(statistics.mean(views)),
                    "median_views": round(statistics.median(views)),
                    "max_views": max(views),
                    "avg_like_ratio": round(statistics.mean([v.get("like_ratio", 0) for v in combo_videos]), 2),
                    "sample_title": combo_videos[0]["title"][:80] if combo_videos else "",
                }
        
        # Sort by avg_views
        sorted_results = dict(sorted(results.items(), key=lambda x: x[1]["avg_views"], reverse=True))
        
        return {
            "factor_combinations": sorted_results,
            "insight": self._generate_combination_insight(sorted_results),
        }
    
    def _generate_combination_insight(self, results: Dict) -> str:
        if not results:
            return "Not enough data for combination analysis"
        
        best_combo = list(results.keys())[0]
        best_views = results[best_combo]["avg_views"]
        
        no_factors = results.get("no_factors", {}).get("avg_views", 0)
        if no_factors > 0:
            multiplier = round(best_views / no_factors, 1)
            return f"Best combination '{best_combo}' gets {multiplier}x more views than videos with no factors"
        
        return f"Best combination is '{best_combo}' with {best_views:,} avg views"
    
    # ========== CELEBRITY TRENDS OVER TIME ==========
    
    def analyze_celebrity_trends(self, videos: List[Dict]) -> Dict[str, Any]:
        """Analyze which celebrities are trending up or down over time."""
        if not videos:
            return {}
        
        # Group videos by year and celebrity
        celeb_by_year = defaultdict(lambda: defaultdict(list))
        
        for v in videos:
            year = v.get("pub_year", 2024)
            for celeb in v.get("celebrities_mentioned", []):
                celeb_by_year[celeb][year].append(v)
        
        # Calculate trends for celebrities with enough data
        celebrity_trends = []
        
        for celeb, years_data in celeb_by_year.items():
            if len(years_data) < 2:
                continue
            
            years = sorted(years_data.keys())
            if len(years) < 2:
                continue
            
            # Get recent vs older performance
            recent_years = [y for y in years if y >= 2024]
            older_years = [y for y in years if y < 2024]
            
            if not recent_years or not older_years:
                continue
            
            recent_videos = []
            for y in recent_years:
                recent_videos.extend(years_data[y])
            
            older_videos = []
            for y in older_years:
                older_videos.extend(years_data[y])
            
            if len(recent_videos) < 2 or len(older_videos) < 2:
                continue
            
            recent_avg = statistics.mean([v["view_count"] for v in recent_videos])
            older_avg = statistics.mean([v["view_count"] for v in older_videos])
            
            trend_change = ((recent_avg - older_avg) / older_avg * 100) if older_avg > 0 else 0
            
            celebrity_trends.append({
                "celebrity": celeb,
                "recent_avg": round(recent_avg),
                "older_avg": round(older_avg),
                "trend_change_percent": round(trend_change, 1),
                "recent_video_count": len(recent_videos),
                "older_video_count": len(older_videos),
                "trend": "rising" if trend_change > 20 else "falling" if trend_change < -20 else "stable",
            })
        
        # Sort by trend change
        rising = sorted([c for c in celebrity_trends if c["trend"] == "rising"], 
                       key=lambda x: x["trend_change_percent"], reverse=True)[:10]
        falling = sorted([c for c in celebrity_trends if c["trend"] == "falling"], 
                        key=lambda x: x["trend_change_percent"])[:10]
        stable = sorted([c for c in celebrity_trends if c["trend"] == "stable"],
                       key=lambda x: x["recent_avg"], reverse=True)[:10]
        
        return {
            "rising_celebrities": rising,
            "falling_celebrities": falling,
            "stable_performers": stable,
        }
    
    # ========== MULTI-CELEBRITY EFFECT ==========
    
    def analyze_multi_celebrity_effect(self, videos: List[Dict]) -> Dict[str, Any]:
        """Analyze if mentioning multiple celebrities multiplies views."""
        if not videos:
            return {}
        
        by_celeb_count = defaultdict(list)
        
        for v in videos:
            count = v.get("celebrity_count", 0)
            by_celeb_count[count].append(v)
        
        results = {}
        for count, count_videos in sorted(by_celeb_count.items()):
            if len(count_videos) >= 5:
                views = [v["view_count"] for v in count_videos]
                results[f"{count}_celebrities"] = {
                    "video_count": len(count_videos),
                    "avg_views": round(statistics.mean(views)),
                    "median_views": round(statistics.median(views)),
                    "avg_like_ratio": round(statistics.mean([v.get("like_ratio", 0) for v in count_videos]), 2),
                }
        
        # Calculate multiplier effect
        baseline = results.get("0_celebrities", {}).get("avg_views", 0)
        for key, data in results.items():
            if baseline > 0:
                data["multiplier_vs_zero"] = round(data["avg_views"] / baseline, 2)
        
        return {
            "by_celebrity_count": results,
            "insight": self._generate_multi_celeb_insight(results, baseline),
        }
    
    def _generate_multi_celeb_insight(self, results: Dict, baseline: int) -> str:
        if "2_celebrities" in results and baseline > 0:
            mult = results["2_celebrities"].get("multiplier_vs_zero", 1)
            return f"Videos with 2 celebrities get {mult}x more views than videos with none"
        return "Not enough data for multi-celebrity analysis"
    
    # ========== ENGAGEMENT QUALITY ANALYSIS ==========
    
    def analyze_engagement_quality(self, videos: List[Dict]) -> Dict[str, Any]:
        """Analyze engagement quality, not just views."""
        if not videos:
            return {}
        
        # Sort by engagement (like_ratio + comment_ratio)
        for v in videos:
            v["engagement_score"] = v.get("like_ratio", 0) + (v.get("comment_ratio", 0) * 10)
        
        sorted_by_engagement = sorted(videos, key=lambda x: x["engagement_score"], reverse=True)
        
        top_engagement = sorted_by_engagement[:len(sorted_by_engagement) // 10]  # Top 10%
        bottom_engagement = sorted_by_engagement[-len(sorted_by_engagement) // 10:]  # Bottom 10%
        
        # What do high engagement videos have in common?
        def analyze_group(group: List[Dict]) -> Dict:
            return {
                "avg_views": round(statistics.mean([v["view_count"] for v in group])),
                "avg_like_ratio": round(statistics.mean([v.get("like_ratio", 0) for v in group]), 2),
                "avg_comment_ratio": round(statistics.mean([v.get("comment_ratio", 0) for v in group]), 4),
                "celebrity_rate": round(sum(1 for v in group if v.get("has_celebrity")) / len(group) * 100, 1),
                "emoji_rate": round(sum(1 for v in group if v.get("has_emoji")) / len(group) * 100, 1),
                "avg_duration_min": round(statistics.mean([v.get("duration_minutes", 0) for v in group]), 1),
                "avg_title_length": round(statistics.mean([v.get("title_length", 0) for v in group])),
                "content_types": Counter([v.get("content_type", "unknown") for v in group]).most_common(5),
                "top_celebrities": Counter([c for v in group for c in v.get("celebrities_mentioned", [])]).most_common(5),
            }
        
        top_analysis = analyze_group(top_engagement)
        bottom_analysis = analyze_group(bottom_engagement)
        
        # Most engaging videos
        most_engaging = [{
            "title": v["title"][:80],
            "video_id": v["video_id"],
            "view_count": v["view_count"],
            "like_ratio": v.get("like_ratio", 0),
            "comment_ratio": v.get("comment_ratio", 0),
            "engagement_score": round(v["engagement_score"], 2),
            "celebrities": v.get("celebrities_mentioned", []),
        } for v in sorted_by_engagement[:20]]
        
        return {
            "top_10_percent_engagement": top_analysis,
            "bottom_10_percent_engagement": bottom_analysis,
            "most_engaging_videos": most_engaging,
            "insights": self._generate_engagement_insights(top_analysis, bottom_analysis),
        }
    
    def _generate_engagement_insights(self, top: Dict, bottom: Dict) -> List[str]:
        insights = []
        
        if top["celebrity_rate"] > bottom["celebrity_rate"] + 10:
            insights.append(f"High engagement videos have {top['celebrity_rate']}% celebrity rate vs {bottom['celebrity_rate']}%")
        
        if top["avg_duration_min"] > bottom["avg_duration_min"] * 1.5:
            insights.append(f"High engagement videos are longer ({top['avg_duration_min']} min vs {bottom['avg_duration_min']} min)")
        
        if top["emoji_rate"] > bottom["emoji_rate"] + 10:
            insights.append(f"High engagement videos use more emojis ({top['emoji_rate']}% vs {bottom['emoji_rate']}%)")
        
        return insights
    
    # ========== CONTROVERSY + CELEBRITY ANALYSIS ==========
    
    def analyze_controversy_celebrity(self, videos: List[Dict]) -> Dict[str, Any]:
        """Analyze if controversial celebrity videos perform differently."""
        if not videos:
            return {}
        
        categories = {
            "celebrity_controversial": [],
            "celebrity_not_controversial": [],
            "no_celebrity_controversial": [],
            "no_celebrity_not_controversial": [],
        }
        
        for v in videos:
            has_celeb = v.get("has_celebrity", False)
            is_controversial = v.get("title_sentiment") == "controversial"
            
            if has_celeb and is_controversial:
                categories["celebrity_controversial"].append(v)
            elif has_celeb and not is_controversial:
                categories["celebrity_not_controversial"].append(v)
            elif not has_celeb and is_controversial:
                categories["no_celebrity_controversial"].append(v)
            else:
                categories["no_celebrity_not_controversial"].append(v)
        
        results = {}
        for cat_name, cat_videos in categories.items():
            if len(cat_videos) >= 5:
                views = [v["view_count"] for v in cat_videos]
                results[cat_name] = {
                    "video_count": len(cat_videos),
                    "avg_views": round(statistics.mean(views)),
                    "median_views": round(statistics.median(views)),
                    "max_views": max(views),
                    "avg_like_ratio": round(statistics.mean([v.get("like_ratio", 0) for v in cat_videos]), 2),
                }
        
        return {
            "controversy_celebrity_matrix": results,
            "insight": self._generate_controversy_insight(results),
        }
    
    def _generate_controversy_insight(self, results: Dict) -> str:
        celeb_contro = results.get("celebrity_controversial", {}).get("avg_views", 0)
        celeb_not = results.get("celebrity_not_controversial", {}).get("avg_views", 0)
        
        if celeb_contro > 0 and celeb_not > 0:
            if celeb_contro > celeb_not * 1.2:
                return f"Controversial celebrity videos get {round((celeb_contro/celeb_not-1)*100)}% more views"
            elif celeb_not > celeb_contro * 1.2:
                return f"Non-controversial celebrity videos actually perform {round((celeb_not/celeb_contro-1)*100)}% better"
        
        return "Controversy has minimal effect on celebrity videos"
    
    # ========== CONTENT TYPE + CELEBRITY MATRIX ==========
    
    def analyze_content_celebrity_matrix(self, videos: List[Dict]) -> Dict[str, Any]:
        """Analyze which content types work best with which celebrities."""
        if not videos:
            return {}
        
        # Group by content type and celebrity presence
        content_celeb = defaultdict(lambda: {"with_celeb": [], "without_celeb": []})
        
        for v in videos:
            content_type = v.get("content_type", "unknown")
            if v.get("has_celebrity"):
                content_celeb[content_type]["with_celeb"].append(v)
            else:
                content_celeb[content_type]["without_celeb"].append(v)
        
        results = {}
        for content_type, data in content_celeb.items():
            with_celeb = data["with_celeb"]
            without_celeb = data["without_celeb"]
            
            if len(with_celeb) >= 5:
                celeb_avg = statistics.mean([v["view_count"] for v in with_celeb])
                no_celeb_avg = statistics.mean([v["view_count"] for v in without_celeb]) if len(without_celeb) >= 5 else 0
                
                celebrity_lift = ((celeb_avg - no_celeb_avg) / no_celeb_avg * 100) if no_celeb_avg > 0 else 0
                
                results[content_type] = {
                    "with_celebrity_count": len(with_celeb),
                    "with_celebrity_avg": round(celeb_avg),
                    "without_celebrity_count": len(without_celeb),
                    "without_celebrity_avg": round(no_celeb_avg),
                    "celebrity_lift_percent": round(celebrity_lift, 1),
                    "top_celebrities": Counter([c for v in with_celeb for c in v.get("celebrities_mentioned", [])]).most_common(5),
                }
        
        # Sort by celebrity lift
        sorted_results = dict(sorted(results.items(), key=lambda x: x[1].get("celebrity_lift_percent", 0), reverse=True))
        
        return {
            "content_celebrity_matrix": sorted_results,
        }
    
    # ========== TITLE PATTERNS WITH CELEBRITIES ==========
    
    def analyze_celebrity_title_patterns(self, videos: List[Dict]) -> Dict[str, Any]:
        """Analyze which title patterns work best with celebrity videos."""
        if not videos:
            return {}
        
        celeb_videos = [v for v in videos if v.get("has_celebrity")]
        
        if len(celeb_videos) < 20:
            return {"error": "Not enough celebrity videos for pattern analysis"}
        
        # Analyze title patterns
        patterns = {
            "interview_style": [],  # "Entrevista a X"
            "revelation_style": [],  # "X revela", "X cuenta"
            "drama_style": [],  # "X vs Y", "X le tira a Y"
            "reaction_style": [],  # "X reacciona"
            "neutral_style": [],  # None of the above
        }
        
        for v in celeb_videos:
            title_lower = v["title"].lower()
            
            if any(p in title_lower for p in ["entrevista", "interview"]):
                patterns["interview_style"].append(v)
            elif any(p in title_lower for p in ["revela", "cuenta", "confiesa", "admite"]):
                patterns["revelation_style"].append(v)
            elif any(p in title_lower for p in [" vs ", "contra", "le tira", "descarga", "responde"]):
                patterns["drama_style"].append(v)
            elif any(p in title_lower for p in ["reacciona", "react"]):
                patterns["reaction_style"].append(v)
            else:
                patterns["neutral_style"].append(v)
        
        results = {}
        for pattern_name, pattern_videos in patterns.items():
            if len(pattern_videos) >= 5:
                views = [v["view_count"] for v in pattern_videos]
                results[pattern_name] = {
                    "video_count": len(pattern_videos),
                    "avg_views": round(statistics.mean(views)),
                    "median_views": round(statistics.median(views)),
                    "max_views": max(views),
                    "avg_like_ratio": round(statistics.mean([v.get("like_ratio", 0) for v in pattern_videos]), 2),
                    "sample_titles": [v["title"][:60] for v in sorted(pattern_videos, key=lambda x: x["view_count"], reverse=True)[:3]],
                }
        
        # Sort by avg views
        sorted_results = dict(sorted(results.items(), key=lambda x: x[1]["avg_views"], reverse=True))
        
        return {
            "celebrity_title_patterns": sorted_results,
        }
    
    # ========== RUN FULL ADVANCED ANALYSIS ==========
    
    def run_advanced_analysis(self, max_videos: int = 5000) -> Dict[str, Any]:
        """Run all advanced analyses."""
        videos = self.get_videos_with_full_data(max_videos=max_videos)
        
        if len(videos) < 50:
            return {"error": f"Need at least 50 videos, found {len(videos)}"}
        
        return {
            "summary": {
                "total_videos_analyzed": len(videos),
                "date_range": {
                    "earliest": min(v["published_at"] for v in videos)[:10],
                    "latest": max(v["published_at"] for v in videos)[:10],
                },
            },
            "factor_combinations": self.analyze_factor_combinations(videos),
            "celebrity_trends": self.analyze_celebrity_trends(videos),
            "multi_celebrity_effect": self.analyze_multi_celebrity_effect(videos),
            "engagement_quality": self.analyze_engagement_quality(videos),
            "controversy_celebrity": self.analyze_controversy_celebrity(videos),
            "content_celebrity_matrix": self.analyze_content_celebrity_matrix(videos),
            "celebrity_title_patterns": self.analyze_celebrity_title_patterns(videos),
        }

