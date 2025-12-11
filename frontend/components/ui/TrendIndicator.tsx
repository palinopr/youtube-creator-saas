"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendIndicatorProps {
  change: number;
  label?: string;
  size?: "sm" | "md";
}

export function TrendIndicator({ change, label, size = "sm" }: TrendIndicatorProps) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
  };

  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  if (isNeutral) {
    return (
      <div className={`flex items-center gap-1 text-gray-400 ${sizeClasses[size]}`}>
        <Minus className={iconSize} />
        <span>0%</span>
        {label && <span className="text-gray-500">{label}</span>}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 ${
        isPositive ? "text-green-400" : "text-red-400"
      } ${sizeClasses[size]}`}
    >
      {isPositive ? (
        <TrendingUp className={iconSize} />
      ) : (
        <TrendingDown className={iconSize} />
      )}
      <span>
        {isPositive ? "+" : ""}
        {change.toFixed(1)}%
      </span>
      {label && <span className="text-gray-500">{label}</span>}
    </div>
  );
}
