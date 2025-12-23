import { Metadata } from "next";
import Link from "next/link";
import {
  Type,
  Sparkles,
  Target,
  Zap,
  TrendingUp,
  MousePointer,
  Check,
  ArrowRight,
  Clock,
  BarChart3,
  Lightbulb,
  Copy,
} from "lucide-react";
import WaitlistForm from "@/components/landing/WaitlistForm";

export const metadata: Metadata = {
  title: "YouTube Title Generator - AI-Powered Video Titles That Get Clicks",
  description:
    "Free AI YouTube title generator that creates click-worthy, SEO-optimized video titles. Generate multiple title variations, test CTR potential, and rank higher in 2025. Join TubeGrow waitlist.",
  alternates: {
    canonical: "/youtube-title-generator",
  },
  keywords: [
    "youtube title generator",
    "youtube title ideas",
    "video title generator",
    "youtube title maker",
    "ai title generator youtube",
    "catchy youtube titles",
    "youtube title optimizer",
    "best youtube titles",
    "youtube title suggestions",
    "clickbait title generator",
    "youtube seo title",
    "video title ideas",
  ],
  openGraph: {
    title: "YouTube Title Generator | TubeGrow",
    description:
      "Generate click-worthy YouTube titles with AI. Create titles that rank in search and get more clicks in suggested videos.",
    type: "website",
  },
};

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Generation",
    description:
      "Our AI analyzes top-performing videos in your niche to generate titles that match proven patterns and search intent.",
  },
  {
    icon: Target,
    title: "Keyword Optimization",
    description:
      "Every title is optimized for your target keywords while remaining natural and click-worthy for viewers.",
  },
  {
    icon: MousePointer,
    title: "CTR Prediction",
    description:
      "Get a predicted click-through rate score for each title based on patterns from millions of YouTube videos.",
  },
  {
    icon: Zap,
    title: "Multiple Variations",
    description:
      "Generate 10+ title variations instantly. Test different hooks, formats, and angles to find your winner.",
  },
  {
    icon: TrendingUp,
    title: "Trend-Aware",
    description:
      "Titles incorporate current trends and seasonal relevance to maximize timely discoverability.",
  },
  {
    icon: BarChart3,
    title: "A/B Testing Ready",
    description:
      "Export title variations for YouTube's native A/B testing or track performance in your TubeGrow dashboard.",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Enter Your Topic or Keywords",
    description: "Tell us what your video is about or paste your current title.",
  },
  {
    step: "2",
    title: "AI Analyzes Your Niche",
    description: "We scan top-ranking videos to understand what works.",
  },
  {
    step: "3",
    title: "Get 10+ Title Options",
    description: "Receive multiple variations with CTR scores and keyword analysis.",
  },
  {
    step: "4",
    title: "Publish and Track",
    description: "Use your favorite title and monitor performance in TubeGrow.",
  },
];

const titleFormulas = [
  {
    name: "How-To Formula",
    example: "How to [Outcome] in [Timeframe] (Even If [Obstacle])",
    description: "Perfect for tutorials and educational content.",
  },
  {
    name: "List Formula",
    example: "[Number] [Topic] That Will [Benefit] in 2025",
    description: "Great for listicles and compilation videos.",
  },
  {
    name: "Curiosity Gap",
    example: "I Tried [Thing] for [Time] - Here's What Happened",
    description: "Creates intrigue and drives clicks from browse.",
  },
  {
    name: "Direct Benefit",
    example: "The [Adjective] Way to [Desired Outcome]",
    description: "Clear value proposition for search traffic.",
  },
];

const useCases = [
  "Generate titles for new video ideas before filming.",
  "Improve CTR on underperforming videos with better titles.",
  "Create multiple variations for YouTube A/B testing.",
  "Optimize Shorts titles for the Shorts feed algorithm.",
  "Find the right balance between SEO and clickability.",
];

const faqs = [
  {
    q: "What makes a good YouTube title?",
    a: "A good YouTube title balances three things: SEO (includes target keywords), curiosity (creates a reason to click), and clarity (viewers know what they'll get). The best titles are specific, promise a clear outcome, and are under 60 characters so they don't get cut off.",
  },
  {
    q: "How does the AI title generator work?",
    a: "Our AI analyzes millions of successful YouTube videos to identify patterns in high-CTR titles. When you enter your topic, it generates variations using proven formulas while incorporating your target keywords naturally.",
  },
  {
    q: "Should I use clickbait titles?",
    a: "Avoid misleading clickbait that doesn't deliver. However, creating curiosity and emotional hooks is effective when your content delivers on the promise. TubeGrow generates compelling titles that are accurate to your content.",
  },
  {
    q: "How long should my YouTube title be?",
    a: "Aim for 50-60 characters. Titles longer than 60 characters get truncated on mobile and in search results. Front-load your most important keywords and hooks in the first 40 characters.",
  },
  {
    q: "Can I use this for YouTube Shorts titles?",
    a: "Yes! Shorts titles work differently - they should be even more concise and hook-focused. TubeGrow has a specific Shorts title mode that optimizes for the vertical feed format.",
  },
  {
    q: "How often should I change my video titles?",
    a: "You can update titles anytime to improve CTR. If a video has good retention but low CTR, changing the title can revive it. Many creators A/B test titles in the first 48 hours after upload.",
  },
  {
    q: "Does the title affect YouTube SEO?",
    a: "Absolutely. The title is one of the strongest signals YouTube uses to understand your video's topic. Including your target keyword naturally in the title helps you rank for that search term.",
  },
  {
    q: "What's the difference between TubeGrow and other title generators?",
    a: "TubeGrow combines AI generation with real performance data. We don't just create titles - we predict CTR, check keyword optimization, and track how your titles perform over time.",
  },
];

export default function YouTubeTitleGeneratorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Hero */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10" />
        <div className="max-w-6xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
            <Type className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">AI Title Generator</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            YouTube Title Generator That{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Gets Clicks
            </span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-8">
            Generate click-worthy, SEO-optimized YouTube titles with AI. Create multiple variations,
            predict CTR, and find the perfect title that ranks and converts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/#waitlist"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Join Waitlist <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/tools/youtube-metadata-generator"
              className="inline-flex items-center justify-center gap-2 bg-zinc-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-zinc-700 transition-colors"
            >
              Try Free Lite Tool
            </Link>
          </div>
          <p className="text-zinc-500 text-sm mt-4">
            Waitlist-only early access. Free lite tool available now.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Use TubeGrow for YouTube Titles?
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Not just random suggestions - AI-powered titles based on real performance data.
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

      {/* Title Formulas */}
      <section className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Proven Title Formulas That Work
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              TubeGrow uses battle-tested formulas from top-performing YouTube videos.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {titleFormulas.map((formula) => (
              <div
                key={formula.name}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-white">{formula.name}</h3>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-4 mb-3">
                  <code className="text-blue-300 text-sm">{formula.example}</code>
                </div>
                <p className="text-zinc-400 text-sm">{formula.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Generate the perfect title in under 30 seconds.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-12 h-12 mx-auto bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-blue-300 font-bold">{step.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-zinc-400 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
            Use TubeGrow Title Generator To
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

      {/* FAQ with Schema Markup */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
            YouTube Title Generator FAQ
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
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
            Related Tools
          </h2>
          <p className="text-zinc-400 text-center mb-8">
            Complete your YouTube optimization workflow.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/youtube-seo-tool"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-blue-500/50 transition-colors"
            >
              <h3 className="text-white font-semibold mb-2">YouTube SEO Tool</h3>
              <p className="text-zinc-400 text-sm">
                Full metadata optimization suite.
              </p>
            </Link>
            <Link
              href="/youtube-tag-generator"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-blue-500/50 transition-colors"
            >
              <h3 className="text-white font-semibold mb-2">Tag Generator</h3>
              <p className="text-zinc-400 text-sm">
                AI-powered tags for your videos.
              </p>
            </Link>
            <Link
              href="/youtube-description-generator"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-blue-500/50 transition-colors"
            >
              <h3 className="text-white font-semibold mb-2">Description Generator</h3>
              <p className="text-zinc-400 text-sm">
                SEO-optimized video descriptions.
              </p>
            </Link>
            <Link
              href="/blog/how-to-optimize-youtube-video-for-seo-2025"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-blue-500/50 transition-colors"
            >
              <h3 className="text-white font-semibold mb-2">YouTube SEO Guide</h3>
              <p className="text-zinc-400 text-sm">
                Complete 2025 optimization playbook.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-12">
            <Type className="w-16 h-16 text-blue-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Stop Guessing on Titles
            </h2>
            <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
              Join the waitlist for TubeGrow's AI title generator and start creating titles that get clicks.
            </p>
            <div className="max-w-md mx-auto">
              <WaitlistForm variant="hero" />
            </div>
          </div>
        </div>
      </section>

      {/* JSON-LD FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.a,
              },
            })),
          }),
        }}
      />
    </div>
  );
}
