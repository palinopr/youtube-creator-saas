"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  Building,
  ArrowRight,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ReactNode;
  gradient: string;
  popular?: boolean;
  highlights: string[];
  features: {
    label: string;
    value: string | boolean;
  }[];
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Get started with basic analytics",
    price: 0,
    icon: <Sparkles className="w-6 h-6" />,
    gradient: "from-gray-500 to-gray-600",
    highlights: [
      "10 video analyses/month",
      "20 AI queries/month",
      "Basic channel stats",
      "Community support",
    ],
    features: [
      { label: "Video Analyses", value: "10/month" },
      { label: "AI Queries", value: "20/month" },
      { label: "Viral Clips", value: false },
      { label: "SEO Optimization", value: false },
      { label: "Deep Analysis", value: false },
      { label: "Support", value: "Community" },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    description: "For growing creators",
    price: 19,
    icon: <Zap className="w-6 h-6" />,
    gradient: "from-blue-500 to-blue-600",
    highlights: [
      "50 video analyses/month",
      "100 AI queries/month",
      "10 viral clips/month",
      "SEO optimization",
      "Transcript analysis",
      "Email support",
    ],
    features: [
      { label: "Video Analyses", value: "50/month" },
      { label: "AI Queries", value: "100/month" },
      { label: "Viral Clips", value: "10/month" },
      { label: "SEO Optimization", value: true },
      { label: "Deep Analysis", value: false },
      { label: "Support", value: "Email" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For serious content creators",
    price: 49,
    icon: <Crown className="w-6 h-6" />,
    gradient: "from-purple-500 to-purple-600",
    popular: true,
    highlights: [
      "Unlimited video analyses",
      "500 AI queries/month",
      "50 viral clips/month",
      "Deep channel analysis",
      "Causal analytics",
      "Export reports",
      "Priority support",
    ],
    features: [
      { label: "Video Analyses", value: "Unlimited" },
      { label: "AI Queries", value: "500/month" },
      { label: "Viral Clips", value: "50/month" },
      { label: "SEO Optimization", value: true },
      { label: "Deep Analysis", value: true },
      { label: "Support", value: "Priority" },
    ],
  },
  {
    id: "agency",
    name: "Agency",
    description: "For teams and agencies",
    price: 149,
    icon: <Building className="w-6 h-6" />,
    gradient: "from-amber-500 to-amber-600",
    highlights: [
      "Everything in Pro",
      "Unlimited AI queries",
      "Unlimited viral clips",
      "API access",
      "Multiple channels",
      "Dedicated support",
    ],
    features: [
      { label: "Video Analyses", value: "Unlimited" },
      { label: "AI Queries", value: "Unlimited" },
      { label: "Viral Clips", value: "Unlimited" },
      { label: "SEO Optimization", value: true },
      { label: "Deep Analysis", value: true },
      { label: "Support", value: "Dedicated" },
    ],
  },
];

const faqs = [
  {
    q: "Can I cancel anytime?",
    a: "Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor, Stripe.",
  },
  {
    q: "Is there a free trial?",
    a: "We offer a generous free tier that lets you try TubeGrow before committing. You can upgrade whenever you're ready.",
  },
  {
    q: "What happens if I exceed my limits?",
    a: "You'll receive a notification when you're approaching your limits. You can upgrade your plan at any time to get more capacity.",
  },
  {
    q: "Can I switch plans?",
    a: "Absolutely! You can upgrade or downgrade at any time. Changes take effect immediately, and we'll prorate your billing.",
  },
  {
    q: "Do you offer refunds?",
    a: "We offer a 14-day money-back guarantee. If you're not satisfied, contact support for a full refund.",
  },
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            TubeGrow
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href={`${process.env.NEXT_PUBLIC_API_URL || ""}/auth/login`}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Choose the plan that fits your channel. Upgrade or downgrade anytime.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-white/5 rounded-lg p-1 mb-12">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-2 rounded-md transition-colors ${
                billingPeriod === "monthly"
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-4 py-2 rounded-md transition-colors ${
                billingPeriod === "yearly"
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Yearly
              <span className="ml-2 text-xs text-green-400">Save 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const price =
                billingPeriod === "yearly"
                  ? Math.round(plan.price * 12 * 0.8)
                  : plan.price;
              const monthlyPrice =
                billingPeriod === "yearly"
                  ? Math.round(plan.price * 0.8)
                  : plan.price;

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white/5 border rounded-2xl p-6 ${
                    plan.popular
                      ? "border-purple-500 ring-2 ring-purple-500/20"
                      : "border-white/10"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-full">
                      Most Popular
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-white mb-4`}
                  >
                    {plan.icon}
                  </div>

                  {/* Name & Description */}
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">
                      ${monthlyPrice}
                    </span>
                    <span className="text-gray-400">/month</span>
                    {billingPeriod === "yearly" && plan.price > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        ${price} billed yearly
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <Link
                    href={
                      plan.id === "free"
                        ? `${process.env.NEXT_PUBLIC_API_URL || ""}/auth/login`
                        : "/settings/billing"
                    }
                    className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      plan.popular
                        ? "bg-purple-600 hover:bg-purple-500 text-white"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    {plan.id === "free" ? "Get Started" : "Upgrade"}
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {/* Features */}
                  <ul className="mt-6 space-y-3">
                    {plan.highlights.map((highlight, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-gray-300"
                      >
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16 px-4 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Compare Plans
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-4 px-4 text-left text-gray-400 font-medium">
                    Feature
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      className="py-4 px-4 text-center text-white font-medium"
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plans[0].features.map((_, idx) => (
                  <tr key={idx} className="border-b border-white/5">
                    <td className="py-4 px-4 text-gray-400">
                      {plans[0].features[idx].label}
                    </td>
                    {plans.map((plan) => (
                      <td
                        key={plan.id}
                        className="py-4 px-4 text-center text-white"
                      >
                        {typeof plan.features[idx].value === "boolean" ? (
                          plan.features[idx].value ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-gray-600">-</span>
                          )
                        ) : (
                          plan.features[idx].value
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-4 border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-2">
                  {faq.q}
                </h3>
                <p className="text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to grow your channel?
          </h2>
          <p className="text-gray-400 mb-8">
            Join creators using TubeGrow to optimize their content
            and grow faster.
          </p>
          <Link
            href={`${process.env.NEXT_PUBLIC_API_URL || ""}/auth/login`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
          >
            Start Free Today
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} TubeGrow. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
