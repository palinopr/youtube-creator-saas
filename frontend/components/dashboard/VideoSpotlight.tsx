"use client";

import Link from "next/link";
import { Trophy, Eye, ThumbsUp, Clock, ExternalLink } from "lucide-react";

interface VideoSpotlightProps {
  video?: {
    video_id: string;
    title: string;
    thumbnail_url: string;
    view_count: number;
    like_count: number;
    published_at: string;
  };
  isLoading?: boolean;
}

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function VideoSpotlightSkeleton() {
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-white/10" />
      <div className="p-4">
        <div className="w-full h-5 rounded bg-white/10 mb-2" />
        <div className="w-2/3 h-4 rounded bg-white/10" />
      </div>
    </div>
  );
}

export function VideoSpotlight({ video, isLoading = false }: VideoSpotlightProps) {
  if (isLoading || !video) {
    return <VideoSpotlightSkeleton />;
  }

  const engagementRate = video.view_count && video.view_count > 0 && video.like_count
    ? ((video.like_count / video.view_count) * 100).toFixed(1)
    : "0";

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden group hover:border-yellow-500/30 transition-colors">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h3 className="font-semibold text-white">Top Performer</h3>
      </div>

      {/* Thumbnail */}
      <Link href={`/video/${video.video_id}`} className="relative block">
        <div className="aspect-video relative">
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Overlay Stats */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-4 text-sm text-white/90">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {formatNumber(video.view_count)}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-4 h-4" />
                {formatNumber(video.like_count)}
              </span>
            </div>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex items-center gap-2 text-white font-medium">
              <span>View Details</span>
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <h4 className="font-medium text-white line-clamp-2 mb-3 group-hover:text-yellow-300 transition-colors">
          {video.title}
        </h4>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(video.published_at)}
          </div>
          <div className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
            {engagementRate}% engagement
          </div>
        </div>
      </div>
    </div>
  );
}
