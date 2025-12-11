"use client";

import Link from "next/link";
import { Play, ArrowRight, Users } from "lucide-react";

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
            Trusted by <span className="text-white font-semibold">10,000+</span> creators
          </span>
        </div>

        {/* Main headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium text-white leading-tight max-w-4xl mx-auto mb-6">
          Maximize Your{" "}
          <span className="text-gradient">YouTube Growth</span>
          {" "}with AI
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
          The easiest way to analyze your channel, find viral opportunities,
          and optimize every video for maximum reach and engagement.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/dashboard" className="btn-cta-primary flex items-center gap-2">
            Start Free Trial
            <ArrowRight size={18} />
          </Link>
          <button className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group">
            <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Play size={16} className="text-white ml-0.5" />
            </span>
            <span className="font-medium">Watch Demo</span>
          </button>
        </div>

        {/* Product screenshot/video placeholder */}
        <div className="relative max-w-5xl mx-auto">
          {/* Glow behind the image */}
          <div className="absolute -inset-4 bg-gradient-to-r from-brand-500/20 via-accent-500/20 to-brand-500/20 rounded-3xl blur-3xl opacity-50" />

          {/* Dashboard preview */}
          <div className="relative landing-card overflow-hidden">
            <div className="aspect-video bg-navy-900 flex items-center justify-center">
              {/* Placeholder for actual dashboard screenshot */}
              <div className="text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                  </svg>
                </div>
                <p className="text-white/40 text-sm">Dashboard Preview</p>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-500/50" />
                <div className="w-3 h-3 rounded-full bg-accent-500/50" />
                <div className="w-3 h-3 rounded-full bg-white/20" />
              </div>

              {/* Play button overlay */}
              <button className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group cursor-pointer">
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play size={32} className="text-white ml-1" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
