// Clip UI Types
// Shared interfaces for all clips components

import { API_URL } from "@/lib/config";
export { API_URL };

export interface VideoItem {
  video_id: string;
  title: string;
  thumbnail_url: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at: string;
  duration: string;
  channel_id: string;
  channel_title: string;
}

export interface ClipSegment {
  start_time: number;
  end_time: number;
  text: string;
  segment_type: string;
}

export interface ClipSuggestion {
  clip_id: string;
  title: string;
  hook: ClipSegment;
  body_segments: ClipSegment[];
  loop_ending: ClipSegment | null;
  total_duration: number;
  viral_score: number;
  why_viral: string;
}

export interface RenderJob {
  job_id: string;
  status: "queued" | "rendering" | "completed" | "failed";
  progress: number;
  message: string;
  ready_for_download: boolean;
}

// Generation progress state
export interface GenerationProgress {
  currentStep: number;
  totalSteps: number;
  statusMessage: string;
}

// Helper functions
export const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

// Parse ISO 8601 duration (PT5M30S) to readable format (5:30)
export const formatISODuration = (isoDuration: string | undefined): string => {
  if (!isoDuration) return "";
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return isoDuration;

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const getScoreColor = (score: number): string => {
  if (score >= 85) return "bg-green-500/30 text-green-400 border-green-500/50";
  if (score >= 70) return "bg-yellow-500/30 text-yellow-400 border-yellow-500/50";
  return "bg-orange-500/30 text-orange-400 border-orange-500/50";
};
