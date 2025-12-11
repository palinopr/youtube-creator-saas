"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { ADMIN_ENDPOINTS } from "@/lib/config";

interface RevenueMetrics {
  mrr: number;
  arr: number;
  total_revenue: number;
  active_subscriptions: number;
  paid_subscriptions: number;
  trial_subscriptions: number;
  churn_rate: number;
  average_revenue_per_user: number;
  plan_breakdown: Array<{
    plan: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  admin_excluded: number;
  trends: {
    mrr_change: number;
    new_subscriptions_this_month: number;
    cancellations_this_month: number;
    upgrades_this_month: number;
    downgrades_this_month: number;
  };
}

export default function AdminRevenuePage() {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(ADMIN_ENDPOINTS.REVENUE_METRICS, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch revenue metrics");
      }

      const data = await res.json();
      setMetrics(data);
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
            onClick={fetchMetrics}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const planColors: Record<string, string> = {
    free: "bg-gray-500",
    starter: "bg-blue-500",
    pro: "bg-purple-500",
    agency: "bg-green-500",
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <DollarSign className="w-7 h-7 text-green-400" />
            Revenue Dashboard
          </h1>
          <p className="text-gray-400">Financial metrics and insights</p>
        </div>
        <button
          onClick={fetchMetrics}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* MRR */}
        <div className="bg-gradient-to-br from-green-600/20 to-green-800/10 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-green-400" />
            <div className={`flex items-center gap-1 text-sm ${metrics.trends.mrr_change >= 0 ? "text-green-400" : "text-red-400"}`}>
              {metrics.trends.mrr_change >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {formatPercent(metrics.trends.mrr_change)}
            </div>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(metrics.mrr)}</p>
          <p className="text-sm text-gray-400">Monthly Recurring Revenue</p>
        </div>

        {/* ARR */}
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(metrics.arr)}</p>
          <p className="text-sm text-gray-400">Annual Recurring Revenue</p>
        </div>

        {/* ARPU */}
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(metrics.average_revenue_per_user)}</p>
          <p className="text-sm text-gray-400">Avg Revenue Per User</p>
        </div>

        {/* Churn Rate */}
        <div className={`bg-gradient-to-br ${metrics.churn_rate > 5 ? "from-red-600/20 to-red-800/10 border-red-500/30" : "from-green-600/20 to-green-800/10 border-green-500/30"} border rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <TrendingDown className={`w-8 h-8 ${metrics.churn_rate > 5 ? "text-red-400" : "text-green-400"}`} />
          </div>
          <p className="text-3xl font-bold">{metrics.churn_rate.toFixed(1)}%</p>
          <p className="text-sm text-gray-400">Monthly Churn Rate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Plan Breakdown */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-6">Revenue by Plan</h2>
          <div className="space-y-4">
            {metrics.plan_breakdown.map((plan) => (
              <div key={plan.plan}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${planColors[plan.plan.toLowerCase()] || "bg-gray-500"}`}></div>
                    <span className="capitalize">{plan.plan}</span>
                    <span className="text-gray-500">({plan.count})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatCurrency(plan.revenue)}</span>
                    <span className="text-gray-500 ml-2">({plan.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${planColors[plan.plan.toLowerCase()] || "bg-gray-500"}`}
                    style={{ width: `${plan.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Revenue</span>
              <span className="text-xl font-bold">{formatCurrency(metrics.total_revenue)}</span>
            </div>
          </div>
        </div>

        {/* Monthly Activity */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-6">This Month</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* New Subscriptions */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-400">New Subscriptions</span>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {metrics.trends.new_subscriptions_this_month}
              </p>
            </div>

            {/* Cancellations */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight className="w-5 h-5 text-red-400" />
                <span className="text-sm text-gray-400">Cancellations</span>
              </div>
              <p className="text-2xl font-bold text-red-400">
                {metrics.trends.cancellations_this_month}
              </p>
            </div>

            {/* Upgrades */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-gray-400">Upgrades</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">
                {metrics.trends.upgrades_this_month}
              </p>
            </div>

            {/* Downgrades */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-gray-400">Downgrades</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">
                {metrics.trends.downgrades_this_month}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Net Change</span>
              <span className={`font-medium ${
                metrics.trends.new_subscriptions_this_month - metrics.trends.cancellations_this_month >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}>
                {metrics.trends.new_subscriptions_this_month - metrics.trends.cancellations_this_month >= 0 ? "+" : ""}
                {metrics.trends.new_subscriptions_this_month - metrics.trends.cancellations_this_month} subscriptions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          <p className="text-gray-400 mb-2">Paid Subscriptions</p>
          <p className="text-4xl font-bold text-green-400">{metrics.paid_subscriptions}</p>
          <p className="text-xs text-gray-500 mt-1">generating revenue</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          <p className="text-gray-400 mb-2">Trial Subscriptions</p>
          <p className="text-4xl font-bold text-yellow-400">{metrics.trial_subscriptions}</p>
          <p className="text-xs text-gray-500 mt-1">potential conversions</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          <p className="text-gray-400 mb-2">Lifetime Revenue</p>
          <p className="text-4xl font-bold">{formatCurrency(metrics.total_revenue)}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
          <p className="text-gray-400 mb-2">Average Plan Price</p>
          <p className="text-4xl font-bold">
            {formatCurrency(metrics.paid_subscriptions > 0 ? metrics.mrr / metrics.paid_subscriptions : 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">/month</p>
        </div>
      </div>

      {/* Admin Exclusion Note */}
      {metrics.admin_excluded > 0 && (
        <div className="mt-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
          <p className="text-sm text-purple-300">
            <span className="font-medium">Note:</span> {metrics.admin_excluded} admin account(s) excluded from revenue metrics for accurate reporting.
          </p>
        </div>
      )}
    </div>
  );
}
