"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, TrendingUp, TrendingDown } from "lucide-react";
import { ChartSkeleton } from "./ChartSkeleton";
import { DailyAnalytics } from "@/hooks/useDashboardData";
import { formatNumber, formatDateLabel } from "@/lib/utils";

interface SubscriberChartProps {
  dailyData?: DailyAnalytics[];
  currentSubscribers?: number;
  isLoading?: boolean;
}

export function SubscriberChart({
  dailyData,
  currentSubscribers = 0,
  isLoading = false,
}: SubscriberChartProps) {
  const [timeRange, setTimeRange] = useState<7 | 30>(7);

  // Transform API data for chart - calculate cumulative subscriber count
  // MUST be called before any early returns (React hooks rules)
  const chartData = useMemo(() => {
    if (!dailyData || dailyData.length === 0) return [];
    const sliced = dailyData.slice(-timeRange);
    let cumulativeCount = currentSubscribers;

    // Calculate the starting point by working backwards from current
    const totalNetChange = sliced.reduce((sum, d) => sum + (d.subscribers_gained - d.subscribers_lost), 0);
    cumulativeCount = currentSubscribers - totalNetChange;

    return sliced.map((d) => {
      const netChange = d.subscribers_gained - d.subscribers_lost;
      cumulativeCount += netChange;
      return {
        date: d.date,
        subscribers: cumulativeCount,
        netChange: netChange,
        gained: d.subscribers_gained,
        lost: d.subscribers_lost,
        label: formatDateLabel(d.date),
      };
    });
  }, [dailyData, timeRange, currentSubscribers]);

  // Calculate stats
  const totalGrowth = chartData.reduce((sum, d) => sum + d.netChange, 0);
  const avgDailyGrowth = chartData.length > 0 ? Math.round(totalGrowth / chartData.length) : 0;
  const startingSubs = currentSubscribers - totalGrowth;
  const growthRate = startingSubs > 0 ? ((totalGrowth / startingSubs) * 100).toFixed(2) : "0";

  if (isLoading) {
    return <ChartSkeleton />;
  }

  // No data state
  if (!dailyData || dailyData.length === 0) {
    return (
      <div className="bg-[#111] border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-red-400" />
          <h3 className="font-semibold text-white">Subscriber Growth</h3>
        </div>
        <div className="h-[200px] flex items-center justify-center text-gray-500">
          No analytics data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-red-400" />
          <h3 className="font-semibold text-white">Subscriber Growth</h3>
        </div>
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setTimeRange(7)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              timeRange === 7
                ? "bg-red-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            7D
          </button>
          <button
            onClick={() => setTimeRange(30)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              timeRange === 30
                ? "bg-red-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            30D
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex gap-6 mb-4">
        <div>
          <p className="text-xs text-gray-500">Net Growth</p>
          <p className={`text-lg font-bold ${totalGrowth >= 0 ? "text-green-400" : "text-red-400"}`}>
            {totalGrowth >= 0 ? "+" : ""}{formatNumber(totalGrowth)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Daily Avg</p>
          <p className={`text-lg font-bold ${avgDailyGrowth >= 0 ? "text-green-400" : "text-red-400"}`}>
            {avgDailyGrowth >= 0 ? "+" : ""}{avgDailyGrowth}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Growth Rate</p>
          <div className="flex items-center gap-1">
            {Number(growthRate) >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <p className={`text-lg font-bold ${Number(growthRate) >= 0 ? "text-green-400" : "text-red-400"}`}>
              {growthRate}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 11 }}
              interval={timeRange === 7 ? 0 : "preserveStartEnd"}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 11 }}
              tickFormatter={(value) => formatNumber(value)}
              domain={["dataMin - 100", "dataMax + 100"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
              }}
              labelStyle={{ color: "#9CA3AF" }}
              formatter={(value: number, name: string) => {
                if (name === "subscribers") return [formatNumber(value), "Subscribers"];
                return [value >= 0 ? `+${value}` : value, "Daily Change"];
              }}
            />
            <Line
              type="monotone"
              dataKey="subscribers"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#EF4444" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
