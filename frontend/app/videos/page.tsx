"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Eye, 
  ThumbsUp, 
  MessageSquare,
  Calendar,
  Search,
  Youtube,
  Home,
  Video,
  Zap,
  BarChart3,
  TrendingUp,
  Sparkles,
  LogOut,
  ChevronRight,
  Play,
  ArrowUpDown,
  Loader2,
  Scissors,
} from "lucide-react";

const API_URL = "http://localhost:8000";

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

  useEffect(() => {
    loadVideos();
  }, []);

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

  const handleLogout = async () => {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/";
  };

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
          <NavItem icon={<Video />} label="Videos" href="/videos" active />
          
          <div className="pt-4 pb-2">
            <p className="text-xs text-gray-600 uppercase tracking-wider px-3">Tools</p>
          </div>
          
          <NavItem icon={<Scissors />} label="Clips" href="/clips" color="pink" />
          <NavItem icon={<Zap />} label="Content Ideas" href="/optimize" color="purple" />
          
          <div className="pt-4 pb-2">
            <p className="text-xs text-gray-600 uppercase tracking-wider px-3">Analytics</p>
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

function NavItem({ 
  icon, 
  label, 
  href, 
  active = false, 
  color = "default"
}: { 
  icon: React.ReactNode; 
  label: string; 
  href: string;
  active?: boolean;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    default: active ? "text-white bg-white/10" : "text-gray-400 hover:text-white hover:bg-white/5",
    purple: "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10",
    pink: "text-pink-400 hover:text-pink-300 hover:bg-pink-500/10",
    emerald: "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10",
    blue: "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10",
    indigo: "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10",
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

