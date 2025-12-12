import { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Brain,
  Users,
  Clock,
  Search,
  MessageSquare,
  Target,
  ArrowRight,
  Check,
} from "lucide-react";
import WaitlistForm from "@/components/landing/WaitlistForm";

export const metadata: Metadata = {
  title: "YouTube Analytics Tool",
  description:
    "AI-powered YouTube analytics tool for creators. Understand your channel, videos, audience, and growth with real dashboards plus an AI assistant. Join the TubeGrow waitlist.",
  alternates: {
    canonical: "/youtube-analytics-tool",
  },
  keywords: [
    "youtube analytics tool",
    "youtube channel analytics",
    "youtube analytics dashboard",
    "youtube video analytics",
    "ai youtube analytics",
    "youtube growth analytics",
    "youtube performance tracker",
    "youtube audience insights",
    "youtube analytics ai assistant",
  ],
  openGraph: {
    title: "YouTube Analytics Tool | TubeGrow",
    description:
      "See what’s working on your channel, why it’s working, and what to do next. Real YouTube analytics plus AI insights for creators.",
    type: "website",
  },
};

const features = [
  {
    icon: BarChart3,
    title: "Real‑Time Channel Dashboard",
    description:
      "Track views, subscribers, watch time, and engagement as they change. Spot spikes early and understand what caused them.",
  },
  {
    icon: TrendingUp,
    title: "Video Performance Breakdown",
    description:
      "See which videos drive growth, how retention behaves, and where traffic is coming from. Compare Shorts vs long‑form in one place.",
  },
  {
    icon: Users,
    title: "Audience Insights",
    description:
      "Understand who is watching, what they return for, and when they’re most active. Turn viewers into repeat fans.",
  },
  {
    icon: Search,
    title: "Traffic Source Clarity",
    description:
      "Measure search, browse, suggested, external, and Shorts feed performance so you know where to double down.",
  },
  {
    icon: Brain,
    title: "AI Pattern Detection",
    description:
      "Our AI scans your channel history to uncover repeatable patterns behind your best videos and growth moments.",
  },
  {
    icon: MessageSquare,
    title: "Ask TubeGrow AI",
    description:
      "Chat with an AI assistant trained on your analytics. Get straight answers and next‑step recommendations in seconds.",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Connect Your Channel",
    description: "Secure OAuth connection pulls only the data you authorize.",
    icon: Target,
  },
  {
    step: "2",
    title: "AI Syncs + Analyzes",
    description: "We process your channel and video history to build your dashboards.",
    icon: Brain,
  },
  {
    step: "3",
    title: "Explore Insights",
    description: "Review performance, retention, CTR signals, and traffic sources.",
    icon: BarChart3,
  },
  {
    step: "4",
    title: "Get a Growth Plan",
    description: "TubeGrow AI suggests concrete moves to improve your next videos.",
    icon: TrendingUp,
  },
];

const exampleQuestions = [
  "Which topics are driving my fastest subscriber growth?",
  "What changed when my last video spiked?",
  "Which videos should I remake as Shorts?",
  "What posting time performs best for my audience?",
  "Where am I losing viewers in my top videos?",
];

export default function YouTubeAnalyticsToolPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Hero */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10" />
        <div className="max-w-6xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">AI‑Powered Analytics</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            YouTube Analytics Tool Built for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Creators in 2025
            </span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-8">
            YouTube Studio shows you numbers. TubeGrow tells you what they mean, why they changed,
            and what to do next — with real dashboards plus an AI assistant that learns your channel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/#waitlist"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity"
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
          <p className="text-zinc-500 text-sm mt-4">
            Waitlist‑only early access. No public pricing yet.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              What You Get with TubeGrow Analytics
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Everything you need to understand performance and make smarter content decisions.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-blue-500/50 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Connect once, then let TubeGrow keep your analytics organized and actionable.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-14 h-14 mx-auto bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                  <step.icon className="w-7 h-7 text-blue-400" />
                </div>
                <div className="text-blue-300 font-semibold mb-2">Step {step.step}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-zinc-400 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example questions */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-7 h-7 text-purple-400" />
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Ask TubeGrow AI Anything
              </h2>
            </div>
            <p className="text-zinc-400 mb-6">
              Instead of digging through tabs, just ask. TubeGrow AI reads your channel data and responds
              with the context you actually need.
            </p>
            <ul className="space-y-3">
              {exampleQuestions.map((q) => (
                <li key={q} className="flex items-start gap-3 text-zinc-300">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
            YouTube Analytics Tool FAQ
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "What data does TubeGrow analyze?",
                a: "We analyze your channel and video performance from the YouTube Data and YouTube Analytics APIs: views, subscribers, watch time, retention, CTR signals, traffic sources, and Shorts vs long‑form behavior.",
              },
              {
                q: "Is the data real‑time?",
                a: "Most channel metrics update near real‑time, while some analytics (like retention and traffic breakdowns) follow YouTube’s normal reporting delay. TubeGrow surfaces both clearly.",
              },
              {
                q: "Do you store my YouTube credentials?",
                a: "No. We use secure OAuth tokens, encrypted per user. We never see your password and only access the data you authorize.",
              },
              {
                q: "How is this different from YouTube Studio?",
                a: "Studio shows raw charts. TubeGrow adds cross‑video pattern analysis, clearer comparisons, and an AI assistant that explains what’s happening and what to do next.",
              },
              {
                q: "When can I use TubeGrow?",
                a: "TubeGrow is in waitlist‑only early access. Join the waitlist and we’ll invite you as new spots open.",
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

      {/* Related resources */}
      <section className="py-16 px-4 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center">
            Related Resources
          </h2>
          <p className="text-zinc-400 text-center mb-8">
            Keep building your channel with TubeGrow.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/youtube-seo-tool"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-blue-500/50 transition-colors"
            >
              <h3 className="text-white font-semibold mb-2">YouTube SEO Tool</h3>
              <p className="text-zinc-400 text-sm">
                Optimize titles, descriptions, and tags with AI.
              </p>
            </Link>
            <Link
              href="/viral-clips-generator"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-blue-500/50 transition-colors"
            >
              <h3 className="text-white font-semibold mb-2">Viral Clips Generator</h3>
              <p className="text-zinc-400 text-sm">
                Turn long videos into Shorts with AI.
              </p>
            </Link>
            <Link
              href="/blog"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-blue-500/50 transition-colors"
            >
              <h3 className="text-white font-semibold mb-2">YouTube Growth Guides</h3>
              <p className="text-zinc-400 text-sm">
                Read our 2025 playbooks for creators.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-12">
            <Clock className="w-16 h-16 text-blue-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Be First to Use TubeGrow Analytics
            </h2>
            <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
              Join the waitlist for early access to our AI‑powered YouTube analytics dashboard.
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

