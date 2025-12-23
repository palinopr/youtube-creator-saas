import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, ArrowRight, Sparkles, BarChart3, Scissors, Zap, Brain, DollarSign, Crown } from "lucide-react";
import WaitlistForm from "@/components/landing/WaitlistForm";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "TubeBuddy vs VidIQ (2025 Comparison) - Which YouTube Tool is Best?",
  description:
    "TubeBuddy vs VidIQ: An honest 2025 comparison of features, pricing, and which YouTube tool is best for your channel. Plus, see how TubeGrow's AI-powered approach compares.",
  alternates: {
    canonical: "/tubebuddy-vs-vidiq",
  },
  keywords: [
    "tubebuddy vs vidiq",
    "vidiq vs tubebuddy",
    "tubebuddy or vidiq",
    "tubebuddy vs vidiq 2025",
    "vidiq vs tubebuddy reddit",
    "best youtube seo tool",
    "tubebuddy vs vidiq comparison",
    "which is better tubebuddy or vidiq",
    "youtube growth tools comparison",
    "tubebuddy vidiq comparison",
  ],
  openGraph: {
    title: "TubeBuddy vs VidIQ (2025) - Complete Comparison | TubeGrow",
    description:
      "Detailed comparison of TubeBuddy vs VidIQ in 2025. Compare features, pricing, pros and cons to choose the best YouTube tool.",
    type: "website",
  },
};

const comparisonData = [
  { feature: "AI Chat Assistant", tubebuddy: false, vidiq: "Limited", tubegrow: true },
  { feature: "Keyword Research", tubebuddy: true, vidiq: true, tubegrow: true },
  { feature: "SEO Score & Analysis", tubebuddy: true, vidiq: true, tubegrow: true },
  { feature: "Tag Suggestions", tubebuddy: true, vidiq: true, tubegrow: true },
  { feature: "Thumbnail A/B Testing", tubebuddy: true, vidiq: false, tubegrow: "Coming" },
  { feature: "Browser Extension", tubebuddy: true, vidiq: true, tubegrow: false },
  { feature: "Bulk Video Editing", tubebuddy: true, vidiq: false, tubegrow: false },
  { feature: "Competitor Analysis", tubebuddy: true, vidiq: true, tubegrow: true },
  { feature: "Viral Clip Detection", tubebuddy: false, vidiq: false, tubegrow: true },
  { feature: "AI Content Ideas", tubebuddy: false, vidiq: true, tubegrow: true },
  { feature: "Real-time Analytics", tubebuddy: true, vidiq: true, tubegrow: true },
  { feature: "Channel Audit", tubebuddy: true, vidiq: true, tubegrow: true },
  { feature: "Best Time to Post", tubebuddy: true, vidiq: true, tubegrow: true },
  { feature: "Modern UI/UX", tubebuddy: false, vidiq: "Partial", tubegrow: true },
];

const pricingData = {
  tubebuddy: {
    name: "TubeBuddy",
    free: "Free tier available",
    paid: "$4.99-$49/mo",
    bestFor: "Creators who want A/B testing and bulk editing",
    pros: ["A/B thumbnail testing", "Bulk editing tools", "Established platform", "Browser extension"],
    cons: ["Dated interface", "No AI insights", "Complex pricing tiers", "No clip generation"],
  },
  vidiq: {
    name: "VidIQ",
    free: "Free tier available",
    paid: "$7.50-$415/mo",
    bestFor: "Creators focused on keyword research and trends",
    pros: ["Strong keyword research", "Trend alerts", "AI content ideas", "Large database"],
    cons: ["Expensive higher tiers", "Limited AI chat", "No A/B testing", "Overwhelming features"],
  },
  tubegrow: {
    name: "TubeGrow",
    free: "Waitlist (Early Access)",
    paid: "TBA",
    bestFor: "Creators who want AI-first analytics and viral clips",
    pros: ["Full AI chat assistant", "Viral clip detection", "Modern interface", "Conversational insights"],
    cons: ["New platform", "No browser extension yet", "Some features in development"],
  },
};

const faqs = [
  {
    q: "Is TubeBuddy or VidIQ better for beginners?",
    a: "Both have free tiers suitable for beginners. VidIQ's free tier offers more features including keyword research and basic analytics. TubeBuddy's free tier is more limited but offers essential SEO tools. For complete beginners, VidIQ's free tier provides more value out of the box.",
  },
  {
    q: "Which has better keyword research: TubeBuddy or VidIQ?",
    a: "VidIQ is generally considered stronger for keyword research. It has a larger database, more detailed search volume estimates, and better trend tracking. TubeBuddy's keyword explorer is solid but not as comprehensive. However, TubeBuddy's tag suggestions are very popular among creators.",
  },
  {
    q: "Is TubeBuddy or VidIQ better for SEO?",
    a: "They're fairly equal for basic SEO. Both offer SEO scores, tag suggestions, and optimization tips. TubeBuddy has the edge with its thumbnail A/B testing for CTR optimization. VidIQ has stronger keyword research tools. Choose based on whether you prioritize testing (TubeBuddy) or research (VidIQ).",
  },
  {
    q: "Can I use both TubeBuddy and VidIQ together?",
    a: "Yes, many creators use both. Some use VidIQ for keyword research and TubeBuddy for A/B testing. However, running both browser extensions can slow down YouTube Studio. Consider which features you actually need before paying for both.",
  },
  {
    q: "Which is more affordable: TubeBuddy or VidIQ?",
    a: "TubeBuddy is generally more affordable for mid-tier plans. TubeBuddy Pro costs $4.99/mo vs VidIQ Pro at $7.50/mo. However, VidIQ's free tier offers more features. For advanced features, VidIQ's Boost plan ($49/mo) and TubeBuddy Legend ($49/mo) are similarly priced.",
  },
  {
    q: "What about TubeGrow vs TubeBuddy vs VidIQ?",
    a: "TubeGrow is a newer, AI-first platform that approaches YouTube analytics differently. Instead of dashboards and browser extensions, TubeGrow lets you ask questions in plain English and get actionable answers. It also offers viral clip detection that neither TubeBuddy nor VidIQ provide.",
  },
  {
    q: "Do I really need any of these tools?",
    a: "Not necessarily. YouTube Studio provides basic analytics for free. These tools become valuable when you're ready to optimize seriously, need keyword research, or want to save time with automation. Start free and upgrade when you hit limitations.",
  },
  {
    q: "Which tool do most successful YouTubers use?",
    a: "It varies widely. Many successful creators use VidIQ for research, some prefer TubeBuddy for testing, and many use neither. The tool matters less than your content quality and consistency. These tools optimize around the edges—they don't replace great content.",
  },
];

export default function TubeBuddyVsVidIQPage() {
  return (
    <main className="landing-bg min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <Crown className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">2025 Comparison Guide</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
            TubeBuddy vs VidIQ: Which is Better in 2025?
          </h1>

          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            The ultimate comparison of YouTube's two most popular growth tools.
            We break down <strong>features, pricing, pros & cons</strong>, and help you decide
            which tool is right for your channel.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a href="#comparison" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all">
              See Full Comparison <ArrowRight className="w-5 h-5" />
            </a>
            <Link href="/#waitlist" className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-lg font-semibold hover:bg-white/10 transition-all">
              Try TubeGrow (AI Alternative)
            </Link>
          </div>

          <p className="text-gray-500 text-sm">
            Updated December 2025 - Based on latest features and pricing
          </p>
        </div>
      </section>

      {/* Quick Summary */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Quick Summary</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* TubeBuddy Card */}
            <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-orange-400">TB</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">TubeBuddy</h3>
                  <p className="text-sm text-gray-400">Best for Testing</p>
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                The OG YouTube optimization tool. Strongest in A/B testing, bulk editing, and workflow automation.
              </p>
              <div className="text-orange-400 font-semibold">$4.99-$49/mo</div>
            </div>

            {/* VidIQ Card */}
            <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-400">VQ</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">VidIQ</h3>
                  <p className="text-sm text-gray-400">Best for Research</p>
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                Powerful keyword research and trend analysis. Better free tier and stronger data insights.
              </p>
              <div className="text-blue-400 font-semibold">$7.50-$49/mo</div>
            </div>

            {/* TubeGrow Card */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">TubeGrow</h3>
                  <p className="text-sm text-purple-400">AI-First Alternative</p>
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                Modern AI approach. Chat-based insights, viral clip detection, and conversational analytics.
              </p>
              <div className="text-purple-400 font-semibold">Waitlist Open</div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Feature Comparison */}
      <section id="comparison" className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">
            Feature-by-Feature Comparison
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            A detailed breakdown of what each tool offers. Green checkmarks indicate full support,
            yellow indicates partial/limited support.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-gray-400 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4">
                    <div className="font-bold text-lg text-orange-400">TubeBuddy</div>
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="font-bold text-lg text-blue-400">VidIQ</div>
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="font-bold text-lg text-purple-400">TubeGrow</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4 font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      {row.tubebuddy === true ? (
                        <Check className="w-6 h-6 text-green-400 mx-auto" />
                      ) : row.tubebuddy === false ? (
                        <X className="w-6 h-6 text-red-400/50 mx-auto" />
                      ) : (
                        <span className="text-yellow-400 text-sm">{row.tubebuddy}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.vidiq === true ? (
                        <Check className="w-6 h-6 text-green-400 mx-auto" />
                      ) : row.vidiq === false ? (
                        <X className="w-6 h-6 text-red-400/50 mx-auto" />
                      ) : (
                        <span className="text-yellow-400 text-sm">{row.vidiq}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.tubegrow === true ? (
                        <Check className="w-6 h-6 text-green-400 mx-auto" />
                      ) : row.tubegrow === false ? (
                        <X className="w-6 h-6 text-red-400/50 mx-auto" />
                      ) : (
                        <span className="text-yellow-400 text-sm">{row.tubegrow}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Pricing Comparison</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Both TubeBuddy and VidIQ offer free tiers. Here's how their paid plans compare.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {Object.values(pricingData).map((tool) => (
              <div key={tool.name} className={`p-6 rounded-xl border ${
                tool.name === "TubeGrow"
                  ? "bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/50"
                  : "bg-white/5 border-white/10"
              }`}>
                <h3 className="text-2xl font-bold mb-2">{tool.name}</h3>
                <div className="text-sm text-gray-400 mb-2">{tool.free}</div>
                <div className="text-3xl font-bold mb-4">{tool.paid}</div>
                <p className="text-gray-300 text-sm mb-4">{tool.bestFor}</p>

                <div className="mb-4">
                  <div className="text-green-400 text-sm font-semibold mb-2">Pros:</div>
                  <ul className="space-y-1">
                    {tool.pros.map((pro, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="text-red-400 text-sm font-semibold mb-2">Cons:</div>
                  <ul className="space-y-1">
                    {tool.cons.map((con, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <X className="w-4 h-4 text-red-400/50 mt-0.5 flex-shrink-0" />
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

      {/* Who Should Choose What */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Which Tool Should You Choose?</h2>

          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <h3 className="text-xl font-bold text-orange-400 mb-3">Choose TubeBuddy if you...</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  Want A/B testing for thumbnails to improve CTR
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  Need bulk editing tools to update many videos at once
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  Prefer working directly in YouTube Studio with a browser extension
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  Are on a tighter budget (cheaper mid-tier plans)
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <h3 className="text-xl font-bold text-blue-400 mb-3">Choose VidIQ if you...</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  Prioritize in-depth keyword research and search data
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  Want to track trends and find trending topics early
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  Need a robust free tier with more features
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  Want AI-powered content ideas (VidIQ Copilot)
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/50">
              <h3 className="text-xl font-bold text-purple-400 mb-3">Choose TubeGrow if you...</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  Want to ask questions about your channel in plain English
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  Need automatic viral clip detection for Shorts
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  Prefer a modern, clean interface over feature bloat
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  Want AI-first analytics that explain insights, not just show data
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            TubeBuddy vs VidIQ FAQ
          </h2>

          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="p-6 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-xl font-bold mb-3">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center p-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <h2 className="text-4xl font-bold mb-6">
            Want Something Different?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            TubeGrow offers an AI-first approach to YouTube analytics.
            No more digging through dashboards—just ask questions and get answers.
          </p>
          <WaitlistForm source="tubebuddy-vs-vidiq-page" />
        </div>
      </section>

      <Footer />

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
    </main>
  );
}
