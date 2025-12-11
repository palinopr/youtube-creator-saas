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
  AlertCircle,
} from "lucide-react";

// Types and utilities
import { VideoItem, API_URL } from "./types";

// Components
import {
  VideoSelector,
  VideoHero,
  ClipCard,
  GenerationProgress,
} from "./components";

// Hooks
import { useClipGeneration, useRenderQueue } from "./hooks";

export default function ClipsPage() {
  // Video list state
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  // Clip generation hook
  const {
    clips,
    generating,
    progress,
    error: generationError,
    generateClips,
    clearClips,
    clearError,
  } = useClipGeneration();

  // Render queue hook
  const { renderJobs, renderClip, downloadClip, clearJobs } = useRenderQueue();

  // Load videos on mount
  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/youtube/videos?max_results=50`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error("Error loading videos:", error);
    }
    setLoading(false);
  };

  const handleSelectVideo = (video: VideoItem) => {
    setSelectedVideo(video);
    clearClips();
    clearJobs();
    clearError();
  };

  const handleGenerateClips = () => {
    if (selectedVideo) {
      generateClips(selectedVideo.video_id);
    }
  };

  const handleRenderClip = (clip: Parameters<typeof renderClip>[0]) => {
    if (selectedVideo) {
      renderClip(clip, selectedVideo.video_id);
    }
  };

  const handleLogout = async () => {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} />

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20">
                <Scissors className="w-6 h-6 text-white" />
              </div>
              AI Clip Generator
            </h1>
            <p className="text-gray-400 mt-2">
              Generate viral YouTube Shorts using the Franken-bite method
            </p>
          </header>

          {/* Main Grid - Left: Video List | Right: Hero + Clips */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
            {/* Left Column: Video List Only */}
            <div className="lg:col-span-3 h-full">
              <VideoSelector
                videos={videos}
                loading={loading}
                selectedVideo={selectedVideo}
                onSelectVideo={handleSelectVideo}
              />
            </div>

            {/* Right Column: Selected Video Hero + Clips */}
            <div className="lg:col-span-9 flex flex-col gap-6 h-full overflow-hidden">
              {/* Video Hero - Fixed at top */}
              <div className="flex-shrink-0">
                <VideoHero
                  video={selectedVideo}
                  generating={generating}
                  progress={progress}
                  onGenerateClips={handleGenerateClips}
                />
              </div>

              {/* Clips Section - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-semibold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-pink-400" />
                      Clip Suggestions
                    </h2>
                    {clips.length > 0 && (
                      <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
                        {clips.length} clips found
                      </span>
                    )}
                  </div>

                  {/* Generation Progress */}
                  {generating && <GenerationProgress progress={progress} />}

                  {/* Error Message */}
                  {generationError && !generating && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <p className="text-red-300 text-sm">{generationError}</p>
                    </div>
                  )}

                  {/* Empty State - Only show if video selected but no clips */}
                  {!generating && !generationError && clips.length === 0 && selectedVideo && (
                    <EmptyState hasSelectedVideo={true} />
                  )}

                  {/* Placeholder when no video selected */}
                  {!selectedVideo && (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-sm">
                        Select a video to see clip suggestions here
                      </p>
                    </div>
                  )}

                  {/* Clip Cards */}
                  {clips.length > 0 && (
                    <div className="space-y-4">
                      {clips.map((clip, index) => (
                        <ClipCard
                          key={clip.clip_id}
                          clip={clip}
                          index={index}
                          videoId={selectedVideo?.video_id || ""}
                          renderJob={renderJobs[clip.clip_id]}
                          onRender={handleRenderClip}
                          onDownload={downloadClip}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Info Box */}
                <InfoBox />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Sidebar component
function Sidebar({ onLogout }: { onLogout: () => void }) {
  return (
    <aside className="w-64 bg-[#111] border-r border-white/10 flex-shrink-0 hidden lg:flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
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

        <NavItem icon={<Scissors />} label="Clips" href="/clips" active color="pink" />
        <NavItem icon={<Zap />} label="Content Ideas" href="/optimize" color="purple" />

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
          onClick={onLogout}
          className="flex items-center gap-3 w-full p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}

// Navigation item
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
  };

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${colorClasses[color]}`}
    >
      <span className="w-5 h-5 flex-shrink-0">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

// Empty state
function EmptyState({ hasSelectedVideo }: { hasSelectedVideo: boolean }) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Scissors className="w-10 h-10 text-gray-600" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">
        {hasSelectedVideo ? "Ready to generate clips" : "Select a video to start"}
      </h3>
      <p className="text-gray-500 text-sm max-w-sm mx-auto">
        {hasSelectedVideo
          ? "Click 'Generate Clips' to find viral short opportunities using AI"
          : "Choose a video from your channel to create viral shorts"}
      </p>
    </div>
  );
}

// Info box about Franken-bite method
function InfoBox() {
  return (
    <div className="mt-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
      <h3 className="text-white font-medium text-sm mb-2">
        🎯 Franken-bite Method
      </h3>
      <p className="text-gray-400 text-xs leading-relaxed">
        The AI analyzes your video transcript to find the best{" "}
        <span className="text-purple-300 font-medium">HOOK</span> (attention grabber) +{" "}
        <span className="text-blue-300 font-medium">BODY</span> (compressed content) +{" "}
        <span className="text-orange-300 font-medium">LOOP</span> (ending that flows
        back). This creates shorts with 25-35s optimal duration and maximum retention.
      </p>
    </div>
  );
}
