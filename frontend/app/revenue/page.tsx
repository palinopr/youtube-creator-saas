"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Globe,
  RefreshCw,
  Calendar,
  BarChart3,
  AlertCircle,
  Banknote,
  Percent,
  Eye,
} from "lucide-react";
import { api } from "@/lib/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface RevenueOverviewTotals {
  estimated_revenue: number;
  ad_revenue: number;
  youtube_premium_revenue: number;
  gross_revenue: number;
  avg_cpm: number;
  monetized_playbacks: number;
  ad_impressions: number;
}

interface RevenueOverview {
  available: boolean;
  period: string;
  start_date: string;
  end_date: string;
  totals: RevenueOverviewTotals;
  daily_data: DailyRevenue[];
  revenue_by_country: CountryRevenue[];
}

interface CountryRevenue {
  country_code: string;
  country_name: string;
  revenue: number;
  cpm: number;
  monetized_playbacks: number;
  percentage: number;
}

interface RevenueByCountry {
  available: boolean;
  period: string;
  start_date: string;
  end_date: string;
  total_revenue: number;
  countries: CountryRevenue[];
}

interface DailyRevenue {
  date: string;
  estimated_revenue: number;
  ad_revenue: number;
  premium_revenue: number;
  cpm: number;
  playback_cpm: number;
}

interface DailyRevenueStats {
  total: number;
  average: number;
  best_day: number;
  worst_day: number;
  best_day_date: string;
  worst_day_date: string;
}

interface DailyRevenueData {
  available: boolean;
  period: string;
  start_date: string;
  end_date: string;
  stats: DailyRevenueStats;
  daily_data: DailyRevenue[];
}

interface MonetizationStatus {
  is_monetized: boolean;
  has_adsense: boolean;
  monetization_available: boolean;
  message: string;
}

// Country flag emoji helper
const getCountryFlag = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return "🌍";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) {
    return "0";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

// Chart colors
const CHART_COLORS = {
  revenue: "#22c55e",
  cpm: "#8b5cf6",
  views: "#3b82f6",
};

export default function RevenuePage() {
  const [overview, setOverview] = useState<RevenueOverview | null>(null);
  const [byCountry, setByCountry] = useState<RevenueByCountry | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenueData | null>(null);
  const [monetizationStatus, setMonetizationStatus] = useState<MonetizationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "countries" | "daily">("overview");
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAllData();
  }, [days]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      // First check monetization status
      const statusRes = await api.getMonetizationStatus();
      setMonetizationStatus(statusRes);

      if (statusRes.monetization_available) {
        const [overviewRes, countryRes, dailyRes] = await Promise.all([
          api.getRevenueOverview(days),
          api.getRevenueByCountry(days, 10),
          api.getDailyRevenue(days),
        ]);

        setOverview(overviewRes);
        setByCountry(countryRes);
        setDailyRevenue(dailyRes);
      }
    } catch (err) {
      console.error("Error fetching revenue data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch revenue data");
    } finally {
      setLoading(false);
    }
  };

  // Prepare daily chart data
  const dailyChartData = dailyRevenue?.daily_data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue: d.estimated_revenue,
    adRevenue: d.ad_revenue,
    cpm: d.cpm,
  })) || [];

  // Calculate trends
  const calculateTrend = () => {
    if (!dailyRevenue || dailyRevenue.daily_data.length < 7) return null;
    const data = dailyRevenue.daily_data;
    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint);
    const secondHalf = data.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.estimated_revenue, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.estimated_revenue, 0) / secondHalf.length;

    if (firstAvg === 0) return null;
    return ((secondAvg - firstAvg) / firstAvg) * 100;
  };

  const revenueTrend = calculateTrend();

  return (
    <DashboardLayout activePath="/revenue">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <DollarSign className="w-7 h-7 text-green-400" />
              Revenue & Monetization
            </h1>
            <p className="text-gray-500 mt-1">Track your earnings and CPM</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
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
        ) : !monetizationStatus?.monetization_available ? (
          /* Monetization Not Available */
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-8 text-center max-w-2xl mx-auto">
            <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Monetization Not Available</h2>
            <p className="text-white/60 mb-6">
              {monetizationStatus?.message ||
                "Revenue data is not available for this channel. This could be because the channel is not monetized or you haven't linked your AdSense account."}
            </p>
            <div className="bg-white/5 rounded-lg p-6 text-left">
              <h3 className="font-semibold mb-3">To enable revenue tracking:</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">1.</span>
                  Join the YouTube Partner Program (1,000+ subscribers, 4,000+ watch hours)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">2.</span>
                  Link an AdSense account to your YouTube channel
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">3.</span>
                  Re-authorize this app to grant monetary data access
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-white/60 text-sm">Estimated Revenue</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(overview?.totals?.estimated_revenue || 0)}
                </p>
                {revenueTrend !== null && (
                  <div
                    className={`flex items-center gap-1 mt-1 text-sm ${
                      revenueTrend >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {revenueTrend >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {Math.abs(revenueTrend).toFixed(1)}% vs previous period
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Banknote className="w-5 h-5 text-purple-400" />
                  <span className="text-white/60 text-sm">CPM</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(overview?.totals?.avg_cpm || 0)}
                </p>
                <p className="text-sm text-white/60 mt-1">Cost per 1,000 impressions</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Percent className="w-5 h-5 text-blue-400" />
                  <span className="text-white/60 text-sm">Ad Impressions</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatNumber(overview?.totals?.ad_impressions || 0)}
                </p>
                <p className="text-sm text-white/60 mt-1">Total ad impressions</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Eye className="w-5 h-5 text-orange-400" />
                  <span className="text-white/60 text-sm">Monetized Playbacks</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatNumber(overview?.totals?.monetized_playbacks || 0)}
                </p>
                <p className="text-sm text-white/60 mt-1">
                  Ad-eligible plays
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "overview"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-white/5 text-white/60 hover:text-white border border-white/10"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab("countries")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "countries"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-white/5 text-white/60 hover:text-white border border-white/10"
                }`}
              >
                <Globe className="w-4 h-4" />
                By Country
              </button>
              <button
                onClick={() => setActiveTab("daily")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "daily"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-white/5 text-white/60 hover:text-white border border-white/10"
                }`}
              >
                <Calendar className="w-4 h-4" />
                Daily Breakdown
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && overview && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Breakdown */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Revenue Sources</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/60">Ad Revenue</span>
                        <span className="font-semibold text-green-400">
                          {formatCurrency(overview.totals.ad_revenue)}
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{
                            width: `${
                              overview.totals.estimated_revenue > 0
                                ? (overview.totals.ad_revenue / overview.totals.estimated_revenue) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/60">YouTube Premium Revenue</span>
                        <span className="font-semibold text-purple-400">
                          {formatCurrency(overview.totals.youtube_premium_revenue)}
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{
                            width: `${
                              overview.totals.estimated_revenue > 0
                                ? (overview.totals.youtube_premium_revenue / overview.totals.estimated_revenue) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* CPM Metrics */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">CPM Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white/60 text-sm">Average CPM</p>
                        <p className="text-xl font-bold">{formatCurrency(overview.totals.avg_cpm)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/60 text-sm">Ad impressions</p>
                        <p className="font-medium">{formatNumber(overview.totals.ad_impressions)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white/60 text-sm">Gross Revenue</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(overview.totals.gross_revenue)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/60 text-sm">Before YouTube cut</p>
                        <p className="font-medium">
                          100%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white/60 text-sm">Your Earnings</p>
                        <p className="text-xl font-bold">{formatCurrency(overview.totals.estimated_revenue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/60 text-sm">Your cut after YouTube</p>
                        <p className="font-medium text-green-400">
                          {overview.totals.gross_revenue > 0
                            ? `${((overview.totals.estimated_revenue / overview.totals.gross_revenue) * 100).toFixed(0)}%`
                            : "~55%"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Insights */}
                <div className="lg:col-span-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Revenue Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/60 mb-1">Daily Average</p>
                      <p className="font-semibold text-lg">
                        {formatCurrency(overview.totals.estimated_revenue / days)}
                      </p>
                      <p className="text-green-400">per day</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/60 mb-1">Projected Monthly</p>
                      <p className="font-semibold text-lg">
                        {formatCurrency((overview.totals.estimated_revenue / days) * 30)}
                      </p>
                      <p className="text-blue-400">at current rate</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/60 mb-1">Premium Share</p>
                      <p className="font-semibold text-lg">
                        {overview.totals.estimated_revenue > 0
                          ? (
                              (overview.totals.youtube_premium_revenue / overview.totals.estimated_revenue) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </p>
                      <p className="text-purple-400">from YT Premium</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "countries" && byCountry && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Country List */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Top Earning Countries</h3>
                  <div className="space-y-3">
                    {byCountry.countries.map((country, index) => (
                      <div
                        key={index}
                        className="p-4 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getCountryFlag(country.country_code)}</span>
                            <div>
                              <p className="font-medium">{country.country_name}</p>
                              <p className="text-sm text-white/60">
                                {formatNumber(country.monetized_playbacks)} monetized plays
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-400">
                              {formatCurrency(country.revenue)}
                            </p>
                            <p className="text-sm text-white/60">
                              CPM: {formatCurrency(country.cpm)}
                            </p>
                          </div>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${country.percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-white/40 mt-1 text-right">
                          {country.percentage.toFixed(1)}% of revenue
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CPM Comparison */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">CPM by Country</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={byCountry.countries.slice(0, 8).map((c) => ({
                          name: c.country_code,
                          flag: getCountryFlag(c.country_code),
                          cpm: c.cpm,
                          revenue: c.revenue,
                        }))}
                        layout="vertical"
                        margin={{ left: 10, right: 20 }}
                      >
                        <XAxis type="number" stroke="#64748b" fontSize={12} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#64748b"
                          fontSize={12}
                          width={40}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1a1a1a",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [formatCurrency(value), "CPM"]}
                        />
                        <Bar dataKey="cpm" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Insights */}
                <div className="lg:col-span-2 bg-gradient-to-r from-purple-500/10 to-green-500/10 border border-purple-500/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-purple-400" />
                    Geographic Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {byCountry.countries[0] && (
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-white/60 mb-1">Top Earning Country</p>
                        <p className="font-semibold">
                          {getCountryFlag(byCountry.countries[0].country_code)}{" "}
                          {byCountry.countries[0].country_name}
                        </p>
                        <p className="text-green-400">
                          {formatCurrency(byCountry.countries[0].revenue)} ({byCountry.countries[0].percentage.toFixed(1)}%)
                        </p>
                      </div>
                    )}
                    {(() => {
                      const highestCPM = [...byCountry.countries].sort((a, b) => b.cpm - a.cpm)[0];
                      return highestCPM ? (
                        <div className="bg-white/5 rounded-lg p-4">
                          <p className="text-white/60 mb-1">Highest CPM</p>
                          <p className="font-semibold">
                            {getCountryFlag(highestCPM.country_code)} {highestCPM.country_name}
                          </p>
                          <p className="text-purple-400">{formatCurrency(highestCPM.cpm)} CPM</p>
                        </div>
                      ) : null;
                    })()}
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/60 mb-1">Geographic Diversity</p>
                      <p className="font-semibold">{byCountry.countries.length} countries</p>
                      <p className="text-blue-400">
                        Top 3 = {byCountry.countries.slice(0, 3).reduce((sum, c) => sum + c.percentage, 0).toFixed(1)}% of revenue
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "daily" && dailyRevenue && (
              <div className="space-y-6">
                {/* Daily Revenue Chart */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Daily Revenue</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyChartData}>
                        <defs>
                          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          stroke="#64748b"
                          fontSize={12}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#64748b"
                          fontSize={12}
                          tickLine={false}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1a1a1a",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number, name: string) => {
                            if (name === "revenue") return [formatCurrency(value), "Revenue"];
                            if (name === "cpm") return [formatCurrency(value), "CPM"];
                            return [formatNumber(value), "Views"];
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#22c55e"
                          strokeWidth={2}
                          fill="url(#revenueGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <span className="text-white/60 text-sm">Total ({days} days)</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(dailyRevenue.stats?.total || 0)}
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                      <span className="text-white/60 text-sm">Daily Average</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(dailyRevenue.stats?.average || 0)}
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                      <span className="text-white/60 text-sm">Best Day</span>
                    </div>
                    {(() => {
                      const bestDay = [...dailyRevenue.daily_data].sort(
                        (a, b) => b.estimated_revenue - a.estimated_revenue
                      )[0];
                      return (
                        <>
                          <p className="text-2xl font-bold">
                            {formatCurrency(bestDay?.estimated_revenue || 0)}
                          </p>
                          <p className="text-sm text-white/60">
                            {bestDay
                              ? new Date(bestDay.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })
                              : ""}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Daily Table */}
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="text-lg font-semibold">Daily Breakdown</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-white/5 sticky top-0">
                        <tr>
                          <th className="text-left p-4 text-white/60 text-sm font-medium">
                            Date
                          </th>
                          <th className="text-right p-4 text-white/60 text-sm font-medium">
                            Revenue
                          </th>
                          <th className="text-right p-4 text-white/60 text-sm font-medium">
                            Ad Revenue
                          </th>
                          <th className="text-right p-4 text-white/60 text-sm font-medium">
                            CPM
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...dailyRevenue.daily_data].reverse().map((day, index) => (
                          <tr
                            key={index}
                            className="border-t border-white/5 hover:bg-white/5"
                          >
                            <td className="p-4">
                              {new Date(day.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                            <td className="p-4 text-right font-medium text-green-400">
                              {formatCurrency(day.estimated_revenue)}
                            </td>
                            <td className="p-4 text-right text-white/60">
                              {formatCurrency(day.ad_revenue)}
                            </td>
                            <td className="p-4 text-right text-white/60">
                              {formatCurrency(day.cpm)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
