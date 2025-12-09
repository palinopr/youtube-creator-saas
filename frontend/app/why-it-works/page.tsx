"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  FileText,
  TrendingUp,
  Star,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Target,
  Sparkles,
  BarChart3,
  Award,
  Zap,
  Clock,
  Hash,
  Link as LinkIcon,
  MessageSquare,
  ThumbsUp,
  Play,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CausalAnalysis {
  summary: {
    total_videos_analyzed: number;
    total_views: number;
    avg_views: number;
    top_video: {
      title: string;
      views: number;
      celebrities: string[];
    };
  };
  celebrity_impact: {
    top_celebrities: Array<{
      celebrity: string;
      video_count: number;
      avg_views: number;
      lift_vs_baseline: number;
      sample_titles: string[];
    }>;
    baseline_no_celebrity: {
      video_count: number;
      avg_views: number;
    };
    celebrity_vs_no_celebrity: {
      with_celebrity_avg: number;
      without_celebrity_avg: number;
    };
  };
  title_vs_content: {
    celebrity_contribution: {
      celebrity_lift_percent: number;
      insight: string;
    };
    title_factors_non_celebrity: {
      emoji_impact_no_celeb?: {
        with_emoji: { count: number; avg_views: number };
        without_emoji: { count: number; avg_views: number };
      };
    };
  };
  description_impact: {
    timestamps: {
      with_timestamps: { count: number; avg_views: number };
      without_timestamps: { count: number; avg_views: number };
    };
    social_links: {
      with_social_links: { count: number; avg_views: number };
      without_social_links: { count: number; avg_views: number };
    };
    call_to_action: {
      with_call_to_action: { count: number; avg_views: number };
      without_call_to_action: { count: number; avg_views: number };
    };
    description_length: {
      [key: string]: { count: number; avg_views: number };
    };
    hashtags: {
      [key: string]: { count: number; avg_views: number };
    };
  };
  success_factors: {
    factor_importance_ranking: Array<{
      factor: string;
      top_10_percent: number;
      bottom_10_percent: number;
      difference: number;
      direction: string;
    }>;
  };
  content_types: {
    content_type_analysis: Array<{
      content_type: string;
      video_count: number;
      avg_views: number;
      avg_like_ratio: number;
      celebrity_frequency: number;
      top_celebrities: string[];
    }>;
  };
}

export default function WhyItWorksPage() {
  const [analysis, setAnalysis] = useState<CausalAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"celebrity" | "factors" | "description" | "content">("celebrity");

  useEffect(() => {
    fetchCausalAnalysis();
  }, []);

  const fetchCausalAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/analysis/causal?max_videos=5000`, {
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl text-gray-300 mb-2">Running Causal Analysis...</p>
          <p className="text-sm text-gray-500">Analyzing ALL your videos (up to 5,000)</p>
          <p className="text-xs text-gray-600 mt-2">This may take 2-5 minutes for large channels</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/" className="text-cyan-400 hover:underline">Go back and authenticate</Link>
        </div>
      </div>
    );
  }

  const data = analysis;

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
                <Target className="w-6 h-6 text-cyan-400" />
                Why It Works Analysis
              </h1>
              <p className="text-sm text-gray-400">
                Deep causal analysis of {data?.summary?.total_videos_analyzed?.toLocaleString()} videos
              </p>
            </div>
            <button
              onClick={fetchCausalAnalysis}
              className="ml-auto p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Finding Banner */}
        <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/20 border border-cyan-500/30 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            Key Finding
          </h2>
          <p className="text-xl text-cyan-300 mb-2">
            {data?.title_vs_content?.celebrity_contribution?.insight}
          </p>
          <div className="flex gap-8 mt-4">
            <div>
              <p className="text-sm text-gray-400">With Celebrity</p>
              <p className="text-2xl font-bold text-green-400">
                {formatNumber(data?.celebrity_impact?.celebrity_vs_no_celebrity?.with_celebrity_avg || 0)} avg
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Without Celebrity</p>
              <p className="text-2xl font-bold text-gray-400">
                {formatNumber(data?.celebrity_impact?.celebrity_vs_no_celebrity?.without_celebrity_avg || 0)} avg
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Celebrity Lift</p>
              <p className="text-2xl font-bold text-cyan-400">
                +{data?.title_vs_content?.celebrity_contribution?.celebrity_lift_percent}%
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-4 overflow-x-auto">
          {[
            { id: "celebrity", label: "Celebrity Impact", icon: Users },
            { id: "factors", label: "Success Factors", icon: Target },
            { id: "description", label: "Description Impact", icon: FileText },
            { id: "content", label: "Content Types", icon: Play },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-cyan-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Celebrity Impact Tab */}
        {activeTab === "celebrity" && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-yellow-400" />
                Celebrity Rankings by Average Views
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Who drives the most views when featured in videos?
              </p>
              <div className="space-y-3">
                {data?.celebrity_impact?.top_celebrities?.slice(0, 15).map((celeb, i) => (
                  <div 
                    key={celeb.celebrity}
                    className={`p-4 rounded-lg ${
                      i < 3 ? "bg-gradient-to-r from-yellow-900/20 to-orange-900/10 border border-yellow-500/30" : "bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-xl font-bold ${
                          i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-gray-500"
                        }`}>#{i + 1}</span>
                        <span className="font-medium capitalize text-lg">{celeb.celebrity}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-cyan-400">{formatNumber(celeb.avg_views)}</p>
                        <p className={`text-sm ${celeb.lift_vs_baseline > 0 ? "text-green-400" : "text-red-400"}`}>
                          {celeb.lift_vs_baseline > 0 ? "+" : ""}{celeb.lift_vs_baseline}% vs baseline
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{celeb.video_count} videos</span>
                    </div>
                    {celeb.sample_titles.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        Top: "{celeb.sample_titles[0]}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Baseline comparison */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Baseline: Videos Without Celebrities
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-400">Video Count</p>
                  <p className="text-2xl font-bold">{data?.celebrity_impact?.baseline_no_celebrity?.video_count}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-400">Average Views</p>
                  <p className="text-2xl font-bold text-gray-400">
                    {formatNumber(data?.celebrity_impact?.baseline_no_celebrity?.avg_views || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Factors Tab */}
        {activeTab === "factors" && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-cyan-400" />
                Success Factors: Top 10% vs Bottom 10%
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                What do your most successful videos have that the worst ones don't?
              </p>
              <div className="space-y-4">
                {data?.success_factors?.factor_importance_ranking?.map((factor) => {
                  const isPositive = factor.difference > 0;
                  const absValue = Math.abs(factor.difference);
                  const isSignificant = absValue >= 10;
                  
                  return (
                    <div key={factor.factor} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{factor.factor.replace(/_/g, ' ')}</span>
                        <div className={`flex items-center gap-2 ${
                          isSignificant 
                            ? (isPositive ? "text-green-400" : "text-red-400")
                            : "text-gray-400"
                        }`}>
                          {isSignificant && (isPositive ? <TrendingUp className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />)}
                          <span className="font-bold">
                            {isPositive ? "+" : ""}{factor.difference}%
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-8 text-sm">
                        <div>
                          <span className="text-gray-500">Top 10%: </span>
                          <span className="text-green-400">{factor.top_10_percent}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Bottom 10%: </span>
                          <span className="text-red-400">{factor.bottom_10_percent}%</span>
                        </div>
                      </div>
                      {isSignificant && (
                        <p className="text-xs text-cyan-400 mt-2">
                          {isPositive 
                            ? `✓ Higher in successful videos - ${factor.factor.replace(/_/g, ' ')} correlates with success`
                            : `⚠ Lower in successful videos - consider reducing ${factor.factor.replace(/_/g, ' ')}`
                          }
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Description Impact Tab */}
        {activeTab === "description" && (
          <div className="space-y-6">
            {/* Timestamps */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-orange-400" />
                Timestamps Impact
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-r from-green-900/20 to-emerald-900/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-gray-400">With Timestamps</p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatNumber(data?.description_impact?.timestamps?.with_timestamps?.avg_views || 0)}
                  </p>
                  <p className="text-xs text-gray-500">{data?.description_impact?.timestamps?.with_timestamps?.count} videos</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-400">Without Timestamps</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(data?.description_impact?.timestamps?.without_timestamps?.avg_views || 0)}
                  </p>
                  <p className="text-xs text-gray-500">{data?.description_impact?.timestamps?.without_timestamps?.count} videos</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <LinkIcon className="w-5 h-5 text-blue-400" />
                Social Links Impact
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-400">With Social Links</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(data?.description_impact?.social_links?.with_social_links?.avg_views || 0)}
                  </p>
                  <p className="text-xs text-gray-500">{data?.description_impact?.social_links?.with_social_links?.count} videos</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-400">Without Social Links</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(data?.description_impact?.social_links?.without_social_links?.avg_views || 0)}
                  </p>
                  <p className="text-xs text-gray-500">{data?.description_impact?.social_links?.without_social_links?.count} videos</p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-pink-400" />
                Call to Action Impact
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-400">With CTA (subscribe, like, etc.)</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(data?.description_impact?.call_to_action?.with_call_to_action?.avg_views || 0)}
                  </p>
                  <p className="text-xs text-gray-500">{data?.description_impact?.call_to_action?.with_call_to_action?.count} videos</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-400">Without CTA</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(data?.description_impact?.call_to_action?.without_call_to_action?.avg_views || 0)}
                  </p>
                  <p className="text-xs text-gray-500">{data?.description_impact?.call_to_action?.without_call_to_action?.count} videos</p>
                </div>
              </div>
            </div>

            {/* Description Length */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-purple-400" />
                Description Length Impact
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(data?.description_impact?.description_length || {}).map(([key, value]) => (
                  <div key={key} className="p-4 bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-400 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-xl font-bold">{formatNumber(value.avg_views)}</p>
                    <p className="text-xs text-gray-500">{value.count} videos</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hashtags */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Hash className="w-5 h-5 text-cyan-400" />
                Hashtags Impact
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(data?.description_impact?.hashtags || {}).map(([key, value]) => (
                  <div key={key} className="p-4 bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-400 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-xl font-bold">{formatNumber(value.avg_views)}</p>
                    <p className="text-xs text-gray-500">{value.count} videos</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content Types Tab */}
        {activeTab === "content" && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Play className="w-5 h-5 text-red-400" />
                Content Type Deep Analysis
              </h3>
              <div className="space-y-4">
                {data?.content_types?.content_type_analysis?.map((type, i) => (
                  <div 
                    key={type.content_type}
                    className={`p-4 rounded-lg ${
                      i < 3 ? "bg-gradient-to-r from-red-900/20 to-orange-900/10 border border-red-500/30" : "bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-xl font-bold ${
                          i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-gray-500"
                        }`}>#{i + 1}</span>
                        <span className="font-medium capitalize text-lg">{type.content_type.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-xl font-bold text-cyan-400">{formatNumber(type.avg_views)} avg</p>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm mt-3">
                      <div>
                        <span className="text-gray-500">Videos: </span>
                        <span>{type.video_count}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Like Ratio: </span>
                        <span className="text-pink-400">{type.avg_like_ratio}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Has Celebrity: </span>
                        <span className="text-green-400">{type.celebrity_frequency}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Top Celebs: </span>
                        <span className="text-yellow-400">{type.top_celebrities?.slice(0, 2).join(', ') || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

