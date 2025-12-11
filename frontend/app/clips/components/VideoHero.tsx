"use client";

import { Eye, ThumbsUp, Clock, Loader2, Wand2, Sparkles } from "lucide-react";
import { VideoItem, formatNumber, formatISODuration, GenerationProgress as ProgressState } from "../types";

// Inline progress bar for the hero section
function ProgressBar({ progress }: { progress: ProgressState }) {
  const progressPercent = (progress.currentStep / progress.totalSteps) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300 flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />
          {progress.statusMessage || "Analyzing..."}
        </span>
        <span className="text-pink-400 font-medium">
          {Math.round(progressPercent)}%
        </span>
      </div>
      <div className="relative w-full bg-black/40 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500 ease-out rounded-full relative"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

interface VideoHeroProps {
  video: VideoItem | null;
  generating: boolean;
  progress: ProgressState | null;
  onGenerateClips: () => void;
}

export function VideoHero({
  video,
  generating,
  progress,
  onGenerateClips,
}: VideoHeroProps) {
  // Empty state - no video selected
  if (!video) {
    return (
      <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[280px]">
        <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-pink-400" />
        </div>
        <h3 className="text-white text-lg font-semibold mb-2">Select a Video</h3>
        <p className="text-gray-500 text-sm text-center max-w-xs">
          Choose a video from the list to generate AI-powered viral clips
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#0a0a0a] via-[#111] to-pink-950/20 border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex gap-6 p-5">
        {/* Large Thumbnail */}
        <div className="relative flex-shrink-0 w-72">
          <img
            src={video.thumbnail_url}
            alt=""
            className="w-full aspect-video object-cover rounded-xl shadow-2xl"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-xl" />
          {video.duration && (
            <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded-md text-xs text-white font-medium">
              {formatISODuration(video.duration)}
            </span>
          )}
        </div>

        {/* Video Info + Generate Button */}
        <div className="flex-1 flex flex-col justify-between py-1">
          {/* Title */}
          <div>
            <h2 className="text-white text-lg font-semibold line-clamp-2 leading-snug mb-3">
              {video.title}
            </h2>

            {/* Stats Row */}
            <div className="flex items-center gap-5 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {formatNumber(video.view_count)} views
              </span>
              <span className="flex items-center gap-1.5">
                <ThumbsUp className="w-4 h-4" />
                {formatNumber(video.like_count)} likes
              </span>
              {video.duration && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {formatISODuration(video.duration)}
                </span>
              )}
            </div>
          </div>

          {/* Generate Button or Progress */}
          <div className="mt-4">
            {generating && progress ? (
              <ProgressBar progress={progress} />
            ) : (
              <button
                onClick={onGenerateClips}
                disabled={generating}
                className="px-8 py-3.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-70 disabled:cursor-not-allowed rounded-xl font-semibold text-white flex items-center gap-2.5 transition-all shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Viral Clips
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
