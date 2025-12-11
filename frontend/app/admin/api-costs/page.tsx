"use client";

import { useState, useEffect } from "react";
import {
  Cpu,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Bot,
  Clock,
  Zap,
  Filter,
  ChevronDown,
} from "lucide-react";
import { ADMIN_ENDPOINTS } from "@/lib/config";

interface CostSummary {
  total_cost: number;
  total_calls: number;
  total_tokens: number;
  by_agent: Array<{
    agent: string;
    calls: number;
    tokens: number;
    cost: number;
  }>;
  by_model: Array<{
    model: string;
    calls: number;
    tokens: number;
    cost: number;
  }>;
  trends: {
    today: number;
    yesterday: number;
    this_week: number;
    last_week: number;
    this_month: number;
    last_month: number;
    today_change: number;
    week_change: number;
    month_change: number;
  };
  pricing: Record<string, { input: number; output: number }>;
}

interface RecentCall {
  id: number;
  agent_type: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  created_at: string;
  user_email?: string;
}

interface BreakdownItem {
  period?: string;
  agent?: string;
  model?: string;
  calls: number;
  tokens: number;
  cost: number;
}

export default function AdminAPICostsPage() {
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [breakdownType, setBreakdownType] = useState<"day" | "agent" | "model">("day");
  const [agentFilter, setAgentFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchBreakdown();
  }, [breakdownType]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [summaryRes, recentRes] = await Promise.all([
        fetch(ADMIN_ENDPOINTS.API_COSTS_SUMMARY, { credentials: "include" }),
        fetch(`${ADMIN_ENDPOINTS.API_COSTS_RECENT}?limit=20`, { credentials: "include" }),
      ]);

      if (!summaryRes.ok || !recentRes.ok) {
        throw new Error("Failed to fetch API cost data");
      }

      const [summaryData, recentData] = await Promise.all([
        summaryRes.json(),
        recentRes.json(),
      ]);

      setSummary(summaryData);
      setRecentCalls(recentData.items || []);
      await fetchBreakdown();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const fetchBreakdown = async () => {
    try {
      const res = await fetch(
        `${ADMIN_ENDPOINTS.API_COSTS_BREAKDOWN}?group_by=${breakdownType}`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setBreakdown(data.breakdown || []);
      }
    } catch {
      // Silently fail - not critical
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const agentColors: Record<string, string> = {
    analytics: "bg-blue-500",
    seo: "bg-green-500",
    clips: "bg-purple-500",
    deep_analysis: "bg-orange-500",
    chat: "bg-pink-500",
    other: "bg-gray-500",
  };

  const modelColors: Record<string, string> = {
    "gpt-4o": "bg-emerald-500",
    "gpt-4o-mini": "bg-teal-500",
    "gpt-4-turbo": "bg-cyan-500",
    "gpt-3.5-turbo": "bg-sky-500",
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
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Cpu className="w-7 h-7 text-cyan-400" />
            API Cost Tracking
          </h1>
          <p className="text-gray-400">Monitor OpenAI API usage and costs across agents</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Cost */}
        <div className="bg-gradient-to-br from-cyan-600/20 to-cyan-800/10 border border-cyan-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-cyan-400" />
            <div className={`flex items-center gap-1 text-sm ${summary.trends.month_change <= 0 ? "text-green-400" : "text-red-400"}`}>
              {summary.trends.month_change <= 0 ? (
                <TrendingDown className="w-4 h-4" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              {formatPercent(summary.trends.month_change)}
            </div>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(summary.total_cost)}</p>
          <p className="text-sm text-gray-400">Total Cost (All Time)</p>
        </div>

        {/* Today's Cost */}
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-blue-400" />
            <div className={`flex items-center gap-1 text-sm ${summary.trends.today_change <= 0 ? "text-green-400" : "text-red-400"}`}>
              {summary.trends.today_change <= 0 ? (
                <TrendingDown className="w-4 h-4" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              {formatPercent(summary.trends.today_change)}
            </div>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(summary.trends.today)}</p>
          <p className="text-sm text-gray-400">Today&apos;s Cost</p>
        </div>

        {/* Total Calls */}
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-3xl font-bold">{formatNumber(summary.total_calls)}</p>
          <p className="text-sm text-gray-400">Total API Calls</p>
        </div>

        {/* Total Tokens */}
        <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/10 border border-orange-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Bot className="w-8 h-8 text-orange-400" />
          </div>
          <p className="text-3xl font-bold">{formatNumber(summary.total_tokens)}</p>
          <p className="text-sm text-gray-400">Total Tokens Used</p>
        </div>
      </div>

      {/* Cost Trends */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Yesterday</p>
          <p className="text-xl font-bold">{formatCurrency(summary.trends.yesterday)}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">This Week</p>
          <p className="text-xl font-bold">{formatCurrency(summary.trends.this_week)}</p>
          <p className={`text-xs ${summary.trends.week_change <= 0 ? "text-green-400" : "text-red-400"}`}>
            {formatPercent(summary.trends.week_change)} vs last week
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">This Month</p>
          <p className="text-xl font-bold">{formatCurrency(summary.trends.this_month)}</p>
          <p className={`text-xs ${summary.trends.month_change <= 0 ? "text-green-400" : "text-red-400"}`}>
            {formatPercent(summary.trends.month_change)} vs last month
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Cost by Agent */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-6">Cost by Agent Type</h2>
          <div className="space-y-4">
            {summary.by_agent.map((item) => {
              const percentage = summary.total_cost > 0 ? (item.cost / summary.total_cost) * 100 : 0;
              return (
                <div key={item.agent}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${agentColors[item.agent] || "bg-gray-500"}`}></div>
                      <span className="capitalize">{item.agent.replace("_", " ")}</span>
                      <span className="text-gray-500">({formatNumber(item.calls)} calls)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{formatCurrency(item.cost)}</span>
                      <span className="text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${agentColors[item.agent] || "bg-gray-500"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cost by Model */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-6">Cost by Model</h2>
          <div className="space-y-4">
            {summary.by_model.map((item) => {
              const percentage = summary.total_cost > 0 ? (item.cost / summary.total_cost) * 100 : 0;
              return (
                <div key={item.model}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${modelColors[item.model] || "bg-gray-500"}`}></div>
                      <span>{item.model}</span>
                      <span className="text-gray-500">({formatNumber(item.calls)} calls)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{formatCurrency(item.cost)}</span>
                      <span className="text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${modelColors[item.model] || "bg-gray-500"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing Reference */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-sm text-gray-400 mb-3">Current Pricing (per 1M tokens)</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(summary.pricing).map(([model, prices]) => (
                <div key={model} className="bg-white/5 rounded px-2 py-1">
                  <span className="text-gray-300">{model}:</span>
                  <span className="text-green-400 ml-1">${prices.input}</span>
                  <span className="text-gray-500">/</span>
                  <span className="text-blue-400">${prices.output}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Cost Breakdown</h2>
          <div className="flex gap-2">
            {(["day", "agent", "model"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setBreakdownType(type)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  breakdownType === type
                    ? "bg-cyan-600 text-white"
                    : "bg-white/5 hover:bg-white/10 text-gray-400"
                }`}
              >
                By {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-white/10">
                <th className="pb-3 font-medium">
                  {breakdownType === "day" ? "Date" : breakdownType.charAt(0).toUpperCase() + breakdownType.slice(1)}
                </th>
                <th className="pb-3 font-medium text-right">Calls</th>
                <th className="pb-3 font-medium text-right">Tokens</th>
                <th className="pb-3 font-medium text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {breakdown.slice(0, 10).map((item, idx) => (
                <tr key={idx} className="hover:bg-white/5">
                  <td className="py-3">
                    {item.period || item.agent || item.model}
                  </td>
                  <td className="py-3 text-right">{formatNumber(item.calls)}</td>
                  <td className="py-3 text-right">{formatNumber(item.tokens)}</td>
                  <td className="py-3 text-right font-medium">{formatCurrency(item.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent API Calls */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Recent API Calls</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showFilters && (
          <div className="mb-4 p-4 bg-white/5 rounded-lg">
            <label className="block text-sm text-gray-400 mb-2">Filter by Agent</label>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="w-full md:w-48 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Agents</option>
              <option value="analytics">Analytics</option>
              <option value="seo">SEO</option>
              <option value="clips">Clips</option>
              <option value="deep_analysis">Deep Analysis</option>
              <option value="chat">Chat</option>
            </select>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-white/10">
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Agent</th>
                <th className="pb-3 font-medium">Model</th>
                <th className="pb-3 font-medium text-right">Tokens</th>
                <th className="pb-3 font-medium text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {recentCalls
                .filter((call) => !agentFilter || call.agent_type === agentFilter)
                .map((call) => (
                  <tr key={call.id} className="hover:bg-white/5">
                    <td className="py-3 text-sm text-gray-400">
                      {formatDate(call.created_at)}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${
                        agentColors[call.agent_type] || "bg-gray-500"
                      } bg-opacity-20`}>
                        <div className={`w-2 h-2 rounded-full ${agentColors[call.agent_type] || "bg-gray-500"}`}></div>
                        {call.agent_type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 text-sm">{call.model}</td>
                    <td className="py-3 text-right text-sm">
                      <span className="text-gray-400">{formatNumber(call.prompt_tokens)}</span>
                      <span className="text-gray-600 mx-1">/</span>
                      <span className="text-gray-400">{formatNumber(call.completion_tokens)}</span>
                    </td>
                    <td className="py-3 text-right font-medium">
                      {formatCurrency(call.cost_usd)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {recentCalls.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No API calls recorded yet. Costs will appear here once agents start making requests.
          </div>
        )}
      </div>
    </div>
  );
}
