"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlanCard } from "@/components/billing";
import { AUTH_ENDPOINTS, BILLING_ENDPOINTS } from "@/lib/config";
import {
  ArrowLeft,
  Check,
  Sparkles,
  Zap,
  Shield,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  features: Record<string, boolean | number>;
  highlights: string[];
  is_current: boolean;
}

interface AuthStatus {
  authenticated: boolean;
}

// Fallback plans for when API is unavailable (unauthenticated users)
const fallbackPlans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for getting started",
    price_monthly: 0,
    features: {},
    highlights: ["10 videos/month", "20 AI queries", "Basic analytics"],
    is_current: false,
  },
  {
    id: "starter",
    name: "Starter",
    description: "For growing creators",
    price_monthly: 19,
    features: {},
    highlights: ["50 videos/month", "100 AI queries", "SEO analysis", "20 clips/month"],
    is_current: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For serious creators",
    price_monthly: 49,
    features: {},
    highlights: ["Unlimited videos", "500 AI queries", "100 clips/month", "Priority support"],
    is_current: false,
  },
  {
    id: "agency",
    name: "Agency",
    description: "For teams and agencies",
    price_monthly: 149,
    features: {},
    highlights: ["Unlimited everything", "API access", "White-label reports", "Dedicated support"],
    is_current: false,
  },
];

const featureComparison = [
  {
    category: "Video Analysis",
    features: [
      { name: "Videos per month", free: "10", starter: "50", pro: "Unlimited", agency: "Unlimited" },
      { name: "AI-powered insights", free: true, starter: true, pro: true, agency: true },
      { name: "SEO analysis", free: false, starter: true, pro: true, agency: true },
      { name: "Competitor research", free: false, starter: true, pro: true, agency: true },
    ],
  },
  {
    category: "AI Features",
    features: [
      { name: "AI queries per month", free: "20", starter: "100", pro: "500", agency: "Unlimited" },
      { name: "Title generation", free: true, starter: true, pro: true, agency: true },
      { name: "Description optimization", free: false, starter: true, pro: true, agency: true },
      { name: "Tag suggestions", free: false, starter: true, pro: true, agency: true },
    ],
  },
  {
    category: "Clips & Content",
    features: [
      { name: "Viral clip detection", free: false, starter: true, pro: true, agency: true },
      { name: "Clips per month", free: "0", starter: "20", pro: "100", agency: "Unlimited" },
      { name: "Clip export (MP4)", free: false, starter: true, pro: true, agency: true },
      { name: "Transcript analysis", free: false, starter: true, pro: true, agency: true },
    ],
  },
  {
    category: "Support & Extras",
    features: [
      { name: "Email support", free: false, starter: true, pro: true, agency: true },
      { name: "Priority support", free: false, starter: false, pro: true, agency: true },
      { name: "API access", free: false, starter: false, pro: false, agency: true },
      { name: "White-label reports", free: false, starter: false, pro: false, agency: true },
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>(fallbackPlans);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthAndFetchPlans();
  }, []);

  const checkAuthAndFetchPlans = async () => {
    try {
      // Check authentication status
      const authRes = await fetch(AUTH_ENDPOINTS.STATUS, { credentials: "include" });
      const authData: AuthStatus = await authRes.json();
      setIsAuthenticated(authData.authenticated);

      // Try to fetch plans from API
      try {
        const plansRes = await fetch(BILLING_ENDPOINTS.PLANS, { credentials: "include" });
        if (plansRes.ok) {
          const plansData = await plansRes.json();
          setPlans(plansData.plans);
        } else {
          // API returned error, use fallback plans
          setPlans(fallbackPlans);
        }
      } catch {
        // API unreachable, use fallback plans
        setPlans(fallbackPlans);
      }
    } catch {
      // Auth check failed, still show fallback plans
      setIsAuthenticated(false);
      setPlans(fallbackPlans);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!isAuthenticated) {
      // Redirect to login, then back to pricing
      router.push("/api/auth/login?redirect=/pricing");
      return;
    }

    const currentPlan = plans.find((p) => p.is_current);
    if (planId === currentPlan?.id) return;

    setProcessingPlan(planId);
    setError(null);

    try {
      if (planId === "free") {
        // Downgrade to free
        const res = await fetch(BILLING_ENDPOINTS.DOWNGRADE, {
          method: "POST",
          credentials: "include",
        });
        const data = await res.json();

        if (data.action === "redirect_to_portal") {
          const portalRes = await fetch(BILLING_ENDPOINTS.PORTAL, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          const portalData = await portalRes.json();
          window.location.href = portalData.portal_url;
        } else if (data.status === "success") {
          router.push("/settings/billing?success=true");
        }
      } else {
        // Upgrade to paid plan
        const res = await fetch(BILLING_ENDPOINTS.CHECKOUT, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan_id: planId }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Failed to create checkout session");
        }

        const data = await res.json();
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setProcessingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            {isAuthenticated ? (
              <Link
                href="/settings/billing"
                className="text-sm text-accent-400 hover:text-accent-300"
              >
                Manage Subscription
              </Link>
            ) : (
              <Link
                href="/api/auth/login"
                className="px-4 py-2 bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-600 hover:to-accent-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500/10 border border-brand-500/20 rounded-full text-brand-400 text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Scale your YouTube channel with AI-powered analytics, SEO optimization,
            and viral clip generation.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Plans Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-20">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                id={plan.id}
                name={plan.name}
                description={plan.description}
                price={plan.price_monthly}
                features={[]}
                highlights={plan.highlights}
                isCurrent={plan.is_current}
                isPopular={plan.id === "pro"}
                onSelect={handleSelectPlan}
                loading={processingPlan === plan.id}
              />
            ))}
          </div>
        )}

        {/* Feature Comparison Table */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">
                    Feature
                  </th>
                  <th className="text-center py-4 px-4 text-gray-400 font-medium">
                    Free
                  </th>
                  <th className="text-center py-4 px-4 text-gray-400 font-medium">
                    Starter
                  </th>
                  <th className="text-center py-4 px-4 text-accent-400 font-medium">
                    Pro
                  </th>
                  <th className="text-center py-4 px-4 text-brand-400 font-medium">
                    Agency
                  </th>
                </tr>
              </thead>
              <tbody>
                {featureComparison.map((category) => (
                  <>
                    <tr key={category.category} className="bg-white/5">
                      <td
                        colSpan={5}
                        className="py-3 px-4 text-sm font-semibold text-white"
                      >
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature) => (
                      <tr
                        key={feature.name}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-300 text-sm">
                          {feature.name}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof feature.free === "boolean" ? (
                            feature.free ? (
                              <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-gray-600">—</span>
                            )
                          ) : (
                            <span className="text-gray-300 text-sm">
                              {feature.free}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof feature.starter === "boolean" ? (
                            feature.starter ? (
                              <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-gray-600">—</span>
                            )
                          ) : (
                            <span className="text-gray-300 text-sm">
                              {feature.starter}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center bg-accent-500/5">
                          {typeof feature.pro === "boolean" ? (
                            feature.pro ? (
                              <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-gray-600">—</span>
                            )
                          ) : (
                            <span className="text-gray-300 text-sm">
                              {feature.pro}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof feature.agency === "boolean" ? (
                            feature.agency ? (
                              <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-gray-600">—</span>
                            )
                          ) : (
                            <span className="text-gray-300 text-sm">
                              {feature.agency}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid sm:grid-cols-3 gap-6 mb-20">
          <div className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="p-3 bg-brand-500/10 rounded-lg">
              <Shield className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Secure Payments</h3>
              <p className="text-sm text-gray-400">Powered by Stripe</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="p-3 bg-accent-500/10 rounded-lg">
              <Zap className="w-6 h-6 text-accent-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Cancel Anytime</h3>
              <p className="text-sm text-gray-400">No long-term contracts</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="p-3 bg-brand-500/10 rounded-lg">
              <Sparkles className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">14-Day Free Trial</h3>
              <p className="text-sm text-gray-400">On Pro & Agency plans</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
              <h3 className="font-semibold text-white mb-2">
                Can I change plans later?
              </h3>
              <p className="text-gray-400 text-sm">
                Yes! You can upgrade or downgrade your plan at any time. When
                upgrading, you&apos;ll be charged the prorated difference. When
                downgrading, the change takes effect at your next billing cycle.
              </p>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
              <h3 className="font-semibold text-white mb-2">
                What happens when I reach my limits?
              </h3>
              <p className="text-gray-400 text-sm">
                We&apos;ll notify you when you&apos;re approaching your limits. Once
                reached, you can either upgrade to a higher plan or wait until
                your limits reset at the start of your next billing cycle.
              </p>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
              <h3 className="font-semibold text-white mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-400 text-sm">
                We offer a 14-day money-back guarantee on all paid plans. If
                you&apos;re not satisfied, contact our support team within 14 days
                of your purchase for a full refund.
              </p>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
              <h3 className="font-semibold text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-400 text-sm">
                We accept all major credit cards (Visa, Mastercard, American
                Express) and debit cards through our secure payment processor,
                Stripe.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20 py-12 bg-gradient-to-r from-brand-500/10 via-accent-500/5 to-brand-500/10 rounded-2xl border border-brand-500/20">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to grow your channel?
          </h2>
          <p className="text-gray-400 mb-8">
            Start with our free plan and upgrade when you&apos;re ready.
          </p>
          {isAuthenticated ? (
            <Link
              href="/settings/billing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-600 hover:to-accent-600 text-white rounded-lg font-medium transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              View Your Plan
            </Link>
          ) : (
            <Link
              href="/api/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-600 hover:to-accent-600 text-white rounded-lg font-medium transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              Get Started Free
            </Link>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Questions about pricing?{" "}
            <a
              href="mailto:support@tubegrow.io"
              className="text-accent-400 hover:text-accent-300"
            >
              Contact support
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
