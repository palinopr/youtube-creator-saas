"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
} from "lucide-react";
import { ADMIN_ENDPOINTS } from "@/lib/config";

interface Subscription {
  user_id: string;
  user_email: string;
  user_name: string | null;
  plan: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  monthly_usage: {
    clips_generated: number;
    seo_analyses: number;
    agent_queries: number;
  };
}

interface PaginatedResponse {
  items: Subscription[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [planFilter, setPlanFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      if (search) params.set("search", search);
      if (planFilter) params.set("plan", planFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`${ADMIN_ENDPOINTS.SUBSCRIPTIONS}?${params}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch subscriptions");
      }

      const data: PaginatedResponse = await res.json();
      setSubscriptions(data.items);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, planFilter, statusFilter]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSubscriptions();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      starter: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      pro: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      agency: "bg-green-500/20 text-green-400 border-green-500/30",
    };
    return colors[plan.toLowerCase()] || colors.free;
  };

  const getStatusIcon = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return <Clock className="w-4 h-4 text-yellow-400" />;
    }
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "trialing":
        return <Clock className="w-4 h-4 text-blue-400" />;
      case "past_due":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "canceled":
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) return "Canceling";
    return status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
  };

  // Summary stats
  const stats = {
    total: total,
    active: subscriptions.filter(s => s.status === "active" && !s.cancel_at_period_end).length,
    canceling: subscriptions.filter(s => s.cancel_at_period_end).length,
    pastDue: subscriptions.filter(s => s.status === "past_due").length,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-purple-400" />
            Subscriptions
          </h1>
          <p className="text-gray-400">{total} total subscriptions</p>
        </div>
        <button
          onClick={fetchSubscriptions}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <p className="text-sm text-green-400">Active</p>
          <p className="text-2xl font-bold text-green-400">{stats.active}</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <p className="text-sm text-yellow-400">Canceling</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.canceling}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-sm text-red-400">Past Due</p>
          <p className="text-2xl font-bold text-red-400">{stats.pastDue}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="agency">Agency</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past Due</option>
            <option value="canceled">Canceled</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Apply
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Period End
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4">
                      <div className="animate-pulse h-10 bg-white/10 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.user_id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{sub.user_name || "No name"}</p>
                        <p className="text-sm text-gray-400">{sub.user_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full border ${getPlanBadge(sub.plan)}`}>
                        {sub.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(sub.status, sub.cancel_at_period_end)}
                        <span className="text-sm">
                          {getStatusText(sub.status, sub.cancel_at_period_end)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {formatDate(sub.current_period_end)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-400 space-y-1">
                        <p>{sub.monthly_usage.clips_generated} clips</p>
                        <p>{sub.monthly_usage.seo_analyses} SEO</p>
                        <p>{sub.monthly_usage.agent_queries} queries</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/users/${sub.user_id}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
