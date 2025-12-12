import { Metadata } from "next";
import Link from "next/link";
import {
  Check,
  X,
  ArrowRight,
  Sparkles,
  BarChart3,
  Scissors,
  Zap,
  DollarSign,
  Brain,
  Video,
  TrendingUp,
  Search,
} from "lucide-react";

export const metadata: Metadata = {
  title: "VidIQ Alternative & TubeBuddy Alternative - Compare YouTube Tools",
  description:
    "Looking for a VidIQ alternative or TubeBuddy alternative? TubeGrow offers AI-powered YouTube analytics, SEO optimization, and viral clip generation at a better price. Compare features now.",
  keywords: [
    "vidiq alternative",
    "tubebuddy alternative",
    "vidiq vs tubebuddy",
    "youtube analytics tool",
    "youtube seo tool",
    "best youtube tools",
    "vidiq free alternative",
    "tubebuddy free alternative",
    "youtube growth tool",
    "youtube optimization tool",
  ],
  openGraph: {
    title: "VidIQ Alternative & TubeBuddy Alternative | TubeGrow",
    description:
      "Compare TubeGrow vs VidIQ vs TubeBuddy. See why creators are switching to AI-powered YouTube analytics.",
    type: "website",
  },
};

const competitors = [
  {
    name: "TubeGrow",
    highlight: true,
    logo: "🚀",
    tagline: "AI-Powered Growth",
    price: "$19/mo",
    features: {
      aiChat: true,
      viralClips: true,
      seoOptimization: true,
      analytics: true,
      keywordResearch: true,
      competitorAnalysis: true,
      thumbnailAnalysis: false,
      browserExtension: false,
      bulkEditing: false,
    },
    pros: [
      "AI chat assistant for channel insights",
      "Automatic viral clip detection",
      "Modern, intuitive dashboard",
      "Real-time analytics",
      "Affordable pricing",
    ],
    cons: ["Newer platform", "No browser extension yet"],
  },
  {
    name: "VidIQ",
    highlight: false,
    logo: "📊",
    tagline: "YouTube Certified",
    price: "$7.50-$415/mo",
    features: {
      aiChat: true,
      viralClips: false,
      seoOptimization: true,
      analytics: true,
      keywordResearch: true,
      competitorAnalysis: true,
      thumbnailAnalysis: true,
      browserExtension: true,
      bulkEditing: true,
    },
    pros: [
      "Browser extension",
      "YouTube certified partner",
      "Large keyword database",
      "Established platform",
    ],
    cons: [
      "Higher pricing for full features",
      "No viral clip generation",
      "Complex interface",
      "Limited AI capabilities",
    ],
  },
  {
    name: "TubeBuddy",
    highlight: false,
    logo: "🔧",
    tagline: "Channel Management",
    price: "$2.80-$49.80/mo",
    features: {
      aiChat: false,
      viralClips: false,
      seoOptimization: true,
      analytics: true,
      keywordResearch: true,
      competitorAnalysis: true,
      thumbnailAnalysis: true,
      browserExtension: true,
      bulkEditing: true,
    },
    pros: [
      "Affordable entry tier",
      "Browser extension",
      "Bulk video processing",
      "A/B testing tools",
    ],
    cons: [
      "No AI chat assistant",
      "No viral clip detection",
      "Dated interface",
      "Limited analytics depth",
    ],
  },
];

const featureList = [
  { key: "aiChat", name: "AI Chat Assistant", icon: Brain },
  { key: "viralClips", name: "Viral Clip Generator", icon: Scissors },
  { key: "seoOptimization", name: "SEO Optimization", icon: Search },
  { key: "analytics", name: "Analytics Dashboard", icon: BarChart3 },
  { key: "keywordResearch", name: "Keyword Research", icon: TrendingUp },
  { key: "competitorAnalysis", name: "Competitor Analysis", icon: Zap },
  { key: "thumbnailAnalysis", name: "Thumbnail Analysis", icon: Video },
  { key: "browserExtension", name: "Browser Extension", icon: Sparkles },
  { key: "bulkEditing", name: "Bulk Video Editing", icon: DollarSign },
];

const faqs = [
  {
    question: "Is TubeGrow better than VidIQ?",
    answer:
      "TubeGrow excels at AI-powered insights and viral clip generation, which VidIQ doesn't offer. If you prioritize AI chat assistance and automatic short-form content creation, TubeGrow is the better choice. VidIQ is better if you need a browser extension and thumbnail A/B testing.",
  },
  {
    question: "Is TubeGrow better than TubeBuddy?",
    answer:
      "TubeGrow offers more advanced AI features including an AI chat assistant and viral clip detection that TubeBuddy lacks. TubeBuddy is better for bulk video management and has a lower entry price, but TubeGrow provides more actionable AI-driven insights.",
  },
  {
    question: "What makes TubeGrow different from VidIQ and TubeBuddy?",
    answer:
      "TubeGrow is built with AI-first approach. You can ask questions about your channel in natural language, automatically detect viral moments in your videos, and get AI-powered content suggestions. Traditional tools like VidIQ and TubeBuddy focus more on SEO metrics and browser extensions.",
  },
  {
    question: "Can I use TubeGrow with VidIQ or TubeBuddy?",
    answer:
      "Yes! Many creators use TubeGrow alongside other tools. TubeGrow's AI insights complement the SEO data from VidIQ or TubeBuddy. Use TubeGrow for AI chat, viral clips, and deep analytics, while using browser extensions from other tools.",
  },
  {
    question: "Is there a free VidIQ or TubeBuddy alternative?",
    answer:
      "TubeGrow offers a free tier with basic analytics and limited AI queries. For creators who want AI-powered insights without a high monthly cost, TubeGrow's pricing is competitive with full VidIQ and TubeBuddy plans.",
  },
];

export default function AlternativesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-black to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            YouTube Tool Comparison
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Best{" "}
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              VidIQ Alternative
            </span>{" "}
            &{" "}
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              TubeBuddy Alternative
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Compare TubeGrow vs VidIQ vs TubeBuddy. See why thousands of creators
            are switching to AI-powered YouTube analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl font-semibold text-lg transition-all"
            >
              Try TubeGrow Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-lg transition-all"
            >
              View All Features
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Comparison Table */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4 text-white">
            Feature Comparison: TubeGrow vs VidIQ vs TubeBuddy
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            See how TubeGrow compares to other popular YouTube tools. We focus on
            AI-powered features that actually help you grow.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">
                    Feature
                  </th>
                  {competitors.map((comp) => (
                    <th
                      key={comp.name}
                      className={`text-center py-4 px-4 ${
                        comp.highlight
                          ? "text-red-400 font-bold"
                          : "text-gray-400 font-medium"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl">{comp.logo}</span>
                        <span>{comp.name}</span>
                        <span className="text-xs text-gray-500">{comp.price}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureList.map((feature) => (
                  <tr
                    key={feature.key}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <feature.icon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">{feature.name}</span>
                      </div>
                    </td>
                    {competitors.map((comp) => (
                      <td key={comp.name} className="text-center py-4 px-4">
                        {comp.features[feature.key as keyof typeof comp.features] ? (
                          <Check
                            className={`w-5 h-5 mx-auto ${
                              comp.highlight ? "text-green-400" : "text-gray-400"
                            }`}
                          />
                        ) : (
                          <X className="w-5 h-5 mx-auto text-gray-600" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Detailed Comparison Cards */}
      <section className="py-20 bg-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            Detailed Tool Comparison
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {competitors.map((comp) => (
              <div
                key={comp.name}
                className={`rounded-2xl p-6 ${
                  comp.highlight
                    ? "bg-gradient-to-br from-red-500/10 to-orange-500/10 border-2 border-red-500/30"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                {comp.highlight && (
                  <div className="text-center mb-4">
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">
                      RECOMMENDED
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <span className="text-4xl">{comp.logo}</span>
                  <h3 className="text-xl font-bold text-white mt-2">{comp.name}</h3>
                  <p className="text-gray-400 text-sm">{comp.tagline}</p>
                  <p className="text-2xl font-bold text-white mt-2">{comp.price}</p>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-green-400 mb-2">
                    Pros
                  </h4>
                  <ul className="space-y-2">
                    {comp.pros.map((pro) => (
                      <li
                        key={pro}
                        className="flex items-start gap-2 text-sm text-gray-300"
                      >
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-red-400 mb-2">Cons</h4>
                  <ul className="space-y-2">
                    {comp.cons.map((con) => (
                      <li
                        key={con}
                        className="flex items-start gap-2 text-sm text-gray-300"
                      >
                        <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose TubeGrow */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4 text-white">
            Why Creators Choose TubeGrow Over VidIQ & TubeBuddy
          </h2>
          <p className="text-gray-400 text-center mb-12">
            TubeGrow is built for the AI era. Here's what makes us different.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                AI Chat Assistant
              </h3>
              <p className="text-gray-400 text-sm">
                Ask questions about your channel in plain English. "Why did my
                last video underperform?" "What topics should I cover next?"
                Get instant, actionable answers.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4">
                <Scissors className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Viral Clip Generator
              </h3>
              <p className="text-gray-400 text-sm">
                Automatically detect the most engaging moments in your videos.
                Perfect for YouTube Shorts and TikTok. Neither VidIQ nor
                TubeBuddy offer this.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Modern Analytics
              </h3>
              <p className="text-gray-400 text-sm">
                A clean, modern dashboard that shows you exactly what matters.
                No cluttered interfaces or overwhelming data. Focus on growth.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Simple Pricing
              </h3>
              <p className="text-gray-400 text-sm">
                No confusing tiers or hidden features. Get full AI capabilities
                at one affordable price. No $415/month enterprise plans needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Ready to Try the Best VidIQ & TubeBuddy Alternative?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of creators using TubeGrow's AI-powered tools to grow
            their channels faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl font-semibold text-lg transition-all"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-lg transition-all"
            >
              See All Features
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
