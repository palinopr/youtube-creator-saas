import { Metadata } from "next";
import Link from "next/link";
import {
  Search,
  Sparkles,
  Target,
  FileText,
  Tags,
  TrendingUp,
  Check,
  ArrowRight,
  Clock,
} from "lucide-react";
import WaitlistForm from "@/components/landing/WaitlistForm";

export const metadata: Metadata = {
  title: "YouTube SEO Tool",
  description:
    "AI YouTube SEO tool to optimize titles, descriptions, and tags. Get SEO scores, keyword insights, and AI‑generated metadata that helps videos rank in 2025. Join the TubeGrow waitlist.",
  alternates: {
    canonical: "/youtube-seo-tool",
  },
  keywords: [
    "youtube seo tool",
    "youtube seo optimization",
    "youtube seo optimizer",
    "youtube tags generator",
    "youtube title generator",
    "youtube description generator",
    "youtube keyword research tool",
    "ai youtube seo",
    "youtube search optimization tools",
  ],
  openGraph: {
    title: "YouTube SEO Tool | TubeGrow",
    description:
      "Improve discoverability with AI‑powered YouTube SEO: metadata scoring, keyword alignment, and optimized titles/descriptions/tags.",
    type: "website",
  },
};

const features = [
  {
    icon: Target,
    title: "SEO Score + Fixes",
    description:
      "Get a clear SEO score for each video and a prioritized checklist of fixes for titles, descriptions, and tags.",
  },
  {
    icon: Search,
    title: "Keyword Alignment",
    description:
      "Understand whether your metadata matches real search demand. TubeGrow highlights missed keywords and intent gaps.",
  },
  {
    icon: Sparkles,
    title: "AI Metadata Generator",
    description:
      "Generate click‑worthy, accurate titles, descriptions, and tag sets optimized for YouTube’s algorithm.",
  },
  {
    icon: FileText,
    title: "Description Structure",
    description:
      "AI formats descriptions for readability and ranking: hooks, chapters, CTAs, and keyword placement.",
  },
  {
    icon: Tags,
    title: "Smart Tags + Hashtags",
    description:
      "TubeGrow suggests tags and hashtags based on your niche, topic, and top‑ranking videos.",
  },
  {
    icon: TrendingUp,
    title: "Measure SEO Impact",
    description:
      "Track how your SEO edits affect impressions, CTR signals, and long‑term traffic — all tied back to outcomes.",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Paste a Video or Connect Your Channel",
    description: "Analyze a single video or your full library via OAuth.",
  },
  {
    step: "2",
    title: "AI Reads Your Metadata + Top Results",
    description: "We compare your title/description/tags to what ranks in your niche.",
  },
  {
    step: "3",
    title: "Get Optimized Titles, Descriptions, Tags",
    description: "TubeGrow generates multiple options you can publish immediately.",
  },
  {
    step: "4",
    title: "Publish + Track Gains",
    description: "Monitor performance changes inside your TubeGrow dashboard.",
  },
];

const useCases = [
  "Rank new uploads faster with better keyword targeting.",
  "Fix underperforming videos by improving metadata.",
  "Generate consistent tags and descriptions across your channel.",
  "Optimize Shorts titles and hashtags for the Shorts feed.",
];

export default function YouTubeSEOToolPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Hero */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10" />
        <div className="max-w-6xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-6">
            <Search className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">AI‑Powered YouTube SEO</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            YouTube SEO Tool to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Rank in 2025
            </span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-8">
            TubeGrow helps your videos get discovered. Score your metadata, align with real keywords,
            and generate optimized titles, descriptions, and tags that win search and suggested traffic.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/#waitlist"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Join Waitlist <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/alternatives"
              className="inline-flex items-center justify-center gap-2 bg-zinc-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-zinc-700 transition-colors"
            >
              Compare Tools
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
              What TubeGrow SEO Does
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Practical, creator‑friendly SEO that improves discoverability without guesswork.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
              >
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-purple-400" />
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
              A simple workflow you can repeat for every upload.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-12 h-12 mx-auto bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-purple-300 font-bold">{step.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-zinc-400 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
            Use TubeGrow SEO To
          </h2>
          <ul className="space-y-3">
            {useCases.map((item) => (
              <li key={item} className="flex items-start gap-3 text-zinc-300">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
            YouTube SEO Tool FAQ
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Does YouTube SEO still matter in 2025?",
                a: "Yes. Titles, descriptions, and tags shape how YouTube understands your video and which searches and suggested surfaces it appears in. Great SEO also boosts long‑tail traffic over time.",
              },
              {
                q: "What does TubeGrow optimize?",
                a: "We score and optimize metadata (title, description, tags), keyword targeting, Shorts hashtags, and the match between your content and user search intent.",
              },
              {
                q: "Is this a replacement for VidIQ or TubeBuddy?",
                a: "TubeGrow is built to be a modern AI‑first alternative. We focus on actionable metadata fixes, AI generation, and connecting SEO work to actual performance results.",
              },
              {
                q: "Can I use it on old videos?",
                a: "Absolutely. Refreshing metadata on existing videos is one of the fastest ways to recover search traffic and improve suggested reach.",
              },
              {
                q: "When will TubeGrow SEO be available?",
                a: "TubeGrow is in waitlist‑only early access. Join the waitlist and we’ll invite you as we open more spots.",
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
            Build a complete growth system with TubeGrow.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/youtube-analytics-tool"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
            >
              <h3 className="text-white font-semibold mb-2">YouTube Analytics Tool</h3>
              <p className="text-zinc-400 text-sm">
                Understand performance and growth drivers.
              </p>
            </Link>
            <Link
              href="/ai-youtube-tools"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
            >
              <h3 className="text-white font-semibold mb-2">AI Tools for Creators</h3>
              <p className="text-zinc-400 text-sm">
                See all AI workflows across TubeGrow.
              </p>
            </Link>
            <Link
              href="/blog"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
            >
              <h3 className="text-white font-semibold mb-2">SEO + Growth Guides</h3>
              <p className="text-zinc-400 text-sm">
                Practical YouTube SEO playbooks for 2025.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-12">
            <Clock className="w-16 h-16 text-purple-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Be First to Use TubeGrow SEO
            </h2>
            <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
              Join the waitlist for early access to our AI‑powered YouTube SEO toolkit.
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

