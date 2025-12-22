/**
 * Consolidated TypeScript types for the TubeGrow frontend.
 *
 * These types are shared across multiple pages and components.
 * Import from '@/lib/types' instead of defining locally.
 */

// =============================================================================
// Analysis Types
// =============================================================================

export interface PerformanceSummary {
  average_views: number;
  median_views: number;
  top_20_percent_avg_views: number;
  top_video_views: number;
  top_video_title: string;
}

export interface TitleLengthAnalysis {
  all_videos_avg: number;
  top_performers_avg: number;
  bottom_performers_avg: number;
  top_vs_bottom_diff_percent: number;
  top_performers_range: { min: number; max: number };
  recommendation: string;
}

export interface TitleWordCountAnalysis {
  all_videos_avg: number;
  top_performers_avg: number;
  recommendation: string;
}

export interface DescriptionLengthAnalysis {
  all_videos_avg: number;
  top_performers_avg: number;
  bottom_performers_avg: number;
  top_vs_bottom_diff_percent: number;
  recommendation: string;
}

export interface TagsCountAnalysis {
  all_videos_avg: number;
  top_performers_avg: number;
  bottom_performers_avg: number;
  top_vs_bottom_diff_percent: number;
  recommendation: string;
}

export interface VideoDurationAnalysis {
  top_avg_minutes: number;
  all_avg_minutes: number;
}

export interface BooleanCorrelation {
  all_videos_percent: number;
  top_performers_percent: number;
  bottom_performers_percent: number;
  correlation: string;
}

export interface TopPerformingTag {
  tag: string;
  video_count: number;
  avg_views_per_video: number;
}

export interface AnalysisResult {
  total_videos_analyzed: number;
  performance_summary: PerformanceSummary;
  title_length: TitleLengthAnalysis;
  title_word_count: TitleWordCountAnalysis;
  description_length: DescriptionLengthAnalysis;
  tags_count: TagsCountAnalysis;
  video_duration: VideoDurationAnalysis;
  has_links: BooleanCorrelation;
  has_hashtags: BooleanCorrelation;
  top_performing_tags: TopPerformingTag[];
  insights: string[];
}

export interface CustomScoringModel {
  channel_specific: boolean;
  based_on_videos: number;
  factors: Record<string, unknown>;
}

export interface AnalysisData {
  analysis: AnalysisResult;
  custom_scoring_model: CustomScoringModel;
}

export interface AnalysisTopVideo {
  video_id: string;
  title: string;
  title_length: number;
  description_length: number;
  tags_count: number;
  view_count: number;
  like_count: number;
  thumbnail_url: string;
}

// =============================================================================
// Content Optimizer Types
// =============================================================================

export interface QuickWin {
  action: string;
  impact: string;
  effort: string;
}

export interface OptimizationContentIdea {
  title: string;
  why: string;
  predicted_views: string;
  celebrities: string[];
  priority: string;
}

export interface CelebrityInfo {
  name: string;
  why?: string;
  avg_views?: string;
  reliability?: string;
  volume?: string;
  change?: string;
  risk?: string;
}

export interface ScoreResult {
  score: number;
  max_score: number;
  grade: string;
  prediction: string;
  feedback: string[];
  quick_fixes: string[];
}

export interface GeneratedTitle {
  title: string;
  predicted_performance: string;
  why: string;
}

export interface GeneratedTitles {
  titles: GeneratedTitle[];
  best_pick: string;
}

// =============================================================================
// Comment Analysis Types
// =============================================================================

export interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  overall_mood: string;
  key_positive_themes: string[];
  key_negative_themes: string[];
}

export type QuestionPriority = "high" | "medium" | "low";
export type ContentPotential = "high" | "medium" | "low";

export interface CommentQuestion {
  text: string;
  author: string;
  likes: number;
  suggested_response: string;
  priority: QuestionPriority;
}

export interface CommentContentIdea {
  topic: string;
  evidence: string;
  mentions: number;
  potential: ContentPotential;
}

export interface NotableCommenter {
  channel_id: string;
  channel_name: string;
  subscriber_count: number;
  video_count: number;
  thumbnail_url: string;
  comment_text: string;
  comment_likes: number;
  video_commented_on: string;
  channel_url: string;
}

export interface CommentAnalysis {
  sentiment_breakdown: SentimentBreakdown;
  questions_to_answer: CommentQuestion[];
  content_ideas: CommentContentIdea[];
  notable_commenters: NotableCommenter[];
  summary: string;
  analyzed_count: number;
  generated_at: string;
}

// =============================================================================
// Video Editor Types (from video/[id]/page.tsx)
// =============================================================================

export interface TitleSuggestion {
  title: string;
  predicted_performance: string;
  why: string;
}

export interface SEOSuggestions {
  title_suggestions: TitleSuggestion[];
  description_template: string;
  tag_suggestions: string[];
  optimization_tips: string[];
}

export interface VideoSEOScore {
  score: number;
  grade: string;
  details: {
    title_score: number;
    description_score: number;
    tags_score: number;
    thumbnail_score?: number;
  };
  suggestions: SEOSuggestions;
}

// =============================================================================
// Shared UI Constants
// =============================================================================

export const SENTIMENT_COLORS = {
  positive: "#22c55e",
  neutral: "#6b7280",
  negative: "#ef4444",
} as const;

export const PRIORITY_STYLES = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
} as const;

export const POTENTIAL_STYLES = {
  high: "bg-green-500/20 text-green-400",
  medium: "bg-blue-500/20 text-blue-400",
  low: "bg-gray-500/20 text-gray-400",
} as const;
