"use client";

import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    description: "For hobbyist creators getting started",
    features: [
      "1 YouTube channel",
      "Basic analytics dashboard",
      "SEO score analysis",
      "5 AI queries per day",
      "Weekly email reports",
      "Community support",
    ],
    cta: "Join Waitlist",
    popular: false,
  },
  {
    name: "Pro",
    description: "For growing creators who want to scale",
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
    cta: "Join Waitlist",
    popular: true,
  },
  {
    name: "Agency",
    description: "For agencies managing multiple channels",
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
  return (
    <section id="pricing" className="py-20">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-brand-500 text-sm font-medium uppercase tracking-wider mb-3">
            Plans
          </p>
          <h2 className="text-4xl md:text-5xl font-medium text-white mb-4">
            Choose the right plan for you
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Join our waitlist to get early access and exclusive launch pricing.
          </p>
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
                href="#waitlist"
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
          Join our waitlist for early access and exclusive launch pricing.
        </p>
      </div>
    </section>
  );
}
