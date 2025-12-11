"use client";

import { TrendIndicator } from "@/components/ui/TrendIndicator";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "red" | "blue" | "green" | "purple";
  change?: number;
  changeLabel?: string;
  isLoading?: boolean;
}

const colorClasses: Record<string, string> = {
  red: "text-red-400 bg-red-500/20",
  blue: "text-blue-400 bg-blue-500/20",
  green: "text-green-400 bg-green-500/20",
  purple: "text-purple-400 bg-purple-500/20",
};

export function StatCard({
  icon,
  label,
  value,
  color,
  change,
  changeLabel = "vs last week",
  isLoading = false,
}: StatCardProps) {
  if (isLoading) {
    return <StatCardSkeleton />;
  }

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
        {change !== undefined && (
          <TrendIndicator change={change} size="sm" />
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        {change !== undefined && (
          <p className="text-xs text-gray-600">{changeLabel}</p>
        )}
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-white/10" />
        <div className="w-12 h-4 rounded bg-white/10" />
      </div>
      <div className="w-20 h-8 rounded bg-white/10 mb-1" />
      <div className="w-16 h-4 rounded bg-white/10" />
    </div>
  );
}

export { StatCardSkeleton };
