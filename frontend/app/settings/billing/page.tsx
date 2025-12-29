"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import {
  ArrowLeft,
  CreditCard,
  Check,
  Loader2,
  ExternalLink,
  Download,
  AlertCircle,
  Sparkles,
  Zap,
  Crown,
  Building,
} from "lucide-react";
import { api, Invoice, PaymentMethod, NextBilling } from "@/lib/api";

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  features: Record<string, any>;
  highlights: string[];
  is_current: boolean;
}

interface Subscription {
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

const planIcons: Record<string, React.ReactNode> = {
  free: <Sparkles className="w-6 h-6" />,
  starter: <Zap className="w-6 h-6" />,
  pro: <Crown className="w-6 h-6" />,
  agency: <Building className="w-6 h-6" />,
};

const planColors: Record<string, string> = {
  free: "from-gray-500 to-gray-600",
  starter: "from-blue-500 to-blue-600",
  pro: "from-purple-500 to-purple-600",
  agency: "from-amber-500 to-amber-600",
};

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCurrency(amount: number, currency: string = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function UsageBar({
  used,
  limit,
  label,
}: {
  used: number;
  limit: number;
  label: string;
}) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="text-white">
          {used.toLocaleString()} / {isUnlimited ? "Unlimited" : limit.toLocaleString()}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isAtLimit
                ? "bg-red-500"
                : isNearLimit
                ? "bg-amber-500"
                : "bg-purple-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [nextBilling, setNextBilling] = useState<NextBilling | null>(null);

  // Check for success/cancel from Stripe redirect
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setSuccessMessage("Your subscription has been updated successfully!");
      // Clear the query param
      router.replace("/settings/billing");
    }
    if (searchParams.get("canceled") === "true") {
      setError("Checkout was canceled. No changes were made.");
      router.replace("/settings/billing");
    }
  }, [searchParams, router]);

  useEffect(() => {
    async function loadBillingData() {
      try {
        setLoading(true);
        setError(null);

        const [plansRes, subscriptionRes, invoicesRes, pmRes, nextRes] =
          await Promise.all([
            api.getPlans(),
            api.getSubscription(),
            api.getInvoices(5),
            api.getPaymentMethod(),
            api.getNextBilling(),
          ]);

        setPlans(plansRes.plans);
        setSubscription(subscriptionRes);
        setInvoices(invoicesRes.invoices);
        setPaymentMethod(pmRes.payment_method);
        setNextBilling(nextRes);
      } catch (err: any) {
        setError(err.message || "Failed to load billing information");
      } finally {
        setLoading(false);
      }
    }

    loadBillingData();
  }, []);

  async function handleUpgrade(planId: string) {
    try {
      setActionLoading(planId);
      setError(null);

      const { checkout_url } = await api.createCheckoutSession(
        planId,
        `${window.location.origin}/settings/billing?success=true`,
        `${window.location.origin}/settings/billing?canceled=true`
      );

      // Redirect to Stripe Checkout
      window.location.href = checkout_url;
    } catch (err: any) {
      setError(err.message || "Failed to start checkout");
      setActionLoading(null);
    }
  }

  async function handleManageSubscription() {
    try {
      setActionLoading("portal");
      setError(null);

      const { portal_url } = await api.createBillingPortal(
        `${window.location.origin}/settings/billing`
      );

      // Redirect to Stripe Customer Portal
      window.location.href = portal_url;
    } catch (err: any) {
      setError(err.message || "Failed to open billing portal");
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        </main>
      </div>
    );
  }

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
              Billing & Subscription
            </h1>
            <p className="text-gray-400 mt-1">
              Manage your subscription and billing information
            </p>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <p className="text-green-400">{successMessage}</p>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Current Plan Card */}
          {subscription && (
            <div className="mb-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {planIcons[subscription.plan_id]}
                    <h2 className="text-xl font-bold text-white">
                      {subscription.plan_name} Plan
                    </h2>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        subscription.is_active
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {subscription.status}
                    </span>
                  </div>
                  {subscription.current_period_end && (
                    <p className="text-gray-400">
                      {subscription.cancel_at_period_end
                        ? "Access until: "
                        : "Next billing: "}
                      {formatDate(subscription.current_period_end)}
                    </p>
                  )}
                  {subscription.cancel_at_period_end && (
                    <p className="text-amber-400 text-sm mt-1">
                      Your subscription will not renew
                    </p>
                  )}
                </div>
                {subscription.plan_id !== "free" && (
                  <button
                    onClick={handleManageSubscription}
                    disabled={actionLoading === "portal"}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    {actionLoading === "portal" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    Manage Subscription
                  </button>
                )}
              </div>

              {/* Usage */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <UsageBar
                  used={subscription.usage.videos_analyzed}
                  limit={subscription.limits.videos_per_month}
                  label="Video Analyses"
                />
                <UsageBar
                  used={subscription.usage.ai_queries}
                  limit={subscription.limits.ai_queries_per_month}
                  label="AI Queries"
                />
                <UsageBar
                  used={subscription.usage.clips_generated}
                  limit={subscription.limits.clips_per_month}
                  label="Clips Generated"
                />
              </div>
            </div>
          )}

          {/* Plans */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">
              Available Plans
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white/5 border rounded-xl p-5 ${
                    plan.is_current
                      ? "border-purple-500/50"
                      : "border-white/10"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                      planColors[plan.id]
                    } flex items-center justify-center text-white mb-4`}
                  >
                    {planIcons[plan.id]}
                  </div>
                  <h4 className="text-lg font-semibold text-white">
                    {plan.name}
                  </h4>
                  <p className="text-gray-400 text-sm mb-3">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-white">
                      ${plan.price_monthly}
                    </span>
                    <span className="text-gray-400">/month</span>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {plan.highlights.slice(0, 4).map((highlight, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-gray-300"
                      >
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                  {plan.is_current ? (
                    <button
                      disabled
                      className="w-full py-2 bg-purple-500/20 text-purple-400 rounded-lg cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : plan.price_monthly === 0 ? (
                    <button
                      disabled
                      className="w-full py-2 bg-white/5 text-gray-500 rounded-lg cursor-not-allowed"
                    >
                      Free Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={actionLoading === plan.id}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {actionLoading === plan.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Upgrade"
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method & Next Billing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Payment Method */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">
                Payment Method
              </h3>
              {paymentMethod ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-white capitalize">
                      {paymentMethod.card.brand} **** {paymentMethod.card.last4}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Expires {paymentMethod.card.exp_month}/
                      {paymentMethod.card.exp_year}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">No payment method on file</p>
              )}
              {subscription?.plan_id !== "free" && (
                <button
                  onClick={handleManageSubscription}
                  className="mt-4 text-sm text-purple-400 hover:text-purple-300"
                >
                  Update payment method
                </button>
              )}
            </div>

            {/* Next Billing */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">
                Next Billing
              </h3>
              {nextBilling && nextBilling.next_billing_date ? (
                <div>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(nextBilling.amount, nextBilling.currency)}
                  </p>
                  <p className="text-gray-400">
                    on {formatDate(nextBilling.next_billing_date)}
                  </p>
                  {nextBilling.cancel_at_period_end && (
                    <p className="text-amber-400 text-sm mt-2">
                      Subscription will not renew
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400">No upcoming charges</p>
              )}
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Recent Invoices
              </h3>
              <Link
                href="/settings/billing/history"
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                View all
              </Link>
            </div>
            {invoices.length > 0 ? (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                  >
                    <div>
                      <p className="text-white">{invoice.number || invoice.id}</p>
                      <p className="text-gray-400 text-sm">
                        {formatDate(invoice.created)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          invoice.status === "paid"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {invoice.status}
                      </span>
                      <span className="text-white">
                        {formatCurrency(invoice.amount_paid, invoice.currency)}
                      </span>
                      {invoice.invoice_pdf && (
                        <a
                          href={invoice.invoice_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-white"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No invoices yet</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        </main>
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}
