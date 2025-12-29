import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import GetStartedButton from "@/components/landing/GetStartedButton";
import { niches, nichesBySlug, type NicheSlug } from "@/lib/niches";

type Props = {
  params: { niche: string };
};

export function generateStaticParams() {
  return niches.map((n) => ({ niche: n.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const slug = params.niche as NicheSlug;
  const niche = nichesBySlug[slug];
  if (!niche) return {};

  return {
    title: `${niche.name} YouTube Growth Playbook`,
    description: niche.description,
    alternates: { canonical: `/niches/${niche.slug}` },
    openGraph: {
      title: `${niche.name} Creators | TubeGrow`,
      description: niche.description,
      type: "website",
    },
  };
}

export default function NichePage({ params }: Props) {
  const slug = params.niche as NicheSlug;
  const niche = nichesBySlug[slug];
  if (!niche) return notFound();

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Hero */}
      <section className="relative pt-24 pb-12 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10" />
        <div className="max-w-4xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">{niche.name} Playbook</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            TubeGrow for {niche.name} Creators
          </h1>
          <p className="text-lg text-zinc-400 max-w-3xl mx-auto mb-6">
            {niche.description}
          </p>
          <p className="text-zinc-500 text-sm mb-6">
            Free tier available. See pricing for details.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`${process.env.NEXT_PUBLIC_API_URL || ""}/auth/login`}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-7 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/niches"
              className="inline-flex items-center justify-center gap-2 bg-zinc-800 text-white px-7 py-3 rounded-lg font-semibold hover:bg-zinc-700 transition-colors"
            >
              All Niches
            </Link>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Common {niche.name} Growth Problems
            </h2>
            <ul className="space-y-3">
              {niche.painPoints.map((item) => (
                <li key={item} className="flex items-start gap-3 text-zinc-300">
                  <Check className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-zinc-900/60 border border-purple-500/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              How TubeGrow Helps
            </h2>
            <ul className="space-y-3">
              {niche.howTubeGrowHelps.map((item) => (
                <li key={item} className="flex items-start gap-3 text-white">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Examples */}
      <section className="py-16 px-4 bg-zinc-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Example Outputs for {niche.name}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Title Ideas
              </h3>
              <ul className="space-y-2 text-zinc-300 text-sm">
                {niche.exampleTitles.map((t) => (
                  <li key={t}>• {t}</li>
                ))}
              </ul>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Tags + Keywords
              </h3>
              <ul className="space-y-2 text-zinc-300 text-sm">
                {niche.exampleTags.map((t) => (
                  <li key={t}>• {t}</li>
                ))}
              </ul>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Shorts Hooks
              </h3>
              <ul className="space-y-2 text-zinc-300 text-sm">
                {niche.exampleShortsHooks.map((t) => (
                  <li key={t}>• {t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Internal links */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Tools That Matter for {niche.name}
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Link href="/youtube-analytics-tool" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-purple-500/50 transition-colors">
              <h3 className="text-white font-semibold mb-1 text-sm">Analytics Tool</h3>
              <p className="text-zinc-400 text-xs">Understand growth drivers.</p>
            </Link>
            <Link href="/youtube-seo-tool" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-purple-500/50 transition-colors">
              <h3 className="text-white font-semibold mb-1 text-sm">SEO Tool</h3>
              <p className="text-zinc-400 text-xs">Rank for your topics.</p>
            </Link>
            <Link href="/viral-clips-generator" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-purple-500/50 transition-colors">
              <h3 className="text-white font-semibold mb-1 text-sm">Viral Clips</h3>
              <p className="text-zinc-400 text-xs">Turn videos into Shorts.</p>
            </Link>
            <Link href="/blog" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-purple-500/50 transition-colors">
              <h3 className="text-white font-semibold mb-1 text-sm">Growth Guides</h3>
              <p className="text-zinc-400 text-xs">Playbooks for 2025.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Want TubeGrow for Your {niche.name} Channel?
            </h2>
            <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
              Start free with niche-aware analytics, SEO, and viral clips workflows.
            </p>
            <div className="max-w-md mx-auto">
              <GetStartedButton variant="hero" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

