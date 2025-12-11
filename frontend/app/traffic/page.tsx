"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Youtube,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  PlayCircle,
  Monitor,
  Smartphone,
  Globe,
  ListVideo,
  BarChart3,
} from "lucide-react";
import { api } from "@/lib/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface TrafficSource {
  source: string;
  views: number;
  watch_time_minutes: number;
  percentage: number;
}

interface TrafficSourcesData {
  sources: TrafficSource[];
  total_views: number;
  period_days: number;
}

interface DailySubscriberData {
  date: string;
  subscribers_gained: number;
  subscribers_lost: number;
  net_change: number;
}

interface SubscriberSourcesData {
  daily_data: DailySubscriberData[];
  total_gained: number;
  total_lost: number;
  net_change: number;
  period: string;
  start_date: string;
  end_date: string;
}

interface PlaybackLocation {
  location: string;
  views: number;
  watch_time_minutes: number;
  percentage: number;
}

interface PlaybackLocationsData {
  locations: PlaybackLocation[];
  total_views: number;
  period_days: number;
}

// Traffic source colors
const SOURCE_COLORS: Record<string, string> = {
  BROWSE_FEATURES: "#8b5cf6",
  YT_SEARCH: "#3b82f6",
  SUGGESTED: "#22c55e",
  EXT_URL: "#f97316",
  PLAYLIST: "#ec4899",
  NOTIFICATION: "#eab308",
  END_SCREEN: "#06b6d4",
  ANNOTATION: "#84cc16",
  SUBSCRIBER: "#a855f7",
  SHORTS: "#f43f5e",
  NO_LINK_OTHER: "#64748b",
  OTHER: "#94a3b8",
};

// Playback location colors
const LOCATION_COLORS: Record<string, string> = {
  WATCH: "#8b5cf6",
  EMBEDDED: "#3b82f6",
  EXTERNAL_APP: "#22c55e",
  MOBILE: "#f97316",
  CHANNEL: "#ec4899",
  BROWSE: "#eab308",
  SEARCH: "#06b6d4",
  OTHER: "#94a3b8",
};

// Friendly names for traffic sources
const SOURCE_NAMES: Record<string, string> = {
  BROWSE_FEATURES: "Browse Features",
  YT_SEARCH: "YouTube Search",
  SUGGESTED: "Suggested Videos",
  EXT_URL: "External Websites",
  PLAYLIST: "Playlists",
  NOTIFICATION: "Notifications",
  END_SCREEN: "End Screens",
  ANNOTATION: "Cards & Annotations",
  SUBSCRIBER: "Subscriber Feed",
  SHORTS: "Shorts Feed",
  NO_LINK_OTHER: "Direct/Unknown",
  OTHER: "Other",
};

// Friendly names for playback locations
const LOCATION_NAMES: Record<string, string> = {
  WATCH: "YouTube Watch Page",
  EMBEDDED: "Embedded Player",
  EXTERNAL_APP: "External Apps",
  MOBILE: "Mobile Apps",
  CHANNEL: "Channel Page",
  BROWSE: "Browse Page",
  SEARCH: "Search Results",
  OTHER: "Other",
};

// Icons for traffic sources
const getSourceIcon = (source: string) => {
  switch (source) {
    case "YT_SEARCH":
      return <Search className="w-4 h-4" />;
    case "SUGGESTED":
      return <Youtube className="w-4 h-4" />;
    case "EXT_URL":
      return <ExternalLink className="w-4 h-4" />;
    case "PLAYLIST":
      return <ListVideo className="w-4 h-4" />;
    case "BROWSE_FEATURES":
      return <Globe className="w-4 h-4" />;
    case "SHORTS":
      return <Smartphone className="w-4 h-4" />;
    default:
      return <PlayCircle className="w-4 h-4" />;
  }
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

function formatWatchTime(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours.toLocaleString()}h`;
  }
  return `${minutes}m`;
}

export default function TrafficPage() {
  const [trafficSources, setTrafficSources] = useState<TrafficSourcesData | null>(null);
  const [subscriberSources, setSubscriberSources] = useState<SubscriberSourcesData | null>(null);
  const [playbackLocations, setPlaybackLocations] = useState<PlaybackLocationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"sources" | "subscribers" | "playback">("sources");
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAllData();
  }, [days]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [sourcesRes, subsRes, locationsRes] = await Promise.all([
        api.getTrafficSources(days),
        api.getSubscriberSources(days),
        api.getPlaybackLocations(days),
      ]);

      setTrafficSources(sourcesRes);
      setSubscriberSources(subsRes);
      setPlaybackLocations(locationsRes);
    } catch (err) {
      console.error("Error fetching traffic data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch traffic data");
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for traffic sources
  const sourceChartData = trafficSources?.sources.map((s) => ({
    name: SOURCE_NAMES[s.source] || s.source,
    views: s.views,
    percentage: s.percentage,
    fill: SOURCE_COLORS[s.source] || SOURCE_COLORS.OTHER,
  })) || [];

  // Prepare pie chart data for playback locations
  const locationPieData = playbackLocations?.locations.map((l) => ({
    name: LOCATION_NAMES[l.location] || l.location,
    value: l.views,
    percentage: l.percentage,
    fill: LOCATION_COLORS[l.location] || LOCATION_COLORS.OTHER,
  })) || [];

  return (
    <DashboardLayout activePath="/traffic">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-purple-400" />
              Traffic Sources
            </h1>
            <p className="text-gray-400 mt-1">
              Understand where your views come from
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Time Period Selector */}
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchAllData}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Eye className="w-5 h-5 text-purple-400" />
                  <span className="text-white/60 text-sm">Total Views</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatNumber(trafficSources?.total_views || 0)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Search className="w-5 h-5 text-blue-400" />
                  <span className="text-white/60 text-sm">From Search</span>
                </div>
                <p className="text-2xl font-bold">
                  {trafficSources?.sources.find((s) => s.source === "YT_SEARCH")?.percentage.toFixed(1) || 0}%
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-white/60 text-sm">Net Subscribers</span>
                </div>
                <p className="text-2xl font-bold">
                  {subscriberSources?.net_change !== undefined ? (
                    subscriberSources.net_change >= 0 ? "+" : ""
                  ) : ""}
                  {formatNumber(subscriberSources?.net_change || 0)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="w-5 h-5 text-orange-400" />
                  <span className="text-white/60 text-sm">External Traffic</span>
                </div>
                <p className="text-2xl font-bold">
                  {trafficSources?.sources.find((s) => s.source === "EXT_URL")?.percentage.toFixed(1) || 0}%
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
              <button
                onClick={() => setActiveTab("sources")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "sources"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "bg-white/5 text-white/60 hover:text-white border border-white/10"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Traffic Sources
              </button>
              <button
                onClick={() => setActiveTab("subscribers")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "subscribers"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "bg-white/5 text-white/60 hover:text-white border border-white/10"
                }`}
              >
                <Users className="w-4 h-4" />
                Subscriber Sources
              </button>
              <button
                onClick={() => setActiveTab("playback")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "playback"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "bg-white/5 text-white/60 hover:text-white border border-white/10"
                }`}
              >
                <Monitor className="w-4 h-4" />
                Playback Locations
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "sources" && trafficSources && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Views by Source</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={sourceChartData}
                        layout="vertical"
                        margin={{ left: 20, right: 20 }}
                      >
                        <XAxis type="number" stroke="#64748b" fontSize={12} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#64748b"
                          fontSize={11}
                          width={120}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1a1a1a",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [formatNumber(value), "Views"]}
                        />
                        <Bar dataKey="views" radius={[0, 4, 4, 0]}>
                          {sourceChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Source List with Details */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Source Breakdown</h3>
                  <div className="space-y-3">
                    {trafficSources.sources.map((source, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${SOURCE_COLORS[source.source] || SOURCE_COLORS.OTHER}20` }}
                          >
                            {getSourceIcon(source.source)}
                          </div>
                          <div>
                            <p className="font-medium">
                              {SOURCE_NAMES[source.source] || source.source}
                            </p>
                            <p className="text-sm text-white/60">
                              {formatWatchTime(source.watch_time_minutes)} watch time
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatNumber(source.views)}</p>
                          <p className="text-sm text-white/60">
                            {source.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Insights */}
                <div className="lg:col-span-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    Traffic Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {trafficSources.sources[0] && (
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-white/60 mb-1">Top Source</p>
                        <p className="font-semibold">
                          {SOURCE_NAMES[trafficSources.sources[0].source] || trafficSources.sources[0].source}
                        </p>
                        <p className="text-purple-400">
                          {trafficSources.sources[0].percentage.toFixed(1)}% of views
                        </p>
                      </div>
                    )}
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/60 mb-1">Search Discoverability</p>
                      <p className="font-semibold">
                        {(trafficSources.sources.find((s) => s.source === "YT_SEARCH")?.percentage || 0) > 20
                          ? "Strong"
                          : (trafficSources.sources.find((s) => s.source === "YT_SEARCH")?.percentage || 0) > 10
                          ? "Moderate"
                          : "Needs Improvement"}
                      </p>
                      <p className="text-blue-400">
                        {trafficSources.sources.find((s) => s.source === "YT_SEARCH")?.percentage.toFixed(1) || 0}% from search
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/60 mb-1">Algorithm Performance</p>
                      <p className="font-semibold">
                        {((trafficSources.sources.find((s) => s.source === "SUGGESTED")?.percentage || 0) +
                          (trafficSources.sources.find((s) => s.source === "BROWSE_FEATURES")?.percentage || 0)) > 50
                          ? "Excellent"
                          : ((trafficSources.sources.find((s) => s.source === "SUGGESTED")?.percentage || 0) +
                              (trafficSources.sources.find((s) => s.source === "BROWSE_FEATURES")?.percentage || 0)) > 30
                          ? "Good"
                          : "Growing"}
                      </p>
                      <p className="text-green-400">
                        {(
                          (trafficSources.sources.find((s) => s.source === "SUGGESTED")?.percentage || 0) +
                          (trafficSources.sources.find((s) => s.source === "BROWSE_FEATURES")?.percentage || 0)
                        ).toFixed(1)}% suggested + browse
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "subscribers" && subscriberSources && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Subscriber Trends Chart */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Daily Subscriber Trends</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={subscriberSources.daily_data?.slice(-14).map((day) => ({
                          date: new Date(day.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          }),
                          gained: day.subscribers_gained,
                          lost: -day.subscribers_lost,
                          net: day.net_change,
                        }))}
                      >
                        <XAxis
                          dataKey="date"
                          stroke="rgba(255,255,255,0.5)"
                          tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                        />
                        <YAxis
                          stroke="rgba(255,255,255,0.5)"
                          tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0,0,0,0.9)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number, name: string) => [
                            name === "lost" ? Math.abs(value) : value,
                            name === "gained" ? "Gained" : name === "lost" ? "Lost" : "Net Change",
                          ]}
                        />
                        <Bar dataKey="gained" fill="#22c55e" name="gained" />
                        <Bar dataKey="lost" fill="#ef4444" name="lost" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-sm text-white/60 mt-3 text-center">
                    Last 14 days of subscriber activity
                  </p>
                </div>

                {/* Summary Stats */}
                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Subscriber Summary</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-500/10 rounded-lg">
                        <p className="text-2xl font-bold text-green-400">
                          +{formatNumber(subscriberSources.total_gained)}
                        </p>
                        <p className="text-sm text-white/60">Gained</p>
                      </div>
                      <div className="text-center p-4 bg-red-500/10 rounded-lg">
                        <p className="text-2xl font-bold text-red-400">
                          -{formatNumber(subscriberSources.total_lost)}
                        </p>
                        <p className="text-sm text-white/60">Lost</p>
                      </div>
                      <div className="text-center p-4 bg-purple-500/10 rounded-lg">
                        <p
                          className={`text-2xl font-bold ${
                            subscriberSources.net_change >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {subscriberSources.net_change >= 0 ? "+" : ""}
                          {formatNumber(subscriberSources.net_change)}
                        </p>
                        <p className="text-sm text-white/60">Net Change</p>
                      </div>
                    </div>
                  </div>

                  {/* Retention Rate */}
                  <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-3">Retention Rate</h3>
                    <div className="flex items-center gap-4">
                      <div className="relative w-24 h-24">
                        <svg className="w-24 h-24 -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="#22c55e"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${
                              ((subscriberSources.total_gained - subscriberSources.total_lost) /
                                Math.max(subscriberSources.total_gained, 1)) *
                              251.2
                            } 251.2`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold">
                            {subscriberSources.total_gained > 0
                              ? Math.round(
                                  ((subscriberSources.total_gained - subscriberSources.total_lost) /
                                    subscriberSources.total_gained) *
                                    100
                                )
                              : 0}
                            %
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm">
                          Of new subscribers are staying
                        </p>
                        <p className="text-green-400 mt-1">
                          {subscriberSources.total_lost < subscriberSources.total_gained * 0.1
                            ? "Excellent retention!"
                            : subscriberSources.total_lost < subscriberSources.total_gained * 0.2
                            ? "Good retention"
                            : "Consider improving content consistency"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "playback" && playbackLocations && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Where Videos Are Watched</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={locationPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percentage }) =>
                            `${name}: ${percentage.toFixed(1)}%`
                          }
                          labelLine={{ stroke: "#64748b" }}
                        >
                          {locationPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1a1a1a",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [formatNumber(value), "Views"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Location List */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Playback Location Details</h3>
                  <div className="space-y-3">
                    {playbackLocations.locations.map((location, index) => (
                      <div
                        key={index}
                        className="p-4 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor:
                                  LOCATION_COLORS[location.location] || LOCATION_COLORS.OTHER,
                              }}
                            />
                            <span className="font-medium">
                              {LOCATION_NAMES[location.location] || location.location}
                            </span>
                          </div>
                          <span className="text-white/60">
                            {location.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">
                            {formatNumber(location.views)} views
                          </span>
                          <span className="text-white/60">
                            {formatWatchTime(location.watch_time_minutes)} watch time
                          </span>
                        </div>
                        <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${location.percentage}%`,
                              backgroundColor:
                                LOCATION_COLORS[location.location] || LOCATION_COLORS.OTHER,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Insights */}
                <div className="lg:col-span-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-blue-400" />
                    Playback Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/60 mb-1">Primary Watch Location</p>
                      <p className="font-semibold">
                        {playbackLocations.locations[0]
                          ? LOCATION_NAMES[playbackLocations.locations[0].location] ||
                            playbackLocations.locations[0].location
                          : "N/A"}
                      </p>
                      <p className="text-blue-400">
                        {playbackLocations.locations[0]?.percentage.toFixed(1) || 0}% of all views
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/60 mb-1">Embedded Views</p>
                      <p className="font-semibold">
                        {(playbackLocations.locations.find((l) => l.location === "EMBEDDED")
                          ?.percentage || 0) > 10
                          ? "Significant external reach"
                          : "Mostly on YouTube"}
                      </p>
                      <p className="text-purple-400">
                        {playbackLocations.locations.find((l) => l.location === "EMBEDDED")
                          ?.percentage.toFixed(1) || 0}% embedded
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
