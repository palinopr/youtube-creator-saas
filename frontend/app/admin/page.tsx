"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { ADMIN_ENDPOINTS } from "@/lib/config";

interface DashboardData {
  users: {
    total: number;
    new_today: number;
    new_this_week: number;
    new_this_month: number;
    active_today: number;
    suspended: number;
  };
  subscriptions: {
    by_plan: Record<string, number>;
    active_paid: number;
    trial: number;
  };
  revenue: {
    mrr: number;
    arr: number;
  };
  system: {
    pending_jobs: number;
    failed_jobs_24h: number;
    api_calls_today: number;
  };
  recent_activity: Array<{
    admin_name: string;
    action_type: string;
    description: string;
    created_at: string;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(ADMIN_ENDPOINTS.DASHBOARD, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const dashboardData = await res.json();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
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
            onClick={fetchDashboard}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-400">Overview of your platform</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-400" />
            <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">
              +{data.users.new_today} today
            </span>
          </div>
          <p className="text-3xl font-bold">{formatNumber(data.users.total)}</p>
          <p className="text-sm text-gray-400">Total Users</p>
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-green-400">+{data.users.new_this_week}</span>
            <span className="text-gray-500">this week</span>
          </div>
        </div>

        {/* MRR */}
        <div className="bg-gradient-to-br from-green-600/20 to-green-800/10 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(data.revenue.mrr)}</p>
          <p className="text-sm text-gray-400">Monthly Recurring Revenue</p>
          <div className="mt-3 pt-3 border-t border-white/10 text-sm text-gray-400">
            ARR: {formatCurrency(data.revenue.arr)}
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <CreditCard className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-3xl font-bold">{formatNumber(data.subscriptions.active_paid)}</p>
          <p className="text-sm text-gray-400">Paid Subscriptions</p>
          <div className="mt-3 pt-3 border-t border-white/10 text-sm text-gray-400">
            {data.subscriptions.trial} in trial
          </div>
        </div>

        {/* Active Today */}
        <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/10 border border-orange-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-orange-400" />
          </div>
          <p className="text-3xl font-bold">{formatNumber(data.users.active_today)}</p>
          <p className="text-sm text-gray-400">Active Today</p>
          <div className="mt-3 pt-3 border-t border-white/10 text-sm text-gray-400">
            {data.users.suspended} suspended
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Plan Distribution */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Plan Distribution</h2>
          <div className="space-y-3">
            {Object.entries(data.subscriptions.by_plan).map(([plan, count]) => {
              const total = Object.values(data.subscriptions.by_plan).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              const colors: Record<string, string> = {
                free: "bg-gray-500",
                starter: "bg-blue-500",
                pro: "bg-purple-500",
                agency: "bg-green-500",
              };
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="capitalize">{plan}</span>
                    <span className="text-gray-400">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[plan] || "bg-gray-500"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">System Health</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span className="text-gray-400">Pending Jobs</span>
              </div>
              <span className={data.system.pending_jobs > 10 ? "text-yellow-400" : "text-green-400"}>
                {data.system.pending_jobs}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-gray-400">Failed Jobs (24h)</span>
              </div>
              <span className={data.system.failed_jobs_24h > 0 ? "text-red-400" : "text-green-400"}>
                {data.system.failed_jobs_24h}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <span className="text-gray-400">API Calls Today</span>
              </div>
              <span className="text-blue-400">{formatNumber(data.system.api_calls_today)}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-400">System Status</span>
              </div>
              <span className="text-green-400">Operational</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/admin/users"
              className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-400" />
                <span>Manage Users</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500" />
            </Link>
            <Link
              href="/admin/subscriptions"
              className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-purple-400" />
                <span>View Subscriptions</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500" />
            </Link>
            <Link
              href="/admin/revenue"
              className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span>Revenue Analytics</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500" />
            </Link>
            <Link
              href="/admin/activity"
              className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-orange-400" />
                <span>Activity Log</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Admin Activity */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Admin Activity</h2>
          <Link
            href="/admin/activity"
            className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-white/10">
          {data.recent_activity.length > 0 ? (
            data.recent_activity.map((activity, index) => (
              <div key={index} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">
                      <span className="text-purple-400">{activity.admin_name}</span>{" "}
                      <span className="text-gray-400">{activity.description}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activity.action_type}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTime(activity.created_at)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400">
              No recent admin activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
