"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
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
  Check,
  Star,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { StatCard, StatCardSkeleton, ChartSkeleton, VideoSpotlight } from "@/components/dashboard";
import { useDashboardData, formatNumber, formatDate } from "@/hooks/useDashboardData";
import { API_URL, AUTH_ENDPOINTS } from "@/lib/config";
import { Logo } from "@/components/ui/Logo";
import { Testimonials } from "@/components/marketing/Testimonials";
import { FAQ } from "@/components/marketing/FAQ";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { FeatureShowcase } from "@/components/marketing/FeatureShowcase";
import { StatsBar } from "@/components/marketing/StatsBar";
import Sidebar from "@/components/layout/Sidebar";

// Lazy load charts for better performance
const ViewsTrendChart = dynamic(
  () => import("@/components/dashboard/ViewsTrendChart").then((mod) => ({ default: mod.ViewsTrendChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
);

const SubscriberChart = dynamic(
  () => import("@/components/dashboard/SubscriberChart").then((mod) => ({ default: mod.SubscriberChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
);

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(AUTH_ENDPOINTS.STATUS, {
        credentials: "include",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      console.error("Auth check failed:", error);
      // Default to not authenticated on error
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = AUTH_ENDPOINTS.LOGIN;
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

const pricingPlans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Get started with basic analytics",
    highlights: [
      "10 videos per month",
      "20 AI queries",
      "Basic channel stats",
      "Video performance tracking",
    ],
    popular: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: 19,
    description: "Perfect for growing creators",
    highlights: [
      "50 videos per month",
      "100 AI queries",
      "SEO optimization tools",
      "20 viral clips per month",
      "Email support",
    ],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 49,
    description: "For serious content creators",
    highlights: [
      "Unlimited videos",
      "500 AI queries",
      "Advanced SEO tools",
      "100 viral clips per month",
      "Priority support",
      "Competitor research",
    ],
    popular: true,
  },
  {
    id: "agency",
    name: "Agency",
    price: 149,
    description: "For teams and agencies",
    highlights: [
      "Unlimited everything",
      "API access",
      "White-label reports",
      "Dedicated support",
      "Custom integrations",
      "Multi-channel management",
    ],
    popular: false,
  },
];

function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-black to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-red-500/10 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
          <nav className="flex items-center justify-between mb-20">
            <Logo size="md" linkToHome={false} />
            <div className="flex items-center gap-4">
              <Link
                href="/pricing"
                className="text-gray-400 hover:text-white transition-colors hidden sm:block"
              >
                Pricing
              </Link>
              <button
                onClick={onLogin}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                Sign In
              </button>
            </div>
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
              <Link
                href="/pricing"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
              >
                View Pricing
              </Link>
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

      {/* How It Works */}
      <HowItWorks />

      {/* Dashboard Preview */}
      <DashboardPreview />

      {/* Feature Showcase */}
      <FeatureShowcase />

      {/* Pricing Section */}
      <section id="pricing" className="py-24 border-t border-white/10 bg-gradient-to-b from-black to-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500/10 border border-brand-500/20 rounded-full mb-6">
              <Star className="w-4 h-4 text-brand-400" />
              <span className="text-sm text-brand-400">Simple Pricing</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your Plan
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Start free and scale as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 flex flex-col ${
                  plan.popular
                    ? "border-accent-500 bg-gradient-to-br from-brand-500/10 to-accent-500/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-brand-500 to-accent-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-400">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      {plan.price === 0 ? "Free" : `$${plan.price}`}
                    </span>
                    {plan.price > 0 && <span className="text-gray-400">/month</span>}
                  </div>
                </div>

                <ul className="space-y-3 mb-6 flex-1">
                  {plan.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-accent-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{highlight}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onLogin}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? "bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-600 hover:to-accent-600 text-white"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/pricing"
              className="text-accent-400 hover:text-accent-300 transition-colors"
            >
              Compare all features →
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof / Trust Section */}
      <section className="py-24 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid sm:grid-cols-3 gap-6 mb-16">
            <div className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-xl">
              <div className="p-3 bg-brand-500/10 rounded-lg">
                <Shield className="w-6 h-6 text-brand-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Secure & Private</h3>
                <p className="text-sm text-gray-400">Your data stays yours</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-xl">
              <div className="p-3 bg-accent-500/10 rounded-lg">
                <Zap className="w-6 h-6 text-accent-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Cancel Anytime</h3>
                <p className="text-sm text-gray-400">No long-term contracts</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-xl">
              <div className="p-3 bg-brand-500/10 rounded-lg">
                <Sparkles className="w-6 h-6 text-brand-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">14-Day Free Trial</h3>
                <p className="text-sm text-gray-400">On Pro & Agency plans</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <StatsBar />

      {/* Testimonials Section */}
      <Testimonials />

      {/* FAQ Section */}
      <FAQ />

      {/* CTA Section */}
      <section className="py-24 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Grow Your Channel?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of creators using AI to optimize their YouTube presence.
          </p>
          <button
            onClick={onLogin}
            className="group px-8 py-4 bg-red-600 hover:bg-red-500 rounded-xl font-semibold text-lg transition-all inline-flex items-center gap-2"
          >
            <Youtube className="w-5 h-5" />
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <Logo size="sm" linkToHome={false} className="mb-4" />
              <p className="text-sm text-gray-400">
                AI-powered YouTube analytics to help creators grow their channels faster.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><a href="mailto:support@tubegrow.io" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} TubeGrow. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <a href="https://twitter.com/tubegrow" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Twitter
              </a>
              <a href="https://youtube.com/@tubegrow" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                YouTube
              </a>
            </div>
          </div>
        </div>
      </footer>
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
  const { channelStats, recentVideos, topVideo, analyticsOverview, isLoading } = useDashboardData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left Sidebar - Uses shared component */}
      <Sidebar activePath="/" />

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#111] border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 hover:bg-white/10 rounded-lg">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Logo size="sm" showIcon={false} linkToHome={false} />
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
              <NavItem icon={<TrendingUp />} label="Deep Analysis" href="/deep-analysis" />
              <NavItem icon={<Sparkles />} label="AI Insights" href="/advanced-insights" />
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 lg:pt-0 pt-16">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">
              Welcome back{channelStats ? `, ${channelStats.title.split(' ')[0]}` : ''} 👋
            </h1>
            <p className="text-gray-500">Here's what's happening with your channel</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {isLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <ViewsTrendChart
              dailyData={analyticsOverview?.daily_data}
              isLoading={isLoading}
            />
            <SubscriberChart
              dailyData={analyticsOverview?.daily_data}
              currentSubscribers={channelStats?.subscriber_count}
              isLoading={isLoading}
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

          {/* Video Spotlight + Recent Videos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            {/* Top Video Spotlight */}
            <div className="lg:col-span-1">
              <VideoSpotlight video={topVideo || undefined} isLoading={isLoading} />
            </div>

            {/* Recent Videos */}
            <div className="lg:col-span-2 bg-[#111] border border-white/10 rounded-xl overflow-hidden">
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
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 animate-pulse">
                      <div className="w-40 h-[90px] bg-white/10 rounded-lg flex-shrink-0" />
                      <div className="flex-1">
                        <div className="w-full h-5 bg-white/10 rounded mb-2" />
                        <div className="w-2/3 h-4 bg-white/10 rounded mb-2" />
                        <div className="w-1/3 h-3 bg-white/10 rounded" />
                      </div>
                    </div>
                  ))
                ) : recentVideos.length > 0 ? (
                  recentVideos.slice(0, 4).map((video) => (
                    <VideoRow key={video.video_id} video={video} />
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No videos found</p>
                  </div>
                )}
              </div>
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
    red: "text-red-400 hover:text-red-300 hover:bg-red-500/10",
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


function VideoRow({ video }: { video: any }) {
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
