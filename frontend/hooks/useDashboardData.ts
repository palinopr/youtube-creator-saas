"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

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
      const [statsRes, videosRes, topVideoRes, analyticsRes] = await Promise.allSettled([
        api.getChannelStats(),
        api.getRecentVideos(6),
        api.getTopVideos(1),
        api.getAnalyticsOverview(30),
      ]);

      if (statsRes.status === "fulfilled") {
        setChannelStats(statsRes.value as any);
      }

      if (videosRes.status === "fulfilled") {
        const videosData = videosRes.value as any;
        setRecentVideos(Array.isArray(videosData) ? videosData : []);
      }

      if (topVideoRes.status === "fulfilled") {
        const topVideos = (topVideoRes.value as any)?.top_videos;
        if (Array.isArray(topVideos) && topVideos.length > 0) {
          setTopVideo(topVideos[0]);
        }
      }

      if (analyticsRes.status === "fulfilled") {
        const analyticsData = analyticsRes.value as any;
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
