"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Clock,
  Calendar,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  Eye,
  FileText,
  Zap,
  Trophy,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Play,
  Hash,
  Loader2,
} from "lucide-react";
import { API_URL } from "@/lib/config";

// Polling interval in milliseconds
const POLL_INTERVAL = 5000;

interface DeepAnalysis {
  summary: {
    total_videos: number;
    total_views: number;
    avg_views: number;
    top_video: { title: string; views: number };
    date_range: { earliest: string; latest: string };
  };
  posting_times: {
    best_days: Array<{ day: string; avg_views: number; video_count: number }>;
    best_hours: Array<{ hour: number; hour_label: string; avg_views: number; video_count: number }>;
    best_months: Array<{ month_name: string; avg_views: number; video_count: number }>;
    yearly_trend: Array<{ year: number; video_count: number; avg_views: number; total_views: number }>;
  };
  title_patterns: {
    power_words: Array<{ word: string; lift: number; top_video_count: number }>;
    avoid_words: Array<{ word: string; bottom_percent: number }>;
    title_characteristics: {
      emoji_effect: { recommendation: string; with_factor_avg: number; without_factor_avg: number };
      numbers_effect: { recommendation: string; with_factor_avg: number; without_factor_avg: number };
      question_effect: { recommendation: string; with_factor_avg: number; without_factor_avg: number };
    };
    top_phrases: Array<{ phrase: string; count: number; avg_views: number }>;
  };
  engagement: {
    overall_stats: { avg_like_ratio: number; avg_engagement_score: number };
    most_engaging_videos: Array<{ title: string; views: number; engagement_score: number }>;
    engagement_by_duration: Array<{ duration_range: string; avg_views: number; avg_engagement: number; video_count: number }>;
  };
  content_types: {
    by_content_type: Array<{ 
      content_type: string; 
      video_count: number; 
      avg_views: number; 
      total_views: number;
      avg_engagement: number;
    }>;
  };
  growth_trends: {
    monthly_stats: Array<{ month: string; video_count: number; avg_views: number; total_views: number }>;
    growth_rate_6m: number;
    breakout_videos: Array<{ title: string; views: number; multiplier: number; month: string }>;
  };
}

interface JobStatus {
  status: "pending" | "queued" | "fetching" | "processing" | "completed" | "failed";
  progress: number;
  message: string;
  result?: DeepAnalysis;
  error?: string;
}

export default function DeepAnalysisPage() {
  const [analysis, setAnalysis] = useState<DeepAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "timing" | "titles" | "engagement" | "content" | "growth">("overview");
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Poll for job status
  const pollJobStatus = useCallback(async (currentJobId: string) => {
    if (!currentJobId || isPollingRef.current) return;
    
    isPollingRef.current = true;
    
    try {
      const response = await fetch(`${API_URL}/api/analysis/deep/status/${currentJobId}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // Job not found, stop polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setError("Analysis job not found. Please try again.");
          setLoading(false);
          return;
        }
        throw new Error("Failed to fetch job status");
      }
      
      const status: JobStatus = await response.json();
      setJobStatus(status);
      
      if (status.status === "completed" && status.result) {
        // Job completed successfully
        setAnalysis(status.result);
        setLoading(false);
        setJobId(null);
        
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else if (status.status === "failed") {
        // Job failed
        setError(status.error || "Analysis failed. Please try again.");
        setLoading(false);
        setJobId(null);
        
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
      // Otherwise keep polling
    } catch (err) {
      console.error("Polling error:", err);
      // Don't stop polling on transient errors, just log them
    } finally {
      isPollingRef.current = false;
    }
  }, []);

  // Start the analysis job
  const startDeepAnalysis = async () => {
    setLoading(true);
    setError(null);
    setJobStatus(null);
    setAnalysis(null);
    
    // Stop any existing polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    try {
      // First, try the async endpoint to start a background job
      const startResponse = await fetch(`${API_URL}/api/analysis/deep/start?max_videos=500`, {
        method: "POST",
        credentials: "include",
      });
      
      if (startResponse.ok) {
        const startData = await startResponse.json();
        
        if (startData.job_id) {
          // Async job started, begin polling
          setJobId(startData.job_id);
          setJobStatus({
            status: "queued",
            progress: 0,
            message: "Analysis job queued...",
          });
          
          // Start polling for status
          pollIntervalRef.current = setInterval(() => {
            pollJobStatus(startData.job_id);
          }, POLL_INTERVAL);
          
          // Also poll immediately
          pollJobStatus(startData.job_id);
          return;
        }
      }
      
      // Fallback to synchronous endpoint if async not available
      const response = await fetch(`${API_URL}/api/analysis/deep?max_videos=500`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError("Please authenticate first");
          setLoading(false);
          return;
        }
        throw new Error("Failed to fetch analysis");
      }
      
      const data = await response.json();
      setAnalysis(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start analysis");
      setLoading(false);
    }
  };

  // Auto-start on mount
  useEffect(() => {
    startDeepAnalysis();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // Loading state with progress
  if (loading) {
    const progressPercent = jobStatus?.progress || 0;
    const statusMessage = jobStatus?.message || "Initializing analysis...";
    const statusPhase = jobStatus?.status || "pending";
    
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          {/* Animated spinner */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
            <div 
              className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"
              style={{ animationDuration: '1s' }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">Running Deep Analysis</h2>
          <p className="text-gray-400 mb-6">{statusMessage}</p>
          
          {/* Progress bar */}
          <div className="w-full bg-white/10 rounded-full h-3 mb-4 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.max(progressPercent, 5)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-gray-500 mb-6">
            <span>{progressPercent}% complete</span>
            <span className="capitalize">{statusPhase.replace(/_/g, ' ')}</span>
          </div>
          
          {/* Status phases */}
          <div className="space-y-2 text-left bg-white/5 rounded-xl p-4">
            {[
              { id: "queued", label: "Job queued", icon: Clock },
              { id: "fetching", label: "Fetching video data", icon: Eye },
              { id: "processing", label: "Analyzing patterns", icon: BarChart3 },
              { id: "completed", label: "Generating insights", icon: Zap },
            ].map((phase, i) => {
              const isActive = statusPhase === phase.id;
              const isPast = 
                (statusPhase === "fetching" && i === 0) ||
                (statusPhase === "processing" && i <= 1) ||
                (statusPhase === "completed" && i <= 2);
              
              return (
                <div 
                  key={phase.id}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    isActive ? "bg-purple-500/20 text-purple-300" :
                    isPast ? "text-green-400" : "text-gray-600"
                  }`}
                >
                  {isPast ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <phase.icon className="w-4 h-4" />
                  )}
                  <span className="text-sm">{phase.label}</span>
                </div>
              );
            })}
          </div>
          
          <p className="text-xs text-gray-600 mt-6">
            Analyzing up to 500 videos • Polling every {POLL_INTERVAL / 1000}s
          </p>
          
          {jobId && (
            <p className="text-xs text-gray-700 mt-2 font-mono">
              Job ID: {jobId}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Analysis Failed</h2>
          <p className="text-red-400 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={startDeepAnalysis}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
            <Link 
              href="/" 
              className="block w-full px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors text-center"
            >
              Go Back & Authenticate
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const data = analysis;

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No analysis data available</p>
          <button 
            onClick={startDeepAnalysis}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors"
          >
            Run Analysis
          </button>
        </div>
      </div>
    );
  }

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
                <Zap className="w-6 h-6 text-yellow-400" />
                Deep Channel Analysis
              </h1>
              <p className="text-sm text-gray-400">
                Comprehensive insights from {data?.summary?.total_videos?.toLocaleString()} videos
              </p>
            </div>
            <button
              onClick={startDeepAnalysis}
              disabled={loading}
              className="ml-auto p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border border-purple-500/30 rounded-xl p-4">
            <p className="text-sm text-gray-400">Videos Analyzed</p>
            <p className="text-2xl font-bold text-purple-300">{data?.summary?.total_videos?.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-sm text-gray-400">Total Views</p>
            <p className="text-2xl font-bold text-blue-300">{formatNumber(data?.summary?.total_views || 0)}</p>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-green-800/10 border border-green-500/30 rounded-xl p-4">
            <p className="text-sm text-gray-400">Avg Views</p>
            <p className="text-2xl font-bold text-green-300">{formatNumber(data?.summary?.avg_views || 0)}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/10 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-sm text-gray-400">6M Growth</p>
            <p className={`text-2xl font-bold ${(data?.growth_trends?.growth_rate_6m || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(data?.growth_trends?.growth_rate_6m || 0) >= 0 ? '+' : ''}{data?.growth_trends?.growth_rate_6m}%
            </p>
          </div>
          <div className="bg-gradient-to-br from-pink-600/20 to-pink-800/10 border border-pink-500/30 rounded-xl p-4">
            <p className="text-sm text-gray-400">Date Range</p>
            <p className="text-sm font-bold text-pink-300">{data?.summary?.date_range?.earliest} → {data?.summary?.date_range?.latest}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-4 overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "timing", label: "Best Times", icon: Clock },
            { id: "titles", label: "Title Patterns", icon: FileText },
            { id: "engagement", label: "Engagement", icon: ThumbsUp },
            { id: "content", label: "Content Types", icon: Play },
            { id: "growth", label: "Growth", icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${
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
        {activeTab === "overview" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Video */}
            <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/10 border border-yellow-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-yellow-400" />
                #1 Video of All Time
              </h3>
              <p className="text-yellow-200 mb-2">{data?.summary?.top_video?.title}</p>
              <p className="text-3xl font-bold text-yellow-400">{formatNumber(data?.summary?.top_video?.views || 0)} views</p>
            </div>

            {/* Quick Insights */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-400" />
                Quick Insights
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Best day: <strong className="text-green-400">{data?.posting_times?.best_days?.[0]?.day}</strong></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Best hour: <strong className="text-green-400">{data?.posting_times?.best_hours?.[0]?.hour_label}</strong></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Top content: <strong className="text-green-400">{data?.content_types?.by_content_type?.[0]?.content_type}</strong></span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Power word: <strong className="text-green-400">{data?.title_patterns?.power_words?.[0]?.word}</strong></span>
                </div>
              </div>
            </div>

            {/* Best Content Types */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:col-span-2">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Play className="w-5 h-5 text-red-400" />
                Content Type Performance
              </h3>
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
                {data?.content_types?.by_content_type?.slice(0, 8).map((type, i) => (
                  <div
                    key={type.content_type}
                    className={`p-4 rounded-lg ${
                      i === 0 ? "bg-gradient-to-br from-yellow-600/20 to-orange-600/10 border border-yellow-500/30" :
                      i === 1 ? "bg-gradient-to-br from-gray-400/10 to-gray-600/10 border border-gray-400/30" :
                      "bg-white/5 border border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-bold ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : "text-gray-400"}`}>
                        #{i + 1}
                      </span>
                      <span className="font-medium capitalize">{type.content_type.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-lg font-bold text-blue-400">{formatNumber(type.avg_views)} avg</p>
                    <p className="text-xs text-gray-500">{type.video_count} videos</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "timing" && (
          <div className="space-y-6">
            {/* Best Days */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-400" />
                Best Days to Post
              </h3>
              <div className="grid md:grid-cols-7 gap-2">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                  const dayData = data?.posting_times?.best_days?.find(d => d.day === day) || 
                                  { day, avg_views: 0, video_count: 0 };
                  const maxViews = Math.max(...(data?.posting_times?.best_days?.map(d => d.avg_views) || [1]));
                  const percentage = (dayData.avg_views / maxViews) * 100;
                  const isTop = data?.posting_times?.best_days?.[0]?.day === day;
                  
                  return (
                    <div
                      key={day}
                      className={`p-3 rounded-lg text-center ${
                        isTop ? "bg-gradient-to-br from-green-600/30 to-emerald-600/20 border border-green-500/50" : "bg-white/5"
                      }`}
                    >
                      <p className="text-xs text-gray-400 mb-1">{day.slice(0, 3)}</p>
                      <div className="h-16 flex items-end justify-center mb-2">
                        <div
                          className={`w-8 rounded-t ${isTop ? "bg-green-500" : "bg-purple-500/50"}`}
                          style={{ height: `${Math.max(percentage, 10)}%` }}
                        />
                      </div>
                      <p className={`text-sm font-bold ${isTop ? "text-green-400" : ""}`}>
                        {formatNumber(dayData.avg_views)}
                      </p>
                      <p className="text-xs text-gray-500">{dayData.video_count} vids</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Best Hours */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-orange-400" />
                Best Hours to Post (Top 10)
              </h3>
              <div className="grid md:grid-cols-5 gap-3">
                {data?.posting_times?.best_hours?.slice(0, 10).map((hour, i) => (
                  <div
                    key={hour.hour}
                    className={`p-3 rounded-lg ${
                      i < 3 ? "bg-gradient-to-br from-orange-600/20 to-yellow-600/10 border border-orange-500/30" : "bg-white/5"
                    }`}
                  >
                    <p className="text-xs text-gray-400">#{i + 1}</p>
                    <p className={`text-xl font-bold ${i < 3 ? "text-orange-400" : ""}`}>{hour.hour_label}</p>
                    <p className="text-sm">{formatNumber(hour.avg_views)} avg</p>
                    <p className="text-xs text-gray-500">{hour.video_count} videos</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Yearly Trend */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Yearly Performance
              </h3>
              <div className="space-y-3">
                {data?.posting_times?.yearly_trend?.map((year) => (
                  <div key={year.year} className="flex items-center gap-4">
                    <span className="w-12 font-bold">{year.year}</span>
                    <div className="flex-1 bg-white/10 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-end px-2"
                        style={{ 
                          width: `${(year.avg_views / Math.max(...(data?.posting_times?.yearly_trend?.map(y => y.avg_views) || [1]))) * 100}%` 
                        }}
                      >
                        <span className="text-xs font-medium">{formatNumber(year.avg_views)}</span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400 w-20">{year.video_count} vids</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "titles" && (
          <div className="space-y-6">
            {/* Power Words */}
            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/10 border border-green-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-green-400" />
                Power Words (Use These!)
              </h3>
              <p className="text-sm text-gray-400 mb-4">Words that appear more frequently in your top performing videos</p>
              <div className="flex flex-wrap gap-2">
                {data?.title_patterns?.power_words?.slice(0, 25).map((word, i) => (
                  <span
                    key={word.word}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      i < 5 ? "bg-green-500/30 text-green-300 border border-green-500/50" :
                      i < 10 ? "bg-green-500/20 text-green-400" :
                      "bg-white/10 text-gray-300"
                    }`}
                  >
                    {word.word}
                    <span className="ml-1 text-xs opacity-70">{word.lift}x</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Words to Avoid */}
            <div className="bg-gradient-to-br from-red-900/20 to-orange-900/10 border border-red-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Words to Avoid
              </h3>
              <p className="text-sm text-gray-400 mb-4">Words that appear more frequently in your low performing videos</p>
              <div className="flex flex-wrap gap-2">
                {data?.title_patterns?.avoid_words?.slice(0, 15).map((word) => (
                  <span
                    key={word.word}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400"
                  >
                    {word.word}
                  </span>
                ))}
              </div>
            </div>

            {/* Title Characteristics */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Hash className="w-5 h-5 text-purple-400" />
                Title Characteristics
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: "Emojis", data: data?.title_patterns?.title_characteristics?.emoji_effect },
                  { name: "Numbers", data: data?.title_patterns?.title_characteristics?.numbers_effect },
                  { name: "Questions (?)", data: data?.title_patterns?.title_characteristics?.question_effect },
                ].map((char) => (
                  <div key={char.name} className="p-4 bg-white/5 rounded-lg">
                    <h4 className="font-medium mb-2">{char.name}</h4>
                    <div className={`flex items-center gap-2 ${
                      char.data?.recommendation === "use" ? "text-green-400" :
                      char.data?.recommendation === "avoid" ? "text-red-400" :
                      "text-gray-400"
                    }`}>
                      {char.data?.recommendation === "use" ? <CheckCircle className="w-4 h-4" /> :
                       char.data?.recommendation === "avoid" ? <AlertTriangle className="w-4 h-4" /> :
                       <span className="w-4 h-4 flex items-center justify-center">≈</span>}
                      <span className="capitalize">{char.data?.recommendation}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      With: {formatNumber(char.data?.with_factor_avg || 0)} avg views
                    </p>
                    <p className="text-xs text-gray-500">
                      Without: {formatNumber(char.data?.without_factor_avg || 0)} avg views
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Phrases */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-400" />
                Top Phrases in High-Performing Videos
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                {data?.title_patterns?.top_phrases?.slice(0, 16).map((phrase, i) => (
                  <div key={phrase.phrase} className="p-3 bg-white/5 rounded-lg">
                    <p className="font-medium text-blue-300">"{phrase.phrase}"</p>
                    <p className="text-sm text-gray-400">{phrase.count} videos • {formatNumber(phrase.avg_views)} avg</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "engagement" && (
          <div className="space-y-6">
            {/* Overall Engagement */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-pink-600/20 to-red-600/10 border border-pink-500/30 rounded-xl p-6">
                <p className="text-sm text-gray-400">Avg Like Ratio</p>
                <p className="text-3xl font-bold text-pink-400">{data?.engagement?.overall_stats?.avg_like_ratio}%</p>
                <p className="text-xs text-gray-500">likes per 100 views</p>
              </div>
              <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/10 border border-blue-500/30 rounded-xl p-6">
                <p className="text-sm text-gray-400">Avg Engagement Score</p>
                <p className="text-3xl font-bold text-blue-400">{data?.engagement?.overall_stats?.avg_engagement_score}</p>
                <p className="text-xs text-gray-500">combined likes + comments</p>
              </div>
              <div className="bg-gradient-to-br from-purple-600/20 to-violet-600/10 border border-purple-500/30 rounded-xl p-6">
                <p className="text-sm text-gray-400">Most Engaging Duration</p>
                <p className="text-3xl font-bold text-purple-400">
                  {data?.engagement?.engagement_by_duration?.sort((a, b) => b.avg_engagement - a.avg_engagement)?.[0]?.duration_range}
                </p>
              </div>
            </div>

            {/* Engagement by Duration */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-orange-400" />
                Engagement by Video Duration
              </h3>
              <div className="space-y-3">
                {data?.engagement?.engagement_by_duration?.map((dur) => (
                  <div key={dur.duration_range} className="flex items-center gap-4">
                    <span className="w-24 font-medium">{dur.duration_range}</span>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Avg Views</p>
                        <p className="font-bold text-blue-400">{formatNumber(dur.avg_views)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Engagement</p>
                        <p className="font-bold text-pink-400">{dur.avg_engagement}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{dur.video_count} vids</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Engaging Videos */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <ThumbsUp className="w-5 h-5 text-green-400" />
                Most Engaging Videos
              </h3>
              <div className="space-y-3">
                {data?.engagement?.most_engaging_videos?.slice(0, 10).map((video, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                    <span className={`font-bold ${i < 3 ? "text-yellow-400" : "text-gray-500"}`}>#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{video.title}</p>
                      <p className="text-sm text-gray-400">{formatNumber(video.views)} views</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-pink-400">{video.engagement_score}</p>
                      <p className="text-xs text-gray-500">engagement</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "content" && (
          <div className="space-y-6">
            {/* Content Type Ranking */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Play className="w-5 h-5 text-red-400" />
                Content Type Rankings
              </h3>
              <div className="space-y-4">
                {data?.content_types?.by_content_type?.map((type, i) => (
                  <div key={type.content_type} className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-xl font-bold ${
                          i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-gray-500"
                        }`}>#{i + 1}</span>
                        <span className="font-medium capitalize text-lg">{type.content_type.replace(/_/g, ' ')}</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-400">{formatNumber(type.avg_views)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Videos</p>
                        <p className="font-medium">{type.video_count}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Total Views</p>
                        <p className="font-medium">{formatNumber(type.total_views)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Engagement</p>
                        <p className="font-medium">{type.avg_engagement}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "growth" && (
          <div className="space-y-6">
            {/* Growth Rate */}
            <div className={`rounded-xl p-6 ${
              (data?.growth_trends?.growth_rate_6m || 0) >= 0 
                ? "bg-gradient-to-br from-green-900/20 to-emerald-900/10 border border-green-500/30"
                : "bg-gradient-to-br from-red-900/20 to-orange-900/10 border border-red-500/30"
            }`}>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <TrendingUp className={`w-5 h-5 ${(data?.growth_trends?.growth_rate_6m || 0) >= 0 ? "text-green-400" : "text-red-400"}`} />
                6-Month Growth Rate
              </h3>
              <p className={`text-5xl font-bold ${(data?.growth_trends?.growth_rate_6m || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                {(data?.growth_trends?.growth_rate_6m || 0) >= 0 ? '+' : ''}{data?.growth_trends?.growth_rate_6m}%
              </p>
              <p className="text-gray-400 mt-2">Comparing last 6 months to previous 6 months</p>
            </div>

            {/* Breakout Videos */}
            <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/10 border border-yellow-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Breakout Videos (5x+ Above Month Average)
              </h3>
              <div className="space-y-3">
                {data?.growth_trends?.breakout_videos?.slice(0, 10).map((video, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                    <span className="text-yellow-400 font-bold">{video.multiplier}x</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{video.title}</p>
                      <p className="text-sm text-gray-400">{video.month}</p>
                    </div>
                    <p className="font-bold text-green-400">{formatNumber(video.views)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-400" />
                Monthly Performance (Last 12 Months)
              </h3>
              <div className="overflow-x-auto">
                <div className="flex gap-2" style={{ minWidth: "800px" }}>
                  {data?.growth_trends?.monthly_stats?.slice(-12).map((month) => {
                    const maxViews = Math.max(...(data?.growth_trends?.monthly_stats?.slice(-12).map(m => m.avg_views) || [1]));
                    const height = (month.avg_views / maxViews) * 150;
                    
                    return (
                      <div key={month.month} className="flex-1 text-center">
                        <div className="h-40 flex items-end justify-center mb-2">
                          <div
                            className="w-full max-w-12 bg-gradient-to-t from-purple-600 to-pink-500 rounded-t"
                            style={{ height: `${height}px` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400">{month.month.slice(5)}</p>
                        <p className="text-xs font-medium">{formatNumber(month.avg_views)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
