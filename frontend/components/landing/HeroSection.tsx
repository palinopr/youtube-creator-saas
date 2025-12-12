import { ShieldCheck } from "lucide-react";
import WaitlistForm from "./WaitlistForm";
import { AUTH_ENDPOINTS } from "@/lib/config";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 overflow-hidden">
      {/* Background glow effect */}
      <div className="hero-glow" />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6 text-center">
        {/* Trust badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
          <ShieldCheck size={16} className="text-brand-500" />
          <span className="text-sm text-white/80">Read-only Google OAuth • No posting • Encrypted tokens</span>
        </div>

        {/* Main headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium text-white leading-tight max-w-4xl mx-auto mb-6">
          Grow faster with{" "}
          <span className="text-gradient">AI-powered</span> YouTube analytics
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
          Connect your channel, sync your videos, and get clear recommendations on what to fix next—titles,
          thumbnails, SEO, and content strategy.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <a href={AUTH_ENDPOINTS.LOGIN} className="btn-cta-primary w-full sm:w-auto">
            Start free with Google
          </a>
          <a href="#pricing" className="btn-cta w-full sm:w-auto">
            See pricing
          </a>
        </div>

        {/* Secondary CTA (waitlist) */}
        <div className="mb-16">
          <div className="text-white/50 text-sm mb-4">
            Want launch updates instead? Join the waitlist.
          </div>
          <div className="flex justify-center">
            <WaitlistForm variant="inline" anchorId="waitlist" />
          </div>
        </div>

        {/* Product screenshot/video placeholder */}
        <div className="relative max-w-5xl mx-auto">
          {/* Glow behind the image */}
          <div className="absolute -inset-4 bg-gradient-to-r from-brand-500/20 via-accent-500/20 to-brand-500/20 rounded-3xl blur-3xl opacity-50" />

          {/* Dashboard preview - mockup */}
          <div className="relative landing-card overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-[#0f0f0f] to-[#1a1a2e] p-4 md:p-6">
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

        <p className="text-white/30 text-xs mt-6">
          Preview is illustrative. Sign in to see your real data.
        </p>
      </div>
    </section>
  );
}
