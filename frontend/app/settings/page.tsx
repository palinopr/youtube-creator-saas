"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import SettingsNav from "@/components/settings/SettingsNav";
import { PlanBadge, UsageBar } from "@/components/billing";
import { BILLING_ENDPOINTS } from "@/lib/config";
import { api, UserProfile } from "@/lib/api";
import {
  Settings,
  CreditCard,
  User,
  Youtube,
  ArrowRight,
  RefreshCw,
  Shield,
  FileText,
} from "lucide-react";

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

export default function SettingsPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subRes, profileData] = await Promise.all([
        fetch(BILLING_ENDPOINTS.SUBSCRIPTION, { credentials: "include" }).then(r => {
          if (!r.ok) throw new Error("Failed to fetch subscription");
          return r.json();
        }),
        api.getProfile(),
      ]);
      setSubscription(subRes);
      setProfile(profileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Settings className="w-7 h-7" />
              Settings
            </h1>
            <p className="text-gray-400 mt-1">
              Manage your account and subscription
            </p>
          </div>

          <SettingsNav />

          {/* Settings Grid */}
          <div className="space-y-6">
            {/* Subscription Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-semibold text-white">
                    Subscription
                  </h2>
                </div>
                {subscription && (
                  <PlanBadge plan={subscription.plan_id} size="md" />
                )}
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading subscription...
                </div>
              ) : error ? (
                <div className="text-red-400">{error}</div>
              ) : subscription ? (
                <div className="space-y-6">
                  {/* Status */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-400">Status:</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        subscription.is_active
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {subscription.status}
                    </span>
                    {subscription.cancel_at_period_end && (
                      <span className="text-yellow-400 text-xs">
                        (Cancels at period end)
                      </span>
                    )}
                  </div>

                  {/* Usage */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-300">
                      Current Usage
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
                        unlimited={subscription.limits.ai_queries_per_month === -1}
                      />
                      <UsageBar
                        label="Clips Generated"
                        used={subscription.usage.clips_generated}
                        limit={subscription.limits.clips_per_month}
                        unlimited={subscription.limits.clips_per_month === -1}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                    <Link
                      href="/settings/billing"
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                    >
                      <span>Manage Subscription</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/settings/billing/history"
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      View Invoices
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Account Card */}
            <Link
              href="/settings/profile"
              className="block bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.name || "Profile"}
                      className="w-12 h-12 rounded-full border border-white/20"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-400" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      Profile
                    </h2>
                    <p className="text-sm text-gray-400">
                      {profile?.name || profile?.email || "Manage your profile"}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </div>
            </Link>

            {/* Account Settings Card */}
            <Link
              href="/settings/account"
              className="block bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Account Settings
                    </h2>
                    <p className="text-sm text-gray-400">
                      Theme, timezone, notifications, and privacy
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </div>
            </Link>

            {/* Connected Channels Card */}
            <Link
              href="/settings/profile"
              className="block bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <Youtube className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Connected YouTube Channels
                    </h2>
                    <p className="text-sm text-gray-400">
                      {loading ? (
                        "Loading..."
                      ) : profile ? (
                        `${profile.channels_count} channel${profile.channels_count !== 1 ? "s" : ""} connected`
                      ) : (
                        "View your connected channels"
                      )}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
