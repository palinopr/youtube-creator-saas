import { Metadata } from "next";
import Link from "next/link";
import {
  Brain,
  Sparkles,
  MessageSquare,
  TrendingUp,
  Search,
  Lightbulb,
  BarChart3,
  Zap,
  Video,
  FileText,
  Clock,
  ArrowRight,
  Check,
} from "lucide-react";
import WaitlistForm from "@/components/landing/WaitlistForm";

export const metadata: Metadata = {
  title: "AI Tools for YouTube Creators",
  description:
    "Discover the best AI tools for YouTube creators. TubeGrow uses artificial intelligence to analyze your channel, optimize SEO, generate viral clips, and grow your audience faster.",
  alternates: {
    canonical: "/ai-youtube-tools",
  },
  keywords: [
    "ai tools for youtube",
    "youtube ai tools",
    "ai youtube analytics",
    "artificial intelligence youtube",
    "ai video optimization",
    "youtube ai assistant",
    "ai content ideas youtube",
    "youtube automation ai",
    "ai seo youtube",
    "youtube growth ai",
    "ai powered youtube",
    "machine learning youtube",
  ],
  openGraph: {
    title: "AI Tools for YouTube Creators | TubeGrow",
    description:
      "Use AI to grow your YouTube channel faster. Intelligent analytics, automated SEO optimization, and AI-powered viral clip detection.",
    type: "website",
  },
};

const aiFeatures = [
  {
    icon: MessageSquare,
    title: "AI Chat Assistant",
    description:
      "Ask questions about your channel in plain English. Get instant insights about your best performing content, audience demographics, and growth opportunities.",
    example: '"What video topics should I focus on based on my analytics?"',
  },
  {
    icon: Sparkles,
    title: "AI Viral Clip Detection",
    description:
      "Our AI analyzes your video transcripts to identify the most engaging moments perfect for YouTube Shorts and social media clips.",
    example: "Automatically finds hook moments, emotional peaks, and quotable segments",
  },
  {
    icon: Search,
    title: "AI SEO Optimization",
    description:
      "Get AI-generated titles, descriptions, and tags optimized for YouTube's algorithm. Our AI analyzes top-ranking videos to suggest winning metadata.",
    example: "AI writes SEO-optimized descriptions that rank higher in search",
  },
  {
    icon: Lightbulb,
    title: "AI Content Ideas",
    description:
      "Stuck on what to create next? Our AI analyzes your best performing videos and trending topics to suggest video ideas tailored to your audience.",
    example: "Get 10 video ideas based on what's working for your channel",
  },
  {
    icon: TrendingUp,
    title: "AI Performance Predictions",
    description:
      "Our AI analyzes patterns in your data to predict which videos will perform best and identifies opportunities you might be missing.",
    example: "Understand why certain videos go viral and replicate success",
  },
  {
    icon: FileText,
    title: "Metadata Generator (Lite Tool)",
    description:
      "Generate YouTube titles, descriptions, tags, and hashtags for a topic or video. Export options you can paste into YouTube Studio.",
    example: "Try it free: optimized metadata in one click",
  },
];

const useCases = [
  {
    title: "For New YouTubers",
    description: "Get AI guidance on channel setup, niche selection, and your first 1000 subscribers strategy",
    icon: Video,
  },
  {
    title: "For Growing Channels",
    description: "Use AI to identify what's working, optimize your content strategy, and scale faster",
    icon: TrendingUp,
  },
  {
    title: "For Established Creators",
    description: "Automate analytics, generate clips at scale, and focus on creating content",
    icon: Zap,
  },
];

const stats = [
  { value: "Faster", label: "Channel & video analysis" },
  { value: "Clearer", label: "SEO recommendations" },
  { value: "Repeatable", label: "Shorts clip workflows" },
  { value: "Always‑On", label: "AI support when you need it" },
];

export default function AIYouTubeToolsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-6">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-medium">AI-Powered YouTube Growth</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              AI Tools for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                YouTube Creators
              </span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-8">
              Stop guessing, start growing. TubeGrow uses artificial intelligence to analyze your channel,
              optimize your content, and uncover viral opportunities other tools miss.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/#waitlist"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Join Waitlist <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center justify-center gap-2 bg-zinc-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-zinc-700 transition-colors"
              >
                See All Features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  {stat.value}
                </div>
                <div className="text-zinc-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Tools */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Try the Free Lite Tools
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Get a feel for TubeGrow’s workflows with our public lite tools. They’re designed for fast
              checks and quick wins — and they link directly to deeper guides across the site.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/tools/youtube-seo-score"
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <Search className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold">SEO Score</h3>
              </div>
              <p className="text-zinc-400 text-sm">Score a video’s metadata and get fixes.</p>
            </Link>
            <Link
              href="/tools/youtube-metadata-generator"
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold">Metadata Generator</h3>
              </div>
              <p className="text-zinc-400 text-sm">Generate titles, descriptions, and tags.</p>
            </Link>
            <Link
              href="/tools/shorts-clip-finder"
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold">Shorts Clip Finder</h3>
              </div>
              <p className="text-zinc-400 text-sm">Find timestamped Shorts moments fast.</p>
            </Link>
            <Link
              href="/tools/youtube-channel-snapshot"
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold">Channel Snapshot</h3>
              </div>
              <p className="text-zinc-400 text-sm">Quick public read on a channel.</p>
            </Link>
          </div>
          <div className="text-center mt-8">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 text-purple-300 hover:text-white transition-colors font-medium"
            >
              Browse all free tools <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* AI Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How AI Supercharges Your YouTube Growth
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Our AI tools work 24/7 to analyze your data, find opportunities, and help you make smarter decisions.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiFeatures.map((feature) => (
              <div
                key={feature.title}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
              >
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-400 mb-4">{feature.description}</p>
                <div className="bg-zinc-800/50 rounded-lg px-4 py-3 text-sm text-zinc-500 italic">
                  {feature.example}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              AI YouTube Tools for Every Creator
            </h2>
            <p className="text-zinc-400">
              Whether you're just starting or have millions of subscribers, our AI adapts to your needs.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase) => (
              <div
                key={useCase.title}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <useCase.icon className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{useCase.title}</h3>
                <p className="text-zinc-400">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How Our AI YouTube Tools Work
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Connect your channel and let our AI get to work analyzing your content and opportunities.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Connect Channel", desc: "One-click Google OAuth connection" },
              { step: "2", title: "AI Analyzes Data", desc: "Processes videos, transcripts, analytics" },
              { step: "3", title: "Get AI Insights", desc: "Ask questions, get recommendations" },
              { step: "4", title: "Grow Faster", desc: "Apply insights, track results" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-zinc-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
            AI YouTube Tools FAQ
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "What AI technology does TubeGrow use?",
                a: "TubeGrow uses modern language models and analytics-driven heuristics to summarize performance, suggest SEO improvements, and propose next steps. The exact models and approaches evolve over time as the product improves.",
              },
              {
                q: "How is AI different from traditional YouTube analytics?",
                a: "Traditional analytics show you numbers. AI analytics tell you what to do about them. Our AI can answer questions like 'Why did this video underperform?' and 'What should my next video be about?' - things dashboards can't tell you.",
              },
              {
                q: "Can AI really help my YouTube channel grow?",
                a: "Yes! AI helps by analyzing patterns humans miss, optimizing SEO automatically, identifying viral potential in your content, and providing data-driven recommendations. Creators using AI tools typically see faster growth because they make better decisions.",
              },
              {
                q: "What can I ask the AI chat assistant?",
                a: "Ask about your channel performance, what topics are working, what to publish next, how to improve retention and CTR, and what SEO changes to make. The best questions are specific and tied to a goal (views, subscribers, or watch time).",
              },
              {
                q: "Is my YouTube data safe with AI analysis?",
                a: "Absolutely. We use secure OAuth connections, never store your YouTube credentials, and only analyze the data you authorize. Your data is encrypted and never shared with third parties.",
              },
              {
                q: "Do I need technical knowledge to use AI tools?",
                a: "Not at all! Our AI is designed to be conversational. Just ask questions in plain English and get actionable answers. No data science or technical background required.",
              },
            ].map((faq, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">{faq.q}</h3>
                <p className="text-zinc-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center">
            Related Resources
          </h2>
          <p className="text-zinc-400 text-center mb-8">
            Explore more guides and tools to grow your channel with AI.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/features"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
            >
              <h3 className="text-white font-semibold mb-2">All TubeGrow Features</h3>
              <p className="text-zinc-400 text-sm">
                See everything you can do inside the platform.
              </p>
            </Link>
            <Link
              href="/viral-clips-generator"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
            >
              <h3 className="text-white font-semibold mb-2">Viral Clips Generator</h3>
              <p className="text-zinc-400 text-sm">
                Turn long videos into Shorts with AI moment detection.
              </p>
            </Link>
            <Link
              href="/blog/how-to-start-youtube-channel-beginners-guide"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
            >
              <h3 className="text-white font-semibold mb-2">Beginner’s Growth Guide</h3>
              <p className="text-zinc-400 text-sm">
                A step‑by‑step guide to starting and growing a channel.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-12">
            <Brain className="w-16 h-16 text-purple-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Let AI Grow Your Channel?
            </h2>
            <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
              Be the first to access AI-powered YouTube growth tools when we launch. Join the waitlist for early access.
            </p>
            <div className="max-w-md mx-auto">
              <WaitlistForm variant="hero" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
