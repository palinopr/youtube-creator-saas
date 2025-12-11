"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Tag,
  FileText,
  Hash,
  Link2,
  Clock,
  Eye,
  Trophy,
  Lightbulb,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { API_URL } from "@/lib/config";

interface AnalysisData {
  analysis: {
    total_videos_analyzed: number;
    performance_summary: {
      average_views: number;
      median_views: number;
      top_20_percent_avg_views: number;
      top_video_views: number;
      top_video_title: string;
    };
    title_length: {
      all_videos_avg: number;
      top_performers_avg: number;
      bottom_performers_avg: number;
      top_vs_bottom_diff_percent: number;
      top_performers_range: { min: number; max: number };
      recommendation: string;
    };
    title_word_count: {
      all_videos_avg: number;
      top_performers_avg: number;
      recommendation: string;
    };
    description_length: {
      all_videos_avg: number;
      top_performers_avg: number;
      bottom_performers_avg: number;
      top_vs_bottom_diff_percent: number;
      recommendation: string;
    };
    tags_count: {
      all_videos_avg: number;
      top_performers_avg: number;
      bottom_performers_avg: number;
      top_vs_bottom_diff_percent: number;
      recommendation: string;
    };
    video_duration: {
      top_avg_minutes: number;
      all_avg_minutes: number;
    };
    has_links: {
      all_videos_percent: number;
      top_performers_percent: number;
      bottom_performers_percent: number;
      correlation: string;
    };
    has_hashtags: {
      all_videos_percent: number;
      top_performers_percent: number;
      bottom_performers_percent: number;
      correlation: string;
    };
    top_performing_tags: Array<{
      tag: string;
      video_count: number;
      avg_views_per_video: number;
    }>;
    insights: string[];
  };
  custom_scoring_model: {
    channel_specific: boolean;
    based_on_videos: number;
    factors: Record<string, any>;
  };
}

interface TopVideo {
  video_id: string;
  title: string;
  title_length: number;
  description_length: number;
  tags_count: number;
  view_count: number;
  like_count: number;
  thumbnail_url: string;
}

export default function AnalysisPage() {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [topVideos, setTopVideos] = useState<TopVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"insights" | "factors" | "tags" | "top-videos">("insights");

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/analysis/patterns?max_videos=500`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError("Please authenticate first");
          return;
        }
        throw new Error("Failed to fetch analysis");
      }
      
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analysis");
    } finally {
      setLoading(false);
    }
  };

  const fetchTopVideos = async () => {
    setLoadingVideos(true);
    
    try {
      const response = await fetch(`${API_URL}/api/analysis/top-videos?limit=20`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setTopVideos(data.top_videos);
      }
    } catch (err) {
      console.error("Failed to fetch top videos:", err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Analyzing your channel data...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a minute for large channels</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/" className="text-purple-400 hover:underline">
            Go back and authenticate
          </Link>
        </div>
      </div>
    );
  }

  const data = analysis?.analysis;
  const model = analysis?.custom_scoring_model;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                Channel Performance Analysis
              </h1>
              <p className="text-sm text-gray-400">
                Data-driven insights from {data?.total_videos_analyzed || 0} videos
              </p>
            </div>
            <button
              onClick={fetchAnalysis}
              className="ml-auto p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Refresh analysis"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Performance Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border border-purple-500/30 rounded-xl p-4">
            <p className="text-sm text-gray-400">Videos Analyzed</p>
            <p className="text-2xl font-bold text-purple-300">{data?.total_videos_analyzed}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-sm text-gray-400">Average Views</p>
            <p className="text-2xl font-bold text-blue-300">{formatNumber(data?.performance_summary?.average_views || 0)}</p>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-green-800/10 border border-green-500/30 rounded-xl p-4">
            <p className="text-sm text-gray-400">Top 20% Avg</p>
            <p className="text-2xl font-bold text-green-300">{formatNumber(data?.performance_summary?.top_20_percent_avg_views || 0)}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/10 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-sm text-gray-400">Top Video</p>
            <p className="text-2xl font-bold text-yellow-300">{formatNumber(data?.performance_summary?.top_video_views || 0)}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
          {[
            { id: "insights", label: "Key Insights", icon: Lightbulb },
            { id: "factors", label: "SEO Factors", icon: BarChart3 },
            { id: "tags", label: "Top Tags", icon: Tag },
            { id: "top-videos", label: "Top Videos", icon: Trophy },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === "top-videos" && topVideos.length === 0) {
                  fetchTopVideos();
                }
              }}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "insights" && (
          <div className="space-y-6">
            {/* AI Insights */}
            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/10 border border-purple-500/30 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                Data-Driven Insights
              </h2>
              <div className="space-y-3">
                {data?.insights?.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                    <span className="text-lg">{insight}</span>
                  </div>
                ))}
                {(!data?.insights || data.insights.length === 0) && (
                  <p className="text-gray-400">No significant patterns found. Your videos are fairly consistent!</p>
                )}
              </div>
            </div>

            {/* Custom Model Info */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Your Custom Scoring Model
              </h2>
              <p className="text-gray-400 mb-4">
                Based on analysis of {model?.based_on_videos} videos, here&apos;s what works best for YOUR channel:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <h3 className="font-medium flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Optimal Title Length
                  </h3>
                  <p className="text-2xl font-bold text-blue-300">{Math.round(data?.title_length?.top_performers_avg || 60)} chars</p>
                  <p className="text-sm text-gray-400 mt-1">{data?.title_length?.recommendation}</p>
                </div>
                
                <div className="p-4 bg-white/5 rounded-lg">
                  <h3 className="font-medium flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-green-400" />
                    Optimal Tags Count
                  </h3>
                  <p className="text-2xl font-bold text-green-300">{Math.round(data?.tags_count?.top_performers_avg || 15)} tags</p>
                  <p className="text-sm text-gray-400 mt-1">{data?.tags_count?.recommendation}</p>
                </div>
                
                <div className="p-4 bg-white/5 rounded-lg">
                  <h3 className="font-medium flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    Optimal Description
                  </h3>
                  <p className="text-2xl font-bold text-purple-300">{Math.round(data?.description_length?.top_performers_avg || 500)} chars</p>
                  <p className="text-sm text-gray-400 mt-1">{data?.description_length?.recommendation}</p>
                </div>
                
                <div className="p-4 bg-white/5 rounded-lg">
                  <h3 className="font-medium flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-orange-400" />
                    Optimal Duration
                  </h3>
                  <p className="text-2xl font-bold text-orange-300">{data?.video_duration?.top_avg_minutes} min</p>
                  <p className="text-sm text-gray-400 mt-1">Your top videos average this length</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "factors" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Title Length Analysis */}
            <FactorCard
              title="Title Length"
              icon={FileText}
              iconColor="text-blue-400"
              topAvg={data?.title_length?.top_performers_avg || 0}
              bottomAvg={data?.title_length?.bottom_performers_avg || 0}
              allAvg={data?.title_length?.all_videos_avg || 0}
              diffPercent={data?.title_length?.top_vs_bottom_diff_percent || 0}
              unit="chars"
              recommendation={data?.title_length?.recommendation || ""}
            />

            {/* Tags Count Analysis */}
            <FactorCard
              title="Tags Count"
              icon={Tag}
              iconColor="text-green-400"
              topAvg={data?.tags_count?.top_performers_avg || 0}
              bottomAvg={data?.tags_count?.bottom_performers_avg || 0}
              allAvg={data?.tags_count?.all_videos_avg || 0}
              diffPercent={data?.tags_count?.top_vs_bottom_diff_percent || 0}
              unit="tags"
              recommendation={data?.tags_count?.recommendation || ""}
            />

            {/* Description Length Analysis */}
            <FactorCard
              title="Description Length"
              icon={FileText}
              iconColor="text-purple-400"
              topAvg={data?.description_length?.top_performers_avg || 0}
              bottomAvg={data?.description_length?.bottom_performers_avg || 0}
              allAvg={data?.description_length?.all_videos_avg || 0}
              diffPercent={data?.description_length?.top_vs_bottom_diff_percent || 0}
              unit="chars"
              recommendation={data?.description_length?.recommendation || ""}
            />

            {/* Links in Description */}
            <BooleanFactorCard
              title="Links in Description"
              icon={Link2}
              iconColor="text-cyan-400"
              topPercent={data?.has_links?.top_performers_percent || 0}
              bottomPercent={data?.has_links?.bottom_performers_percent || 0}
              correlation={data?.has_links?.correlation || "neutral"}
            />

            {/* Hashtags */}
            <BooleanFactorCard
              title="Hashtags in Description"
              icon={Hash}
              iconColor="text-pink-400"
              topPercent={data?.has_hashtags?.top_performers_percent || 0}
              bottomPercent={data?.has_hashtags?.bottom_performers_percent || 0}
              correlation={data?.has_hashtags?.correlation || "neutral"}
            />

            {/* Video Duration */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-orange-400" />
                Video Duration
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Top Performers Avg</span>
                  <span className="font-bold text-green-400">{data?.video_duration?.top_avg_minutes} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">All Videos Avg</span>
                  <span className="font-medium">{data?.video_duration?.all_avg_minutes} min</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tags" && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-green-400" />
              Top Performing Tags
            </h2>
            <p className="text-gray-400 mb-4">
              Tags that appear in your highest-viewed videos, weighted by performance
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data?.top_performing_tags?.slice(0, 30).map((tag, index) => (
                <div
                  key={tag.tag}
                  className={`p-3 rounded-lg border ${
                    index < 5
                      ? "bg-gradient-to-br from-yellow-600/20 to-orange-600/10 border-yellow-500/30"
                      : index < 10
                      ? "bg-gradient-to-br from-purple-600/20 to-blue-600/10 border-purple-500/30"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-medium ${index < 5 ? "text-yellow-300" : ""}`}>
                      #{index + 1} {tag.tag}
                    </span>
                    {index < 5 && <Trophy className="w-4 h-4 text-yellow-400" />}
                  </div>
                  <div className="text-sm text-gray-400">
                    <span>{tag.video_count} videos</span>
                    <span className="mx-2">•</span>
                    <span>{formatNumber(tag.avg_views_per_video)} avg views</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "top-videos" && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Your Top Performing Videos
            </h2>
            
            {loadingVideos ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
              </div>
            ) : topVideos.length > 0 ? (
              <div className="space-y-3">
                {topVideos.map((video, index) => (
                  <div
                    key={video.video_id}
                    className="flex items-center gap-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <span className={`text-lg font-bold w-8 ${
                      index < 3 ? "text-yellow-400" : "text-gray-500"
                    }`}>
                      #{index + 1}
                    </span>
                    {video.thumbnail_url && (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-24 h-14 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{video.title}</h3>
                      <div className="text-sm text-gray-400 flex gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatNumber(video.view_count)}
                        </span>
                        <span>{video.title_length} chars</span>
                        <span>{video.tags_count} tags</span>
                      </div>
                    </div>
                    <Link
                      href={`/seo?video=${video.video_id}`}
                      className="px-3 py-1 bg-purple-600/50 hover:bg-purple-600 rounded-lg text-sm transition-colors"
                    >
                      Analyze
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={fetchTopVideos}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Load Top Videos
              </button>
            )}
          </div>
        )}

        {/* Top Video Highlight */}
        {data?.performance_summary?.top_video_title && (
          <div className="mt-8 p-6 bg-gradient-to-r from-yellow-900/20 to-orange-900/10 border border-yellow-500/30 rounded-xl">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Your #1 Video
            </h3>
            <p className="text-xl text-yellow-200 mb-2">{data.performance_summary.top_video_title}</p>
            <p className="text-gray-400">
              {formatNumber(data.performance_summary.top_video_views)} views
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// Factor Card Component
function FactorCard({
  title,
  icon: Icon,
  iconColor,
  topAvg,
  bottomAvg,
  allAvg,
  diffPercent,
  unit,
  recommendation,
}: {
  title: string;
  icon: any;
  iconColor: string;
  topAvg: number;
  bottomAvg: number;
  allAvg: number;
  diffPercent: number;
  unit: string;
  recommendation: string;
}) {
  const isPositive = diffPercent > 5;
  const isNegative = diffPercent < -5;
  
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <h3 className="font-semibold flex items-center gap-2 mb-4">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        {title}
      </h3>
      
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Top Performers</span>
          <span className="font-bold text-green-400">{Math.round(topAvg)} {unit}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Bottom Performers</span>
          <span className="font-medium text-red-400">{Math.round(bottomAvg)} {unit}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">All Videos</span>
          <span className="font-medium">{Math.round(allAvg)} {unit}</span>
        </div>
      </div>
      
      {/* Difference indicator */}
      <div className={`flex items-center gap-2 p-2 rounded-lg ${
        isPositive ? "bg-green-500/10 text-green-400" :
        isNegative ? "bg-red-500/10 text-red-400" :
        "bg-gray-500/10 text-gray-400"
      }`}>
        {isPositive ? (
          <TrendingUp className="w-4 h-4" />
        ) : isNegative ? (
          <TrendingUp className="w-4 h-4 rotate-180" />
        ) : (
          <span className="w-4 h-4 flex items-center justify-center">≈</span>
        )}
        <span className="text-sm">
          {Math.abs(diffPercent).toFixed(0)}% {isPositive ? "more" : isNegative ? "less" : "difference"} in top videos
        </span>
      </div>
      
      {recommendation && (
        <p className="text-xs text-gray-500 mt-3">{recommendation}</p>
      )}
    </div>
  );
}

// Boolean Factor Card Component
function BooleanFactorCard({
  title,
  icon: Icon,
  iconColor,
  topPercent,
  bottomPercent,
  correlation,
}: {
  title: string;
  icon: any;
  iconColor: string;
  topPercent: number;
  bottomPercent: number;
  correlation: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <h3 className="font-semibold flex items-center gap-2 mb-4">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        {title}
      </h3>
      
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Top Performers Use</span>
          <span className="font-bold text-green-400">{topPercent.toFixed(0)}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Bottom Performers Use</span>
          <span className="font-medium text-red-400">{bottomPercent.toFixed(0)}%</span>
        </div>
      </div>
      
      <div className={`flex items-center gap-2 p-2 rounded-lg ${
        correlation === "positive" ? "bg-green-500/10 text-green-400" :
        correlation === "negative" ? "bg-red-500/10 text-red-400" :
        "bg-gray-500/10 text-gray-400"
      }`}>
        {correlation === "positive" ? (
          <>
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Correlates with higher views</span>
          </>
        ) : correlation === "negative" ? (
          <>
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Correlates with lower views</span>
          </>
        ) : (
          <>
            <span className="w-4 h-4 flex items-center justify-center">≈</span>
            <span className="text-sm">No significant correlation</span>
          </>
        )}
      </div>
    </div>
  );
}

