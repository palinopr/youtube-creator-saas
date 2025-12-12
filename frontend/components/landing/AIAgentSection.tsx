"use client";

import Link from "next/link";
import { MessageSquareText, Search, Scissors, ArrowRight } from "lucide-react";

const cards = [
  {
    icon: MessageSquareText,
    title: "Ask your analytics",
    prompt: "“Why did my last video underperform?”",
    bullets: [
      "Pulls your real channel + video metrics",
      "Explains patterns in plain English",
      "Suggests the next best actions",
    ],
    href: "/youtube-analytics-tool",
    cta: "See analytics",
  },
  {
    icon: Search,
    title: "Fix YouTube SEO",
    prompt: "“Improve my title, description, and tags.”",
    bullets: [
      "SEO score + prioritized checklist",
      "Title/description/tag suggestions",
      "Option to apply updates when you choose",
    ],
    href: "/youtube-seo-tool",
    cta: "See SEO tool",
  },
  {
    icon: Scissors,
    title: "Find Shorts clips",
    prompt: "“Find 5 viral Shorts moments from this video.”",
    bullets: [
      "Timestamped clip suggestions",
      "Hooks + why each clip might work",
      "Optional rendering workflow in-app",
    ],
    href: "/viral-clips-generator",
    cta: "See clips",
  },
];

export default function AIAgentSection() {
  return (
    <section id="agent" className="py-20">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-brand-500 text-sm font-medium uppercase tracking-wider mb-3">
            AI Agent
          </p>
          <h2 className="text-4xl md:text-5xl font-medium text-white mb-4">
            One agent. Three growth jobs.
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            TubeGrow combines analytics, SEO, and Shorts into a single workflow so
            you always know what to do next.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="landing-card p-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-brand-500" />
                </div>
                <div className="text-white font-semibold mb-2">{card.title}</div>
                <div className="text-white/60 text-sm leading-relaxed mb-4">
                  <span className="text-white/40">Example prompt:</span>{" "}
                  <span className="text-white/80">{card.prompt}</span>
                </div>
                <ul className="space-y-2 mb-5">
                  {card.bullets.map((b) => (
                    <li key={b} className="text-sm text-white/60 flex gap-2">
                      <span className="text-brand-500">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={card.href}
                  className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
                >
                  {card.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link href="/tools" className="btn-cta-primary inline-flex items-center gap-2">
            Try free tools
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-white/40 text-sm mt-3">
            No login required for tool previews. Join the waitlist for full access.
          </p>
        </div>
      </div>
    </section>
  );
}

