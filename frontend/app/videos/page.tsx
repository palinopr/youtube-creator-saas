"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Eye,
  ThumbsUp,
  MessageSquare,
  Calendar,
  Search,
  Video,
  ChevronRight,
  Play,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { formatNumber, formatDate } from "@/lib/utils";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/providers/ErrorProvider";

interface VideoItem {
  video_id: string;
  title: string;
  thumbnail_url: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at: string;
  tags?: string[];
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "views" | "likes">("date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const { isAuthenticated, isLoading: authLoading } = useAuth({ requireAuth: true });
  const { showError } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      loadVideos();
    }
  }, [isAuthenticated]);

  const loadVideos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/videos/recent?limit=100`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setVideos(Array.isArray(data) ? data : data.videos || []);
      } else {
        showError("Failed to load videos");
      }
    } catch (error) {
      showError("Failed to load videos. Please try again.");
    }
    setLoading(false);
  };

  // Filter and sort videos
  const filteredVideos = videos
    .filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      } else if (sortBy === "views") {
        comparison = b.view_count - a.view_count;
      } else if (sortBy === "likes") {
        comparison = b.like_count - a.like_count;
      }
      return sortOrder === "desc" ? comparison : -comparison;
    });

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar activePath="/videos" />

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Video className="w-7 h-7 text-red-400" />
                Your Videos
              </h1>
              <p className="text-gray-500 mt-1">{videos.length} videos total</p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full pl-12 pr-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="date">Date</option>
                <option value="views">Views</option>
                <option value="likes">Likes</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                className="px-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
              >
                <ArrowUpDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Videos Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
            </div>
          ) : filteredVideos.length > 0 ? (
            <div className="space-y-3">
              {filteredVideos.map((video) => (
                <Link 
                  key={video.video_id}
                  href={`/video/${video.video_id}`}
                  className="flex gap-4 p-4 bg-[#111] border border-white/10 rounded-xl hover:border-white/20 hover:bg-white/5 transition-all group"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-48 h-[108px] object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Play className="w-10 h-10 text-white" fill="white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 py-1">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-5 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4" />
                        {formatNumber(video.view_count)} views
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ThumbsUp className="w-4 h-4" />
                        {formatNumber(video.like_count)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" />
                        {formatNumber(video.comment_count)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
                      <Calendar className="w-3 h-3" />
                      {formatDate(video.published_at)}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No videos found</h3>
              <p className="text-gray-500">
                {searchQuery ? "Try a different search term" : "Upload some videos to get started"}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
