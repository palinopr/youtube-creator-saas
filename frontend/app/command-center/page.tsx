"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Play,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MessageSquare,
  ThumbsUp,
  Sparkles,
  BarChart3,
  Zap,
  Home,
  Video,
  ChevronRight,
  Calendar,
  LogOut,
  Menu,
  X,
  Scissors,
  Check,
  Clock,
  DollarSign,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { ChartSkeleton } from "@/components/dashboard";
import { useDashboardData, formatNumber, formatDate } from "@/hooks/useDashboardData";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/ui/Logo";
import Sidebar from "@/components/layout/Sidebar";
import HealthScore from "@/components/dashboard/HealthScore";
import AlertsPanel, { Alert } from "@/components/dashboard/AlertsPanel";
import ViralRadar, { TrendingVideo, calculateVideoVelocity } from "@/components/dashboard/ViralRadar";
import { InlineToast } from "@/components/ui/Toast";

// Lazy load charts for better performance
const ViewsTrendChart = dynamic(
  () => import("@/components/dashboard/ViewsTrendChart").then((mod) => ({ default: mod.ViewsTrendChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
);

const SubscriberChart = dynamic(
  () => import("@/components/dashboard/SubscriberChart").then((mod) => ({ default: mod.SubscriberChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export default function CommandCenterPage() {
  const { isAuthenticated, isLoading } = useAuth({
    requireAuth: true,
    redirectTo: "/",
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Dashboard />;
}

function Dashboard() {
  const { channelStats, recentVideos, topVideo, analyticsOverview, isLoading, error, errors, lastUpdated, refetch } = useDashboardData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showError, setShowError] = useState(true);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore logout failures
    }
    window.location.reload();
  };

  // Calculate health metrics from analytics data
  const healthMetrics = useMemo(() => {
    if (!analyticsOverview?.daily_data || analyticsOverview.daily_data.length < 7) {
      return undefined;
    }

    const dailyData = analyticsOverview.daily_data;
    const recentDays = dailyData.slice(-7);
    const previousDays = dailyData.slice(-14, -7);

    // Calculate view velocity (recent vs previous)
    const recentViews = recentDays.reduce((sum, d) => sum + (d.views || 0), 0);
    const previousViews = previousDays.reduce((sum, d) => sum + (d.views || 0), 0);
    const viewVelocity = previousViews > 0 ? ((recentViews - previousViews) / previousViews) * 100 : 0;

    // Calculate subscriber growth
    const recentSubs = recentDays.reduce((sum, d) => sum + (d.subscribers_gained || 0) - (d.subscribers_lost || 0), 0);
    const previousSubs = previousDays.reduce((sum, d) => sum + (d.subscribers_gained || 0) - (d.subscribers_lost || 0), 0);
    const subGrowth = previousSubs !== 0 ? ((recentSubs - previousSubs) / Math.abs(previousSubs)) * 100 : (recentSubs > 0 ? 100 : 0);

    // Calculate engagement trend (likes vs views ratio)
    const recentLikes = recentDays.reduce((sum, d) => sum + (d.likes || 0), 0);
    const previousLikes = previousDays.reduce((sum, d) => sum + (d.likes || 0), 0);
    const engagementTrend = previousLikes > 0 ? ((recentLikes - previousLikes) / previousLikes) * 100 : 0;

    // Upload consistency score (based on how regularly videos are published)
    const videosThisWeek = recentVideos.filter(v => {
      const publishDate = new Date(v.published_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return publishDate > weekAgo;
    }).length;
    const uploadConsistency = Math.min(100, videosThisWeek * 25); // 4 videos = 100

    return {
      viewVelocity: Math.round(viewVelocity * 10) / 10,
      subscriberGrowth: Math.round(subGrowth * 10) / 10,
      engagementTrend: Math.round(engagementTrend * 10) / 10,
      uploadConsistency,
    };
  }, [analyticsOverview, recentVideos]);

  // Calculate channel average views for viral radar
  const channelAverageViews = useMemo(() => {
    if (!recentVideos || recentVideos.length === 0) return 0;
    const totalViews = recentVideos.reduce((sum, v) => sum + (v.view_count || 0), 0);
    return Math.round(totalViews / recentVideos.length);
  }, [recentVideos]);

  // Calculate trending videos for viral radar
  const trendingVideos: TrendingVideo[] = useMemo(() => {
    if (!recentVideos || recentVideos.length === 0 || channelAverageViews === 0) return [];

    return recentVideos
      .filter(v => {
        const publishDate = new Date(v.published_at);
        const hoursSince = (Date.now() - publishDate.getTime()) / 3600000;
        return hoursSince < 168; // Only videos from last 7 days
      })
      .map(v => calculateVideoVelocity(
        {
          video_id: v.video_id,
          title: v.title,
          thumbnail_url: v.thumbnail_url,
          published_at: v.published_at,
          view_count: v.view_count,
          like_count: v.like_count,
          comment_count: v.comment_count,
        },
        channelAverageViews
      ));
  }, [recentVideos, channelAverageViews]);

  // Fetch alerts from backend API
  const [alertsLoading, setAlertsLoading] = useState(false);

  useEffect(() => {
    // Deduplicate alerts by type+title (keeps first occurrence)
    const deduplicateAlerts = (alerts: Alert[]): Alert[] => {
      const seen = new Map<string, Alert>();
      for (const alert of alerts) {
        // For milestones, dedupe by milestone value in data
        // For others, dedupe by type+title combination
        const key = alert.type === 'milestone'
          ? `milestone-${alert.data?.milestone || alert.title}`
          : `${alert.type}-${alert.title}`;

        if (!seen.has(key)) {
          seen.set(key, alert);
        }
      }
      return Array.from(seen.values());
    };

    const fetchAlerts = async () => {
      setAlertsLoading(true);
      try {
        // First, cleanup any existing duplicates in the database
        try {
          await api.cleanupDuplicateAlerts();
        } catch {
          // Ignore cleanup errors - it's an optimization
        }

        // Then, trigger a check for new alerts based on current data
        await api.checkForAlerts();

        // Fetch all alerts
        const response = await api.getAlerts(20, false);

        // Deduplicate on frontend as extra safety
        const uniqueAlerts = deduplicateAlerts(response.alerts as Alert[]);
        setAlerts(uniqueAlerts);
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
        // Fallback: generate alerts locally if API fails
        generateLocalAlerts();
      } finally {
        setAlertsLoading(false);
      }
    };

    // Local alert generation as fallback
    const generateLocalAlerts = () => {
      const newAlerts: Alert[] = [];

      // Check for viral videos
      const viralVideos = trendingVideos.filter(v => v.velocity_multiplier >= 3);
      viralVideos.forEach(v => {
        newAlerts.push({
          id: `viral-${v.id}`,
          type: "viral",
          title: v.velocity_multiplier >= 5 ? "Video Going Viral!" : "Video Trending Hot!",
          message: `"${v.title.slice(0, 50)}..." is getting ${v.velocity_multiplier.toFixed(1)}x more views than average.`,
          timestamp: new Date(),
          priority: v.velocity_multiplier >= 5 ? "high" : "medium",
          videoId: v.id,
          videoTitle: v.title,
          actionUrl: `/video/${v.id}`,
          actionLabel: "View analytics",
        });
      });

      // Check for view drops
      if (healthMetrics && healthMetrics.viewVelocity < -20) {
        newAlerts.push({
          id: "view-drop",
          type: "drop",
          title: "Views Dropping",
          message: `Views are down ${Math.abs(healthMetrics.viewVelocity).toFixed(0)}% compared to last week. Consider posting new content.`,
          timestamp: new Date(),
          priority: healthMetrics.viewVelocity < -50 ? "high" : "medium",
          actionUrl: "/analysis",
          actionLabel: "Analyze performance",
        });
      }

      // Milestone alerts based on subscriber count
      if (channelStats?.subscriber_count) {
        const milestones = [1000, 5000, 10000, 50000, 100000, 500000, 1000000];
        const subs = channelStats.subscriber_count;
        milestones.forEach(milestone => {
          if (subs >= milestone && subs < milestone * 1.05) {
            newAlerts.push({
              id: `milestone-${milestone}`,
              type: "milestone",
              title: `${formatNumber(milestone)} Subscribers!`,
              message: `Congratulations! You've reached ${formatNumber(milestone)} subscribers.`,
              timestamp: new Date(),
              priority: "medium",
            });
          }
        });
      }

      // Upload consistency warning
      if (healthMetrics && healthMetrics.uploadConsistency < 25) {
        newAlerts.push({
          id: "upload-consistency",
          type: "warning",
          title: "Upload Consistency",
          message: "You haven't uploaded recently. Consistent uploads help maintain audience engagement.",
          timestamp: new Date(Date.now() - 3600000),
          priority: "low",
          actionUrl: "/clips",
          actionLabel: "Create new clips",
        });
      }

      setAlerts(newAlerts);
    };

    fetchAlerts();

    // Refresh alerts every 15 minutes (reduced from 5 to prevent duplicate creation)
    const interval = setInterval(fetchAlerts, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [trendingVideos, healthMetrics, channelStats]);

  const handleDismissAlert = async (alertId: string) => {
    // Optimistically update UI
    setAlerts(prev => prev.map(a =>
      String(a.id) === alertId ? { ...a, dismissed: true, is_dismissed: true } : a
    ));

    // Call backend API if the alertId is numeric (backend alert)
    const numericId = parseInt(alertId, 10);
    if (!isNaN(numericId)) {
      try {
        await api.dismissAlert(numericId);
      } catch (error) {
        console.error("Failed to dismiss alert:", error);
        // Revert on error
        setAlerts(prev => prev.map(a =>
          String(a.id) === alertId ? { ...a, dismissed: false, is_dismissed: false } : a
        ));
      }
    }
  };

  const handleAlertAction = (alert: Alert) => {
    if (alert.actionUrl) {
      window.location.href = alert.actionUrl;
    }
  };

  // Calculate today's stats from analytics
  const todayStats = useMemo(() => {
    if (!analyticsOverview?.daily_data || analyticsOverview.daily_data.length === 0) {
      return { views: 0, viewsChange: 0, subs: 0, subsChange: 0, watchTime: 0 };
    }

    const today = analyticsOverview.daily_data[analyticsOverview.daily_data.length - 1];
    const yesterday = analyticsOverview.daily_data.length > 1
      ? analyticsOverview.daily_data[analyticsOverview.daily_data.length - 2]
      : null;

    const viewsChange = yesterday && yesterday.views > 0
      ? ((today.views - yesterday.views) / yesterday.views) * 100
      : 0;

    const todaySubs = (today.subscribers_gained || 0) - (today.subscribers_lost || 0);
    const yesterdaySubs = yesterday
      ? (yesterday.subscribers_gained || 0) - (yesterday.subscribers_lost || 0)
      : 0;
    const subsChange = yesterdaySubs !== 0
      ? ((todaySubs - yesterdaySubs) / Math.abs(yesterdaySubs)) * 100
      : 0;

    return {
      views: today.views || 0,
      viewsChange: Math.round(viewsChange),
      subs: todaySubs,
      subsChange: Math.round(subsChange),
      watchTime: Math.round((today.watch_time_minutes || 0) / 60), // Convert to hours
    };
  }, [analyticsOverview]);

  // Top performing videos - sorted by views (highest first)
  const topPerformingVideos = useMemo(() => {
    if (!recentVideos || recentVideos.length === 0) return [];

    return [...recentVideos]
      .filter(v => (v.view_count || 0) > 0) // Only videos with actual views
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 3);
  }, [recentVideos]);

  // Identify underperforming videos - videos with significantly fewer views than expected
  const underperformingVideos = useMemo(() => {
    if (!recentVideos || recentVideos.length === 0) return [];

    // Calculate average views per hour for the channel (based on videos with views)
    const videosWithViews = recentVideos.filter(v => (v.view_count || 0) > 0);
    if (videosWithViews.length === 0) return [];

    const avgViewsPerVideo = videosWithViews.reduce((sum, v) => sum + (v.view_count || 0), 0) / videosWithViews.length;

    return recentVideos
      .filter(v => {
        const publishDate = new Date(v.published_at);
        const hoursSince = (Date.now() - publishDate.getTime()) / 3600000;

        // Only check videos from last 7 days
        if (hoursSince > 168) return false;

        // Skip very new videos (less than 6 hours) - they need time to get views
        if (hoursSince < 6) return false;

        const viewCount = v.view_count || 0;

        // Calculate expected views based on age
        // Older videos should have more views
        const ageMultiplier = Math.min(hoursSince / 24, 7); // Max 7 days factor
        const expectedViews = avgViewsPerVideo * (ageMultiplier / 7);

        // Flag if views are less than 60% of expected
        return viewCount < expectedViews * 0.6 && expectedViews > 100;
      })
      .map(v => {
        const publishDate = new Date(v.published_at);
        const hoursSince = (Date.now() - publishDate.getTime()) / 3600000;
        const ageMultiplier = Math.min(hoursSince / 24, 7);
        const expectedViews = avgViewsPerVideo * (ageMultiplier / 7);
        const velocityPercent = expectedViews > 0 ? ((v.view_count || 0) / expectedViews) * 100 : 0;

        return { ...v, velocityPercent: Math.round(velocityPercent) };
      })
      .sort((a, b) => a.velocityPercent - b.velocityPercent) // Worst first
      .slice(0, 3);
  }, [recentVideos]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left Sidebar - Uses shared component */}
      <Sidebar activePath="/command-center" />

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#111] border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 hover:bg-white/10 rounded-lg">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Logo size="sm" showIcon={false} linkToHome={false} />
          </div>
          <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 bg-[#111] h-full p-4" onClick={e => e.stopPropagation()}>
            <nav className="space-y-1">
              <NavItem icon={<Home />} label="Command Center" href="/command-center" active={true} />
              <NavItem icon={<Video />} label="Videos" href="/videos" />
              <NavItem icon={<Scissors />} label="Clips" href="/clips" color="pink" />
              <NavItem icon={<BarChart3 />} label="Channel Analysis" href="/analysis" color="emerald" />
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 lg:pt-0 pt-16">
        <div className="max-w-7xl mx-auto p-6">
          {/* Command Center Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  Command Center
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                    LIVE
                  </span>
                </h1>
                <p className="text-gray-500">Real-time channel performance at a glance</p>
              </div>
              <div className="hidden sm:flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}
                </div>
                <button
                  onClick={refetch}
                  disabled={isLoading}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh data"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && showError && (
            <div className="mb-6">
              <InlineToast
                type="error"
                title={error}
                message={Object.entries(errors)
                  .filter(([_, err]) => err !== null)
                  .map(([key, err]) => `${key}: ${err}`)
                  .join("; ")}
                onRetry={refetch}
                onDismiss={() => setShowError(false)}
              />
            </div>
          )}

          {/* Top Row: Health Score + Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
            {/* Health Score - Takes 1 column */}
            <div className="lg:col-span-1">
              <HealthScore metrics={healthMetrics} loading={isLoading} />
            </div>

            {/* Quick Stats - Compact Horizontal Bar */}
            <div className="lg:col-span-3 bg-white/5 border border-white/10 rounded-xl p-3 flex items-center">
              <div className="flex items-center divide-x divide-white/10 w-full">
                {/* Views Today */}
                <div className="flex items-center gap-3 px-4 flex-1">
                  <Eye className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Views Today</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">
                        {isLoading ? "—" : formatNumber(todayStats.views)}
                      </span>
                      {!isLoading && todayStats.viewsChange !== 0 && (
                        <span className={`flex items-center gap-0.5 text-xs ${todayStats.viewsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {todayStats.viewsChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {todayStats.viewsChange >= 0 ? '+' : ''}{todayStats.viewsChange}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subscribers Today */}
                <div className="flex items-center gap-3 px-4 flex-1">
                  <Users className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Subs Today</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">
                        {isLoading ? "—" : (todayStats.subs >= 0 ? '+' : '') + formatNumber(todayStats.subs)}
                      </span>
                      {!isLoading && todayStats.subsChange !== 0 && (
                        <span className={`flex items-center gap-0.5 text-xs ${todayStats.subsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {todayStats.subsChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {todayStats.subsChange >= 0 ? '+' : ''}{todayStats.subsChange}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Watch Time Today */}
                <div className="flex items-center gap-3 px-4 flex-1">
                  <Clock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Watch Time</p>
                    <span className="text-lg font-bold text-white">
                      {isLoading ? "—" : `${formatNumber(todayStats.watchTime)}h`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Row: Performance Chart + Viral Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
            {/* Performance Chart - Takes 2 columns */}
            <div className="lg:col-span-2">
              <ViewsTrendChart
                dailyData={analyticsOverview?.daily_data}
                isLoading={isLoading}
              />
            </div>

            {/* Viral Radar - Takes 1 column */}
            <div className="lg:col-span-1">
              <ViralRadar
                videos={trendingVideos}
                loading={isLoading}
                channelAverageViews={channelAverageViews}
                onVideoClick={(videoId) => window.location.href = `/video/${videoId}`}
              />
            </div>
          </div>

          {/* Bottom Row: Alerts + Video Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
            {/* Alerts Panel */}
            <div className="lg:col-span-1">
              <AlertsPanel
                alerts={alerts}
                onDismiss={handleDismissAlert}
                onAction={handleAlertAction}
                loading={alertsLoading || isLoading}
              />
            </div>

            {/* Top Performing + Needs Attention */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Performing Videos */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Top Performing
                  </h3>
                  <span className="text-xs text-white/40">Last 24h</span>
                </div>
                <div className="divide-y divide-white/5">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-4 animate-pulse">
                        <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-white/10 rounded w-1/2" />
                      </div>
                    ))
                  ) : topPerformingVideos.length > 0 ? (
                    topPerformingVideos.map((video, index) => (
                      <Link
                        key={video.video_id}
                        href={`/video/${video.video_id}`}
                        className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          index === 1 ? 'bg-gray-400/20 text-gray-300' :
                          'bg-orange-700/20 text-orange-400'
                        }`}>
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{video.title}</p>
                          <p className="text-xs text-white/40">
                            {formatNumber(video.view_count)} views
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20" />
                      </Link>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <TrendingUp className="w-8 h-8 text-white/20 mx-auto mb-2" />
                      <p className="text-sm text-white/60">No video data yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Needs Attention */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    Needs Attention
                  </h3>
                </div>
                <div className="divide-y divide-white/5">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="p-4 animate-pulse">
                        <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-white/10 rounded w-1/2" />
                      </div>
                    ))
                  ) : underperformingVideos.length > 0 ? (
                    underperformingVideos.map((video) => (
                      <Link
                        key={video.video_id}
                        href={`/video/${video.video_id}`}
                        className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                          <TrendingDown className="w-3 h-3 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{video.title}</p>
                          <p className="text-xs text-red-400">
                            {video.velocityPercent}% of expected views
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20" />
                      </Link>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p className="text-sm text-white/60">All videos performing well!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Link
              href="/clips"
              className="p-5 bg-gradient-to-br from-pink-600/20 to-rose-600/20 border border-pink-500/30 rounded-xl hover:border-pink-400/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pink-500/30 rounded-xl flex items-center justify-center">
                  <Scissors className="w-6 h-6 text-pink-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">Viral Clips</h3>
                  <p className="text-gray-400 text-sm">Generate short-form content</p>
                </div>
                <ChevronRight className="w-5 h-5 text-pink-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/analysis"
              className="p-5 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-xl hover:border-emerald-400/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/30 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">Channel Analysis</h3>
                  <p className="text-gray-400 text-sm">AI-powered insights</p>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/videos"
              className="p-5 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl hover:border-blue-400/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">Your Videos</h3>
                  <p className="text-gray-400 text-sm">Browse all your content</p>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          {/* AI Chat Hint */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              💬 Click the <span className="text-purple-400">purple button</span> in the corner to chat with your AI assistant
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ 
  icon, 
  label, 
  href, 
  active = false, 
  collapsed = false,
  color = "default"
}: { 
  icon: React.ReactNode; 
  label: string; 
  href: string;
  active?: boolean;
  collapsed?: boolean;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    default: active ? "text-white bg-white/10" : "text-gray-400 hover:text-white hover:bg-white/5",
    purple: "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10",
    pink: "text-pink-400 hover:text-pink-300 hover:bg-pink-500/10",
    emerald: "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10",
    blue: "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10",
    indigo: "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10",
    red: "text-red-400 hover:text-red-300 hover:bg-red-500/10",
  };
  
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${colorClasses[color]} ${collapsed && 'justify-center'}`}
      title={collapsed ? label : undefined}
    >
      <span className="w-5 h-5 flex-shrink-0">{icon}</span>
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
}


function VideoRow({ video }: { video: any }) {
  return (
    <Link 
      href={`/video/${video.video_id}`}
      className="flex gap-4 p-4 hover:bg-white/5 transition-colors group"
    >
      <div className="relative flex-shrink-0">
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className="w-40 h-[90px] object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
          <Play className="w-8 h-8 text-white" fill="white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-white mb-1 line-clamp-2 group-hover:text-purple-300 transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {formatNumber(video.view_count)}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-4 h-4" />
            {formatNumber(video.like_count)}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {formatNumber(video.comment_count)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
          <Calendar className="w-3 h-3" />
          {formatDate(video.published_at)}
        </div>
      </div>
      <div className="flex items-center">
        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
      </div>
    </Link>
  );
}
