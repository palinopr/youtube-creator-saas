"use client";

import { AlertTriangle, Smartphone, Info } from "lucide-react";
import {
  formatNumber,
  getMobileTitleTruncation,
  getMobileDescriptionTruncation,
  getMobileChannelTruncation,
  MOBILE_TITLE_LIMIT,
} from "@/lib/utils";

interface MobilePreviewProps {
  title: string;
  description: string;
  thumbnailUrl: string;
  channelName: string;
  viewCount: number;
  /** Channel avatar URL from Google OAuth */
  channelAvatarUrl?: string | null;
}

export default function MobilePreview({
  title,
  description,
  thumbnailUrl,
  channelName,
  viewCount,
  channelAvatarUrl,
}: MobilePreviewProps) {
  const titleTruncation = getMobileTitleTruncation(title);
  const descTruncation = getMobileDescriptionTruncation(description);
  const channelTruncation = getMobileChannelTruncation(channelName);

  return (
    <div className="space-y-4">
      {/* Phone Frame */}
      <div className="mx-auto w-64 bg-gray-900 rounded-[2rem] p-2 shadow-2xl border border-gray-700">
        {/* Phone Notch */}
        <div className="w-20 h-5 bg-black rounded-full mx-auto mb-2" />

        {/* Phone Screen */}
        <div className="bg-black rounded-2xl overflow-hidden">
          {/* YouTube Video Card Mockup */}
          <div className="p-2">
            {/* Thumbnail */}
            <div className="relative rounded-lg overflow-hidden mb-2">
              <img
                src={thumbnailUrl}
                alt=""
                className="w-full aspect-video object-cover"
              />
              {/* Duration badge placeholder */}
              <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">
                12:34
              </div>
            </div>

            {/* Video Info Row */}
            <div className="flex gap-2">
              {/* Channel Avatar */}
              {channelAvatarUrl ? (
                <img
                  src={channelAvatarUrl}
                  alt={channelName}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0" />
              )}

              {/* Title & Meta */}
              <div className="flex-1 min-w-0">
                {/* Title - Truncated */}
                <p className="text-white text-xs font-medium leading-tight line-clamp-2">
                  {titleTruncation.display}
                </p>

                {/* Channel & Views */}
                <p className="text-gray-400 text-[10px] mt-1">
                  {channelTruncation.display} • {formatNumber(viewCount)} views
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Truncation Warnings */}
      <div className="space-y-2">
        {/* Title Warning */}
        {titleTruncation.truncated && (
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-amber-400 font-medium">Title truncates on mobile</p>
              <p className="text-gray-400 text-xs mt-1">
                {titleTruncation.warning}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Tip: Put key info in first {MOBILE_TITLE_LIMIT} characters
              </p>
            </div>
          </div>
        )}

        {/* Title OK */}
        {!titleTruncation.truncated && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <p className="text-green-400 text-sm">
              Title fits on mobile ({title.length}/{MOBILE_TITLE_LIMIT} chars)
            </p>
          </div>
        )}

        {/* Description Info */}
        {descTruncation.truncated && (
          <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-400 font-medium">Description preview</p>
              <p className="text-gray-400 text-xs mt-1">
                Only ~100 chars show in mobile search. Make your hook count!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Character Count Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Title length</span>
          <span className={title.length > MOBILE_TITLE_LIMIT ? "text-amber-400" : "text-green-400"}>
            {title.length} / {MOBILE_TITLE_LIMIT} mobile limit
          </span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              title.length > MOBILE_TITLE_LIMIT
                ? "bg-gradient-to-r from-amber-500 to-red-500"
                : "bg-gradient-to-r from-green-500 to-emerald-500"
            }`}
            style={{
              width: `${Math.min((title.length / MOBILE_TITLE_LIMIT) * 100, 100)}%`,
            }}
          />
        </div>
        {title.length > MOBILE_TITLE_LIMIT && (
          <div
            className="h-1 bg-red-500/50 rounded-full"
            style={{
              width: `${((title.length - MOBILE_TITLE_LIMIT) / title.length) * 100}%`,
              marginLeft: "auto",
            }}
          />
        )}
      </div>
    </div>
  );
}
