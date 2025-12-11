"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    description: "For hobbyist creators getting started",
    monthlyPrice: 19,
    yearlyPrice: 15,
    features: [
      "1 YouTube channel",
      "Basic analytics dashboard",
      "SEO score analysis",
      "5 AI queries per day",
      "Weekly email reports",
      "Community support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Pro",
    description: "For growing creators who want to scale",
    monthlyPrice: 49,
    yearlyPrice: 39,
    features: [
      "3 YouTube channels",
      "Advanced analytics & insights",
      "Full SEO optimization suite",
      "Unlimited AI queries",
      "Viral clips generator",
      "Audience insights",
      "Priority support",
      "Daily email reports",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Agency",
    description: "For agencies managing multiple channels",
    monthlyPrice: 149,
    yearlyPrice: 119,
    features: [
      "Unlimited channels",
      "Everything in Pro",
      "White-label reports",
      "Team collaboration",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section id="pricing" className="py-20">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-brand-500 text-sm font-medium uppercase tracking-wider mb-3">
            Pricing
          </p>
          <h2 className="text-4xl md:text-5xl font-medium text-white mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Start free for 14 days. No credit card required.
            Cancel anytime.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span
            className={`text-sm font-medium ${
              !isYearly ? "text-white" : "text-white/50"
            }`}
          >
            Monthly
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className="relative w-14 h-7 rounded-full bg-white/10 transition-colors"
            aria-label="Toggle billing period"
          >
            <div
              className={`absolute top-1 w-5 h-5 rounded-full bg-brand-500 transition-transform ${
                isYearly ? "translate-x-8" : "translate-x-1"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${
              isYearly ? "text-white" : "text-white/50"
            }`}
          >
            Yearly
          </span>
          {isYearly && (
            <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
              Save 20%
            </span>
          )}
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`landing-card p-8 relative ${
                plan.popular ? "pricing-popular" : ""
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 text-white text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-white/50 text-sm">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-white/40 text-lg line-through">
                    ${plan.monthlyPrice}
                  </span>
                  <span className="text-4xl font-bold text-white">
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-white/50">/mo</span>
                </div>
                {isYearly && (
                  <p className="text-white/40 text-sm mt-1">
                    Billed yearly (${plan.yearlyPrice * 12}/year)
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check
                      size={18}
                      className={`flex-shrink-0 mt-0.5 ${
                        plan.popular ? "text-brand-500" : "text-white/40"
                      }`}
                    />
                    <span className="text-white/70 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/dashboard"
                className={`block w-full text-center py-3 rounded-full font-semibold transition-all ${
                  plan.popular
                    ? "btn-cta-primary"
                    : "bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Trust note */}
        <p className="text-center text-white/40 text-sm mt-8">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}
