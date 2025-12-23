"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Flame,
  TrendingUp,
  Eye,
  Clock,
  ChevronRight,
  Sparkles,
  Play,
} from "lucide-react";

export interface TrendingVideo {
  id: string;
  title: string;
  thumbnail_url: string;
  published_at: string;
  view_count: number;
  average_views: number; // Channel average for comparison
  velocity_multiplier: number; // How many times faster than average
  views_per_hour: number;
  hours_since_publish: number;
  like_count?: number;
  comment_count?: number;
}

interface ViralRadarProps {
  videos: TrendingVideo[];
  loading?: boolean;
  channelAverageViews?: number;
  onVideoClick?: (videoId: string) => void;
}

// Determine viral status based on velocity
function getViralStatus(multiplier: number): {
  label: string;
  color: string;
  bgColor: string;
  icon: "flame" | "trending" | "sparkles";
} {
  if (multiplier >= 5) {
    return {
      label: "Going Viral!",
      color: "#f97316",
      bgColor: "rgba(249, 115, 22, 0.1)",
      icon: "flame",
    };
  } else if (multiplier >= 3) {
    return {
      label: "Hot",
      color: "#eab308",
      bgColor: "rgba(234, 179, 8, 0.1)",
      icon: "flame",
    };
  } else if (multiplier >= 2) {
    return {
      label: "Trending",
      color: "#22c55e",
      bgColor: "rgba(34, 197, 94, 0.1)",
      icon: "trending",
    };
  } else if (multiplier >= 1.5) {
    return {
      label: "Above Average",
      color: "#3b82f6",
      bgColor: "rgba(59, 130, 246, 0.1)",
      icon: "sparkles",
    };
  } else {
    return {
      label: "Normal",
      color: "#64748b",
      bgColor: "rgba(100, 116, 139, 0.1)",
      icon: "sparkles",
    };
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

function formatTimeAgo(hours: number): string {
  if (hours < 1) return "< 1h ago";
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function ViralRadar({
  videos,
  loading,
  channelAverageViews,
  onVideoClick,
}: ViralRadarProps) {
  const [showAll, setShowAll] = useState(false);

  // Sort by velocity multiplier (highest first)
  const sortedVideos = [...videos].sort(
    (a, b) => b.velocity_multiplier - a.velocity_multiplier
  );

  // Only show videos with multiplier >= 1.5 (above average)
  const trendingVideos = sortedVideos.filter((v) => v.velocity_multiplier >= 1.5);
  const displayedVideos = showAll ? trendingVideos : trendingVideos.slice(0, 3);
  const hasViralVideo = trendingVideos.some((v) => v.velocity_multiplier >= 5);

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-white/10 rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/10 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white/5 border rounded-xl p-4 transition-all ${
        hasViralVideo
          ? "border-orange-500/30 shadow-lg shadow-orange-500/10"
          : "border-white/10"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`relative ${hasViralVideo ? "animate-pulse" : ""}`}>
            <Flame
              className={`w-5 h-5 ${hasViralVideo ? "text-orange-400" : "text-purple-400"}`}
            />
          </div>
          <h3 className="font-semibold">Viral Radar</h3>
          {hasViralVideo && (
            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full animate-pulse">
              LIVE
            </span>
          )}
        </div>
        {channelAverageViews && (
          <span className="text-xs text-white/40">
            Avg: {formatNumber(channelAverageViews)} views
          </span>
        )}
      </div>

      {/* Videos List */}
      {trendingVideos.length === 0 ? (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/60">No trending videos</p>
          <p className="text-sm text-white/40">
            Videos performing above average will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedVideos.map((video, index) => {
            const status = getViralStatus(video.velocity_multiplier);
            const StatusIcon =
              status.icon === "flame"
                ? Flame
                : status.icon === "trending"
                ? TrendingUp
                : Sparkles;

            return (
              <div
                key={video.id}
                className={`relative group bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all cursor-pointer ${
                  index === 0 && video.velocity_multiplier >= 5
                    ? "ring-1 ring-orange-500/30"
                    : ""
                }`}
                onClick={() => onVideoClick?.(video.id)}
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0">
                    <div className="w-24 h-14 rounded-lg overflow-hidden bg-white/10">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-white/40" />
                        </div>
                      )}
                    </div>
                    {/* Velocity badge */}
                    <div
                      className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5"
                      style={{ backgroundColor: status.bgColor, color: status.color }}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {video.velocity_multiplier.toFixed(1)}x
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium line-clamp-2 group-hover:text-purple-400 transition-colors">
                        {video.title}
                      </h4>
                      <ChevronRight className="w-4 h-4 text-white/40 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatNumber(video.view_count)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(video.hours_since_publish)}
                      </span>
                      <span className="flex items-center gap-1 text-green-400">
                        <TrendingUp className="w-3 h-3" />
                        {formatNumber(video.views_per_hour)}/hr
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar showing performance vs average */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
                    <span>Performance vs Average</span>
                    <span style={{ color: status.color }}>{status.label}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, video.velocity_multiplier * 20)}%`,
                        backgroundColor: status.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Show More */}
      {trendingVideos.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-4 py-2 text-sm text-white/60 hover:text-white flex items-center justify-center gap-1 transition-colors"
        >
          {showAll ? "Show less" : `Show ${trendingVideos.length - 3} more`}
          <ChevronRight
            className={`w-4 h-4 transition-transform ${showAll ? "-rotate-90" : "rotate-90"}`}
          />
        </button>
      )}

      {/* Quick link to all videos */}
      {trendingVideos.length > 0 && (
        <Link
          href="/videos"
          className="block mt-4 pt-4 border-t border-white/10 text-center text-sm text-white/60 hover:text-purple-400 transition-colors"
        >
          View all videos →
        </Link>
      )}
    </div>
  );
}

// Helper function to calculate video velocity from raw data
export function calculateVideoVelocity(
  video: {
    video_id: string;
    title: string;
    thumbnail_url?: string;
    published_at: string;
    view_count: number;
    like_count?: number;
    comment_count?: number;
  },
  channelAverageViews: number,
  averageHoursToReachAverage: number = 48 // How long it typically takes to reach average views
): TrendingVideo {
  const publishedDate = new Date(video.published_at);
  const hoursSincePublish = Math.max(
    1,
    (Date.now() - publishedDate.getTime()) / 3600000
  );
  const viewsPerHour = video.view_count / hoursSincePublish;

  // Calculate expected views at this point based on channel average
  const expectedViewsAtThisPoint =
    (channelAverageViews * hoursSincePublish) / averageHoursToReachAverage;
  const velocityMultiplier =
    expectedViewsAtThisPoint > 0
      ? video.view_count / expectedViewsAtThisPoint
      : 1;

  return {
    id: video.video_id,
    title: video.title,
    thumbnail_url: video.thumbnail_url || "",
    published_at: video.published_at,
    view_count: video.view_count,
    average_views: channelAverageViews,
    velocity_multiplier: velocityMultiplier,
    views_per_hour: Math.round(viewsPerHour),
    hours_since_publish: hoursSincePublish,
    like_count: video.like_count,
    comment_count: video.comment_count,
  };
}
