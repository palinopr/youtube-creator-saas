import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight, Sparkles, BarChart3, Scissors, Zap, Brain } from "lucide-react";
import GetStartedButton from "@/components/landing/GetStartedButton";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "TubeBuddy Alternative - AI-Powered YouTube Growth Tool",
  description:
    "Looking for a TubeBuddy alternative? TubeGrow offers AI-powered analytics, viral clip generation, and advanced SEO optimization. Compare features, pricing, and see why creators are switching.",
  alternates: {
    canonical: "/tubebuddy-alternative",
  },
  keywords: [
    "tubebuddy alternative",
    "tubebuddy alternative free",
    "best tubebuddy alternative",
    "tubebuddy competitor",
    "youtube growth tool",
    "youtube analytics tool",
    "youtube seo tool",
    "ai youtube tool",
    "viral clips generator",
    "youtube optimization software",
  ],
  openGraph: {
    title: "TubeBuddy Alternative - AI-Powered YouTube Growth | TubeGrow",
    description:
      "Discover a modern TubeBuddy alternative with AI-powered insights, viral clip detection, and advanced analytics for YouTube creators.",
    type: "website",
  },
};

export default function TubeBuddyAlternativePage() {
  return (
    <main className="landing-bg min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">The Modern TubeBuddy Alternative</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            TubeBuddy Alternative Built for the AI Era
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            While TubeBuddy offers solid YouTube tools, TubeGrow takes it further with <strong>AI-powered analytics</strong>, 
            <strong> automatic viral clip detection</strong>, and <strong>intelligent growth recommendations</strong>. 
            Get the insights you need without the complexity.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href={`${process.env.NEXT_PUBLIC_API_URL || ""}/auth/login`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-lg font-semibold hover:bg-white/10 transition-all"
            >
              See Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Why Switch Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Why Creators Are Switching from TubeBuddy to TubeGrow
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI-Powered Insights</h3>
              <p className="text-gray-400">
                Chat with an AI agent that understands your channel data and provides actionable recommendations. 
                No more digging through dashboards—just ask questions in plain English.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                <Scissors className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Viral Clip Detection</h3>
              <p className="text-gray-400">
                Automatically identify the most engaging moments in your long-form videos. 
                Turn them into Shorts with AI-powered clip generation—something TubeBuddy doesn't offer.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Modern Analytics</h3>
              <p className="text-gray-400">
                Clean, intuitive dashboards that show what matters. Real-time data sync with YouTube Analytics API 
                for up-to-the-minute performance tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            TubeGrow vs TubeBuddy: Feature Comparison
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-gray-400 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4">
                    <div className="font-bold text-lg">TubeGrow</div>
                    <div className="text-sm text-purple-400">Modern AI Platform</div>
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="font-bold text-lg">TubeBuddy</div>
                    <div className="text-sm text-gray-400">Traditional Tool</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "AI Chat Assistant", tubegrow: true, tubebuddy: false },
                  { feature: "Viral Clip Generation", tubegrow: true, tubebuddy: false },
                  { feature: "Real-Time Analytics", tubegrow: true, tubebuddy: true },
                  { feature: "SEO Optimization", tubegrow: true, tubebuddy: true },
                  { feature: "Keyword Research", tubegrow: true, tubebuddy: true },
                  { feature: "A/B Testing", tubegrow: false, tubebuddy: true },
                  { feature: "Bulk Editing", tubegrow: false, tubebuddy: true },
                  { feature: "Browser Extension", tubegrow: false, tubebuddy: true },
                  { feature: "Modern UI/UX", tubegrow: true, tubebuddy: false },
                  { feature: "AI-Powered Recommendations", tubegrow: true, tubebuddy: false },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4 font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      {row.tubegrow ? (
                        <Check className="w-6 h-6 text-green-400 mx-auto" />
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.tubebuddy ? (
                        <Check className="w-6 h-6 text-blue-400 mx-auto" />
                      ) : (
                        <span className="text-gray-600">—</span>
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
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/50">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">TubeGrow</h3>
                <div className="text-4xl font-bold mb-2">Free - $149/mo</div>
                <p className="text-gray-400">Free tier available, no credit card</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>AI-powered analytics & insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Automatic viral clip detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Real-time channel analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>SEO optimization tools</span>
                </li>
              </ul>
              <Link
                href={`${process.env.NEXT_PUBLIC_API_URL || ""}/auth/login`}
                className="block w-full text-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Start Free
              </Link>
            </div>

            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">TubeBuddy</h3>
                <div className="text-4xl font-bold mb-2">$9-$59/mo</div>
                <p className="text-gray-400">Multiple paid tiers</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Browser extension</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>A/B testing (higher tiers)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Bulk editing tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Keyword research</span>
                </li>
              </ul>
              <a
                href="https://www.tubebuddy.com/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-6 py-3 bg-white/10 border border-white/20 rounded-lg font-semibold hover:bg-white/20 transition-all"
              >
                View TubeBuddy Pricing
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-bold mb-3">Is TubeGrow better than TubeBuddy?</h3>
              <p className="text-gray-400">
                TubeGrow offers modern AI-powered features that TubeBuddy doesn't have, like conversational analytics 
                and automatic viral clip detection. However, TubeBuddy has more established features like browser extensions 
                and A/B testing. The best choice depends on whether you prioritize AI insights or traditional optimization tools.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-bold mb-3">Can I use TubeGrow for free?</h3>
              <p className="text-gray-400">
                Yes! TubeGrow offers a free tier with 10 video analyses and 20 AI queries per month.
                No credit card required to get started. Upgrade anytime for more features and higher limits.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-bold mb-3">Does TubeGrow have a browser extension?</h3>
              <p className="text-gray-400">
                Not yet. We're focused on building the best web-based analytics platform first. A browser extension 
                may come in the future based on user feedback.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-bold mb-3">What makes TubeGrow's AI different?</h3>
              <p className="text-gray-400">
                TubeGrow uses advanced language models to analyze your channel data and provide conversational insights. 
                Instead of manually digging through charts and reports, you can simply ask questions like "What's my 
                best performing video this month?" or "How can I improve my click-through rate?"
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-bold mb-3">Can I migrate from TubeBuddy to TubeGrow?</h3>
              <p className="text-gray-400">
                Yes! TubeGrow connects directly to your YouTube channel via the official YouTube Analytics API. 
                There's no data migration needed—just connect your channel and start using TubeGrow's features immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center p-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Experience the Future of YouTube Analytics?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join creators using TubeGrow—the AI-powered TubeBuddy alternative.
          </p>
          <GetStartedButton variant="inline" text="Start Free Today" />
        </div>
      </section>

      <Footer />
    </main>
  );
}
