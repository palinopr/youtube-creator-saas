"use client";

import { Crown, Star, Sparkles, User } from "lucide-react";

interface PlanBadgeProps {
  plan: string;
  size?: "sm" | "md" | "lg";
  showUpgrade?: boolean;
  onUpgrade?: () => void;
}

const planConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }> = {
  free: {
    label: "Free",
    icon: User,
    color: "text-gray-400",
    bgColor: "bg-gray-800",
  },
  starter: {
    label: "Starter",
    icon: Star,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  pro: {
    label: "Pro",
    icon: Sparkles,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  agency: {
    label: "Agency",
    icon: Crown,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
  },
};

export function PlanBadge({ plan, size = "md", showUpgrade = false, onUpgrade }: PlanBadgeProps) {
  const config = planConfig[plan] || planConfig.free;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-sm gap-1.5",
    lg: "px-4 py-1.5 text-base gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${config.color} ${config.bgColor}`}
      >
        <Icon className={iconSizes[size]} />
        {config.label}
      </span>
      {showUpgrade && plan === "free" && onUpgrade && (
        <button
          onClick={onUpgrade}
          className="text-xs text-purple-400 hover:text-purple-300 hover:underline"
        >
          Upgrade
        </button>
      )}
    </div>
  );
}
