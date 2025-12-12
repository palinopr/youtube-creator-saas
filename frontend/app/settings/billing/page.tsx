"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import { PlanBadge, UsageBar, PlanCard } from "@/components/billing";
import { api } from "@/lib/api";
import {
  CreditCard,
  ArrowLeft,
  ExternalLink,
  Check,
  AlertCircle,
  RefreshCw,
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

interface SubscriptionData {
  plan_id: string;
  plan_name: string;
  status: string;
  is_active: boolean;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  usage: {
    videos_analyzed: number;
    ai_queries: number;
    clips_generated: number;
  };
  limits: {
    videos_per_month: number;
    ai_queries_per_month: number;
    clips_per_month: number;
  };
}

function BillingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for success/cancel from Stripe redirect
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success === "true") {
      setSuccessMessage("Subscription updated successfully!");
      // Clear the URL params
      router.replace("/settings/billing");
    } else if (canceled === "true") {
      setError("Checkout was canceled.");
      router.replace("/settings/billing");
    }
  }, [searchParams, router]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansData, subData] = await Promise.all([
        api.getPlans(),
        api.getSubscription(),
      ]);

      setPlans(plansData.plans);
      setSubscription(subData as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (planId === subscription?.plan_id) return;

    setProcessingPlan(planId);
    setError(null);

    try {
      // If downgrading to free, use the downgrade endpoint
      if (planId === "free") {
        const data = await api.downgradeToFree();

        if (data.action === "redirect_to_portal") {
          // Open portal for cancellation
          await handleManageSubscription();
        } else if (data.status === "success") {
          setSuccessMessage("Downgraded to free plan!");
          fetchData();
        }
      } else {
        // Upgrade to paid plan
        const data = await api.createCheckoutSession(planId);
        // Redirect to Stripe Checkout
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const data = await api.createBillingPortal();
      // Open Stripe Customer Portal
      window.location.href = data.portal_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Settings
            </Link>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <CreditCard className="w-7 h-7" />
              Billing & Plans
            </h1>
            <p className="text-gray-400 mt-1">
              Manage your subscription and view available plans
            </p>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400">{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Current Subscription */}
              {subscription && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-lg font-semibold text-white">
                          Current Subscription
                        </h2>
                        <PlanBadge plan={subscription.plan_id} />
                      </div>
                      <p className="text-sm text-gray-400">
                        Status:{" "}
                        <span
                          className={
                            subscription.is_active
                              ? "text-emerald-400"
                              : "text-red-400"
                          }
                        >
                          {subscription.status}
                        </span>
                        {subscription.current_period_end && (
                          <>
                            {" "}
                            | Next billing:{" "}
                            {new Date(
                              subscription.current_period_end
                            ).toLocaleDateString()}
                          </>
                        )}
                      </p>
                    </div>

                    {subscription.plan_id !== "free" && (
                      <button
                        onClick={handleManageSubscription}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                      >
                        <span>Manage Subscription</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Usage Stats */}
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h3 className="text-sm font-medium text-gray-300 mb-4">
                      This Month&apos;s Usage
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <UsageBar
                        label="Videos Analyzed"
                        used={subscription.usage.videos_analyzed}
                        limit={subscription.limits.videos_per_month}
                        unlimited={subscription.limits.videos_per_month === -1}
                      />
                      <UsageBar
                        label="AI Queries"
                        used={subscription.usage.ai_queries}
                        limit={subscription.limits.ai_queries_per_month}
                        unlimited={
                          subscription.limits.ai_queries_per_month === -1
                        }
                      />
                      <UsageBar
                        label="Clips Generated"
                        used={subscription.usage.clips_generated}
                        limit={subscription.limits.clips_per_month}
                        unlimited={subscription.limits.clips_per_month === -1}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Available Plans */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-6">
                  Available Plans
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
              </div>

              {/* FAQ/Info */}
              <div className="mt-12 text-center text-sm text-gray-500">
                <p>
                  Questions about billing?{" "}
                  <a
                    href="mailto:support@tubegrow.io"
                    className="text-purple-400 hover:text-purple-300"
                  >
                    Contact support
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-[#0a0a0a]">
          <Sidebar />
          <main className="flex-1 p-6 lg:p-8">
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          </main>
        </div>
      }
    >
      <BillingPageContent />
    </Suspense>
  );
}
