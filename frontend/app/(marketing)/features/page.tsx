import { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Sparkles,
  TrendingUp,
  Scissors,
  Zap,
  MessageSquare,
  Eye,
  Video,
  ArrowRight,
  Check,
  Brain,
  Search,
  Target,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore TubeGrow's powerful features: AI-powered YouTube analytics, viral clip generator, SEO optimization, and more. Everything you need to grow your channel.",
  openGraph: {
    title: "Features | TubeGrow - YouTube Analytics & Growth Tools",
    description:
      "Explore TubeGrow's powerful features: AI-powered YouTube analytics, viral clip generator, SEO optimization.",
  },
};

const features = [
  {
    category: "Analytics",
    tagline: "Understand Your Performance",
    color: "blue",
    items: [
      {
        icon: BarChart3,
        title: "Real-Time Analytics",
        description:
          "Track views, subscribers, and engagement metrics as they happen. See your channel's pulse in real-time.",
        highlights: [
          "Live view counts",
          "Subscriber growth tracking",
          "Engagement metrics",
          "Revenue estimates",
        ],
      },
      {
        icon: TrendingUp,
        title: "Deep Channel Analysis",
        description:
          "Understand patterns across your entire channel. Discover what makes your best videos perform.",
        highlights: [
          "Performance patterns",
          "Best posting times",
          "Topic analysis",
          "Audience insights",
        ],
      },
      {
        icon: Brain,
        title: "AI Insights",
        description:
          "Ask questions about your channel in natural language. Get intelligent, actionable answers instantly.",
        highlights: [
          "Natural language queries",
          "Instant answers",
          "Trend detection",
          "Growth recommendations",
        ],
      },
    ],
  },
  {
    category: "Growth",
    tagline: "Accelerate Your Channel",
    color: "purple",
    items: [
      {
        icon: Search,
        title: "SEO Optimization",
        description:
          "Optimize your titles, descriptions, and tags for maximum discoverability. Rank higher in search.",
        highlights: [
          "Keyword research",
          "Title optimization",
          "Tag suggestions",
          "Description templates",
        ],
      },
      {
        icon: Sparkles,
        title: "Content Ideas",
        description:
          "Get AI-powered content suggestions based on trending topics in your niche and what works for similar channels.",
        highlights: [
          "Trending topics",
          "Competitor analysis",
          "Idea scoring",
          "Title generation",
        ],
      },
      {
        icon: Target,
        title: "Competitor Research",
        description:
          "Learn from successful videos in your niche. Understand what strategies work and apply them to your content.",
        highlights: [
          "Niche analysis",
          "Video comparisons",
          "Strategy insights",
          "Gap identification",
        ],
      },
    ],
  },
  {
    category: "Clips",
    tagline: "Go Viral with Shorts",
    color: "pink",
    items: [
      {
        icon: Scissors,
        title: "Viral Clip Generator",
        description:
          "Automatically identify the most engaging moments in your videos. Perfect for YouTube Shorts and TikTok.",
        highlights: [
          "Auto-detection",
          "Hook identification",
          "Loop optimization",
          "One-click export",
        ],
      },
      {
        icon: Video,
        title: "Transcript Analysis",
        description:
          "We analyze your video transcripts to find quotable moments, key takeaways, and viral-worthy segments.",
        highlights: [
          "Full transcription",
          "Quote extraction",
          "Highlight detection",
          "Timestamp linking",
        ],
      },
      {
        icon: Zap,
        title: "Quick Export",
        description:
          "Export clips in the perfect format for each platform. Ready to post in seconds, not hours.",
        highlights: [
          "Multiple formats",
          "Platform optimization",
          "Batch export",
          "Quality control",
        ],
      },
    ],
  },
];

const colorClasses: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
    gradient: "from-blue-500 to-cyan-500",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
    gradient: "from-purple-500 to-pink-500",
  },
  pink: {
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    border: "border-pink-500/20",
    gradient: "from-pink-500 to-red-500",
  },
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-black to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Powerful Features
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Grow
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            From AI-powered analytics to viral clip generation, TubeGrow gives you
            the tools professional creators use to succeed.
          </p>
        </div>
      </section>

      {/* Feature Sections */}
      {features.map((section, sectionIndex) => {
        const colors = colorClasses[section.color];
        return (
          <section
            key={section.category}
            className={`py-20 ${sectionIndex % 2 === 1 ? "bg-white/5" : ""}`}
          >
            <div className="max-w-7xl mx-auto px-6">
              {/* Section Header */}
              <div className="text-center mb-16">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 ${colors.bg} border ${colors.border} rounded-full ${colors.text} text-sm mb-4`}
                >
                  {section.category}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {section.tagline}
                </h2>
              </div>

              {/* Feature Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                {section.items.map((feature) => (
                  <div
                    key={feature.title}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
                  >
                    <div
                      className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}
                    >
                      <feature.icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 mb-4">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.highlights.map((highlight) => (
                        <li
                          key={highlight}
                          className="flex items-center gap-2 text-sm text-gray-300"
                        >
                          <Check className={`w-4 h-4 ${colors.text}`} />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* AI Chat Feature Highlight */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm mb-6">
                <MessageSquare className="w-4 h-4" />
                AI Assistant
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ask Anything About Your Channel
              </h2>
              <p className="text-gray-400 mb-6">
                Our AI assistant understands your channel data and can answer
                complex questions in plain English. No data science degree required.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  "Why did my last video underperform?"
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  "What topics should I cover next?"
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  "How can I improve my click-through rate?"
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  "Compare my performance to last month"
                </li>
              </ul>
            </div>
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">TubeGrow AI</p>
                  <p className="text-xs text-gray-400">Your channel assistant</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-3 text-sm text-gray-300">
                  What's my best performing topic this month?
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm text-gray-300">
                  Your tutorial videos are performing best this month with an
                  average of 25K views, 15% higher than your vlogs. The "How to"
                  format particularly resonates with your audience.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Ready to Try These Features?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Start with our free plan and upgrade as you grow. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/api/auth/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl font-semibold text-lg transition-all"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-lg transition-all"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
