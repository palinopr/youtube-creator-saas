"use client";

import { useState, useEffect } from "react";
import {
  Scissors,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

// Types and utilities
import { VideoItem } from "./types";

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
  // Auth state - wait for authentication before loading videos
  const { isAuthenticated } = useAuth({ requireAuth: true });

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

  // Load videos when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadVideos();
    }
  }, [isAuthenticated]);

  const loadVideos = async () => {
    try {
      const data = await api.listYouTubeVideos(50);
      setVideos(data.videos || []);
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

  const handleRenderClip = (clip: Parameters<typeof renderClip>[0], startTime?: number, endTime?: number) => {
    if (selectedVideo) {
      renderClip(clip, selectedVideo.video_id, startTime, endTime);
    }
  };

  return (
    <DashboardLayout activePath="/clips">
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

              </div>
            </div>
          </div>
        </div>
    </DashboardLayout>
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
