import { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ArrowRight, Target } from "lucide-react";
import WaitlistForm from "@/components/landing/WaitlistForm";
import { niches } from "@/lib/niches";

export const metadata: Metadata = {
  title: "YouTube Niches",
  description:
    "Explore TubeGrow’s niche playbooks for creators. See how AI analytics, SEO, and viral clips adapt to Gaming, Fitness, Finance, Tech/AI, Education, Cooking, Beauty, Music, Entertainment, and Podcasts.",
  alternates: {
    canonical: "/niches",
  },
  openGraph: {
    title: "YouTube Niches | TubeGrow",
    description:
      "Niche‑specific growth strategies powered by TubeGrow’s AI tools.",
    type: "website",
  },
};

export default function NichesHubPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Hero */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10" />
        <div className="max-w-6xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">Niche Playbooks</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            TubeGrow for Every{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              YouTube Niche
            </span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-8">
            Different niches win in different ways. These playbooks show how TubeGrow’s AI analytics,
            YouTube SEO, and viral clips workflows adapt to your content style.
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
      </section>

      {/* Niche grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {niches.map((niche) => (
              <Link
                key={niche.slug}
                href={`/niches/${niche.slug}`}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
              >
                <h2 className="text-xl font-semibold text-white mb-2">{niche.name}</h2>
                <p className="text-sm text-purple-300 mb-3">{niche.tagline}</p>
                <p className="text-zinc-400 text-sm">{niche.description}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm text-white">
                  View playbook <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How to use */}
      <section className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <Target className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Start with Your Niche, Then Scale
          </h2>
          <p className="text-zinc-400 mb-8">
            Each niche page includes SEO examples, Shorts hooks, and the analytics signals that matter most
            for that creator type. Use it as a repeatable template for new uploads.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/youtube-analytics-tool"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
            >
              <h3 className="text-white font-semibold mb-2">Analytics Tool</h3>
              <p className="text-zinc-400 text-sm">Understand what drives growth.</p>
            </Link>
            <Link
              href="/youtube-seo-tool"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
            >
              <h3 className="text-white font-semibold mb-2">SEO Tool</h3>
              <p className="text-zinc-400 text-sm">Rank with optimized metadata.</p>
            </Link>
            <Link
              href="/viral-clips-generator"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
            >
              <h3 className="text-white font-semibold mb-2">Viral Clips</h3>
              <p className="text-zinc-400 text-sm">Turn long videos into Shorts.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Want Your Niche Playbook Inside TubeGrow?
            </h2>
            <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
              Join the waitlist for early access to niche‑aware analytics, SEO, and clip workflows.
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

