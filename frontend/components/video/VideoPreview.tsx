"use client";

import { useState } from "react";
import { Eye, ThumbsUp, MessageSquare, Loader2, Wand2, Monitor, Smartphone } from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";
import MobilePreview from "./MobilePreview";

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
  /** Current title being edited (may differ from video.title) */
  currentTitle?: string;
  /** Current description being edited */
  currentDescription?: string;
  /** Channel name for mobile preview */
  channelName?: string;
}

type PreviewMode = "desktop" | "mobile";

export default function VideoPreview({
  video,
  analyzing,
  analyzed,
  onOptimize,
  currentTitle,
  currentDescription,
  channelName = "Your Channel",
}: VideoPreviewProps) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");

  // Use current edited values if provided, otherwise fall back to original
  const displayTitle = currentTitle ?? video.title;
  const displayDescription = currentDescription ?? video.description;

  return (
    <div className="w-80 flex-shrink-0 p-6 border-r border-white/10">
      {/* Preview Mode Toggle */}
      <div className="flex items-center justify-center gap-1 mb-4 p-1 bg-gray-800/50 rounded-lg">
        <button
          onClick={() => setPreviewMode("desktop")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            previewMode === "desktop"
              ? "bg-white/10 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Monitor className="w-4 h-4" />
          Desktop
        </button>
        <button
          onClick={() => setPreviewMode("mobile")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            previewMode === "mobile"
              ? "bg-white/10 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Mobile
        </button>
      </div>

      {/* Desktop Preview - YouTube Search Result Style */}
      {previewMode === "desktop" && (
        <>
          {/* YouTube Search Result Mockup */}
          <div className="bg-gray-900/50 rounded-xl p-3 mb-4 border border-white/5">
            <div className="flex gap-3">
              {/* Thumbnail */}
              <div className="w-32 flex-shrink-0">
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={video.thumbnail_url}
                    alt=""
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">
                    12:34
                  </div>
                </div>
              </div>

              {/* Title & Meta */}
              <div className="flex-1 min-w-0">
                {/* Title - Full display on desktop */}
                <h3 className="text-white text-sm font-medium leading-tight line-clamp-2 mb-1">
                  {displayTitle}
                </h3>

                {/* Views & Date */}
                <p className="text-gray-400 text-xs mb-1">
                  {formatNumber(video.view_count)} views • {formatDate(video.published_at)}
                </p>

                {/* Channel */}
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-gray-700 flex-shrink-0" />
                  <span className="text-gray-400 text-xs">{channelName}</span>
                </div>
              </div>
            </div>

            {/* Title Character Count */}
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Title length</span>
                <span className={displayTitle.length > 70 ? "text-amber-400" : "text-green-400"}>
                  {displayTitle.length} / 100 chars
                </span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full transition-all ${
                    displayTitle.length > 70
                      ? "bg-gradient-to-r from-amber-500 to-red-500"
                      : "bg-gradient-to-r from-green-500 to-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min((displayTitle.length / 100) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
              <Eye className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-white font-medium text-sm">{formatNumber(video.view_count)}</p>
              <p className="text-gray-500 text-xs">Views</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
              <ThumbsUp className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-white font-medium text-sm">{formatNumber(video.like_count)}</p>
              <p className="text-gray-500 text-xs">Likes</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
              <MessageSquare className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-white font-medium text-sm">{formatNumber(video.comment_count)}</p>
              <p className="text-gray-500 text-xs">Comments</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
              <p className="text-white font-medium text-sm">{formatDate(video.published_at)}</p>
              <p className="text-gray-500 text-xs">Published</p>
            </div>
          </div>
        </>
      )}

      {/* Mobile Preview */}
      {previewMode === "mobile" && (
        <div className="mb-6">
          <MobilePreview
            title={displayTitle}
            description={displayDescription}
            thumbnailUrl={video.thumbnail_url}
            channelName={channelName}
            viewCount={video.view_count}
          />
        </div>
      )}

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
