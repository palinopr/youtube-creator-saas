"use client";

import { useState, useEffect } from "react";
import { 
  Play, 
  TrendingUp, 
  Users, 
  Eye, 
  MessageSquare,
  ThumbsUp,
  Youtube,
  Sparkles,
  ArrowRight,
  BarChart3,
  Zap,
  Home,
  Video,
  ChevronRight,
  Calendar,
  LogOut,
  Menu,
  X,
  Scissors,
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/status`, {
        credentials: "include",
      });
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = `${API_URL}/auth/login`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return <LandingPage onLogin={handleLogin} />;
}

function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-black to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-red-500/10 rounded-full blur-[120px]" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
          <nav className="flex items-center justify-between mb-20">
            <div className="flex items-center gap-2">
              <Youtube className="w-8 h-8 text-red-500" />
              <span className="text-xl font-bold">CreatorSaaS</span>
            </div>
            <button
              onClick={onLogin}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Sign In
            </button>
          </nav>

          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">AI-Powered Analytics</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Maximize Your <br />
              <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">YouTube Growth</span>
            </h1>

            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Get AI-powered insights, optimize your content, and grow your channel 
              with actionable analytics that actually make a difference.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onLogin}
                className="group px-8 py-4 bg-red-600 hover:bg-red-500 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
              >
                <Youtube className="w-5 h-5" />
                Connect YouTube
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-24">
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Real-Time Analytics"
              description="Track views, subscribers, and engagement metrics as they happen"
            />
            <FeatureCard
              icon={<Sparkles className="w-6 h-6" />}
              title="AI Insights"
              description="Ask questions about your channel and get intelligent answers"
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Growth Recommendations"
              description="Get actionable tips to improve your content performance"
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
      <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4 text-red-400">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

function Dashboard() {
  const [channelStats, setChannelStats] = useState<any>(null);
  const [recentVideos, setRecentVideos] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchChannelStats();
    fetchRecentVideos();
  }, []);

  const fetchChannelStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/channel/stats`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setChannelStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch channel stats:", error);
    }
  };

  const fetchRecentVideos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/videos/recent?limit=10`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setRecentVideos(data);
      }
    } catch (error) {
      console.error("Failed to fetch recent videos:", error);
    }
  };

  const handleLogout = async () => {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    window.location.reload();
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#111] border-r border-white/10 flex-shrink-0 hidden lg:flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Youtube className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-white">CreatorSaaS</h1>
                <p className="text-xs text-gray-500">YouTube Analytics</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <NavItem icon={<Home />} label="Dashboard" href="/" active={true} collapsed={!sidebarOpen} />
          <NavItem icon={<Video />} label="Videos" href="/videos" collapsed={!sidebarOpen} />
          
          <div className="pt-4 pb-2">
            {sidebarOpen && <p className="text-xs text-gray-600 uppercase tracking-wider px-3">Tools</p>}
          </div>
          
          <NavItem icon={<Scissors />} label="Clips" href="/clips" collapsed={!sidebarOpen} color="pink" />
          <NavItem icon={<Zap />} label="Content Ideas" href="/optimize" collapsed={!sidebarOpen} color="purple" />
          
          <div className="pt-4 pb-2">
            {sidebarOpen && <p className="text-xs text-gray-600 uppercase tracking-wider px-3">Analytics</p>}
          </div>
          
          <NavItem icon={<BarChart3 />} label="Channel Analysis" href="/analysis" collapsed={!sidebarOpen} />
          <NavItem icon={<TrendingUp />} label="Deep Analysis" href="/deep-analysis" collapsed={!sidebarOpen} />
          <NavItem icon={<Sparkles />} label="AI Insights" href="/advanced-insights" collapsed={!sidebarOpen} />
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-white/10">
          {channelStats && sidebarOpen && (
            <div className="p-3 bg-white/5 rounded-lg mb-3">
              <p className="font-medium text-sm truncate">{channelStats.title}</p>
              <p className="text-xs text-gray-500">{formatNumber(channelStats.subscriber_count)} subscribers</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors ${!sidebarOpen && 'justify-center'}`}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#111] border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 hover:bg-white/10 rounded-lg">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Youtube className="w-6 h-6 text-red-500" />
            <span className="font-bold">CreatorSaaS</span>
          </div>
          <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-white">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 bg-[#111] h-full p-4" onClick={e => e.stopPropagation()}>
            <nav className="space-y-1">
              <NavItem icon={<Home />} label="Dashboard" href="/" active={true} />
              <NavItem icon={<Video />} label="Videos" href="/videos" />
              <NavItem icon={<Scissors />} label="Clips" href="/clips" color="pink" />
              <NavItem icon={<Zap />} label="Content Ideas" href="/optimize" color="purple" />
              <NavItem icon={<BarChart3 />} label="Analytics" href="/analysis" />
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 lg:pt-0 pt-16">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome back{channelStats ? `, ${channelStats.title.split(' ')[0]}` : ''} 👋
              </h1>
              <p className="text-gray-500">Here's what's happening with your channel</p>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Subscribers"
              value={channelStats ? formatNumber(channelStats.subscriber_count) : "—"}
              color="red"
            />
            <StatCard
              icon={<Eye className="w-5 h-5" />}
              label="Total Views"
              value={channelStats ? formatNumber(channelStats.view_count) : "—"}
              color="blue"
            />
            <StatCard
              icon={<Play className="w-5 h-5" />}
              label="Videos"
              value={channelStats ? formatNumber(channelStats.video_count) : "—"}
              color="green"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Avg per Video"
              value={channelStats && channelStats.video_count > 0 
                ? formatNumber(Math.round(channelStats.view_count / channelStats.video_count)) 
                : "—"}
              color="purple"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Link
              href="/optimize"
              className="p-5 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl hover:border-purple-400/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">New Content Ideas</h3>
                  <p className="text-gray-400 text-sm">Score ideas & generate AI titles</p>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            
            <Link
              href="/videos"
              className="p-5 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-xl hover:border-emerald-400/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/30 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">Edit Videos</h3>
                  <p className="text-gray-400 text-sm">SEO, transcripts & AI optimization</p>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          {/* Recent Videos - Full Width */}
          <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-red-400" />
                Recent Videos
              </h2>
              <Link href="/videos" className="text-sm text-gray-400 hover:text-white transition-colors">
                View all →
              </Link>
            </div>
            
            <div className="divide-y divide-white/5">
              {recentVideos.length > 0 ? (
                recentVideos.slice(0, 6).map((video) => (
                  <VideoRow key={video.video_id} video={video} formatNumber={formatNumber} formatDate={formatDate} />
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No videos found</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Chat Hint */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              💬 Click the <span className="text-purple-400">purple button</span> in the corner to chat with your AI assistant
            </p>
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
  collapsed = false,
  color = "default"
}: { 
  icon: React.ReactNode; 
  label: string; 
  href: string;
  active?: boolean;
  collapsed?: boolean;
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
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${colorClasses[color]} ${collapsed && 'justify-center'}`}
      title={collapsed ? label : undefined}
    >
      <span className="w-5 h-5 flex-shrink-0">{icon}</span>
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    red: "text-red-400 bg-red-500/20",
    blue: "text-blue-400 bg-blue-500/20",
    green: "text-green-400 bg-green-500/20",
    purple: "text-purple-400 bg-purple-500/20",
  };
  
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function VideoRow({ 
  video, 
  formatNumber,
  formatDate
}: { 
  video: any; 
  formatNumber: (n: number) => string;
  formatDate: (s: string) => string;
}) {
  return (
    <Link 
      href={`/video/${video.video_id}`}
      className="flex gap-4 p-4 hover:bg-white/5 transition-colors group"
    >
      <div className="relative flex-shrink-0">
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className="w-40 h-[90px] object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
          <Play className="w-8 h-8 text-white" fill="white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-white mb-1 line-clamp-2 group-hover:text-purple-300 transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {formatNumber(video.view_count)}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-4 h-4" />
            {formatNumber(video.like_count)}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {formatNumber(video.comment_count)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
          <Calendar className="w-3 h-3" />
          {formatDate(video.published_at)}
        </div>
      </div>
      <div className="flex items-center">
        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
      </div>
    </Link>
  );
}
