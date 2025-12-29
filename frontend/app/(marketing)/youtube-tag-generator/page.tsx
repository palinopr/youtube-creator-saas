import { Metadata } from "next";
import Link from "next/link";
import {
  Tags,
  Sparkles,
  Target,
  Zap,
  TrendingUp,
  Search,
  Check,
  ArrowRight,
  Clock,
  Hash,
  Copy,
  BarChart3,
} from "lucide-react";
import GetStartedButton from "@/components/landing/GetStartedButton";

export const metadata: Metadata = {
  title: "YouTube Tag Generator - AI-Powered Tags That Boost Rankings",
  description:
    "Free AI YouTube tag generator that creates SEO-optimized tags for your videos. Generate relevant tags, find trending keywords, and improve video discoverability in 2025.",
  alternates: {
    canonical: "/youtube-tag-generator",
  },
  keywords: [
    "youtube tag generator",
    "youtube tags generator free",
    "video tag generator",
    "youtube tag finder",
    "youtube keyword tags",
    "best youtube tags",
    "youtube tags for views",
    "youtube tag extractor",
    "youtube tag ideas",
    "seo tags youtube",
    "youtube hashtag generator",
    "video tags generator",
  ],
  openGraph: {
    title: "YouTube Tag Generator | TubeGrow",
    description:
      "Generate SEO-optimized YouTube tags with AI. Find the right tags to help your videos rank higher and get discovered.",
    type: "website",
  },
};

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Tag Generation",
    description:
      "Our AI analyzes your video topic and generates tags based on what actually ranks in your niche.",
  },
  {
    icon: Search,
    title: "Keyword Research Built-In",
    description:
      "Every tag comes with search volume estimates so you know which keywords are worth targeting.",
  },
  {
    icon: Target,
    title: "Competitor Tag Analysis",
    description:
      "See what tags top-ranking videos in your niche use and find gaps you can exploit.",
  },
  {
    icon: Hash,
    title: "Hashtag Suggestions",
    description:
      "Get the optimal 2-3 hashtags for your video based on your topic and niche trends.",
  },
  {
    icon: TrendingUp,
    title: "Trending Tag Detection",
    description:
      "Identify trending tags in your niche to capitalize on timely search traffic.",
  },
  {
    icon: BarChart3,
    title: "Tag Performance Tracking",
    description:
      "Track which tags drive the most impressions and clicks over time.",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Enter Your Video Topic",
    description: "Tell us what your video is about or paste your title.",
  },
  {
    step: "2",
    title: "AI Analyzes Top Videos",
    description: "We scan ranking videos to find effective tags.",
  },
  {
    step: "3",
    title: "Get Optimized Tag Set",
    description: "Receive 15-30 relevant tags sorted by search volume.",
  },
  {
    step: "4",
    title: "Copy and Publish",
    description: "One-click copy to paste directly into YouTube Studio.",
  },
];

const tagCategories = [
  {
    name: "Primary Tags",
    count: "1-3 tags",
    description: "Exact match keywords that define your video's core topic.",
    example: "youtube seo, youtube seo 2025",
  },
  {
    name: "Variant Tags",
    count: "5-10 tags",
    description: "Close variations and related search terms.",
    example: "youtube optimization, video seo tips, rank youtube videos",
  },
  {
    name: "Broad Tags",
    count: "5-10 tags",
    description: "Wider category tags that help YouTube understand context.",
    example: "youtube tips, content creator, youtube growth",
  },
  {
    name: "Long-tail Tags",
    count: "5-10 tags",
    description: "Specific phrases with lower competition but high intent.",
    example: "how to optimize youtube videos for search, youtube seo for beginners 2025",
  },
];

const useCases = [
  "Find high-volume, low-competition tags for new videos.",
  "Analyze competitor tags and find what you're missing.",
  "Generate consistent tag sets across your video library.",
  "Discover trending tags to capitalize on timely traffic.",
  "Optimize old videos with better tag targeting.",
  "Create niche-specific tag templates for faster uploads.",
];

const faqs = [
  {
    q: "Do YouTube tags still matter in 2025?",
    a: "Yes, but they're not the main ranking factor. Tags help YouTube understand your video's topic, especially for niche or technical content. They're most valuable for clarifying ambiguous titles and catching misspellings. Focus on tags as topic clarification, not as a magic ranking hack.",
  },
  {
    q: "How many tags should I use on YouTube?",
    a: "Use 10-15 highly relevant tags. Quality matters more than quantity. YouTube allows up to 500 characters for tags, but stuffing irrelevant tags can hurt your video. Focus on tags that accurately describe your content and target real search terms.",
  },
  {
    q: "What's the difference between tags and hashtags?",
    a: "Tags are hidden metadata that help YouTube categorize your video. Hashtags appear above your video title and are clickable - viewers can tap them to find related videos. Use 2-3 relevant hashtags in your description for discoverability.",
  },
  {
    q: "Should I use the same tags on every video?",
    a: "No. Each video should have tags specific to its topic. However, you can have a small set of channel-level tags (your niche, channel name) that appear on all videos. The majority of tags should be unique to each video's content.",
  },
  {
    q: "How does TubeGrow find the best tags?",
    a: "We analyze top-ranking videos for your target keywords to see what tags they use. Then we cross-reference with search volume data to prioritize tags that have real demand. The result is a tag set optimized for both relevance and discoverability.",
  },
  {
    q: "Can I see what tags competitors use?",
    a: "Yes! TubeGrow's tag extractor shows you the exact tags any public YouTube video uses. Enter a video URL and we'll reveal all their tags along with search volume estimates for each.",
  },
  {
    q: "What about YouTube Shorts tags?",
    a: "Shorts rely more heavily on hashtags than traditional tags. Use 3-5 relevant hashtags in your Shorts description. TubeGrow suggests both tags and hashtags optimized for the Shorts feed algorithm.",
  },
  {
    q: "How often should I update my video tags?",
    a: "Update tags when you see declining impressions or when new relevant keywords emerge. Some creators refresh tags quarterly on their best-performing videos. Always keep tags accurate to your content - misleading tags can hurt your channel.",
  },
];

export default function YouTubeTagGeneratorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Hero */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-blue-500/10" />
        <div className="max-w-6xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
            <Tags className="w-4 h-4 text-green-400" />
            <span className="text-green-300 text-sm font-medium">AI Tag Generator</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            YouTube Tag Generator for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
              Better Rankings
            </span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-8">
            Generate SEO-optimized YouTube tags with AI. Find high-volume keywords, analyze competitor tags,
            and get the perfect tag set for every video.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`${process.env.NEXT_PUBLIC_API_URL || ""}/auth/login`}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/tools/youtube-metadata-generator"
              className="inline-flex items-center justify-center gap-2 bg-zinc-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-zinc-700 transition-colors"
            >
              Try Free Lite Tool
            </Link>
          </div>
          <p className="text-zinc-500 text-sm mt-4">
            Free tier available. No credit card required.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Use TubeGrow for YouTube Tags?
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Not random keywords - data-driven tags based on what actually ranks.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-green-500/50 transition-colors"
              >
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tag Categories */}
      <section className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              The Perfect Tag Structure
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              TubeGrow generates a balanced mix of tag types for maximum discoverability.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {tagCategories.map((category) => (
              <div
                key={category.name}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                  <span className="text-green-400 text-sm font-medium">{category.count}</span>
                </div>
                <p className="text-zinc-400 text-sm mb-3">{category.description}</p>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <code className="text-green-300 text-xs">{category.example}</code>
                </div>
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
              Get optimized tags in under 30 seconds.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-12 h-12 mx-auto bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-green-300 font-bold">{step.step}</span>
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
            Use TubeGrow Tag Generator To
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
            YouTube Tag Generator FAQ
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
            Complete your YouTube SEO workflow.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/youtube-title-generator"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-green-500/50 transition-colors"
            >
              <h3 className="text-white font-semibold mb-2">Title Generator</h3>
              <p className="text-zinc-400 text-sm">
                AI-powered click-worthy titles.
              </p>
            </Link>
            <Link
              href="/youtube-description-generator"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-green-500/50 transition-colors"
            >
              <h3 className="text-white font-semibold mb-2">Description Generator</h3>
              <p className="text-zinc-400 text-sm">
                SEO-optimized video descriptions.
              </p>
            </Link>
            <Link
              href="/youtube-hashtag-generator"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-green-500/50 transition-colors"
            >
              <h3 className="text-white font-semibold mb-2">Hashtag Generator</h3>
              <p className="text-zinc-400 text-sm">
                Trending hashtags for visibility.
              </p>
            </Link>
            <Link
              href="/youtube-seo-tool"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-green-500/50 transition-colors"
            >
              <h3 className="text-white font-semibold mb-2">Full SEO Suite</h3>
              <p className="text-zinc-400 text-sm">
                Complete metadata optimization.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-2xl p-12">
            <Tags className="w-16 h-16 text-green-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Stop Guessing on Tags
            </h2>
            <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
              Start using TubeGrow's AI tag generator and rank for the right keywords.
            </p>
            <div className="max-w-md mx-auto">
              <GetStartedButton variant="inline" text="Start Free Today" />
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
