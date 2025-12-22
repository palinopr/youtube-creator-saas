"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Eye } from "lucide-react";
import { ChartSkeleton } from "./ChartSkeleton";
import { DailyAnalytics } from "@/hooks/useDashboardData";
import { formatNumber, formatDateLabel } from "@/lib/utils";

interface ViewsTrendChartProps {
  dailyData?: DailyAnalytics[];
  isLoading?: boolean;
}

export function ViewsTrendChart({ dailyData, isLoading = false }: ViewsTrendChartProps) {
  const [timeRange, setTimeRange] = useState<7 | 30>(7);

  // Transform API data for chart - slice to show timeRange days
  // MUST be called before any early returns (React hooks rules)
  const chartData = useMemo(() => {
    if (!dailyData || dailyData.length === 0) return [];
    const sliced = dailyData.slice(-timeRange);
    return sliced.map((d) => ({
      date: d.date,
      views: d.views,
      label: formatDateLabel(d.date),
    }));
  }, [dailyData, timeRange]);

  // Calculate totals
  const totalViews = chartData.reduce((sum, d) => sum + d.views, 0);
  const avgViews = chartData.length > 0 ? Math.round(totalViews / chartData.length) : 0;

  if (isLoading) {
    return <ChartSkeleton />;
  }

  // No data state
  if (!dailyData || dailyData.length === 0) {
    return (
      <div className="bg-[#111] border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Views Trend</h3>
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
          <Eye className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Views Trend</h3>
        </div>
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setTimeRange(7)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              timeRange === 7
                ? "bg-blue-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            7D
          </button>
          <button
            onClick={() => setTimeRange(30)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              timeRange === 30
                ? "bg-blue-500 text-white"
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
          <p className="text-xs text-gray-500">Total Views</p>
          <p className="text-lg font-bold text-white">{formatNumber(totalViews)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Daily Average</p>
          <p className="text-lg font-bold text-white">{formatNumber(avgViews)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
              }}
              labelStyle={{ color: "#9CA3AF" }}
              itemStyle={{ color: "#3B82F6" }}
              formatter={(value: number) => [formatNumber(value), "Views"]}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#viewsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
