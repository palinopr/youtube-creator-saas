"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlanCard } from "@/components/billing";
import { AUTH_ENDPOINTS, BILLING_ENDPOINTS } from "@/lib/config";
import {
  Youtube,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  Loader2,
  BarChart3,
  Zap,
  Video,
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
  channel_connected?: boolean;
  user?: {
    email: string;
    name: string;
  };
}

type OnboardingStep = "welcome" | "connect" | "plan" | "complete";

const steps: { id: OnboardingStep; label: string }[] = [
  { id: "welcome", label: "Welcome" },
  { id: "connect", label: "Connect" },
  { id: "plan", label: "Choose Plan" },
  { id: "complete", label: "Complete" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch(AUTH_ENDPOINTS.STATUS, { credentials: "include" });
      const data = await res.json();
      setAuthStatus(data);

      // If not authenticated, redirect to login
      if (!data.authenticated) {
        router.push("/");
        return;
      }

      // If channel is connected, skip to plan selection
      if (data.channel_connected) {
        setCurrentStep("plan");
      }

      // Fetch plans
      const plansRes = await fetch(BILLING_ENDPOINTS.PLANS, { credentials: "include" });
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData.plans);
      }
    } catch (err) {
      setError("Failed to check authentication status");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectYouTube = () => {
    setConnecting(true);
    // Redirect to YouTube OAuth with onboarding return URL
    window.location.href = `${AUTH_ENDPOINTS.LOGIN}?redirect=/onboarding`;
  };

  const handleSelectPlan = async (planId: string) => {
    setProcessingPlan(planId);
    setError(null);

    try {
      if (planId === "free") {
        // Free plan - just complete onboarding
        setCurrentStep("complete");
      } else {
        // Paid plan - redirect to checkout
        const res = await fetch(BILLING_ENDPOINTS.CHECKOUT, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_id: planId,
            success_url: `${window.location.origin}/onboarding?step=complete`,
            cancel_url: `${window.location.origin}/onboarding?step=plan`,
          }),
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

  const handleGoToDashboard = () => {
    router.push("/");
  };

  const nextStep = () => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Youtube className="w-8 h-8 text-red-500" />
              <span className="text-xl font-bold">CreatorSaaS</span>
            </div>
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Skip for now
            </Link>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center gap-2 mb-12">
          {steps.map((step, index) => {
            const currentIndex = steps.findIndex((s) => s.id === currentStep);
            const isCompleted = index < currentIndex;
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-purple-500 text-white"
                        : "bg-white/10 text-gray-500"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 ${
                      isCurrent ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-0.5 mx-2 ${
                      index < currentIndex ? "bg-emerald-500" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Step Content */}
        <div className="max-w-2xl mx-auto">
          {/* Welcome Step */}
          {currentStep === "welcome" && (
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-purple-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">
                Welcome to CreatorSaaS{authStatus?.user?.name ? `, ${authStatus.user.name.split(" ")[0]}` : ""}!
              </h1>
              <p className="text-gray-400 text-lg mb-8">
                Let&apos;s get your account set up in just a few steps. You&apos;ll be
                analyzing your YouTube channel in no time.
              </p>

              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <h3 className="font-medium text-white mb-1">Analytics</h3>
                  <p className="text-sm text-gray-400">
                    Track your channel growth
                  </p>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <h3 className="font-medium text-white mb-1">AI Insights</h3>
                  <p className="text-sm text-gray-400">
                    Get intelligent recommendations
                  </p>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <h3 className="font-medium text-white mb-1">Optimization</h3>
                  <p className="text-sm text-gray-400">
                    Improve your content SEO
                  </p>
                </div>
              </div>

              <button
                onClick={nextStep}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Connect YouTube Step */}
          {currentStep === "connect" && (
            <div className="text-center">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Youtube className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">
                Connect Your YouTube Channel
              </h1>
              <p className="text-gray-400 text-lg mb-8">
                We need access to your YouTube Analytics to provide insights and
                recommendations. Your data is secure and private.
              </p>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 text-left">
                <h3 className="font-medium text-white mb-4">
                  What we&apos;ll access:
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="text-white">Channel statistics</p>
                      <p className="text-sm text-gray-400">
                        Views, subscribers, and video metrics
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="text-white">Video data</p>
                      <p className="text-sm text-gray-400">
                        Titles, descriptions, and transcripts
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="text-white">Analytics reports</p>
                      <p className="text-sm text-gray-400">
                        Historical performance data
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={prevStep}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={handleConnectYouTube}
                  disabled={connecting}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Youtube className="w-5 h-5" />
                      Connect YouTube
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Choose Plan Step */}
          {currentStep === "plan" && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-4">
                  Choose Your Plan
                </h1>
                <p className="text-gray-400 text-lg">
                  Start free and upgrade whenever you&apos;re ready. All plans include
                  a 14-day trial.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {plans.slice(0, 4).map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative rounded-xl border p-5 cursor-pointer transition-all ${
                      plan.id === "pro"
                        ? "border-purple-500 bg-purple-500/5 hover:bg-purple-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {plan.id === "pro" && (
                      <div className="absolute -top-2.5 left-4">
                        <span className="bg-purple-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                          Popular
                        </span>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-white">{plan.name}</h3>
                        <p className="text-sm text-gray-400">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-white">
                          {plan.price_monthly === 0 ? "Free" : `$${plan.price_monthly}`}
                        </span>
                        {plan.price_monthly > 0 && (
                          <span className="text-sm text-gray-400">/mo</span>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-2 mb-4">
                      {plan.highlights.slice(0, 3).map((highlight, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-gray-300">{highlight}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      disabled={processingPlan === plan.id}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        plan.id === "pro"
                          ? "bg-purple-500 hover:bg-purple-600 text-white"
                          : "bg-white/10 hover:bg-white/20 text-white"
                      }`}
                    >
                      {processingPlan === plan.id ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : plan.price_monthly === 0 ? (
                        "Continue Free"
                      ) : (
                        "Select Plan"
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Link
                  href="/pricing"
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Compare all plans in detail →
                </Link>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {currentStep === "complete" && (
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">
                You&apos;re All Set!
              </h1>
              <p className="text-gray-400 text-lg mb-8">
                Your account is ready. Start exploring your analytics and get
                AI-powered insights to grow your channel.
              </p>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
                <h3 className="font-medium text-white mb-4">
                  What&apos;s next?
                </h3>
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-gray-300">
                      View your channel analytics dashboard
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-gray-300">
                      Ask AI questions about your performance
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
                      <Video className="w-4 h-4 text-pink-400" />
                    </div>
                    <span className="text-gray-300">
                      Optimize your video titles and descriptions
                    </span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleGoToDashboard}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
