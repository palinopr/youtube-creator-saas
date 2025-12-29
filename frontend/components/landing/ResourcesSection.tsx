"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, FileText, Scissors, Search } from "lucide-react";

const tools = [
  {
    href: "/tools/youtube-seo-score",
    title: "YouTube SEO Score (Lite)",
    description: "Quick score + prioritized fixes for titles, descriptions, and tags.",
    icon: Search,
  },
  {
    href: "/tools/youtube-metadata-generator",
    title: "Metadata Generator (Lite)",
    description: "Generate titles, descriptions, tags, and hashtags you can paste into Studio.",
    icon: FileText,
  },
  {
    href: "/tools/shorts-clip-finder",
    title: "Shorts Clip Finder (Lite)",
    description: "Find 3–5 timestamped Shorts moments from captions.",
    icon: Scissors,
  },
  {
    href: "/tools/youtube-channel-snapshot",
    title: "Channel Snapshot (Lite)",
    description: "Fast public read on a channel’s recent uploads and stats.",
    icon: BarChart3,
  },
];

const guides = [
  {
    href: "/blog/youtube-seo-optimization-2025-checklist",
    title: "YouTube SEO Optimization (2025 Checklist)",
    description: "A repeatable metadata checklist for every upload.",
  },
  {
    href: "/blog/how-to-start-youtube-channel-beginners-guide",
    title: "How to Start a YouTube Channel (2025)",
    description: "Step-by-step setup, niche, and growth plan for beginners.",
  },
  {
    href: "/blog/best-times-to-post-youtube-2025",
    title: "Best Times to Post on YouTube (2025)",
    description: "How to pick posting times using real audience signals.",
  },
];

export default function ResourcesSection() {
  return (
    <section className="py-20 border-t border-white/5" id="resources">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-brand-500 text-sm font-medium uppercase tracking-wider mb-3">
            Resources
          </p>
          <h2 className="text-3xl md:text-4xl font-medium text-white mb-4">
            Free tools + practical guides for 2025
          </h2>
          <p className="text-white/60 max-w-3xl mx-auto">
            Use the lite tools for quick wins, then follow the guides to turn improvements into
            repeatable workflows. Sign up free to unlock the full TubeGrow experience.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="landing-card p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h3 className="text-xl font-semibold text-white">Free Lite Tools</h3>
              <Link
                href="/tools"
                className="text-white/70 hover:text-white text-sm inline-flex items-center gap-2"
              >
                Browse all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {tools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <tool.icon className="w-5 h-5 text-brand-500" />
                    </div>
                    <div className="text-white font-semibold">{tool.title}</div>
                  </div>
                  <p className="text-white/60 text-sm">{tool.description}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="landing-card p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h3 className="text-xl font-semibold text-white">Latest Guides</h3>
              <Link
                href="/blog"
                className="text-white/70 hover:text-white text-sm inline-flex items-center gap-2"
              >
                Read more <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {guides.map((guide) => (
                <Link
                  key={guide.href}
                  href={guide.href}
                  className="block bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <div className="text-white font-semibold mb-1">{guide.title}</div>
                  <p className="text-white/60 text-sm">{guide.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

