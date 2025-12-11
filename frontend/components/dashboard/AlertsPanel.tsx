"use client";

import { useState } from "react";
import {
  Bell,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  Flame,
  X,
  ChevronRight,
  CheckCircle,
  Clock,
  Heart,
  MessageCircle,
  Lightbulb,
} from "lucide-react";

// Backend API types
export type AlertType = "viral" | "milestone" | "drop" | "opportunity" | "warning" | "engagement" | "comment_surge";
export type AlertPriority = "critical" | "high" | "medium" | "low";

// Support both legacy format and API format
export interface Alert {
  id: string | number;
  type?: AlertType;
  alert_type?: AlertType;
  title: string;
  message: string;
  timestamp?: Date;
  created_at?: string;
  priority: AlertPriority;
  videoId?: string;
  video_id?: string | null;
  videoTitle?: string;
  video_title?: string | null;
  actionUrl?: string;
  actionLabel?: string;
  dismissed?: boolean;
  is_dismissed?: boolean;
  is_read?: boolean;
  data?: Record<string, any>;
}

interface AlertsPanelProps {
  alerts: Alert[];
  onDismiss?: (alertId: string) => void;
  onAction?: (alert: Alert) => void;
  maxDisplay?: number;
  loading?: boolean;
}

// Alert type configuration
const ALERT_CONFIG: Record<AlertType, { icon: React.ElementType; color: string; bgColor: string }> = {
  viral: {
    icon: Flame,
    color: "#f97316",
    bgColor: "rgba(249, 115, 22, 0.1)",
  },
  milestone: {
    icon: Award,
    color: "#22c55e",
    bgColor: "rgba(34, 197, 94, 0.1)",
  },
  drop: {
    icon: TrendingDown,
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.1)",
  },
  opportunity: {
    icon: Lightbulb,
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.1)",
  },
  warning: {
    icon: AlertTriangle,
    color: "#eab308",
    bgColor: "rgba(234, 179, 8, 0.1)",
  },
  engagement: {
    icon: Heart,
    color: "#ec4899",
    bgColor: "rgba(236, 72, 153, 0.1)",
  },
  comment_surge: {
    icon: MessageCircle,
    color: "#8b5cf6",
    bgColor: "rgba(139, 92, 246, 0.1)",
  },
};

// Priority badge styles
const PRIORITY_STYLES: Record<AlertPriority, { dot: string; text: string }> = {
  critical: { dot: "bg-red-600 animate-ping", text: "text-red-500" },
  high: { dot: "bg-red-500", text: "text-red-400" },
  medium: { dot: "bg-yellow-500", text: "text-yellow-400" },
  low: { dot: "bg-blue-500", text: "text-blue-400" },
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Helper to normalize alert format (supports both legacy and API formats)
function normalizeAlert(alert: Alert): {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  timestamp: Date;
  priority: AlertPriority;
  videoId: string | null;
  videoTitle: string | null;
  actionUrl?: string;
  actionLabel?: string;
  isDismissed: boolean;
  isRead: boolean;
} {
  return {
    id: String(alert.id),
    type: alert.type || alert.alert_type || "warning",
    title: alert.title,
    message: alert.message,
    timestamp: alert.timestamp || (alert.created_at ? new Date(alert.created_at) : new Date()),
    priority: alert.priority,
    videoId: alert.videoId || alert.video_id || null,
    videoTitle: alert.videoTitle || alert.video_title || null,
    actionUrl: alert.actionUrl,
    actionLabel: alert.actionLabel,
    isDismissed: alert.dismissed || alert.is_dismissed || false,
    isRead: alert.is_read || false,
  };
}

export default function AlertsPanel({
  alerts,
  onDismiss,
  onAction,
  maxDisplay = 5,
  loading,
}: AlertsPanelProps) {
  const [showAll, setShowAll] = useState(false);

  // Normalize and filter out dismissed alerts, sort by priority and timestamp
  const activeAlerts = alerts
    .map(normalizeAlert)
    .filter((a) => !a.isDismissed)
    .sort((a, b) => {
      const priorityOrder: Record<AlertPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

  const displayedAlerts = showAll ? activeAlerts : activeAlerts.slice(0, maxDisplay);
  const hasMore = activeAlerts.length > maxDisplay;
  const urgentCount = activeAlerts.filter((a) => a.priority === "critical" || a.priority === "high").length;

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-40 bg-white/10 rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/10 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="w-5 h-5 text-purple-400" />
            {urgentCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                {urgentCount}
              </span>
            )}
          </div>
          <h3 className="font-semibold">Alerts & Milestones</h3>
        </div>
        <span className="text-sm text-white/60">
          {activeAlerts.length} active
        </span>
      </div>

      {/* Alerts List */}
      {activeAlerts.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-400/50 mx-auto mb-3" />
          <p className="text-white/60">All caught up!</p>
          <p className="text-sm text-white/40">No new alerts at the moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedAlerts.map((alert) => {
            const config = ALERT_CONFIG[alert.type] || ALERT_CONFIG.warning;
            const Icon = config.icon;
            const priorityStyle = PRIORITY_STYLES[alert.priority];
            const isUrgent = alert.priority === "critical" || alert.priority === "high";

            return (
              <div
                key={alert.id}
                className={`relative group bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors ${
                  !alert.isRead ? "ring-1 ring-white/20" : ""
                }`}
                style={{ borderLeft: `3px solid ${config.color}` }}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className="p-2 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: config.bgColor }}
                  >
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{alert.title}</span>
                      {isUrgent && (
                        <span className={`w-2 h-2 rounded-full ${priorityStyle.dot}`} />
                      )}
                      {!alert.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" title="Unread" />
                      )}
                    </div>
                    <p className="text-sm text-white/60 line-clamp-2">{alert.message}</p>
                    {alert.videoTitle && (
                      <p className="text-xs text-white/40 mt-1 truncate">
                        Video: {alert.videoTitle}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-white/40 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(alert.timestamp)}
                      </span>
                      {alert.actionUrl && alert.actionLabel && onAction && (
                        <button
                          onClick={() => onAction({
                            id: alert.id,
                            type: alert.type,
                            title: alert.title,
                            message: alert.message,
                            priority: alert.priority,
                            actionUrl: alert.actionUrl,
                            actionLabel: alert.actionLabel,
                          } as Alert)}
                          className="text-xs flex items-center gap-1 hover:underline"
                          style={{ color: config.color }}
                        >
                          {alert.actionLabel}
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dismiss button */}
                  {onDismiss && (
                    <button
                      onClick={() => onDismiss(alert.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                      title="Dismiss"
                    >
                      <X className="w-4 h-4 text-white/40" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Show More/Less */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-4 py-2 text-sm text-white/60 hover:text-white flex items-center justify-center gap-1 transition-colors"
        >
          {showAll ? "Show less" : `Show ${activeAlerts.length - maxDisplay} more`}
          <ChevronRight
            className={`w-4 h-4 transition-transform ${showAll ? "-rotate-90" : "rotate-90"}`}
          />
        </button>
      )}
    </div>
  );
}

// Helper component for creating sample alerts (useful for testing)
export function createSampleAlerts(): Alert[] {
  return [
    {
      id: "1",
      type: "viral",
      title: "Video Going Viral!",
      message: "Your latest video is getting 5x more views than average in the first 24 hours.",
      timestamp: new Date(Date.now() - 1800000), // 30 mins ago
      priority: "high",
      videoId: "abc123",
      videoTitle: "How to Edit Videos Like a Pro",
      actionUrl: "/video/abc123",
      actionLabel: "View analytics",
    },
    {
      id: "2",
      type: "milestone",
      title: "100K Subscribers!",
      message: "Congratulations! You've reached 100,000 subscribers.",
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      priority: "medium",
      actionUrl: "/",
      actionLabel: "Celebrate",
    },
    {
      id: "3",
      type: "drop",
      title: "Views Dropping",
      message: "Views are down 30% compared to last week. Consider posting new content.",
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      priority: "high",
      actionUrl: "/analysis",
      actionLabel: "Analyze",
    },
    {
      id: "4",
      type: "opportunity",
      title: "Trending Topic",
      message: '"AI Video Editing" is trending in your niche. Consider creating content on this topic.',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      priority: "medium",
      actionUrl: "/optimize",
      actionLabel: "Get ideas",
    },
    {
      id: "5",
      type: "warning",
      title: "Upload Consistency",
      message: "You haven't uploaded in 14 days. Consistent uploads help maintain audience engagement.",
      timestamp: new Date(Date.now() - 172800000), // 2 days ago
      priority: "low",
    },
  ];
}
