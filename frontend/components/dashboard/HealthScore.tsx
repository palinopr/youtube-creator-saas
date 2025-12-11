"use client";

import { useEffect, useState } from "react";
import { Activity, TrendingUp, TrendingDown, Info } from "lucide-react";

interface HealthMetrics {
  viewVelocity: number; // Current views vs 30-day average (percentage)
  subscriberGrowth: number; // Growth rate percentage
  engagementTrend: number; // Like ratio trend
  uploadConsistency: number; // 0-100 score based on upload frequency
  ctrTrend?: number; // Optional: click-through rate trend
  watchTimeTrend?: number; // Optional: watch time trend
}

interface HealthScoreProps {
  metrics?: HealthMetrics;
  loading?: boolean;
  onLearnMore?: () => void;
}

// Calculate overall health score from metrics
function calculateHealthScore(metrics: HealthMetrics): number {
  const weights = {
    viewVelocity: 0.25,
    subscriberGrowth: 0.20,
    engagementTrend: 0.20,
    uploadConsistency: 0.15,
    ctrTrend: 0.10,
    watchTimeTrend: 0.10,
  };

  // Normalize each metric to 0-100 scale
  const normalizedViewVelocity = Math.min(100, Math.max(0, 50 + metrics.viewVelocity / 2));
  const normalizedSubGrowth = Math.min(100, Math.max(0, 50 + metrics.subscriberGrowth * 5));
  const normalizedEngagement = Math.min(100, Math.max(0, 50 + metrics.engagementTrend));
  const normalizedUploadConsistency = metrics.uploadConsistency;
  const normalizedCTR = metrics.ctrTrend !== undefined
    ? Math.min(100, Math.max(0, 50 + metrics.ctrTrend))
    : 50;
  const normalizedWatchTime = metrics.watchTimeTrend !== undefined
    ? Math.min(100, Math.max(0, 50 + metrics.watchTimeTrend))
    : 50;

  const score =
    normalizedViewVelocity * weights.viewVelocity +
    normalizedSubGrowth * weights.subscriberGrowth +
    normalizedEngagement * weights.engagementTrend +
    normalizedUploadConsistency * weights.uploadConsistency +
    normalizedCTR * weights.ctrTrend +
    normalizedWatchTime * weights.watchTimeTrend;

  return Math.round(score);
}

// Get health status label and color
function getHealthStatus(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 80) {
    return { label: "Excellent", color: "#22c55e", bgColor: "rgba(34, 197, 94, 0.1)" };
  } else if (score >= 60) {
    return { label: "Good", color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.1)" };
  } else if (score >= 40) {
    return { label: "Fair", color: "#eab308", bgColor: "rgba(234, 179, 8, 0.1)" };
  } else if (score >= 20) {
    return { label: "Needs Work", color: "#f97316", bgColor: "rgba(249, 115, 22, 0.1)" };
  } else {
    return { label: "Critical", color: "#ef4444", bgColor: "rgba(239, 68, 68, 0.1)" };
  }
}

export default function HealthScore({ metrics, loading, onLearnMore }: HealthScoreProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const score = metrics ? calculateHealthScore(metrics) : 0;
  const status = getHealthStatus(score);

  // Animate score on load
  useEffect(() => {
    if (loading || !metrics) {
      setAnimatedScore(0);
      return;
    }

    const duration = 1000;
    const steps = 60;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score, loading, metrics]);

  // SVG circle parameters
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-white/10 rounded" />
        </div>
        <div className="flex items-center justify-center">
          <div className="w-44 h-44 rounded-full bg-white/10" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white/5 border border-white/10 rounded-xl p-6 transition-all hover:border-white/20"
      style={{ borderColor: `${status.color}30` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" style={{ color: status.color }} />
          <h3 className="font-semibold">Channel Health</h3>
        </div>
        {onLearnMore && (
          <button
            onClick={onLearnMore}
            className="text-white/40 hover:text-white/60 transition-colors"
            title="Learn more about health score"
          >
            <Info className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Score Circle */}
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width="180" height="180" className="-rotate-90">
            {/* Background circle */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke={status.color}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold" style={{ color: status.color }}>
              {animatedScore}
            </span>
            <span className="text-sm text-white/60">out of 100</span>
            <span
              className="mt-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: status.bgColor, color: status.color }}
            >
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Breakdown */}
      {metrics && (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <MetricItem
            label="View Velocity"
            value={metrics.viewVelocity}
            suffix="%"
            isPercentage
          />
          <MetricItem
            label="Sub Growth"
            value={metrics.subscriberGrowth}
            suffix="%"
            isPercentage
          />
          <MetricItem
            label="Engagement"
            value={metrics.engagementTrend}
            suffix="%"
            isPercentage
          />
          <MetricItem
            label="Upload Score"
            value={metrics.uploadConsistency}
            suffix="/100"
          />
        </div>
      )}
    </div>
  );
}

interface MetricItemProps {
  label: string;
  value: number;
  suffix: string;
  isPercentage?: boolean;
}

function MetricItem({ label, value, suffix, isPercentage }: MetricItemProps) {
  const isPositive = value >= 0;
  const displayValue = isPercentage ? Math.abs(value).toFixed(1) : value;

  return (
    <div className="bg-white/5 rounded-lg p-3">
      <p className="text-xs text-white/60 mb-1">{label}</p>
      <div className="flex items-center gap-1">
        {isPercentage && (
          isPositive ? (
            <TrendingUp className="w-3 h-3 text-green-400" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-400" />
          )
        )}
        <span
          className={`font-semibold ${
            isPercentage ? (isPositive ? "text-green-400" : "text-red-400") : "text-white"
          }`}
        >
          {isPercentage && isPositive && "+"}
          {displayValue}
          {suffix}
        </span>
      </div>
    </div>
  );
}
