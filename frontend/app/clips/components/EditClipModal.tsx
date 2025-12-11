"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Play, Pause, ChevronLeft, ChevronRight, SkipBack, SkipForward } from "lucide-react";
import { ClipSuggestion, formatDuration } from "../types";

// YouTube IFrame API types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
  getPlayerState: () => number;
}

type AspectRatio = "9:16" | "1:1";

interface EditClipModalProps {
  clip: ClipSuggestion;
  videoId: string;
  originalStart: number;
  originalEnd: number;
  onClose: () => void;
  onRender: (startTime: number, endTime: number, aspectRatio: AspectRatio) => void;
}

export function EditClipModal({
  clip,
  videoId,
  originalStart,
  originalEnd,
  onClose,
  onRender,
}: EditClipModalProps) {
  // ±20 seconds from original clip
  const EXTEND_RANGE = 20;

  const [startTime, setStartTime] = useState(originalStart);
  const [endTime, setEndTime] = useState(originalEnd);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(originalStart);
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef<YTPlayer | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"start" | "end" | "playhead" | null>(null);
  const timeUpdateRef = useRef<number | null>(null);

  // Calculate bounds
  const minStart = Math.max(0, originalStart - EXTEND_RANGE);
  const maxEnd = originalEnd + EXTEND_RANGE;
  const minDuration = 3; // Minimum 3 seconds

  const duration = endTime - startTime;
  const hasChanges = startTime !== originalStart || endTime !== originalEnd;
  const totalRange = maxEnd - minStart;

  // Load YouTube IFrame API
  useEffect(() => {
    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        initPlayer();
        return;
      }

      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initPlayer;
    };

    const initPlayer = () => {
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player("yt-player", {
        videoId: videoId,
        playerVars: {
          start: Math.floor(originalStart),
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 0,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            setPlayerReady(true);
            event.target.seekTo(originalStart, true);
          },
          onStateChange: (event) => {
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
          },
        },
      });
    };

    loadYouTubeAPI();

    return () => {
      if (timeUpdateRef.current) {
        cancelAnimationFrame(timeUpdateRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, originalStart]);

  // Update current time while playing
  useEffect(() => {
    const updateTime = () => {
      if (playerRef.current && playerReady) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);

        // Loop within selected range
        if (time >= endTime) {
          playerRef.current.seekTo(startTime, true);
        }
      }
      if (isPlaying) {
        timeUpdateRef.current = requestAnimationFrame(updateTime);
      }
    };

    if (isPlaying) {
      timeUpdateRef.current = requestAnimationFrame(updateTime);
    }

    return () => {
      if (timeUpdateRef.current) {
        cancelAnimationFrame(timeUpdateRef.current);
      }
    };
  }, [isPlaying, startTime, endTime, playerReady]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        seekRelative(-1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        seekRelative(1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const togglePlay = () => {
    if (!playerRef.current || !playerReady) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const seekTo = useCallback((time: number) => {
    if (!playerRef.current || !playerReady) return;
    const clampedTime = Math.max(minStart, Math.min(maxEnd, time));
    playerRef.current.seekTo(clampedTime, true);
    setCurrentTime(clampedTime);
  }, [playerReady, minStart, maxEnd]);

  const seekRelative = (delta: number) => {
    seekTo(currentTime + delta);
  };

  // Timeline calculations
  const startPercent = ((startTime - minStart) / totalRange) * 100;
  const endPercent = ((endTime - minStart) / totalRange) * 100;
  const currentPercent = ((currentTime - minStart) / totalRange) * 100;
  const originalStartPercent = ((originalStart - minStart) / totalRange) * 100;
  const originalEndPercent = ((originalEnd - minStart) / totalRange) * 100;

  const handleMouseDown = (handle: "start" | "end" | "playhead") => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(handle);

    // Pause while dragging
    if (playerRef.current && isPlaying) {
      playerRef.current.pauseVideo();
    }
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    if (dragging || !trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const time = minStart + (percent / 100) * totalRange;
    seekTo(time);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging || !trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const time = minStart + (percent / 100) * totalRange;

      if (dragging === "start") {
        const newStart = Math.max(minStart, Math.min(endTime - minDuration, time));
        const roundedStart = Math.round(newStart * 10) / 10;
        setStartTime(roundedStart);
        seekTo(roundedStart);
      } else if (dragging === "end") {
        const newEnd = Math.max(startTime + minDuration, Math.min(maxEnd, time));
        const roundedEnd = Math.round(newEnd * 10) / 10;
        setEndTime(roundedEnd);
        seekTo(roundedEnd);
      } else if (dragging === "playhead") {
        seekTo(time);
      }
    },
    [dragging, minStart, maxEnd, totalRange, startTime, endTime, minDuration, seekTo]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Update start/end time and seek video
  const handleStartTimeChange = (newStart: number) => {
    setStartTime(newStart);
    seekTo(newStart);
  };

  const handleEndTimeChange = (newEnd: number) => {
    setEndTime(newEnd);
    seekTo(newEnd);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">Edit Clip</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Drag handles to adjust · Click timeline to seek · Space to play/pause
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Side by side layout */}
        <div className="p-5 flex gap-6">
          {/* Left: Video Player */}
          <div className="flex-shrink-0">
            <div className="bg-black rounded-xl overflow-hidden" style={{ width: "280px" }}>
              <div className="relative" style={{ aspectRatio: "9/16" }}>
                <div id="yt-player" className="absolute inset-0 w-full h-full" />

                {/* Loading overlay */}
                {!playerReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* Play/Pause overlay */}
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    {isPlaying ? (
                      <Pause className="w-7 h-7 text-white" />
                    ) : (
                      <Play className="w-7 h-7 text-white ml-1" />
                    )}
                  </div>
                </button>
              </div>

              {/* Video controls */}
              <div className="p-3 bg-black/50 flex items-center justify-center gap-3">
                <button
                  onClick={() => seekRelative(-5)}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="-5 seconds"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button
                  onClick={() => seekRelative(5)}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="+5 seconds"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Current time display */}
            <div className="mt-3 text-center">
              <span className="text-2xl font-mono text-white">{formatDuration(currentTime)}</span>
              <span className="text-gray-500 text-sm ml-2">/ {formatDuration(maxEnd)}</span>
            </div>
          </div>

          {/* Right: Timeline & Controls */}
          <div className="flex-1 space-y-5">
            {/* Timeline */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Timeline Range: {formatDuration(minStart)} - {formatDuration(maxEnd)}</span>
                <span className={hasChanges ? "text-yellow-400" : ""}>
                  {hasChanges ? "Modified" : "Original timing"}
                </span>
              </div>

              <div
                ref={trackRef}
                onClick={handleTrackClick}
                className="relative h-16 bg-white/5 rounded-lg overflow-hidden cursor-crosshair"
              >
                {/* Original clip indicator (faded) */}
                <div
                  className="absolute top-0 bottom-0 bg-pink-500/10 border-l border-r border-pink-500/20"
                  style={{
                    left: `${originalStartPercent}%`,
                    width: `${originalEndPercent - originalStartPercent}%`,
                  }}
                />

                {/* Selected range */}
                <div
                  className="absolute top-0 bottom-0 bg-gradient-to-r from-pink-500/30 to-rose-500/30"
                  style={{
                    left: `${startPercent}%`,
                    width: `${endPercent - startPercent}%`,
                  }}
                />

                {/* Start Handle */}
                <div
                  className={`absolute top-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center transition-all z-10 ${
                    dragging === "start"
                      ? "bg-pink-500 w-4"
                      : "bg-pink-500/80 hover:bg-pink-500 hover:w-4"
                  }`}
                  style={{ left: `calc(${startPercent}% - 6px)` }}
                  onMouseDown={handleMouseDown("start")}
                >
                  <div className="w-0.5 h-8 bg-white/60 rounded-full" />
                </div>

                {/* End Handle */}
                <div
                  className={`absolute top-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center transition-all z-10 ${
                    dragging === "end"
                      ? "bg-rose-500 w-4"
                      : "bg-rose-500/80 hover:bg-rose-500 hover:w-4"
                  }`}
                  style={{ left: `calc(${endPercent}% - 6px)` }}
                  onMouseDown={handleMouseDown("end")}
                >
                  <div className="w-0.5 h-8 bg-white/60 rounded-full" />
                </div>

                {/* Playhead */}
                <div
                  className={`absolute top-0 bottom-0 w-1 cursor-ew-resize z-20 ${
                    dragging === "playhead" ? "bg-white" : "bg-white/80"
                  }`}
                  style={{ left: `calc(${currentPercent}% - 2px)` }}
                  onMouseDown={handleMouseDown("playhead")}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
                </div>

                {/* Time labels on track */}
                <div className="absolute bottom-1 left-2 text-[10px] text-gray-500 font-mono">
                  {formatDuration(minStart)}
                </div>
                <div className="absolute bottom-1 right-2 text-[10px] text-gray-500 font-mono">
                  {formatDuration(maxEnd)}
                </div>
              </div>

              {/* Current selection indicator */}
              <div className="flex justify-between text-xs text-gray-400">
                <span>
                  Start: <span className="text-pink-400 font-mono">{formatDuration(startTime)}</span>
                </span>
                <span>
                  Duration: <span className="text-white font-mono font-medium">{formatDuration(duration)}</span>
                </span>
                <span>
                  End: <span className="text-rose-400 font-mono">{formatDuration(endTime)}</span>
                </span>
              </div>
            </div>

            {/* Time Controls */}
            <div className="grid grid-cols-2 gap-4">
              <TimeControl
                label="Start Time"
                value={startTime}
                min={minStart}
                max={endTime - minDuration}
                onChange={handleStartTimeChange}
                originalValue={originalStart}
                color="pink"
              />
              <TimeControl
                label="End Time"
                value={endTime}
                min={startTime + minDuration}
                max={maxEnd}
                onChange={handleEndTimeChange}
                originalValue={originalEnd}
                color="rose"
              />
            </div>

            {/* Info */}
            {hasChanges && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-xs text-yellow-400">
                  Changed from original: {formatDuration(originalEnd - originalStart)} → {formatDuration(duration)}
                </p>
              </div>
            )}

            {/* Aspect Ratio Selector */}
            <div className="space-y-2">
              <label className="text-xs text-gray-500 uppercase tracking-wide">Aspect Ratio</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAspectRatio("9:16")}
                  className={`flex-1 py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-3 ${
                    aspectRatio === "9:16"
                      ? "bg-pink-500/20 border-pink-500/50 text-pink-300"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="w-4 h-7 border-2 border-current rounded-sm" />
                  <span className="font-medium">9:16</span>
                  <span className="text-xs opacity-60">TikTok/Reels</span>
                </button>
                <button
                  onClick={() => setAspectRatio("1:1")}
                  className={`flex-1 py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-3 ${
                    aspectRatio === "1:1"
                      ? "bg-pink-500/20 border-pink-500/50 text-pink-300"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="w-5 h-5 border-2 border-current rounded-sm" />
                  <span className="font-medium">1:1</span>
                  <span className="text-xs opacity-60">Instagram</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onRender(startTime, endTime, aspectRatio)}
                className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-pink-500/20"
              >
                <Play className="w-5 h-5" />
                Re-render Clip ({aspectRatio})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Time control with +/- buttons
function TimeControl({
  label,
  value,
  min,
  max,
  onChange,
  originalValue,
  color,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  originalValue: number;
  color: "pink" | "rose";
}) {
  const step = 0.5;
  const isModified = Math.abs(value - originalValue) > 0.01;
  const colorClass = color === "pink" ? "text-pink-400" : "text-rose-400";

  const handleIncrement = () => {
    onChange(Math.min(max, Math.round((value + step) * 10) / 10));
  };

  const handleDecrement = () => {
    onChange(Math.max(min, Math.round((value - step) * 10) / 10));
  };

  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-2">
        {label}
        {isModified && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}
      </label>
      <div className="flex items-center gap-1">
        <button
          onClick={handleDecrement}
          disabled={value <= min}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-center">
          <span className={`font-mono ${colorClass}`}>{formatDuration(value)}</span>
        </div>
        <button
          onClick={handleIncrement}
          disabled={value >= max}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
