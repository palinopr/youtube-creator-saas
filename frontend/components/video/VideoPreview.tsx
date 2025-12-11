"use client";

import { Eye, ThumbsUp, MessageSquare, Loader2, Wand2 } from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";

interface VideoData {
  video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at: string;
  tags: string[];
}

interface VideoPreviewProps {
  video: VideoData;
  analyzing: boolean;
  analyzed: boolean;
  onOptimize: () => void;
}

export default function VideoPreview({
  video,
  analyzing,
  analyzed,
  onOptimize,
}: VideoPreviewProps) {
  return (
    <div className="w-80 flex-shrink-0 p-6 border-r border-white/10">
      <div className="rounded-xl overflow-hidden mb-4">
        <img
          src={video.thumbnail_url}
          alt=""
          className="w-full aspect-video object-cover"
        />
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400 flex items-center gap-2">
            <Eye className="w-4 h-4" /> Views
          </span>
          <span className="text-white font-medium">
            {formatNumber(video.view_count)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400 flex items-center gap-2">
            <ThumbsUp className="w-4 h-4" /> Likes
          </span>
          <span className="text-white font-medium">
            {formatNumber(video.like_count)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Comments
          </span>
          <span className="text-white font-medium">
            {formatNumber(video.comment_count)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Published</span>
          <span className="text-white">{formatDate(video.published_at)}</span>
        </div>
      </div>

      {/* Optimize Button */}
      <button
        onClick={onOptimize}
        disabled={analyzing}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-70 rounded-xl font-medium transition-all"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Optimizing...
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5" />
            Optimize
          </>
        )}
      </button>

      {analyzed && (
        <p className="text-center text-xs text-gray-500 mt-2">
          ✓ Same content = same suggestions
        </p>
      )}
    </div>
  );
}
