"use client";

import { useState } from "react";
import {
  Play,
  Download,
  Loader2,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  Zap,
  X,
} from "lucide-react";
import {
  ClipSuggestion,
  RenderJob,
  formatDuration,
  getScoreColor,
  API_URL,
} from "../types";
import { SegmentBadge } from "./SegmentBadge";

interface ClipCardProps {
  clip: ClipSuggestion;
  index: number;
  videoId: string;
  renderJob?: RenderJob;
  onRender: (clip: ClipSuggestion) => void;
  onDownload: (clipId: string) => void;
}

export function ClipCard({
  clip,
  index,
  videoId,
  renderJob,
  onRender,
  onDownload,
}: ClipCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const isRendering = renderJob?.status === "rendering" || renderJob?.status === "queued";
  const isComplete = renderJob?.status === "completed" && renderJob?.ready_for_download;
  const isFailed = renderJob?.status === "failed";

  // Calculate YouTube preview URL with timestamp
  const previewUrl = `https://www.youtube.com/embed/${videoId}?start=${Math.floor(
    clip.hook.start_time
  )}&autoplay=1`;

  return (
    <div className="bg-gradient-to-br from-black/40 to-black/20 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all group">
      {/* Render Progress Bar at Top */}
      {isRendering && (
        <div className="h-1 bg-black/50 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-300 ease-out relative"
            style={{ width: `${renderJob?.progress || 0}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Info */}
          <div className="flex-1 min-w-0">
            {/* Top Row: Index, Score, Duration */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-gray-400 font-medium">
                {index + 1}
              </span>
              <div
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                  clip.viral_score >= 80
                    ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30"
                    : clip.viral_score >= 60
                    ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border border-yellow-500/30"
                    : "bg-white/5 text-gray-400 border border-white/10"
                }`}
              >
                <Zap className="w-3 h-3" />
                {clip.viral_score}%
              </div>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(clip.total_duration)}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-white font-medium text-base leading-snug">
              {clip.title}
            </h3>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Quick Preview Button */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`p-2.5 rounded-lg transition-all ${
                showPreview
                  ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                  : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-transparent"
              }`}
              title={showPreview ? "Hide Preview" : "Quick Preview"}
            >
              {showPreview ? <X className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Render/Download Button */}
            {isComplete ? (
              <button
                onClick={() => onDownload(clip.clip_id)}
                className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg text-sm font-medium text-white flex items-center gap-2 transition-all shadow-lg shadow-green-500/20"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            ) : isRendering ? (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-pink-500/20 rounded-lg min-w-[110px] border border-pink-500/30">
                <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />
                <span className="text-pink-300 text-sm font-medium">
                  {renderJob?.progress || 0}%
                </span>
              </div>
            ) : isFailed ? (
              <button
                onClick={() => onRender(clip)}
                className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm font-medium text-red-300 flex items-center gap-2 transition-colors border border-red-500/30"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            ) : (
              <button
                onClick={() => onRender(clip)}
                className="px-4 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 rounded-lg text-sm font-medium text-white flex items-center gap-2 transition-all shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 hover:scale-[1.02]"
              >
                <Play className="w-4 h-4" />
                Render
              </button>
            )}
          </div>
        </div>

        {/* Quick YouTube Preview */}
        {showPreview && (
          <div className="mt-4 bg-black rounded-lg overflow-hidden">
            <iframe
              src={previewUrl}
              className="w-full aspect-video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <p className="text-xs text-gray-500 p-2 text-center">
              Preview starts at {formatDuration(clip.hook.start_time)} (hook
              timestamp)
            </p>
          </div>
        )}

        {/* Mini Timeline */}
        <MiniTimeline clip={clip} />

        {/* Segments - Collapsed by default, show hook only */}
        <div className="mt-4 space-y-2">
          <SegmentBadge type="hook" segment={clip.hook} showTimestamp />

          {expanded ? (
            <>
              {clip.body_segments.map((seg, i) => (
                <SegmentBadge
                  key={i}
                  type="body"
                  segment={seg}
                  showTimestamp
                />
              ))}
              {clip.loop_ending && (
                <SegmentBadge
                  type="loop"
                  segment={clip.loop_ending}
                  showTimestamp
                />
              )}
            </>
          ) : (
            clip.body_segments.length > 0 && (
              <p className="text-gray-500 text-xs pl-2">
                +{clip.body_segments.length} body segment
                {clip.body_segments.length > 1 ? "s" : ""}
                {clip.loop_ending ? " + loop ending" : ""}
              </p>
            )
          )}
        </div>

        {/* Expand/Collapse Button */}
        {(clip.body_segments.length > 0 || clip.loop_ending) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show all segments
              </>
            )}
          </button>
        )}

        {/* Why Viral */}
        <p className="text-gray-500 text-xs mt-4 pt-3 border-t border-white/5">
          💡 {clip.why_viral}
        </p>

        {/* Render Status Message */}
        {renderJob?.message && (isRendering || isFailed) && (
          <p
            className={`text-xs mt-2 ${
              isFailed ? "text-red-400" : "text-pink-300"
            }`}
          >
            {renderJob.message}
          </p>
        )}
      </div>

      {/* Video Preview (after render complete) */}
      {isComplete && renderJob?.job_id && (
        <div className="border-t border-white/10 p-4 bg-gradient-to-b from-green-500/5 to-transparent">
          <div className="flex items-center gap-2 mb-3">
            <Play className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400 font-medium">
              Rendered Preview
            </span>
          </div>
          <div
            className="bg-black rounded-lg overflow-hidden mx-auto"
            style={{ maxWidth: "280px" }}
          >
            <video
              controls
              className="w-full"
              style={{ aspectRatio: "9/16", maxHeight: "400px" }}
              src={`${API_URL}/api/clips/${renderJob.job_id}/preview`}
            >
              Your browser does not support video playback.
            </video>
          </div>
        </div>
      )}
    </div>
  );
}

// Mini timeline showing segment positions
function MiniTimeline({ clip }: { clip: ClipSuggestion }) {
  const totalDuration = clip.total_duration;

  const getPosition = (time: number) => (time / totalDuration) * 100;
  const getWidth = (start: number, end: number) =>
    ((end - start) / totalDuration) * 100;

  return (
    <div className="mt-4 mb-2">
      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
        {/* Hook segment */}
        <div
          className="absolute h-full bg-purple-500/60 rounded-l-full"
          style={{
            left: `${getPosition(clip.hook.start_time)}%`,
            width: `${getWidth(clip.hook.start_time, clip.hook.end_time)}%`,
          }}
        />

        {/* Body segments */}
        {clip.body_segments.map((seg, i) => (
          <div
            key={i}
            className="absolute h-full bg-blue-500/60"
            style={{
              left: `${getPosition(seg.start_time)}%`,
              width: `${getWidth(seg.start_time, seg.end_time)}%`,
            }}
          />
        ))}

        {/* Loop ending */}
        {clip.loop_ending && (
          <div
            className="absolute h-full bg-orange-500/60 rounded-r-full"
            style={{
              left: `${getPosition(clip.loop_ending.start_time)}%`,
              width: `${getWidth(
                clip.loop_ending.start_time,
                clip.loop_ending.end_time
              )}%`,
            }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          Hook
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          Body
        </span>
        {clip.loop_ending && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            Loop
          </span>
        )}
        <span className="ml-auto">{formatDuration(totalDuration)}</span>
      </div>
    </div>
  );
}
