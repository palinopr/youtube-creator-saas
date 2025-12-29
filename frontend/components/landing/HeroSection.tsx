"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import GetStartedButton from "./GetStartedButton";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 overflow-hidden">
      {/* Background glow effect */}
      <div className="hero-glow" />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6 text-center">
        {/* Trust badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
          <Users size={16} className="text-brand-500" />
          <span className="text-sm text-white/80">
            Free tier available &mdash; <span className="text-white font-semibold">no credit card required</span>
          </span>
        </div>

        {/* Main headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium text-white leading-tight max-w-4xl mx-auto mb-6">
          Meet your{" "}
          <span className="text-gradient">AI agent</span>
          {" "}for YouTube analytics, SEO, and Shorts
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
          Connect your channel, ask questions about your performance, get SEO fixes for every video,
          and generate timestamped Shorts clip ideas.
        </p>

        {/* CTA */}
        <div className="mb-16">
          <GetStartedButton variant="hero" />
          <div className="mt-6 flex items-center justify-center gap-4 text-sm">
            <Link
              href="/pricing"
              className="text-white/70 hover:text-white transition-colors"
            >
              See pricing
            </Link>
            <span className="text-white/20">•</span>
            <Link
              href="/tools"
              className="text-white/70 hover:text-white transition-colors"
            >
              Try free tools
            </Link>
            <span className="text-white/20">•</span>
            <a
              href="#agent"
              className="text-white/70 hover:text-white transition-colors"
            >
              See the AI agent
            </a>
          </div>
        </div>

        {/* Product screenshot/video placeholder */}
        <div className="relative max-w-5xl mx-auto">
          {/* Glow behind the image */}
          <div className="absolute -inset-4 bg-gradient-to-r from-brand-500/20 via-accent-500/20 to-brand-500/20 rounded-3xl blur-3xl opacity-50" />

          {/* Dashboard preview - illustration */}
          <div className="relative landing-card overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-[#0f0f0f] to-[#1a1a2e] p-4 md:p-6">
              <div className="absolute top-4 right-4">
                <span className="text-[11px] text-white/60 bg-black/40 border border-white/10 px-2 py-1 rounded-full">
                  Product preview (illustration)
                </span>
              </div>

              {/* Window controls */}
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>

              {/* Dashboard mockup content */}
              <div className="mt-6 grid grid-cols-12 gap-3 md:gap-4 h-[calc(100%-2rem)]">
                {/* Sidebar mockup */}
                <div className="col-span-2 bg-white/5 rounded-lg p-2 hidden md:block">
                  <div className="w-full h-8 bg-brand-500/30 rounded mb-3" />
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-full h-6 bg-white/10 rounded" />
                    ))}
                  </div>
                </div>

                {/* Main content mockup */}
                <div className="col-span-12 md:col-span-10 space-y-3">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    <div className="bg-gradient-to-br from-blue-600/30 to-cyan-600/30 rounded-lg p-2 md:p-3">
                      <div className="w-8 h-2 bg-white/30 rounded mb-2" />
                      <div className="w-12 md:w-16 h-4 md:h-6 bg-white/50 rounded" />
                    </div>
                    <div className="bg-gradient-to-br from-red-600/30 to-orange-600/30 rounded-lg p-2 md:p-3">
                      <div className="w-8 h-2 bg-white/30 rounded mb-2" />
                      <div className="w-12 md:w-16 h-4 md:h-6 bg-white/50 rounded" />
                    </div>
                    <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-lg p-2 md:p-3">
                      <div className="w-8 h-2 bg-white/30 rounded mb-2" />
                      <div className="w-12 md:w-16 h-4 md:h-6 bg-white/50 rounded" />
                    </div>
                  </div>

                  {/* Chart mockup */}
                  <div className="bg-white/5 rounded-lg p-3 flex-1 min-h-[120px] md:min-h-[180px]">
                    <div className="w-20 h-3 bg-white/20 rounded mb-4" />
                    <div className="flex items-end justify-between h-[80px] md:h-[120px] gap-1">
                      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-brand-500/60 to-brand-500/20 rounded-t"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Bottom row */}
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div className="bg-white/5 rounded-lg p-2 md:p-3">
                      <div className="w-16 h-2 bg-white/20 rounded mb-2" />
                      <div className="space-y-1.5">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-6 h-6 md:w-8 md:h-8 bg-white/10 rounded" />
                            <div className="flex-1 h-2 bg-white/10 rounded" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 md:p-3">
                      <div className="w-16 h-2 bg-white/20 rounded mb-2" />
                      <div className="space-y-1.5">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-6 h-6 md:w-8 md:h-8 bg-white/10 rounded" />
                            <div className="flex-1 h-2 bg-white/10 rounded" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
