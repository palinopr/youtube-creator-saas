"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  Activity,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Video,
  Search,
  MessageSquare,
  Zap,
  Server,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { ADMIN_ENDPOINTS } from "@/lib/config";

interface UserAnalytics {
  dau: number;
  wau: number;
  mau: number;
  dau_change: number;
  wau_change: number;
  mau_change: number;
  retention_rate: number;
  new_users_today: number;
  new_users_this_week: number;
  new_users_this_month: number;
  total_users: number;
  growth_rate: number;
}

interface FeatureAnalytics {
  clips_generated: {
    today: number;
    this_week: number;
    this_month: number;
    total: number;
  };
  seo_analyses: {
    today: number;
    this_week: number;
    this_month: number;
    total: number;
  };
  agent_queries: {
    today: number;
    this_week: number;
    this_month: number;
    total: number;
  };
  channels_connected: {
    today: number;
    total: number;
  };
}

interface SystemAnalytics {
  api_calls: {
    today: number;
    this_week: number;
    this_month: number;
  };
  job_queue: {
    pending: number;
    processing: number;
    completed_today: number;
    failed_today: number;
  };
  response_times: {
    avg_ms: number;
    p95_ms: number;
    p99_ms: number;
  };
  uptime: {
    status: string;
    uptime_percentage: number;
    last_incident: string | null;
  };
}

export default function AdminAnalyticsPage() {
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [featureAnalytics, setFeatureAnalytics] = useState<FeatureAnalytics | null>(null);
  const [systemAnalytics, setSystemAnalytics] = useState<SystemAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const [usersRes, featuresRes, systemRes] = await Promise.all([
        fetch(ADMIN_ENDPOINTS.ANALYTICS_USERS, { credentials: "include" }),
        fetch(ADMIN_ENDPOINTS.ANALYTICS_FEATURES, { credentials: "include" }),
        fetch(ADMIN_ENDPOINTS.ANALYTICS_SYSTEM, { credentials: "include" }),
      ]);

      if (!usersRes.ok || !featuresRes.ok || !systemRes.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const [users, features, system] = await Promise.all([
        usersRes.json(),
        featuresRes.json(),
        systemRes.json(),
      ]);

      setUserAnalytics(users);
      setFeatureAnalytics(features);
      setSystemAnalytics(system);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/10 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white/5 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
          <button
            onClick={fetchAllAnalytics}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-blue-400" />
            Platform Analytics
          </h1>
          <p className="text-gray-400">User engagement and system metrics</p>
        </div>
        <button
          onClick={fetchAllAnalytics}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* User Engagement Section */}
      {userAnalytics && (
        <>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            User Engagement
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* DAU */}
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 border border-blue-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-blue-400" />
                <span className={`text-sm ${userAnalytics.dau_change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {formatPercent(userAnalytics.dau_change)}
                </span>
              </div>
              <p className="text-3xl font-bold">{formatNumber(userAnalytics.dau)}</p>
              <p className="text-sm text-gray-400">Daily Active Users</p>
            </div>

            {/* WAU */}
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-purple-400" />
                <span className={`text-sm ${userAnalytics.wau_change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {formatPercent(userAnalytics.wau_change)}
                </span>
              </div>
              <p className="text-3xl font-bold">{formatNumber(userAnalytics.wau)}</p>
              <p className="text-sm text-gray-400">Weekly Active Users</p>
            </div>

            {/* MAU */}
            <div className="bg-gradient-to-br from-green-600/20 to-green-800/10 border border-green-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-green-400" />
                <span className={`text-sm ${userAnalytics.mau_change >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {formatPercent(userAnalytics.mau_change)}
                </span>
              </div>
              <p className="text-3xl font-bold">{formatNumber(userAnalytics.mau)}</p>
              <p className="text-sm text-gray-400">Monthly Active Users</p>
            </div>

            {/* Retention Rate */}
            <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/10 border border-orange-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-orange-400" />
              </div>
              <p className="text-3xl font-bold">{userAnalytics.retention_rate.toFixed(1)}%</p>
              <p className="text-sm text-gray-400">Retention Rate</p>
            </div>
          </div>

          {/* Growth Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-400">Total Users</p>
              <p className="text-2xl font-bold">{formatNumber(userAnalytics.total_users)}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-400">New Today</p>
              <p className="text-2xl font-bold text-green-400">+{formatNumber(userAnalytics.new_users_today)}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-400">New This Week</p>
              <p className="text-2xl font-bold text-blue-400">+{formatNumber(userAnalytics.new_users_this_week)}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-gray-400">Growth Rate</p>
              <p className={`text-2xl font-bold ${userAnalytics.growth_rate >= 0 ? "text-green-400" : "text-red-400"}`}>
                {formatPercent(userAnalytics.growth_rate)}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Feature Usage Section */}
      {featureAnalytics && (
        <>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Feature Usage
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Clips Generated */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Video className="w-6 h-6 text-purple-400" />
                <h3 className="font-semibold">Clips Generated</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Today</p>
                  <p className="text-xl font-bold">{formatNumber(featureAnalytics.clips_generated.today)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">This Week</p>
                  <p className="text-xl font-bold">{formatNumber(featureAnalytics.clips_generated.this_week)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">This Month</p>
                  <p className="text-xl font-bold">{formatNumber(featureAnalytics.clips_generated.this_month)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="text-xl font-bold text-purple-400">{formatNumber(featureAnalytics.clips_generated.total)}</p>
                </div>
              </div>
            </div>

            {/* SEO Analyses */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Search className="w-6 h-6 text-green-400" />
                <h3 className="font-semibold">SEO Analyses</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Today</p>
                  <p className="text-xl font-bold">{formatNumber(featureAnalytics.seo_analyses.today)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">This Week</p>
                  <p className="text-xl font-bold">{formatNumber(featureAnalytics.seo_analyses.this_week)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">This Month</p>
                  <p className="text-xl font-bold">{formatNumber(featureAnalytics.seo_analyses.this_month)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="text-xl font-bold text-green-400">{formatNumber(featureAnalytics.seo_analyses.total)}</p>
                </div>
              </div>
            </div>

            {/* Agent Queries */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-6 h-6 text-blue-400" />
                <h3 className="font-semibold">AI Agent Queries</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Today</p>
                  <p className="text-xl font-bold">{formatNumber(featureAnalytics.agent_queries.today)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">This Week</p>
                  <p className="text-xl font-bold">{formatNumber(featureAnalytics.agent_queries.this_week)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">This Month</p>
                  <p className="text-xl font-bold">{formatNumber(featureAnalytics.agent_queries.this_month)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="text-xl font-bold text-blue-400">{formatNumber(featureAnalytics.agent_queries.total)}</p>
                </div>
              </div>
            </div>

            {/* Channels Connected */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Video className="w-6 h-6 text-red-400" />
                <h3 className="font-semibold">YouTube Channels Connected</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Today</p>
                  <p className="text-xl font-bold">{formatNumber(featureAnalytics.channels_connected.today)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="text-xl font-bold text-red-400">{formatNumber(featureAnalytics.channels_connected.total)}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* System Health Section */}
      {systemAnalytics && (
        <>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-gray-400" />
            System Health
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* API Calls */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold mb-4">API Calls</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Today</span>
                  <span className="font-medium">{formatNumber(systemAnalytics.api_calls.today)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">This Week</span>
                  <span className="font-medium">{formatNumber(systemAnalytics.api_calls.this_week)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">This Month</span>
                  <span className="font-medium">{formatNumber(systemAnalytics.api_calls.this_month)}</span>
                </div>
              </div>
            </div>

            {/* Job Queue */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Job Queue</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-400">Pending</span>
                  </div>
                  <span className={`font-medium ${systemAnalytics.job_queue.pending > 10 ? "text-yellow-400" : ""}`}>
                    {systemAnalytics.job_queue.pending}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-400">Processing</span>
                  </div>
                  <span className="font-medium text-blue-400">{systemAnalytics.job_queue.processing}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-400">Completed Today</span>
                  </div>
                  <span className="font-medium text-green-400">{systemAnalytics.job_queue.completed_today}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-gray-400">Failed Today</span>
                  </div>
                  <span className={`font-medium ${systemAnalytics.job_queue.failed_today > 0 ? "text-red-400" : "text-green-400"}`}>
                    {systemAnalytics.job_queue.failed_today}
                  </span>
                </div>
              </div>
            </div>

            {/* Response Times & Uptime */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Performance</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Avg Response</span>
                  <span className={`font-medium ${systemAnalytics.response_times.avg_ms > 500 ? "text-yellow-400" : "text-green-400"}`}>
                    {systemAnalytics.response_times.avg_ms}ms
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">P95 Response</span>
                  <span className="font-medium">{systemAnalytics.response_times.p95_ms}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">P99 Response</span>
                  <span className="font-medium">{systemAnalytics.response_times.p99_ms}ms</span>
                </div>
                <div className="pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={`font-medium ${systemAnalytics.uptime.status === "operational" ? "text-green-400" : "text-red-400"}`}>
                      {systemAnalytics.uptime.status.charAt(0).toUpperCase() + systemAnalytics.uptime.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-400">Uptime</span>
                    <span className="font-medium text-green-400">{systemAnalytics.uptime.uptime_percentage.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
