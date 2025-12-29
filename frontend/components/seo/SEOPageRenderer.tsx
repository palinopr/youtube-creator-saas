"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Check,
  X,
  ArrowRight,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  BarChart3,
  Search,
  Video,
  Users,
} from "lucide-react";
import type { SEOPage, ContentSection, FeatureItem, ComparisonRow, FAQItem } from "@/lib/seo/types";
import GetStartedButton from "@/components/landing/GetStartedButton";

// Icon mapping for features
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  target: Target,
  trending: TrendingUp,
  zap: Zap,
  chart: BarChart3,
  search: Search,
  video: Video,
  users: Users,
};

interface Props {
  page: SEOPage;
  relatedPages: SEOPage[];
}

export default function SEOPageRenderer({ page, relatedPages }: Props) {
  const [openFAQs, setOpenFAQs] = useState<number[]>([]);

  const toggleFAQ = (index: number) => {
    setOpenFAQs((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/10 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-full text-brand-400 text-sm font-medium mb-6">
            <Sparkles size={14} />
            {page.hero.badge}
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            {page.hero.headline}
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl mx-auto leading-relaxed">
            {page.hero.subheadline}
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <GetStartedButton variant="inline" />
          </div>
        </div>
      </section>

      {/* Content Sections */}
      {page.sections.map((section, index) => (
        <section key={index} className="py-16">
          <div className="max-w-6xl mx-auto px-6">
            {section.title && (
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
                {section.title}
              </h2>
            )}
            {renderSection(section)}
          </div>
        </section>
      ))}

      {/* FAQ Section */}
      {page.faq.length > 0 && (
        <section className="py-20 bg-white/5">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-brand-500 text-sm font-medium uppercase tracking-wider mb-3">
                FAQ
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-0">
              {page.faq.map((item, index) => {
                const isOpen = openFAQs.includes(index);
                return (
                  <div key={index} className="border-b border-white/10">
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full flex items-center justify-between py-5 text-left"
                    >
                      <span className="text-white font-medium pr-4">
                        {item.question}
                      </span>
                      <ChevronDown
                        size={20}
                        className={`flex-shrink-0 text-white/50 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="pb-5">
                        <p className="text-white/60 leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Related Resources */}
      {relatedPages.length > 0 && (
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Related Resources
              </h2>
              <p className="text-white/60">
                Explore more guides and tools for YouTube creators
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPages.map((related) => (
                <Link
                  key={related.slug}
                  href={`/seo/${related.category}/${related.slug}`}
                  className="group p-6 bg-white/5 rounded-xl border border-white/10 hover:border-brand-500/50 transition-all"
                >
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-brand-400 transition-colors">
                    {related.metadata.title}
                  </h3>
                  <p className="text-sm text-white/60 line-clamp-2">
                    {related.metadata.description}
                  </p>
                  <div className="mt-4 flex items-center text-brand-500 text-sm font-medium">
                    Read more
                    <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-b from-transparent via-brand-500/5 to-brand-500/10">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Grow Your YouTube Channel?
          </h2>
          <p className="text-lg text-white/70 mb-8">
            Start free with TubeGrow to optimize your content and grow faster.
          </p>
          <GetStartedButton variant="inline" />
        </div>
      </section>
    </div>
  );
}

// Helper function to render different section types
function renderSection(section: ContentSection) {
  switch (section.type) {
    case "intro":
      return (
        <div className="prose prose-lg prose-invert mx-auto">
          <p className="text-white/80 leading-relaxed text-lg">
            {section.content as string}
          </p>
        </div>
      );

    case "features":
      const features = section.content as FeatureItem[];
      return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = iconMap[feature.icon] || Sparkles;
            return (
              <div
                key={i}
                className="p-6 bg-white/5 rounded-xl border border-white/10"
              >
                <div className="w-12 h-12 bg-brand-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-brand-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/60">{feature.description}</p>
              </div>
            );
          })}
        </div>
      );

    case "comparison":
      const rows = section.content as ComparisonRow[];
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-4 px-4 text-left text-white font-semibold">Feature</th>
                <th className="py-4 px-4 text-center text-white/70">Tool A</th>
                <th className="py-4 px-4 text-center text-white/70">Tool B</th>
                <th className="py-4 px-4 text-center text-brand-400 font-semibold">TubeGrow</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="py-4 px-4 text-white">{row.feature}</td>
                  <td className="py-4 px-4 text-center">
                    {renderComparisonValue(row.toolA)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {renderComparisonValue(row.toolB)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {renderComparisonValue(row.tubeGrow, true)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "steps":
      const steps = section.content as string[];
      return (
        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center text-white font-bold">
                {i + 1}
              </div>
              <div className="pt-2">
                <p className="text-white/80">{step}</p>
              </div>
            </div>
          ))}
        </div>
      );

    case "benefits":
      const benefits = section.content as string[];
      return (
        <div className="grid md:grid-cols-2 gap-4">
          {benefits.map((benefit, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-white/5 rounded-lg">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-white/80">{benefit}</p>
            </div>
          ))}
        </div>
      );

    case "checklist":
      const items = section.content as string[];
      return (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-6 h-6 border-2 border-white/30 rounded flex items-center justify-center">
                <Check className="w-4 h-4 text-brand-500" />
              </div>
              <p className="text-white/80">{item}</p>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

// Helper to render comparison table values
function renderComparisonValue(value: string | boolean, highlight = false) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className={`w-5 h-5 mx-auto ${highlight ? "text-brand-500" : "text-green-500"}`} />
    ) : (
      <X className="w-5 h-5 mx-auto text-red-500/50" />
    );
  }
  return (
    <span className={highlight ? "text-brand-400 font-medium" : "text-white/70"}>
      {value}
    </span>
  );
}
