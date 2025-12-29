"use client";

import GetStartedButton from "./GetStartedButton";

export default function FinalCTA() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/10 to-transparent pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        {/* Headline */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium text-white mb-6">
          Ready to grow your channel?
        </h2>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-white/60 mb-10 max-w-xl mx-auto">
          Start free with AI-powered YouTube analytics
          that will help you maximize reach and engagement.
        </p>

        {/* CTA */}
        <div className="flex justify-center mb-8">
          <GetStartedButton variant="inline" text="Start Free Today" />
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-white/40 text-sm">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Free tier available</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}
