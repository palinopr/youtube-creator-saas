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

      {/* Desktop Preview */}
      {previewMode === "desktop" && (
        <>
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
