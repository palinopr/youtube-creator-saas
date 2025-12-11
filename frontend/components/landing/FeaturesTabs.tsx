"use client";

import { useState } from "react";
import {
  BarChart3,
  Search,
  Scissors,
  Users,
  TrendingUp,
  ChevronRight,
  Eye,
  ThumbsUp,
  MessageSquare,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  Play,
  Zap,
  Target,
  Globe,
  Smartphone,
  Monitor,
  Calendar,
  Sparkles,
} from "lucide-react";

const features = [
  {
    id: "analytics",
    icon: BarChart3,
    title: "AI-Powered Analytics",
    description:
      "Get deep insights into your channel performance with AI that understands YouTube's algorithm. Track views, engagement, and growth patterns.",
  },
  {
    id: "seo",
    icon: Search,
    title: "SEO Optimizer",
    description:
      "Rank higher in search with AI-generated titles, descriptions, and tags. Analyze competitor keywords and discover untapped opportunities.",
  },
  {
    id: "clips",
    icon: Scissors,
    title: "Viral Clips Generator",
    description:
      "Automatically identify the most engaging moments in your videos and turn them into viral-ready short-form content for TikTok, Shorts, and Reels.",
  },
  {
    id: "audience",
    icon: Users,
    title: "Audience Insights",
    description:
      "Understand who watches your content, when they're most active, and what keeps them coming back. Build a loyal community with data-driven strategies.",
  },
  {
    id: "growth",
    icon: TrendingUp,
    title: "Growth Predictions",
    description:
      "AI-powered forecasting that predicts your channel's growth trajectory. Set goals and get personalized recommendations to hit your targets.",
  },
];

// Analytics Mockup - Dashboard with stats and chart
function AnalyticsMockup() {
  const stats = [
    { label: "Views", value: "2.4M", change: "+24%", up: true, icon: Eye },
    { label: "Watch Time", value: "156K hrs", change: "+18%", up: true, icon: Clock },
    { label: "Subscribers", value: "+12.4K", change: "+32%", up: true, icon: Users },
    { label: "Engagement", value: "8.7%", change: "+5%", up: true, icon: ThumbsUp },
  ];

  const chartData = [65, 72, 68, 85, 78, 92, 88];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-brand-500" />
          <span className="text-white text-sm font-medium">Channel Analytics</span>
        </div>
        <span className="text-white/40 text-xs">Last 7 days</span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon size={14} className="text-brand-400" />
              <span className="text-white/50 text-xs">{stat.label}</span>
            </div>
            <p className="text-white font-bold text-lg">{stat.value}</p>
            <span className={`text-xs flex items-center gap-1 ${stat.up ? "text-green-400" : "text-red-400"}`}>
              {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {stat.change}
            </span>
          </div>
        ))}
      </div>

      {/* Mini chart */}
      <div className="flex-1 bg-white/5 rounded-xl p-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/60 text-xs">Views Trend</span>
          <span className="text-brand-500 text-xs font-medium">+24% this week</span>
        </div>
        <div className="flex items-end justify-between h-20 gap-2">
          {chartData.map((height, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-gradient-to-t from-brand-500 to-accent-500 rounded-t"
                style={{ height: `${height}%` }}
              />
              <span className="text-white/30 text-[10px]">{days[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// SEO Optimizer Mockup - SEO score and recommendations
function SEOMockup() {
  const seoItems = [
    { label: "Title Optimization", score: 92, status: "good" },
    { label: "Description", score: 78, status: "warning" },
    { label: "Tags Relevance", score: 85, status: "good" },
    { label: "Thumbnail CTR", score: 65, status: "warning" },
  ];

  const keywords = [
    { term: "react tutorial", volume: "12.5K", difficulty: "Medium" },
    { term: "nextjs 14", volume: "8.2K", difficulty: "Low" },
    { term: "web development", volume: "45K", difficulty: "High" },
  ];

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-brand-500" />
          <span className="text-white text-sm font-medium">SEO Analysis</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-green-400 text-xs">Good</span>
        </div>
      </div>

      {/* Overall Score */}
      <div className="bg-white/5 rounded-xl p-4 mb-4 text-center">
        <div className="relative w-20 h-20 mx-auto mb-2">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="3"
              strokeDasharray="82, 100"
            />
            <defs>
              <linearGradient id="gradient">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-xl">82</span>
          </div>
        </div>
        <p className="text-white/60 text-xs">SEO Score</p>
      </div>

      {/* SEO Items */}
      <div className="space-y-2 mb-4">
        {seoItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between bg-white/5 rounded-lg p-2">
            <div className="flex items-center gap-2">
              {item.status === "good" ? (
                <CheckCircle2 size={14} className="text-green-400" />
              ) : (
                <AlertCircle size={14} className="text-yellow-400" />
              )}
              <span className="text-white/70 text-xs">{item.label}</span>
            </div>
            <span className={`text-xs font-medium ${item.status === "good" ? "text-green-400" : "text-yellow-400"}`}>
              {item.score}%
            </span>
          </div>
        ))}
      </div>

      {/* Keywords */}
      <div className="flex-1">
        <p className="text-white/40 text-xs mb-2">Suggested Keywords</p>
        <div className="space-y-1">
          {keywords.map((kw) => (
            <div key={kw.term} className="flex items-center justify-between text-xs">
              <span className="text-white/70">{kw.term}</span>
              <span className="text-brand-400">{kw.volume}/mo</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Viral Clips Mockup - Clip suggestions with timestamps
function ClipsMockup() {
  const clips = [
    { title: "Hook moment", time: "0:45 - 1:12", score: 98, icon: Zap },
    { title: "Key insight", time: "3:22 - 3:58", score: 94, icon: Sparkles },
    { title: "Emotional peak", time: "7:15 - 7:45", score: 91, icon: Target },
  ];

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scissors size={16} className="text-brand-500" />
          <span className="text-white text-sm font-medium">Clip Generator</span>
        </div>
        <span className="text-brand-400 text-xs">3 clips found</span>
      </div>

      {/* Video preview */}
      <div className="relative bg-black rounded-xl overflow-hidden mb-4 aspect-video">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 to-accent-500/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <Play size={20} className="text-white ml-1" />
          </div>
        </div>
        {/* Timeline */}
        <div className="absolute bottom-2 left-2 right-2">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 w-[45%]" />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-white/60 text-[10px]">0:45</span>
            <span className="text-white/60 text-[10px]">10:24</span>
          </div>
        </div>
        {/* Viral markers */}
        <div className="absolute bottom-4 left-2 right-2">
          <div className="relative h-2">
            <div className="absolute left-[7%] w-3 h-3 bg-brand-500 rounded-full animate-pulse" />
            <div className="absolute left-[33%] w-3 h-3 bg-accent-500 rounded-full animate-pulse" />
            <div className="absolute left-[70%] w-3 h-3 bg-brand-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Clip suggestions */}
      <div className="flex-1 space-y-2">
        <p className="text-white/40 text-xs mb-2">AI-Detected Viral Moments</p>
        {clips.map((clip, i) => (
          <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
              <clip.icon size={14} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white text-xs font-medium">{clip.title}</p>
              <p className="text-white/40 text-[10px]">{clip.time}</p>
            </div>
            <div className="text-right">
              <p className="text-brand-400 text-xs font-bold">{clip.score}%</p>
              <p className="text-white/30 text-[10px]">Viral score</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Audience Insights Mockup - Demographics and behavior
function AudienceMockup() {
  const demographics = [
    { label: "18-24", value: 35 },
    { label: "25-34", value: 42 },
    { label: "35-44", value: 15 },
    { label: "45+", value: 8 },
  ];

  const devices = [
    { icon: Smartphone, label: "Mobile", value: "68%" },
    { icon: Monitor, label: "Desktop", value: "24%" },
    { icon: Globe, label: "TV", value: "8%" },
  ];

  const topCountries = [
    { flag: "🇺🇸", name: "United States", value: "42%" },
    { flag: "🇬🇧", name: "United Kingdom", value: "18%" },
    { flag: "🇨🇦", name: "Canada", value: "12%" },
  ];

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-brand-500" />
          <span className="text-white text-sm font-medium">Audience Insights</span>
        </div>
        <span className="text-white/40 text-xs">Last 28 days</span>
      </div>

      {/* Age demographics */}
      <div className="bg-white/5 rounded-xl p-3 mb-3">
        <p className="text-white/60 text-xs mb-3">Age Distribution</p>
        <div className="space-y-2">
          {demographics.map((d) => (
            <div key={d.label} className="flex items-center gap-2">
              <span className="text-white/50 text-xs w-10">{d.label}</span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full"
                  style={{ width: `${d.value}%` }}
                />
              </div>
              <span className="text-white text-xs w-8 text-right">{d.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Devices */}
      <div className="bg-white/5 rounded-xl p-3 mb-3">
        <p className="text-white/60 text-xs mb-3">Watch Devices</p>
        <div className="flex justify-between">
          {devices.map((d) => (
            <div key={d.label} className="text-center">
              <d.icon size={16} className="text-brand-400 mx-auto mb-1" />
              <p className="text-white font-medium text-sm">{d.value}</p>
              <p className="text-white/40 text-[10px]">{d.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top countries */}
      <div className="flex-1">
        <p className="text-white/60 text-xs mb-2">Top Countries</p>
        <div className="space-y-2">
          {topCountries.map((c) => (
            <div key={c.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{c.flag}</span>
                <span className="text-white/70 text-xs">{c.name}</span>
              </div>
              <span className="text-brand-400 text-xs font-medium">{c.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Growth Predictions Mockup - Forecasting and goals
function GrowthMockup() {
  const predictions = [
    { metric: "Subscribers", current: "124K", predicted: "156K", timeline: "30 days" },
    { metric: "Monthly Views", current: "2.4M", predicted: "3.1M", timeline: "30 days" },
  ];

  const milestones = [
    { target: "100K Subs", progress: 100, status: "Achieved" },
    { target: "150K Subs", progress: 83, status: "On track" },
    { target: "200K Subs", progress: 45, status: "3 months" },
  ];

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-brand-500" />
          <span className="text-white text-sm font-medium">Growth Predictions</span>
        </div>
        <div className="flex items-center gap-1 bg-green-500/20 px-2 py-0.5 rounded-full">
          <ArrowUpRight size={12} className="text-green-400" />
          <span className="text-green-400 text-xs">Growing</span>
        </div>
      </div>

      {/* Prediction cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {predictions.map((p) => (
          <div key={p.metric} className="bg-white/5 rounded-xl p-3">
            <p className="text-white/50 text-xs mb-1">{p.metric}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-white font-bold">{p.current}</span>
              <span className="text-white/30">→</span>
              <span className="text-green-400 font-bold">{p.predicted}</span>
            </div>
            <p className="text-white/30 text-[10px] mt-1">In {p.timeline}</p>
          </div>
        ))}
      </div>

      {/* Growth chart visualization */}
      <div className="bg-white/5 rounded-xl p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/60 text-xs">Projected Growth</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-brand-500" />
              <span className="text-white/40 text-[10px]">Actual</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-brand-500/40" />
              <span className="text-white/40 text-[10px]">Predicted</span>
            </div>
          </div>
        </div>
        <div className="h-16 flex items-end gap-1">
          {[40, 45, 52, 48, 55, 62, 58, 65, 72, 78].map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t ${i > 6 ? "bg-brand-500/40" : "bg-brand-500"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="flex-1">
        <p className="text-white/60 text-xs mb-2">Milestones</p>
        <div className="space-y-2">
          {milestones.map((m) => (
            <div key={m.target} className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/70 text-xs">{m.target}</span>
                  <span className={`text-xs ${m.progress === 100 ? "text-green-400" : "text-white/40"}`}>
                    {m.status}
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${m.progress === 100 ? "bg-green-500" : "bg-gradient-to-r from-brand-500 to-accent-500"}`}
                    style={{ width: `${m.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Map feature IDs to mockup components
const featureMockups: Record<string, React.ComponentType> = {
  analytics: AnalyticsMockup,
  seo: SEOMockup,
  clips: ClipsMockup,
  audience: AudienceMockup,
  growth: GrowthMockup,
};

export default function FeaturesTabs() {
  const [activeFeature, setActiveFeature] = useState(features[0].id);
  const ActiveMockup = featureMockups[activeFeature];

  return (
    <section id="features" className="py-20">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-brand-500 text-sm font-medium uppercase tracking-wider mb-3">
            Features
          </p>
          <h2 className="text-4xl md:text-5xl font-medium text-white mb-4">
            Everything you need to grow
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Powerful AI tools designed specifically for YouTube creators who want to
            maximize their reach and engagement.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Left: Feature tabs */}
          <div className="space-y-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              const isActive = activeFeature === feature.id;

              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  className={`w-full text-left p-6 rounded-xl transition-all duration-300 feature-tab ${
                    isActive ? "tab-active landing-card" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isActive
                          ? "bg-gradient-to-br from-brand-500 to-accent-500"
                          : "bg-white/5"
                      }`}
                    >
                      <Icon
                        size={20}
                        className={isActive ? "text-white" : "text-white/60"}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3
                          className={`text-lg font-medium ${
                            isActive ? "text-white" : "text-white/70"
                          }`}
                        >
                          {feature.title}
                        </h3>
                        <ChevronRight
                          size={18}
                          className={`flex-shrink-0 transition-transform ${
                            isActive
                              ? "text-brand-500 rotate-90"
                              : "text-white/30"
                          }`}
                        />
                      </div>
                      {isActive && (
                        <p className="text-white/60 text-sm mt-2 leading-relaxed">
                          {feature.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Feature mockup */}
          <div className="lg:sticky lg:top-32">
            <div className="landing-card overflow-hidden">
              <div className="aspect-[4/3] bg-navy-900">
                <ActiveMockup />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
