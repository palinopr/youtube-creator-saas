"use client";

import { useState, useEffect, useCallback } from "react";
import { API_URL } from "@/lib/config";

interface ChannelStats {
  title: string;
  subscriber_count: number;
  view_count: number;
  video_count: number;
  custom_url?: string;
  thumbnail_url?: string;
}

interface Video {
  video_id: string;
  title: string;
  thumbnail_url: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at: string;
}

interface TopVideo extends Video {
  rank?: number;
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

interface DashboardData {
  channelStats: ChannelStats | null;
  recentVideos: Video[];
  topVideo: TopVideo | null;
  analyticsOverview: AnalyticsOverview | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardData(): DashboardData {
  const [channelStats, setChannelStats] = useState<ChannelStats | null>(null);
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [topVideo, setTopVideo] = useState<TopVideo | null>(null);
  const [analyticsOverview, setAnalyticsOverview] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Parallel fetch for better performance - includes analytics overview for charts
      const [statsRes, videosRes, topVideoRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}/api/channel/stats`, {
          credentials: "include",
        }).catch(() => null),
        fetch(`${API_URL}/api/videos/recent?limit=6`, {
          credentials: "include",
        }).catch(() => null),
        fetch(`${API_URL}/api/analysis/top-videos?limit=1`, {
          credentials: "include",
        }).catch(() => null),
        fetch(`${API_URL}/api/analytics/overview?days=30`, {
          credentials: "include",
        }).catch(() => null),
      ]);

      // Process channel stats
      if (statsRes?.ok) {
        const statsData = await statsRes.json();
        setChannelStats(statsData);
      }

      // Process recent videos
      if (videosRes?.ok) {
        const videosData = await videosRes.json();
        setRecentVideos(Array.isArray(videosData) ? videosData : []);
      }

      // Process top video
      if (topVideoRes?.ok) {
        const topVideoData = await topVideoRes.json();
        // API returns { top_videos: [...] }
        if (topVideoData?.top_videos && Array.isArray(topVideoData.top_videos) && topVideoData.top_videos.length > 0) {
          setTopVideo(topVideoData.top_videos[0]);
        } else if (Array.isArray(topVideoData) && topVideoData.length > 0) {
          setTopVideo(topVideoData[0]);
        } else if (topVideoData && !Array.isArray(topVideoData) && !topVideoData.top_videos) {
          setTopVideo(topVideoData);
        }
      }

      // Process analytics overview for charts
      if (analyticsRes?.ok) {
        const analyticsData = await analyticsRes.json();
        if (analyticsData && !analyticsData.error) {
          setAnalyticsOverview(analyticsData);
        }
      }
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
