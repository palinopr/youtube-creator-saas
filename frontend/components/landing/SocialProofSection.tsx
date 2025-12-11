"use client";

import { Star } from "lucide-react";

const badges = [
  {
    label: "Leader",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    ),
    source: "G2",
  },
  {
    label: "High Performer",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 3H19C20.1 3 21 3.9 21 5V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3M7 5V19H9V5H7M11 5V19H13V5H11M15 5V19H17V5H15Z" />
      </svg>
    ),
    source: "G2",
  },
  {
    label: "Best Support",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2M4 12C4 7.58 7.58 4 12 4C14.12 4 16.07 4.79 17.54 6.11L6.11 17.54C4.79 16.07 4 14.12 4 12M12 20C9.88 20 7.93 19.21 6.46 17.89L17.89 6.46C19.21 7.93 20 9.88 20 12C20 16.42 16.42 20 12 20Z" />
      </svg>
    ),
    source: "Capterra",
  },
  {
    label: "Momentum Leader",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 6L18.29 8.29L13.41 13.17L9.41 9.17L2 16.59L3.41 18L9.41 12L13.41 16L19.71 9.71L22 12V6H16Z" />
      </svg>
    ),
    source: "G2",
  },
];

const stats = [
  { value: "10K+", label: "Active Creators" },
  { value: "50M+", label: "Videos Analyzed" },
  { value: "2.5B+", label: "Views Generated" },
  { value: "98%", label: "Satisfaction Rate" },
];

export default function SocialProofSection() {
  return (
    <section className="py-16 border-y border-white/5">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Star rating */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={20}
                className="text-yellow-500 fill-yellow-500"
              />
            ))}
          </div>
          <span className="text-white font-semibold">4.9/5</span>
          <span className="text-white/50">from 500+ reviews</span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          {badges.map((badge, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10"
            >
              <span className="text-brand-500">{badge.icon}</span>
              <span className="text-white text-sm font-medium">
                {badge.label}
              </span>
              <span className="text-white/40 text-xs">| {badge.source}</span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-white mb-1 stat-number">
                {stat.value}
              </p>
              <p className="text-white/50 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
