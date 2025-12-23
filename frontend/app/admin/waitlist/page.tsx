"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  CheckCircle,
  Clock,
  Send,
  UserPlus,
  ArrowUpDown,
  Trash2,
  MailCheck,
} from "lucide-react";
import { ADMIN_ENDPOINTS } from "@/lib/config";

interface WaitlistEntry {
  id: string;
  email: string;
  position: number;
  status: string;
  referral_source: string | null;
  ip_address: string | null;
  created_at: string | null;
  confirmed_at: string | null;
}

interface WaitlistStats {
  total: number;
  pending: number;
  confirmed: number;
  invited: number;
  converted: number;
  today: number;
  top_sources: { source: string; count: number }[];
}

interface PaginatedResponse {
  items: WaitlistEntry[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  invited: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  converted: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  confirmed: <CheckCircle className="w-3 h-3" />,
  invited: <Send className="w-3 h-3" />,
  converted: <UserPlus className="w-3 h-3" />,
};

export default function AdminWaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [stats, setStats] = useState<WaitlistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  // Actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(ADMIN_ENDPOINTS.WAITLIST_STATS, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (search) params.append("search", search);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`${ADMIN_ENDPOINTS.WAITLIST}?${params}`, {
        credentials: "include",
      });

      if (res.ok) {
        const data: PaginatedResponse = await res.json();
        setEntries(data.items);
        setTotalPages(data.pages);
        setTotal(data.total);
      }
    } catch (err) {
      console.error("Failed to fetch entries:", err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchStats();
    fetchEntries();
  }, [fetchStats, fetchEntries]);

  const handleStatusUpdate = async (entryId: string, newStatus: string) => {
    setActionLoading(entryId);
    try {
      const res = await fetch(`${ADMIN_ENDPOINTS.WAITLIST}/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchEntries();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setActionLoading(null);
      setOpenDropdown(null);
    }
  };

  const handleResendEmail = async (entryId: string) => {
    setActionLoading(entryId);
    try {
      const res = await fetch(`${ADMIN_ENDPOINTS.WAITLIST}/${entryId}/resend`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        alert("Confirmation email resent successfully");
      } else {
        const data = await res.json();
        alert(data.detail || "Failed to resend email");
      }
    } catch (err) {
      console.error("Failed to resend email:", err);
      alert("Failed to resend email");
    } finally {
      setActionLoading(null);
      setOpenDropdown(null);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    setActionLoading(entryId);
    try {
      const res = await fetch(`${ADMIN_ENDPOINTS.WAITLIST}/${entryId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        fetchEntries();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to delete entry:", err);
    } finally {
      setActionLoading(null);
      setOpenDropdown(null);
    }
  };

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Mail className="w-7 h-7 text-purple-400" />
            Waitlist Management
          </h1>
          <p className="text-gray-400 mt-1">Track and manage waitlisted users</p>
        </div>
        <button
          onClick={() => {
            fetchStats();
            fetchEntries();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard
          label="Total"
          value={stats?.total ?? 0}
          loading={statsLoading}
          color="white"
        />
        <StatCard
          label="Pending"
          value={stats?.pending ?? 0}
          loading={statsLoading}
          color="yellow"
        />
        <StatCard
          label="Confirmed"
          value={stats?.confirmed ?? 0}
          loading={statsLoading}
          color="green"
        />
        <StatCard
          label="Invited"
          value={stats?.invited ?? 0}
          loading={statsLoading}
          color="blue"
        />
        <StatCard
          label="Converted"
          value={stats?.converted ?? 0}
          loading={statsLoading}
          color="purple"
        />
        <StatCard
          label="Today"
          value={stats?.today ?? 0}
          loading={statsLoading}
          color="pink"
        />
      </div>

      {/* Top Sources */}
      {stats?.top_sources && stats.top_sources.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Top Referral Sources</h3>
          <div className="flex flex-wrap gap-2">
            {stats.top_sources.map((source) => (
              <span
                key={source.source}
                className="px-3 py-1 bg-white/10 rounded-full text-sm"
              >
                {source.source} <span className="text-gray-400">({source.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="invited">Invited</option>
          <option value="converted">Converted</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                <th className="px-4 py-3 font-medium">
                  <button
                    onClick={() => toggleSort("position")}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    #
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button
                    onClick={() => toggleSort("email")}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    Email
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">
                  <button
                    onClick={() => toggleSort("created_at")}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    Signed Up
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button
                    onClick={() => toggleSort("confirmed_at")}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    Confirmed
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No waitlist entries found
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-400 font-mono text-sm">
                      {entry.position}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{entry.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          statusColors[entry.status] || "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {statusIcons[entry.status]}
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {entry.referral_source || "direct"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {formatDate(entry.created_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {formatDate(entry.confirmed_at)}
                    </td>
                    <td className="px-4 py-3 text-right relative">
                      <button
                        onClick={() =>
                          setOpenDropdown(openDropdown === entry.id ? null : entry.id)
                        }
                        disabled={actionLoading === entry.id}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading === entry.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="w-4 h-4" />
                        )}
                      </button>

                      {openDropdown === entry.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                          {entry.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(entry.id, "confirmed")}
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 flex items-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                Mark Confirmed
                              </button>
                              <button
                                onClick={() => handleResendEmail(entry.id)}
                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 flex items-center gap-2"
                              >
                                <MailCheck className="w-4 h-4 text-blue-400" />
                                Resend Email
                              </button>
                            </>
                          )}
                          {(entry.status === "pending" || entry.status === "confirmed") && (
                            <button
                              onClick={() => handleStatusUpdate(entry.id, "invited")}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 flex items-center gap-2"
                            >
                              <Send className="w-4 h-4 text-blue-400" />
                              Mark Invited
                            </button>
                          )}
                          {entry.status === "invited" && (
                            <button
                              onClick={() => handleStatusUpdate(entry.id, "converted")}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 flex items-center gap-2"
                            >
                              <UserPlus className="w-4 h-4 text-purple-400" />
                              Mark Converted
                            </button>
                          )}
                          <div className="border-t border-white/10" />
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-500/10 text-red-400 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <div className="text-sm text-gray-400">
              Showing {(page - 1) * perPage + 1} - {Math.min(page * perPage, total)} of{" "}
              {total}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  loading,
  color,
}: {
  label: string;
  value: number;
  loading: boolean;
  color: "white" | "yellow" | "green" | "blue" | "purple" | "pink";
}) {
  const colorClasses: Record<string, string> = {
    white: "text-white",
    yellow: "text-yellow-400",
    green: "text-green-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
    pink: "text-pink-400",
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      {loading ? (
        <div className="h-8 w-16 bg-white/10 animate-pulse rounded" />
      ) : (
        <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
      )}
    </div>
  );
}
