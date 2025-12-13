import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight, Sparkles, BarChart3, Scissors, Zap, Brain, TrendingUp } from "lucide-react";
import WaitlistForm from "@/components/landing/WaitlistForm";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "VidIQ Alternative - AI-Powered YouTube Analytics & Growth",
  description:
    "Looking for a VidIQ alternative? TubeGrow offers AI-powered analytics, conversational insights, and viral clip generation. Compare features and pricing to see why creators are making the switch.",
  alternates: {
    canonical: "/vidiq-alternative",
  },
  keywords: [
    "vidiq alternative",
    "vidiq alternative free",
    "best vidiq alternative",
    "vidiq competitor",
    "youtube analytics tool",
    "youtube growth software",
    "youtube seo tool",
    "ai youtube analytics",
    "viral clips generator",
    "youtube optimization tool",
  ],
  openGraph: {
    title: "VidIQ Alternative - AI-Powered YouTube Growth | TubeGrow",
    description:
      "Discover a modern VidIQ alternative with conversational AI analytics, automatic viral clip detection, and intelligent growth recommendations.",
    type: "website",
  },
};

export default function VidIQAlternativePage() {
  return (
    <main className="landing-bg min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">The Intelligent VidIQ Alternative</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
            VidIQ Alternative with True AI Intelligence
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            VidIQ provides great analytics, but TubeGrow takes YouTube growth to the next level with 
            <strong> conversational AI insights</strong>, <strong>automatic viral moment detection</strong>, 
            and <strong>intelligent recommendations</strong> that actually understand your content strategy.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/#waitlist"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
            >
              Join Waitlist <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/alternatives"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-lg font-semibold hover:bg-white/10 transition-all"
            >
              Compare All Tools
            </Link>
          </div>
        </div>
      </section>

      {/* Why Switch Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Why YouTube Creators Choose TubeGrow Over VidIQ
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Conversational AI Analytics</h3>
              <p className="text-gray-400">
                Ask questions in plain English and get instant, actionable answers. "Why did my views drop last week?" 
                "Which video should I promote?" Our AI understands context and provides intelligent recommendations.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                <Scissors className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Automatic Viral Clip Detection</h3>
              <p className="text-gray-400">
                AI analyzes your long-form content to find the most engaging moments automatically. 
                Turn them into Shorts with one click—a feature VidIQ doesn't offer natively.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Simpler, Cleaner Interface</h3>
              <p className="text-gray-400">
                No more information overload. TubeGrow shows you exactly what matters with a modern, 
                intuitive dashboard designed for creators who want insights, not complexity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            TubeGrow vs VidIQ: Head-to-Head Comparison
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-gray-400 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4">
                    <div className="font-bold text-lg">TubeGrow</div>
                    <div className="text-sm text-blue-400">AI-First Platform</div>
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="font-bold text-lg">VidIQ</div>
                    <div className="text-sm text-gray-400">Traditional Analytics</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Conversational AI Assistant", tubegrow: true, vidiq: "Limited" },
                  { feature: "Viral Clip Generation", tubegrow: true, vidiq: false },
                  { feature: "Real-Time Analytics", tubegrow: true, vidiq: true },
                  { feature: "SEO Optimization", tubegrow: true, vidiq: true },
                  { feature: "Keyword Research", tubegrow: true, vidiq: true },
                  { feature: "Thumbnail Analysis", tubegrow: "Coming", vidiq: true },
                  { feature: "Browser Extension", tubegrow: false, vidiq: true },
                  { feature: "Competitor Tracking", tubegrow: "Coming", vidiq: true },
                  { feature: "Modern UI/UX", tubegrow: true, vidiq: false },
                  { feature: "Context-Aware Recommendations", tubegrow: true, vidiq: false },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-4 px-4 font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      {row.tubegrow === true ? (
                        <Check className="w-6 h-6 text-green-400 mx-auto" />
                      ) : row.tubegrow === false ? (
                        <span className="text-gray-600">—</span>
                      ) : (
                        <span className="text-sm text-yellow-400">{row.tubegrow}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.vidiq === true ? (
                        <Check className="w-6 h-6 text-blue-400 mx-auto" />
                      ) : row.vidiq === false ? (
                        <span className="text-gray-600">—</span>
                      ) : (
                        <span className="text-sm text-yellow-400">{row.vidiq}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Perfect For These Use Cases</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-2xl font-bold mb-4">🎯 Growing Channels (1K-100K subs)</h3>
              <p className="text-gray-400 mb-4">
                TubeGrow's AI helps you understand what's working and what's not without overwhelming you with data. 
                Get clear, actionable insights that help you grow faster.
              </p>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Identify your best-performing content patterns</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Find viral moments in your existing videos</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Get SEO recommendations that actually work</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-2xl font-bold mb-4">🚀 Content Creators Who Value Time</h3>
              <p className="text-gray-400 mb-4">
                Stop spending hours analyzing dashboards. Ask TubeGrow's AI what you need to know and get instant answers 
                so you can focus on creating great content.
              </p>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Chat-based analytics saves hours per week</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Automated clip detection for Shorts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>No learning curve—just ask questions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Transparent Pricing Comparison</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/50">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">TubeGrow</h3>
                <div className="text-4xl font-bold mb-2">Coming Soon</div>
                <p className="text-gray-400">Join waitlist for early access pricing</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Conversational AI analytics</span>
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
                  <span>SEO optimization & keyword research</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Modern, intuitive interface</span>
                </li>
              </ul>
              <Link
                href="/#waitlist"
                className="block w-full text-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Join Waitlist
              </Link>
            </div>

            <div className="p-8 rounded-xl bg-white/5 border border-white/10">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">VidIQ</h3>
                <div className="text-4xl font-bold mb-2">$7.50-$39/mo</div>
                <p className="text-gray-400">Plus higher-tier plans available</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Browser extension</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Keyword research tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Competitor tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Thumbnail analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Basic AI features (limited)</span>
                </li>
              </ul>
              <a
                href="https://vidiq.com/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-6 py-3 bg-white/10 border border-white/20 rounded-lg font-semibold hover:bg-white/20 transition-all"
              >
                View VidIQ Pricing
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Common Questions</h2>
          
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-bold mb-3">Is TubeGrow better than VidIQ?</h3>
              <p className="text-gray-400">
                TubeGrow excels in AI-powered insights and conversational analytics, making it easier to understand 
                your channel performance without drowning in data. VidIQ has more established features like browser 
                extensions and competitor tracking. Choose TubeGrow if you want intelligent, context-aware recommendations; 
                choose VidIQ if you need comprehensive traditional analytics tools.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-bold mb-3">Does TubeGrow offer a free plan?</h3>
              <p className="text-gray-400">
                TubeGrow is currently in development. Join our waitlist to be notified when we launch and get access 
                to exclusive early-bird pricing. We're committed to offering great value for YouTube creators.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-bold mb-3">Can I use both TubeGrow and VidIQ?</h3>
              <p className="text-gray-400">
                Absolutely! Many creators use multiple tools. TubeGrow's AI analytics complement VidIQ's browser 
                extension and keyword research features. However, most creators find that TubeGrow's intelligent 
                insights reduce the need for multiple tools.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-bold mb-3">How does TubeGrow's AI work?</h3>
              <p className="text-gray-400">
                TubeGrow uses advanced language models trained on YouTube growth patterns. It analyzes your channel 
                data in real-time and provides conversational insights. You can ask questions like "What's my best 
                upload time?" or "Which topics should I cover next?" and get intelligent, data-driven answers.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-bold mb-3">Is my YouTube data safe with TubeGrow?</h3>
              <p className="text-gray-400">
                Yes. TubeGrow connects to your channel via YouTube's official OAuth API. We only request read-only 
                access to your analytics data. We never post on your behalf, and your data is encrypted and secure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center p-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
          <h2 className="text-4xl font-bold mb-6">
            Experience YouTube Analytics Powered by True AI
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join the waitlist for TubeGrow and discover what intelligent YouTube analytics really means.
          </p>
          <WaitlistForm source="vidiq-alternative-page" />
        </div>
      </section>

      <Footer />
    </main>
  );
}
