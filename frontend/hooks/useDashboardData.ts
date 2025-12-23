"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ChannelStats as ApiChannelStats, VideoStats } from "@/lib/api";

// Re-export API types with dashboard-specific extensions
interface ChannelStats extends ApiChannelStats {
  custom_url?: string;
}

interface Video extends VideoStats {
  // Video extends VideoStats from API
}

interface TopVideo extends Video {
  rank?: number;
}

// Response types for API calls
interface TopVideosResponse {
  top_videos: TopVideo[];
  total_analyzed?: number;
}

// Analytics daily data from YouTube Analytics API
export interface DailyAnalytics {
  date: string;
  views: number;
  watch_time_minutes: number;
  avg_view_duration: number;
  subscribers_gained: number;
  subscribers_lost: number;
  likes: number;
  dislikes: number;
  shares: number;
  comments: number;
}

export interface AnalyticsTotals {
  views: number;
  watch_time_minutes: number;
  avg_view_duration: number;
  subscribers_gained: number;
  subscribers_lost: number;
  likes: number;
  dislikes: number;
  shares: number;
  comments: number;
}

export interface AnalyticsOverview {
  period: string;
  start_date: string;
  end_date: string;
  totals: AnalyticsTotals;
  daily_data: DailyAnalytics[];
  error?: string;
}

// Individual error states for each data source
interface DataErrors {
  channelStats: string | null;
  recentVideos: string | null;
  topVideo: string | null;
  analyticsOverview: string | null;
}

interface DashboardData {
  channelStats: ChannelStats | null;
  recentVideos: Video[];
  topVideo: TopVideo | null;
  analyticsOverview: AnalyticsOverview | null;
  isLoading: boolean;
  error: string | null;
  errors: DataErrors;  // Individual error states
  lastUpdated: Date | null;  // When data was last fetched
  refetch: () => Promise<void>;
}

export function useDashboardData(): DashboardData {
  const [channelStats, setChannelStats] = useState<ChannelStats | null>(null);
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [topVideo, setTopVideo] = useState<TopVideo | null>(null);
  const [analyticsOverview, setAnalyticsOverview] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [errors, setErrors] = useState<DataErrors>({
    channelStats: null,
    recentVideos: null,
    topVideo: null,
    analyticsOverview: null,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Reset individual errors
    const newErrors: DataErrors = {
      channelStats: null,
      recentVideos: null,
      topVideo: null,
      analyticsOverview: null,
    };

    try {
      const [statsRes, videosRes, topVideoRes, analyticsRes] = await Promise.allSettled([
        api.getChannelStats(),
        api.getRecentVideos(6),
        api.getTopVideos(1),
        api.getAnalyticsOverview(30),
      ]);

      // Handle channel stats
      if (statsRes.status === "fulfilled") {
        setChannelStats(statsRes.value as ChannelStats);
      } else {
        const errMsg = statsRes.reason?.message || "Failed to load channel stats";
        newErrors.channelStats = errMsg;
        console.error("Channel stats error:", errMsg);
      }

      // Handle recent videos
      if (videosRes.status === "fulfilled") {
        setRecentVideos(Array.isArray(videosRes.value) ? videosRes.value : []);
      } else {
        const errMsg = videosRes.reason?.message || "Failed to load recent videos";
        newErrors.recentVideos = errMsg;
        console.error("Recent videos error:", errMsg);
      }

      // Handle top video
      if (topVideoRes.status === "fulfilled") {
        const topVideosResponse = topVideoRes.value as TopVideosResponse;
        if (Array.isArray(topVideosResponse?.top_videos) && topVideosResponse.top_videos.length > 0) {
          setTopVideo(topVideosResponse.top_videos[0]);
        }
      } else {
        const errMsg = topVideoRes.reason?.message || "Failed to load top video";
        newErrors.topVideo = errMsg;
        console.error("Top video error:", errMsg);
      }

      // Handle analytics overview
      if (analyticsRes.status === "fulfilled") {
        const analyticsData = analyticsRes.value as AnalyticsOverview;
        if (analyticsData && !analyticsData.error) {
          setAnalyticsOverview(analyticsData);
        } else if (analyticsData?.error) {
          newErrors.analyticsOverview = analyticsData.error;
        }
      } else {
        const errMsg = analyticsRes.reason?.message || "Failed to load analytics";
        newErrors.analyticsOverview = errMsg;
        console.error("Analytics error:", errMsg);
      }

      // Update errors state
      setErrors(newErrors);

      // Check if any critical errors occurred
      const hasErrors = Object.values(newErrors).some(e => e !== null);
      if (hasErrors) {
        const failedCount = Object.values(newErrors).filter(e => e !== null).length;
        setError(`${failedCount} data source(s) failed to load`);
      }

      // Update last updated timestamp
      setLastUpdated(new Date());

    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    channelStats,
    recentVideos,
    topVideo,
    analyticsOverview,
    isLoading,
    error,
    errors,
    lastUpdated,
    refetch: fetchData,
  };
}

// Helper to calculate trend (mock for now - real implementation needs historical data)
export function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// Format numbers consistently
export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

// Format date consistently
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
