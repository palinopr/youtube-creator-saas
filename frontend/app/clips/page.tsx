"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scissors,
  Youtube,
  Home,
  Video,
  Zap,
  BarChart3,
  TrendingUp,
  Sparkles,
  LogOut,
  Search,
  Play,
  Download,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Film,
  Wand2,
  RefreshCw,
  Eye,
  ThumbsUp,
} from "lucide-react";

const API_URL = "http://localhost:8000";

interface VideoItem {
  video_id: string;
  title: string;
  thumbnail_url: string;
  view_count: number;
  like_count: number;
  published_at: string;
}

interface ClipSegment {
  start_time: number;
  end_time: number;
  text: string;
  segment_type: string;
}

interface ClipSuggestion {
  clip_id: string;
  title: string;
  hook: ClipSegment;
  body_segments: ClipSegment[];
  loop_ending: ClipSegment | null;
  total_duration: number;
  viral_score: number;
  why_viral: string;
}

interface RenderJob {
  job_id: string;
  status: "queued" | "rendering" | "completed" | "failed";
  progress: number;
  message: string;
  ready_for_download: boolean;
}

export default function ClipsPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Selected video
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  // Clip generation
  const [generating, setGenerating] = useState(false);
  const [clips, setClips] = useState<ClipSuggestion[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Render jobs - keyed by clip_id
  const [renderJobs, setRenderJobs] = useState<Record<string, RenderJob>>({});
  // Map from job_id to clip_id for polling
  const [jobToClipMap, setJobToClipMap] = useState<Record<string, string>>({});
  const [pollingJobs, setPollingJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadVideos();
  }, []);

  // Poll for render job status
  useEffect(() => {
    if (pollingJobs.size === 0) return;

    const interval = setInterval(async () => {
      for (const jobId of pollingJobs) {
        try {
          const res = await fetch(`${API_URL}/api/clips/${jobId}/status`, {
            credentials: "include",
          });
          if (res.ok) {
            const job = await res.json();
            // Get the clip_id from our mapping
            const clipId = jobToClipMap[jobId];
            if (clipId) {
              setRenderJobs((prev) => ({ ...prev, [clipId]: job }));
            }

            // Stop polling if complete or failed
            if (job.status === "completed" || job.status === "failed") {
              setPollingJobs((prev) => {
                const next = new Set(prev);
                next.delete(jobId);
                return next;
              });
            }
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [pollingJobs, jobToClipMap]);

  const loadVideos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/videos/recent?limit=100`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setVideos(Array.isArray(data) ? data : data.videos || []);
      }
    } catch (error) {
      console.error("Error loading videos:", error);
    }
    setLoading(false);
  };

  const generateClips = async () => {
    if (!selectedVideo) return;
    console.log("[CLIPS] generateClips called for:", selectedVideo.video_id, selectedVideo.title);
    setGenerating(true);
    setGenerationError(null);
    setClips([]);

    try {
      // Check for cached transcript
      const cacheKey = `transcript_${selectedVideo.video_id}`;
      const cached = localStorage.getItem(cacheKey);
      let transcript: string | null = null;

      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          transcript = cachedData.text;
          console.log("[CLIPS] Using cached transcript, length:", transcript?.length);
        } catch (e) {
          localStorage.removeItem(cacheKey);
          console.log("[CLIPS] Cache parse error, removed");
        }
      } else {
        console.log("[CLIPS] No cached transcript");
      }

      console.log("[CLIPS] About to fetch from:", `${API_URL}/api/clips/generate`);
      
      // Use AbortController with 2 minute timeout (GPT-4o can be slow)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      
      try {
        const res = await fetch(`${API_URL}/api/clips/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: controller.signal,
          body: JSON.stringify({
            video_id: selectedVideo.video_id,
            transcript: transcript,
            max_clips: 5,
          }),
        });
        
        clearTimeout(timeoutId);
        console.log("[CLIPS] Response status:", res.status);

        if (res.ok) {
          const data = await res.json();
          console.log("[CLIPS] Got clips:", data.clips?.length);
          setClips(data.clips || []);

          if (data.clips?.length === 0) {
            setGenerationError("No viral clip opportunities found in this video.");
          }
        } else {
          const error = await res.json();
          console.error("[CLIPS] API error:", error);
          setGenerationError(error.detail || "Failed to generate clips");
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error("[CLIPS] Request timed out");
          setGenerationError("Request timed out - the AI is taking too long. Please try again.");
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error("[CLIPS] Network error:", error);
      setGenerationError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setGenerating(false);
  };

  const renderClip = async (clip: ClipSuggestion) => {
    if (!selectedVideo) return;

    try {
      // Build segments from the clip
      // For now, we'll create a simple segment based on estimated timing
      // In a full implementation, we'd need to map the text to actual timestamps
      const segments = [
        { start: 0, end: clip.total_duration }
      ];

      const res = await fetch(`${API_URL}/api/clips/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          video_id: selectedVideo.video_id,
          clip_id: clip.clip_id,
          segments: segments,
          title: clip.title,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const jobId = data.job_id;

        // Map job_id to clip_id for polling updates
        setJobToClipMap((prev) => ({ ...prev, [jobId]: clip.clip_id }));

        // Add to render jobs and start polling
        setRenderJobs((prev) => ({
          ...prev,
          [clip.clip_id]: {
            job_id: jobId,
            status: "queued",
            progress: 0,
            message: "Starting render...",
            ready_for_download: false,
          },
        }));

        setPollingJobs((prev) => new Set(prev).add(jobId));
      }
    } catch (error) {
      console.error("Render error:", error);
    }
  };

  const downloadClip = async (clipId: string) => {
    const job = renderJobs[clipId];
    if (!job || !job.ready_for_download) return;

    window.open(`${API_URL}/api/clips/${job.job_id}/download`, "_blank");
  };

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "bg-green-500/30 text-green-400 border-green-500/50";
    if (score >= 70) return "bg-yellow-500/30 text-yellow-400 border-yellow-500/50";
    return "bg-orange-500/30 text-orange-400 border-orange-500/50";
  };

  const handleLogout = async () => {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/";
  };

  // Filter videos
  const filteredVideos = videos.filter((v) =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#111] border-r border-white/10 flex-shrink-0 hidden lg:flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Youtube className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white">CreatorSaaS</h1>
              <p className="text-xs text-gray-500">YouTube Analytics</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <NavItem icon={<Home />} label="Dashboard" href="/" />
          <NavItem icon={<Video />} label="Videos" href="/videos" />

          <div className="pt-4 pb-2">
            <p className="text-xs text-gray-600 uppercase tracking-wider px-3">
              Tools
            </p>
          </div>

          <NavItem
            icon={<Scissors />}
            label="Clips"
            href="/clips"
            active
            color="pink"
          />
          <NavItem
            icon={<Zap />}
            label="Content Ideas"
            href="/optimize"
            color="purple"
          />

          <div className="pt-4 pb-2">
            <p className="text-xs text-gray-600 uppercase tracking-wider px-3">
              Analytics
            </p>
          </div>

          <NavItem icon={<BarChart3 />} label="Channel Analysis" href="/analysis" />
          <NavItem icon={<TrendingUp />} label="Deep Analysis" href="/deep-analysis" />
          <NavItem icon={<Sparkles />} label="AI Insights" href="/advanced-insights" />
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                <Scissors className="w-6 h-6 text-white" />
              </div>
              AI Clip Generator
            </h1>
            <p className="text-gray-400 mt-2">
              Generate viral YouTube Shorts using the Franken-bite method
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Selector */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-[#111] border border-white/10 rounded-xl p-4">
                <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Film className="w-5 h-5 text-pink-400" />
                  Select Video
                </h2>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search videos..."
                    className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-pink-500"
                  />
                </div>

                {/* Video List */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                    </div>
                  ) : filteredVideos.length > 0 ? (
                    filteredVideos.slice(0, 20).map((video) => (
                      <button
                        key={video.video_id}
                        onClick={() => {
                          setSelectedVideo(video);
                          setClips([]);
                          setGenerationError(null);
                        }}
                        className={`w-full text-left p-2 rounded-lg transition-all flex gap-3 ${
                          selectedVideo?.video_id === video.video_id
                            ? "bg-pink-500/20 border border-pink-500/50"
                            : "bg-black/30 border border-transparent hover:border-white/20"
                        }`}
                      >
                        <img
                          src={video.thumbnail_url}
                          alt=""
                          className="w-20 h-[45px] object-cover rounded flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium line-clamp-2">
                            {video.title}
                          </p>
                          <p className="text-gray-500 text-xs mt-1 flex items-center gap-2">
                            <Eye className="w-3 h-3" />
                            {formatNumber(video.view_count)}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-8">
                      No videos found
                    </p>
                  )}
                </div>
              </div>

              {/* Selected Video Info */}
              {selectedVideo && (
                <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/30 rounded-xl p-4">
                  <img
                    src={selectedVideo.thumbnail_url}
                    alt=""
                    className="w-full aspect-video object-cover rounded-lg mb-3"
                  />
                  <h3 className="text-white font-medium text-sm line-clamp-2 mb-2">
                    {selectedVideo.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatNumber(selectedVideo.view_count)} views
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      {formatNumber(selectedVideo.like_count)}
                    </span>
                  </div>

                  <button
                    onClick={generateClips}
                    disabled={generating}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-70 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        Generate Clips
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Clip Suggestions */}
            <div className="lg:col-span-2">
              <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-pink-400" />
                    Clip Suggestions
                  </h2>
                  {clips.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {clips.length} clips found
                    </span>
                  )}
                </div>

                {/* Progress indicator during generation */}
                {generating && (
                  <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-4">
                      <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
                      <div>
                        <p className="text-white font-medium">
                          Analyzing video for viral moments...
                        </p>
                        <p className="text-pink-300/70 text-sm mt-1">
                          Using Franken-bite method to find hooks + solutions
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {generationError && !generating && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-300 text-sm">{generationError}</p>
                  </div>
                )}

                {/* Empty state */}
                {!generating && !generationError && clips.length === 0 && (
                  <div className="text-center py-16">
                    <Scissors className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      {selectedVideo
                        ? "Ready to generate clips"
                        : "Select a video to start"}
                    </h3>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto">
                      {selectedVideo
                        ? "Click 'Generate Clips' to find viral short opportunities using AI"
                        : "Choose a video from your channel to create viral shorts"}
                    </p>
                  </div>
                )}

                {/* Clip cards */}
                {clips.length > 0 && (
                  <div className="space-y-4">
                    {clips.map((clip, index) => {
                      const job = renderJobs[clip.clip_id];
                      const isRendering = job?.status === "rendering" || job?.status === "queued";
                      const isComplete = job?.status === "completed" && job?.ready_for_download;
                      const isFailed = job?.status === "failed";

                      return (
                        <div
                          key={clip.clip_id}
                          className="bg-black/30 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-gray-500">
                                  #{index + 1}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-bold border ${getScoreColor(
                                    clip.viral_score
                                  )}`}
                                >
                                  {clip.viral_score}% viral
                                </span>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(clip.total_duration)}
                                </span>
                              </div>
                              <h3 className="text-white font-medium">
                                {clip.title}
                              </h3>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2">
                              {isComplete ? (
                                <>
                                  <button
                                    onClick={() => downloadClip(clip.clip_id)}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium text-white flex items-center gap-2"
                                  >
                                    <Download className="w-4 h-4" />
                                    Download
                                  </button>
                                </>
                              ) : isRendering ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-pink-500/20 rounded-lg">
                                  <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />
                                  <span className="text-pink-300 text-sm">
                                    {job?.progress || 0}%
                                  </span>
                                </div>
                              ) : isFailed ? (
                                <button
                                  onClick={() => renderClip(clip)}
                                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm font-medium text-red-300 flex items-center gap-2"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  Retry
                                </button>
                              ) : (
                                <button
                                  onClick={() => renderClip(clip)}
                                  className="px-4 py-2 bg-pink-600 hover:bg-pink-500 rounded-lg text-sm font-medium text-white flex items-center gap-2"
                                >
                                  <Play className="w-4 h-4" />
                                  Render
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Clip structure */}
                          <div className="space-y-2 mt-4">
                            {/* Hook */}
                            <div className="flex items-start gap-2">
                              <span className="px-2 py-0.5 bg-purple-500/30 text-purple-300 rounded text-xs font-medium flex-shrink-0">
                                HOOK
                              </span>
                              <p className="text-gray-300 text-sm">
                                "{clip.hook.text}"
                              </p>
                            </div>

                            {/* Body */}
                            {clip.body_segments.slice(0, 2).map((seg, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="px-2 py-0.5 bg-blue-500/30 text-blue-300 rounded text-xs font-medium flex-shrink-0">
                                  BODY
                                </span>
                                <p className="text-gray-400 text-sm line-clamp-1">
                                  "{seg.text}"
                                </p>
                              </div>
                            ))}

                            {/* Loop ending */}
                            {clip.loop_ending && (
                              <div className="flex items-start gap-2">
                                <span className="px-2 py-0.5 bg-orange-500/30 text-orange-300 rounded text-xs font-medium flex-shrink-0">
                                  LOOP
                                </span>
                                <p className="text-gray-300 text-sm">
                                  "{clip.loop_ending.text}"
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Why viral */}
                          <p className="text-gray-500 text-xs mt-3 pt-3 border-t border-white/5">
                            💡 {clip.why_viral}
                          </p>

                          {/* Render status message */}
                          {job?.message && (isRendering || isFailed) && (
                            <p
                              className={`text-xs mt-2 ${
                                isFailed ? "text-red-400" : "text-pink-300"
                              }`}
                            >
                              {job.message}
                            </p>
                          )}

                          {/* Video Preview */}
                          {isComplete && job?.job_id && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                              <div className="flex items-center gap-2 mb-2">
                                <Play className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-green-400 font-medium">Preview Ready</span>
                              </div>
                              <div className="bg-black rounded-lg overflow-hidden" style={{ maxWidth: "300px" }}>
                                <video
                                  controls
                                  className="w-full"
                                  style={{ aspectRatio: "9/16", maxHeight: "400px" }}
                                  src={`${API_URL}/api/clips/${job.job_id}/preview`}
                                >
                                  Your browser does not support video playback.
                                </video>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Info box */}
              <div className="mt-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
                <h3 className="text-white font-medium text-sm mb-2">
                  🎯 Franken-bite Method
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  The AI analyzes your video transcript to find the best{" "}
                  <span className="text-purple-300">HOOK</span> (attention
                  grabber) + <span className="text-blue-300">BODY</span>{" "}
                  (compressed content) +{" "}
                  <span className="text-orange-300">LOOP</span> (ending that
                  flows back). This creates shorts with 25-35s optimal duration
                  and maximum retention.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({
  icon,
  label,
  href,
  active = false,
  color = "default",
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    default: active
      ? "text-white bg-white/10"
      : "text-gray-400 hover:text-white hover:bg-white/5",
    purple: "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10",
    pink: active
      ? "text-pink-300 bg-pink-500/20"
      : "text-pink-400 hover:text-pink-300 hover:bg-pink-500/10",
    emerald: "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10",
    blue: "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10",
  };

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
        colorClasses[color]
      }`}
    >
      <span className="w-5 h-5 flex-shrink-0">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

