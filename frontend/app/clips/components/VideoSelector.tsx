"use client";

import { useState } from "react";
import {
  Film,
  Search,
  Eye,
  ThumbsUp,
  Loader2,
} from "lucide-react";
import { VideoItem, formatNumber, formatISODuration } from "../types";

interface VideoSelectorProps {
  videos: VideoItem[];
  loading: boolean;
  selectedVideo: VideoItem | null;
  onSelectVideo: (video: VideoItem) => void;
}

export function VideoSelector({
  videos,
  loading,
  selectedVideo,
  onSelectVideo,
}: VideoSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVideos = videos.filter((v) =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-4 h-full flex flex-col">
      <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
        <Film className="w-5 h-5 text-pink-400" />
        Your Videos
      </h2>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search videos..."
          className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
        />
      </div>

      {/* Video List - fills remaining space */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
          </div>
        ) : filteredVideos.length > 0 ? (
          filteredVideos.slice(0, 30).map((video) => (
            <VideoListItem
              key={video.video_id}
              video={video}
              isSelected={selectedVideo?.video_id === video.video_id}
              onSelect={() => onSelectVideo(video)}
            />
          ))
        ) : (
          <p className="text-gray-500 text-sm text-center py-8">
            No videos found
          </p>
        )}
      </div>
    </div>
  );
}

// Video list item component
function VideoListItem({
  video,
  isSelected,
  onSelect,
}: {
  video: VideoItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-2.5 rounded-lg transition-all flex gap-3 group ${
        isSelected
          ? "bg-pink-500/20 border border-pink-500/50 shadow-lg shadow-pink-500/10"
          : "bg-black/30 border border-transparent hover:border-white/20 hover:bg-black/50"
      }`}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0">
        <img
          src={video.thumbnail_url}
          alt=""
          className="w-24 h-[54px] object-cover rounded"
        />
        {video.duration && (
          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-[10px] text-white font-medium">
            {formatISODuration(video.duration)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-medium line-clamp-2 group-hover:text-pink-200 transition-colors">
          {video.title}
        </p>
        <div className="flex items-center gap-3 text-gray-500 text-xs mt-1.5">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {formatNumber(video.view_count)}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" />
            {formatNumber(video.like_count)}
          </span>
        </div>
      </div>
    </button>
  );
}

