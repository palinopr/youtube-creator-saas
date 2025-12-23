"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { ChartSkeleton } from "./ChartSkeleton";
import { DailyAnalytics } from "@/hooks/useDashboardData";
import { formatNumber, formatDateLabel } from "@/lib/utils";

interface EngagementChartProps {
  dailyData?: DailyAnalytics[];
  isLoading?: boolean;
}

export function EngagementChart({ dailyData, isLoading = false }: EngagementChartProps) {
  const [timeRange, setTimeRange] = useState<7 | 30>(7);

  // Transform API data for chart - slice to show timeRange days
  const chartData = useMemo(() => {
    if (!dailyData || dailyData.length === 0) return [];
    const sliced = dailyData.slice(-timeRange);
    return sliced.map((d) => ({
      date: d.date,
      likes: d.likes || 0,
      comments: d.comments || 0,
      shares: d.shares || 0,
      label: formatDateLabel(d.date),
    }));
  }, [dailyData, timeRange]);

  // Calculate totals
  const totalLikes = chartData.reduce((sum, d) => sum + d.likes, 0);
  const totalComments = chartData.reduce((sum, d) => sum + d.comments, 0);
  const totalShares = chartData.reduce((sum, d) => sum + d.shares, 0);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  // No data state
  if (!dailyData || dailyData.length === 0) {
    return (
      <div className="bg-[#111] border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-pink-400" />
          <h3 className="font-semibold text-white">Engagement</h3>
        </div>
        <div className="h-[160px] flex items-center justify-center text-gray-500">
          No engagement data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-400" />
          <h3 className="font-semibold text-white">Engagement</h3>
        </div>
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setTimeRange(7)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              timeRange === 7
                ? "bg-pink-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            7D
          </button>
          <button
            onClick={() => setTimeRange(30)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              timeRange === 30
                ? "bg-pink-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            30D
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <Heart className="w-3 h-3 text-green-400" />
          <div>
            <p className="text-[10px] text-gray-500">Likes</p>
            <p className="text-sm font-bold text-white">{formatNumber(totalLikes)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <MessageCircle className="w-3 h-3 text-blue-400" />
          <div>
            <p className="text-[10px] text-gray-500">Comments</p>
            <p className="text-sm font-bold text-white">{formatNumber(totalComments)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Share2 className="w-3 h-3 text-purple-400" />
          <div>
            <p className="text-[10px] text-gray-500">Shares</p>
            <p className="text-sm font-bold text-white">{formatNumber(totalShares)}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 10 }}
              interval={timeRange === 7 ? 0 : "preserveStartEnd"}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 10 }}
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
              formatter={(value: number, name: string) => [
                formatNumber(value),
                name.charAt(0).toUpperCase() + name.slice(1),
              ]}
            />
            <Line
              type="monotone"
              dataKey="likes"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#22c55e" }}
            />
            <Line
              type="monotone"
              dataKey="comments"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#3b82f6" }}
            />
            <Line
              type="monotone"
              dataKey="shares"
              stroke="#a855f7"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#a855f7" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
