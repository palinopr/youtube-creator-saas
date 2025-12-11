"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "TubeGrow helped me identify exactly what was working on my channel. My views increased 340% in just 3 months.",
    name: "Alex Chen",
    channel: "TechReviews Daily",
    subscribers: "1.2M subscribers",
    avatar: "A",
  },
  {
    quote:
      "The SEO optimizer alone is worth the subscription. My videos now rank on the first page for competitive keywords.",
    name: "Sarah Martinez",
    channel: "Fitness Journey",
    subscribers: "850K subscribers",
    avatar: "S",
  },
  {
    quote:
      "I was skeptical at first, but the AI recommendations are spot-on. It's like having a YouTube strategist on staff.",
    name: "Marcus Johnson",
    channel: "Gaming Central",
    subscribers: "2.1M subscribers",
    avatar: "M",
  },
  {
    quote:
      "The viral clips feature is a game-changer. My Shorts now consistently get 100K+ views from repurposed content.",
    name: "Emily Wong",
    channel: "Cooking with Em",
    subscribers: "560K subscribers",
    avatar: "E",
  },
  {
    quote:
      "Finally, analytics that actually make sense. TubeGrow shows me exactly what to focus on to grow my channel.",
    name: "David Park",
    channel: "Travel Vlogs",
    subscribers: "920K subscribers",
    avatar: "D",
  },
  {
    quote:
      "The audience insights helped me understand when to post and what topics my viewers actually want. Subscriber growth doubled.",
    name: "Jessica Taylor",
    channel: "Beauty Secrets",
    subscribers: "1.5M subscribers",
    avatar: "J",
  },
];

export default function TestimonialCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-20 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Section header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-brand-500 text-sm font-medium uppercase tracking-wider mb-3">
              Testimonials
            </p>
            <h2 className="text-4xl md:text-5xl font-medium text-white">
              Loved by creators worldwide
            </h2>
          </div>

          {/* Navigation arrows */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              aria-label="Previous testimonials"
            >
              <ChevronLeft size={20} className="text-white" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              aria-label="Next testimonials"
            >
              <ChevronRight size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Testimonial carousel */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-[350px] md:w-[400px] landing-card p-6 snap-start"
            >
              {/* Quote icon */}
              <Quote size={32} className="text-brand-500/40 mb-4" />

              {/* Quote text */}
              <p className="text-white/80 text-base leading-relaxed mb-6">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author info */}
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-semibold">
                  {testimonial.avatar}
                </div>

                <div className="flex-1">
                  <p className="text-white font-medium">{testimonial.name}</p>
                  <p className="text-white/50 text-sm">{testimonial.channel}</p>
                </div>

                {/* Subscriber badge */}
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <span className="text-white/60 text-xs">
                    {testimonial.subscribers}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile navigation dots */}
        <div className="flex md:hidden items-center justify-center gap-2 mt-6">
          {testimonials.slice(0, 6).map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-white/20"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
