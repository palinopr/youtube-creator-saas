"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Sparkles,
  Flame,
  Star,
  Target,
  Zap,
  BarChart3,
  MessageSquare,
  ThumbsUp,
  Eye,
  Film,
  Hash,
  Smile,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Equal,
  Crown,
  Combine,
} from "lucide-react";
import { API_URL } from "@/lib/config";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface AdvancedData {
  summary: {
    total_videos_analyzed: number;
    date_range: {
      earliest: string;
      latest: string;
    };
  };
  factor_combinations: {
    factor_combinations: Record<string, {
      video_count: number;
      avg_views: number;
      median_views: number;
      max_views: number;
      avg_like_ratio: number;
      sample_title: string;
    }>;
    insight: string;
  };
  celebrity_trends: {
    rising_celebrities: Array<{
      celebrity: string;
      recent_avg: number;
      older_avg: number;
      trend_change_percent: number;
      recent_video_count: number;
      older_video_count: number;
      trend: string;
    }>;
    falling_celebrities: Array<{
      celebrity: string;
      recent_avg: number;
      older_avg: number;
      trend_change_percent: number;
      recent_video_count: number;
      older_video_count: number;
      trend: string;
    }>;
    stable_performers: Array<{
      celebrity: string;
      recent_avg: number;
      older_avg: number;
      trend_change_percent: number;
      recent_video_count: number;
      older_video_count: number;
      trend: string;
    }>;
  };
  multi_celebrity_effect: {
    by_celebrity_count: Record<string, {
      video_count: number;
      avg_views: number;
      median_views: number;
      avg_like_ratio: number;
      multiplier_vs_zero?: number;
    }>;
    insight: string;
  };
  engagement_quality: {
    top_10_percent_engagement: {
      avg_views: number;
      avg_like_ratio: number;
      avg_comment_ratio: number;
      celebrity_rate: number;
      emoji_rate: number;
      avg_duration_min: number;
      avg_title_length: number;
      content_types: Array<[string, number]>;
      top_celebrities: Array<[string, number]>;
    };
    bottom_10_percent_engagement: {
      avg_views: number;
      avg_like_ratio: number;
      avg_comment_ratio: number;
      celebrity_rate: number;
      emoji_rate: number;
      avg_duration_min: number;
      avg_title_length: number;
      content_types: Array<[string, number]>;
      top_celebrities: Array<[string, number]>;
    };
    most_engaging_videos: Array<{
      title: string;
      video_id: string;
      view_count: number;
      like_ratio: number;
      comment_ratio: number;
      engagement_score: number;
      celebrities: string[];
    }>;
    insights: string[];
  };
  controversy_celebrity: {
    controversy_celebrity_matrix: Record<string, {
      video_count: number;
      avg_views: number;
      median_views: number;
      max_views: number;
      avg_like_ratio: number;
    }>;
    insight: string;
  };
  celebrity_title_patterns: {
    celebrity_title_patterns: Record<string, {
      video_count: number;
      avg_views: number;
      median_views: number;
      max_views: number;
      avg_like_ratio: number;
      sample_titles: string[];
    }>;
  };
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export default function AdvancedInsightsPage() {
  const [data, setData] = useState<AdvancedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"combos" | "trends" | "multi" | "engagement" | "controversy" | "patterns">("combos");

  useEffect(() => {
    fetchAdvancedAnalysis();
  }, []);

  const fetchAdvancedAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/analysis/advanced?max_videos=5000`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-black text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
          <p className="text-xl text-gray-300 mb-2">Running Advanced Analysis...</p>
          <p className="text-sm text-gray-500">Analyzing ALL videos with deep factor combinations</p>
          <p className="text-xs text-gray-600 mt-2">This may take 3-5 minutes</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-black text-white">
        <div className="text-red-500 text-lg">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-black text-white">
        <div className="text-gray-400 text-lg">No data available</div>
      </div>
    );
  }

  return (
    <DashboardLayout activePath="/advanced-insights">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="w-7 h-7 text-orange-400" />
              Advanced Insights
            </h1>
            <p className="text-gray-400 mt-1">
              Deep analysis of {formatNumber(data.summary.total_videos_analyzed)} videos
            </p>
          </div>
          <button
            onClick={fetchAdvancedAnalysis}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab("combos")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === "combos"
                ? "bg-orange-500/20 text-orange-300 border border-orange-500/50"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Combine className="w-4 h-4" />
            Combo Effects
          </button>
          <button
            onClick={() => setActiveTab("trends")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === "trends"
                ? "bg-orange-500/20 text-orange-300 border border-orange-500/50"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Celebrity Trends
          </button>
          <button
            onClick={() => setActiveTab("multi")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === "multi"
                ? "bg-orange-500/20 text-orange-300 border border-orange-500/50"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Users className="w-4 h-4" />
            Multi-Celebrity
          </button>
          <button
            onClick={() => setActiveTab("engagement")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === "engagement"
                ? "bg-orange-500/20 text-orange-300 border border-orange-500/50"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            Engagement Quality
          </button>
          <button
            onClick={() => setActiveTab("controversy")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === "controversy"
                ? "bg-orange-500/20 text-orange-300 border border-orange-500/50"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Flame className="w-4 h-4" />
            Controversy
          </button>
          <button
            onClick={() => setActiveTab("patterns")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === "patterns"
                ? "bg-orange-500/20 text-orange-300 border border-orange-500/50"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Film className="w-4 h-4" />
            Title Patterns
          </button>
        </div>

        {/* COMBO EFFECTS TAB */}
        {activeTab === "combos" && data.factor_combinations && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-600/20 to-yellow-600/20 border border-orange-500/30 rounded-2xl p-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-orange-300 mb-2">
                <Combine className="w-6 h-6" />
                Factor Combinations
              </h2>
              <p className="text-gray-300">{data.factor_combinations.insight}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(data.factor_combinations.factor_combinations || {}).map(([combo, stats], idx) => (
                <div
                  key={combo}
                  className={`rounded-xl p-5 ${
                    idx === 0
                      ? "bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border-2 border-orange-500/50"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-semibold text-white capitalize">
                      {combo.replace(/_/g, " ")}
                    </span>
                    {idx === 0 && <Crown className="w-5 h-5 text-orange-400" />}
                  </div>
                  <div className="text-3xl font-bold text-orange-400 mb-2">
                    {formatNumber(stats.avg_views)}
                  </div>
                  <p className="text-sm text-gray-400">{stats.video_count} videos</p>
                  {stats.sample_title && (
                    <p className="text-xs text-gray-500 mt-2 truncate">"{stats.sample_title}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CELEBRITY TRENDS TAB */}
        {activeTab === "trends" && data.celebrity_trends && (
          <div className="space-y-6">
            {/* Rising */}
            <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-green-300 mb-4">
                <ArrowUpRight className="w-6 h-6" />
                Rising Celebrities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(data.celebrity_trends.rising_celebrities || []).slice(0, 6).map((celeb, idx) => (
                  <div key={celeb.celebrity} className="bg-black/30 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold capitalize">{celeb.celebrity}</p>
                      <p className="text-sm text-gray-400">
                        {formatNumber(celeb.recent_avg)} avg (was {formatNumber(celeb.older_avg)})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold text-lg">+{celeb.trend_change_percent}%</p>
                      <p className="text-xs text-gray-500">{celeb.recent_video_count} recent videos</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Falling */}
            <div className="bg-gradient-to-r from-red-600/20 to-rose-600/20 border border-red-500/30 rounded-2xl p-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-red-300 mb-4">
                <ArrowDownRight className="w-6 h-6" />
                Declining Celebrities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(data.celebrity_trends.falling_celebrities || []).slice(0, 6).map((celeb, idx) => (
                  <div key={celeb.celebrity} className="bg-black/30 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold capitalize">{celeb.celebrity}</p>
                      <p className="text-sm text-gray-400">
                        {formatNumber(celeb.recent_avg)} avg (was {formatNumber(celeb.older_avg)})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 font-bold text-lg">{celeb.trend_change_percent}%</p>
                      <p className="text-xs text-gray-500">{celeb.recent_video_count} recent videos</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stable */}
            <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-2xl p-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-300 mb-4">
                <Equal className="w-6 h-6" />
                Consistent Performers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(data.celebrity_trends.stable_performers || []).slice(0, 6).map((celeb, idx) => (
                  <div key={celeb.celebrity} className="bg-black/30 rounded-lg p-4">
                    <p className="text-white font-semibold capitalize">{celeb.celebrity}</p>
                    <p className="text-blue-400 font-bold">{formatNumber(celeb.recent_avg)} avg</p>
                    <p className="text-xs text-gray-500">{celeb.recent_video_count + celeb.older_video_count} total videos</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MULTI-CELEBRITY TAB */}
        {activeTab === "multi" && data.multi_celebrity_effect && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-purple-300 mb-2">
                <Users className="w-6 h-6" />
                Multi-Celebrity Effect
              </h2>
              <p className="text-gray-300">{data.multi_celebrity_effect.insight}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(data.multi_celebrity_effect.by_celebrity_count || {}).map(([key, stats]) => (
                <div key={key} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="text-lg font-semibold text-white mb-2 capitalize">
                    {key.replace(/_/g, " ")}
                  </div>
                  <div className="text-3xl font-bold text-purple-400">
                    {formatNumber(stats.avg_views)}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{stats.video_count} videos</p>
                  {stats.multiplier_vs_zero && (
                    <p className="text-sm text-green-400 mt-2">
                      {stats.multiplier_vs_zero}x vs no celebrity
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ENGAGEMENT QUALITY TAB */}
        {activeTab === "engagement" && data.engagement_quality && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Engagement */}
              <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-green-300 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Top 10% Engagement
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Avg Views</p>
                    <p className="text-white font-bold text-lg">{formatNumber(data.engagement_quality.top_10_percent_engagement.avg_views)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Like Ratio</p>
                    <p className="text-white font-bold text-lg">{data.engagement_quality.top_10_percent_engagement.avg_like_ratio}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Celebrity Rate</p>
                    <p className="text-white font-bold text-lg">{data.engagement_quality.top_10_percent_engagement.celebrity_rate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Emoji Rate</p>
                    <p className="text-white font-bold text-lg">{data.engagement_quality.top_10_percent_engagement.emoji_rate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Avg Duration</p>
                    <p className="text-white font-bold text-lg">{data.engagement_quality.top_10_percent_engagement.avg_duration_min} min</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Title Length</p>
                    <p className="text-white font-bold text-lg">{data.engagement_quality.top_10_percent_engagement.avg_title_length} chars</p>
                  </div>
                </div>
              </div>

              {/* Bottom Engagement */}
              <div className="bg-gradient-to-br from-red-600/20 to-rose-600/20 border border-red-500/30 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-red-300 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Bottom 10% Engagement
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Avg Views</p>
                    <p className="text-white font-bold text-lg">{formatNumber(data.engagement_quality.bottom_10_percent_engagement.avg_views)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Like Ratio</p>
                    <p className="text-white font-bold text-lg">{data.engagement_quality.bottom_10_percent_engagement.avg_like_ratio}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Celebrity Rate</p>
                    <p className="text-white font-bold text-lg">{data.engagement_quality.bottom_10_percent_engagement.celebrity_rate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Emoji Rate</p>
                    <p className="text-white font-bold text-lg">{data.engagement_quality.bottom_10_percent_engagement.emoji_rate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Avg Duration</p>
                    <p className="text-white font-bold text-lg">{data.engagement_quality.bottom_10_percent_engagement.avg_duration_min} min</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Title Length</p>
                    <p className="text-white font-bold text-lg">{data.engagement_quality.bottom_10_percent_engagement.avg_title_length} chars</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Insights */}
            {data.engagement_quality.insights && data.engagement_quality.insights.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-3">Key Insights</h3>
                <ul className="space-y-2">
                  {data.engagement_quality.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-300">
                      <Sparkles className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Most Engaging Videos */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Most Engaging Videos</h3>
              <div className="space-y-3">
                {(data.engagement_quality.most_engaging_videos || []).slice(0, 10).map((video, idx) => (
                  <div key={video.video_id} className="flex items-center gap-4 p-3 bg-black/30 rounded-lg">
                    <span className="text-lg font-bold text-orange-400 w-8">#{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{video.title}</p>
                      <p className="text-sm text-gray-400">
                        {formatNumber(video.view_count)} views • {video.like_ratio}% likes • {video.engagement_score} score
                      </p>
                    </div>
                    <a
                      href={`https://youtube.com/watch?v=${video.video_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-400 hover:text-orange-300"
                    >
                      <Eye className="w-5 h-5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CONTROVERSY TAB */}
        {activeTab === "controversy" && data.controversy_celebrity && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/30 rounded-2xl p-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-red-300 mb-2">
                <Flame className="w-6 h-6" />
                Controversy + Celebrity Matrix
              </h2>
              <p className="text-gray-300">{data.controversy_celebrity.insight}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(data.controversy_celebrity.controversy_celebrity_matrix || {}).map(([key, stats]) => (
                <div key={key} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className="text-lg font-semibold text-white mb-2 capitalize">
                    {key.replace(/_/g, " ")}
                  </div>
                  <div className="text-3xl font-bold text-orange-400">
                    {formatNumber(stats.avg_views)}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{stats.video_count} videos</p>
                  <p className="text-sm text-gray-500">Max: {formatNumber(stats.max_views)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TITLE PATTERNS TAB */}
        {activeTab === "patterns" && data.celebrity_title_patterns && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 rounded-2xl p-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-indigo-300 mb-2">
                <Film className="w-6 h-6" />
                Celebrity Title Patterns
              </h2>
              <p className="text-gray-300">Which title formats work best for celebrity videos?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(data.celebrity_title_patterns.celebrity_title_patterns || {}).map(([pattern, stats], idx) => (
                <div
                  key={pattern}
                  className={`rounded-xl p-5 ${
                    idx === 0
                      ? "bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border-2 border-indigo-500/50"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-semibold text-white capitalize">
                      {pattern.replace(/_/g, " ")}
                    </span>
                    {idx === 0 && <Crown className="w-5 h-5 text-indigo-400" />}
                  </div>
                  <div className="text-3xl font-bold text-indigo-400 mb-2">
                    {formatNumber(stats.avg_views)}
                  </div>
                  <p className="text-sm text-gray-400">{stats.video_count} videos</p>
                  
                  {stats.sample_titles && stats.sample_titles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-gray-500">Top examples:</p>
                      {stats.sample_titles.slice(0, 2).map((title, tidx) => (
                        <p key={tidx} className="text-xs text-gray-400 truncate">
                          "{title}"
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

