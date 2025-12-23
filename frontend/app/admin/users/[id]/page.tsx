"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  CreditCard,
  Youtube,
  Activity,
  Shield,
  UserCog,
  Ban,
  CheckCircle,
  Trash2,
  RefreshCw,
  AlertCircle,
  Edit,
  Save,
  X,
} from "lucide-react";
import { ADMIN_ENDPOINTS } from "@/lib/config";

interface UserDetails {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  is_admin: boolean;
  is_suspended: boolean;
  suspended_at: string | null;
  suspended_reason: string | null;
  suspended_by: string | null;
  created_at: string;
  last_login: string | null;
  subscription: {
    plan: string;
    status: string;
    stripe_customer_id: string | null;
    current_period_end: string | null;
    monthly_usage: {
      clips_generated: number;
      seo_analyses: number;
      agent_queries: number;
    };
  };
  channels: Array<{
    id: string;
    channel_name: string | null;
    subscriber_count: number;
    video_count: number;
  }>;
  activity: Array<{
    action_type: string;
    description: string;
    created_at: string;
  }>;
}

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", is_admin: false });

  // Subscription override
  const [showPlanOverride, setShowPlanOverride] = useState(false);
  const [newPlan, setNewPlan] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  useEffect(() => {
    fetchUser();
  }, [resolvedParams.id]);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${ADMIN_ENDPOINTS.USERS}/${resolvedParams.id}`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("User not found");
        }
        throw new Error("Failed to fetch user");
      }

      const data = await res.json();
      setUser(data);
      setEditForm({
        name: data.name || "",
        email: data.email,
        is_admin: data.is_admin,
      });
      setNewPlan(data.subscription.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!user) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${ADMIN_ENDPOINTS.USERS}/${user.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        setEditing(false);
        fetchUser();
      }
    } catch (err) {
      console.error("Failed to update user:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!user) return;

    const reason = prompt("Enter reason for suspension:");
    if (!reason) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${ADMIN_ENDPOINTS.USERS}/${user.id}/suspend`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        fetchUser();
      }
    } catch (err) {
      console.error("Failed to suspend user:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    if (!user) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${ADMIN_ENDPOINTS.USERS}/${user.id}/unsuspend`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        fetchUser();
      }
    } catch (err) {
      console.error("Failed to unsuspend user:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (hard: boolean = false) => {
    if (!user) return;

    if (!confirm(`Are you sure you want to ${hard ? "permanently delete" : "delete"} this user? This cannot be undone.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const params = hard ? "?hard_delete=true" : "";
      const res = await fetch(`${ADMIN_ENDPOINTS.USERS}/${user.id}${params}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        router.push("/admin/users");
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleImpersonate = async () => {
    if (!user) return;

    const reason = prompt("Enter reason for impersonation (required for audit):");
    if (!reason) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${ADMIN_ENDPOINTS.USERS}/${user.id}/impersonate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = data.redirect_to || "/";
      }
    } catch (err) {
      console.error("Failed to impersonate user:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePlanOverride = async () => {
    if (!user || !newPlan || !overrideReason) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${ADMIN_ENDPOINTS.USERS}/${user.id}/subscription`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan, reason: overrideReason }),
      });

      if (res.ok) {
        setShowPlanOverride(false);
        setOverrideReason("");
        fetchUser();
      }
    } catch (err) {
      console.error("Failed to override plan:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetUsage = async () => {
    if (!user) return;

    if (!confirm("Are you sure you want to reset this user's monthly usage?")) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${ADMIN_ENDPOINTS.USERS}/${user.id}/subscription/reset-usage`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        fetchUser();
      }
    } catch (err) {
      console.error("Failed to reset usage:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/10 rounded w-48"></div>
          <div className="h-32 bg-white/5 rounded-xl"></div>
          <div className="h-64 bg-white/5 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-8">
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error || "User not found"}</p>
          <Link href="/admin/users" className="text-purple-400 hover:underline">
            Back to users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/users"
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{user.name || user.email}</h1>
          <p className="text-gray-400">User Details</p>
        </div>
        <button
          onClick={fetchUser}
          disabled={actionLoading}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${actionLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">User Information</h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-start gap-6">
              {user.picture ? (
                <img src={user.picture} alt="" className="w-20 h-20 rounded-full" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-2xl text-purple-400 font-medium">
                    {(user.name || user.email)[0].toUpperCase()}
                  </span>
                </div>
              )}

              <div className="flex-1 space-y-4">
                {editing ? (
                  <>
                    <div>
                      <label className="text-sm text-gray-400">Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Email</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.is_admin}
                        onChange={(e) => setEditForm({ ...editForm, is_admin: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Admin Access</span>
                    </label>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{user.name || "No name set"}</span>
                      {user.is_admin && (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {formatDate(user.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Activity className="w-4 h-4" />
                      <span>Last active {formatDate(user.last_login)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Suspension Status */}
            {user.is_suspended && (
              <div className="mt-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <Ban className="w-5 h-5" />
                  <span className="font-medium">User Suspended</span>
                </div>
                <p className="text-sm text-gray-400">
                  Reason: {user.suspended_reason}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Suspended on {formatDate(user.suspended_at)}
                </p>
              </div>
            )}
          </div>

          {/* Subscription */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Subscription</h2>
              <button
                onClick={() => setShowPlanOverride(!showPlanOverride)}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                Override Plan
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-400">Plan</p>
                <p className="text-lg font-medium capitalize">{user.subscription.plan}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className={`text-lg font-medium capitalize ${
                  user.subscription.status === "active" ? "text-green-400" : "text-yellow-400"
                }`}>
                  {user.subscription.status}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Renewal</p>
                <p className="text-lg font-medium">
                  {user.subscription.current_period_end
                    ? formatDate(user.subscription.current_period_end)
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Stripe ID</p>
                <p className="text-lg font-medium truncate">
                  {user.subscription.stripe_customer_id || "-"}
                </p>
              </div>
            </div>

            {/* Plan Override Modal */}
            {showPlanOverride && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
                <h3 className="font-medium mb-3">Override Subscription Plan</h3>
                <div className="space-y-3">
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="agency">Agency</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Reason for override"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handlePlanOverride}
                    disabled={!overrideReason || actionLoading}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Apply Override
                  </button>
                </div>
              </div>
            )}

            {/* Usage */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Monthly Usage</h3>
                <button
                  onClick={handleResetUsage}
                  disabled={actionLoading}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Reset Usage
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-2xl font-bold">{user.subscription.monthly_usage.clips_generated}</p>
                  <p className="text-xs text-gray-400">Clips Generated</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-2xl font-bold">{user.subscription.monthly_usage.seo_analyses}</p>
                  <p className="text-xs text-gray-400">SEO Analyses</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-2xl font-bold">{user.subscription.monthly_usage.agent_queries}</p>
                  <p className="text-xs text-gray-400">Agent Queries</p>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Channels */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">
              Connected Channels ({user.channels.length})
            </h2>
            {user.channels.length > 0 ? (
              <div className="space-y-3">
                {user.channels.map((channel) => (
                  <div key={channel.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                    <Youtube className="w-8 h-8 text-red-500" />
                    <div className="flex-1">
                      <p className="font-medium">{channel.channel_name || "Unknown Channel"}</p>
                      <p className="text-sm text-gray-400">
                        {formatNumber(channel.subscriber_count)} subscribers · {formatNumber(channel.video_count)} videos
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">No channels connected</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="space-y-2">
              {!user.is_admin && (
                <>
                  <button
                    onClick={handleImpersonate}
                    disabled={actionLoading}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <UserCog className="w-5 h-5 text-purple-400" />
                    <span>Impersonate User</span>
                  </button>

                  {user.is_suspended ? (
                    <button
                      onClick={handleUnsuspend}
                      disabled={actionLoading}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Unsuspend User</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSuspend}
                      disabled={actionLoading}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg transition-colors"
                    >
                      <Ban className="w-5 h-5" />
                      <span>Suspend User</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(false)}
                    disabled={actionLoading}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Delete User</span>
                  </button>
                </>
              )}

              {user.is_admin && (
                <div className="text-center py-4 text-gray-400">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                  <p>Admin users cannot be modified</p>
                </div>
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            {user.activity.length > 0 ? (
              <div className="space-y-3">
                {user.activity.map((activity, index) => (
                  <div key={index} className="text-sm">
                    <p className="text-gray-400">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
