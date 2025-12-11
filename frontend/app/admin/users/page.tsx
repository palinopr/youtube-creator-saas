"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  UserCog,
  Ban,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { ADMIN_ENDPOINTS, API_URL } from "@/lib/config";

interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  is_admin: boolean;
  is_suspended: boolean;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string;
  last_login: string | null;
  subscription_plan: string;
  channels_count: number;
}

interface PaginatedResponse {
  items: User[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Action menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal for suspend
  const [suspendModal, setSuspendModal] = useState<{ userId: string; name: string } | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (search) params.set("search", search);
      if (planFilter) params.set("plan", planFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`${ADMIN_ENDPOINTS.USERS}?${params}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      const data: PaginatedResponse = await res.json();
      setUsers(data.items);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, planFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleSuspend = async () => {
    if (!suspendModal) return;

    setActionLoading(suspendModal.userId);
    try {
      const res = await fetch(`${ADMIN_ENDPOINTS.USERS}/${suspendModal.userId}/suspend`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: suspendReason }),
      });

      if (res.ok) {
        setSuspendModal(null);
        setSuspendReason("");
        fetchUsers();
      }
    } catch (err) {
      console.error("Failed to suspend user:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnsuspend = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`${ADMIN_ENDPOINTS.USERS}/${userId}/unsuspend`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error("Failed to unsuspend user:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string, hardDelete: boolean = false) => {
    if (!confirm(`Are you sure you want to ${hardDelete ? "permanently delete" : "delete"} this user?`)) {
      return;
    }

    setActionLoading(userId);
    try {
      const params = hardDelete ? "?hard_delete=true" : "";
      const res = await fetch(`${ADMIN_ENDPOINTS.USERS}/${userId}${params}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleImpersonate = async (userId: string) => {
    const reason = prompt("Enter reason for impersonation (required for audit):");
    if (!reason) return;

    setActionLoading(userId);
    try {
      const res = await fetch(`${ADMIN_ENDPOINTS.USERS}/${userId}/impersonate`, {
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
      setActionLoading(null);
    }
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-gray-400">
            {total} total users
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
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
            <option value="suspended">Suspended</option>
            <option value="admin">Admins</option>
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
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort("subscription_plan")}
                >
                  Plan {sortBy === "subscription_plan" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Channels
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort("created_at")}
                >
                  Joined {sortBy === "created_at" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort("last_login")}
                >
                  Last Active {sortBy === "last_login" && (sortOrder === "asc" ? "↑" : "↓")}
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
                    <td colSpan={7} className="px-4 py-4">
                      <div className="animate-pulse h-10 bg-white/10 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.picture ? (
                          <img
                            src={user.picture}
                            alt=""
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <span className="text-purple-400 font-medium">
                              {(user.name || user.email)[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{user.name || "No name"}</p>
                            {user.is_admin && (
                              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full border ${getPlanBadge(user.subscription_plan)}`}>
                        {user.subscription_plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.is_suspended ? (
                        <span className="flex items-center gap-1 text-red-400 text-sm">
                          <XCircle className="w-4 h-4" />
                          Suspended
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-400 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {user.channels_count}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {formatDate(user.last_login)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === user.id ? null : user.id);
                          }}
                          disabled={actionLoading === user.id}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          {actionLoading === user.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <MoreVertical className="w-4 h-4" />
                          )}
                        </button>

                        {openMenuId === user.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-10">
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </Link>
                            {!user.is_admin && (
                              <>
                                <button
                                  onClick={() => handleImpersonate(user.id)}
                                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/10 transition-colors text-left"
                                >
                                  <UserCog className="w-4 h-4" />
                                  Impersonate
                                </button>
                                {user.is_suspended ? (
                                  <button
                                    onClick={() => handleUnsuspend(user.id)}
                                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/10 transition-colors text-left text-green-400"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Unsuspend
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setSuspendModal({ userId: user.id, name: user.name || user.email })}
                                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/10 transition-colors text-left text-yellow-400"
                                  >
                                    <Ban className="w-4 h-4" />
                                    Suspend
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/10 transition-colors text-left text-red-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
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
              Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} users
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

      {/* Suspend Modal */}
      {suspendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSuspendModal(null)}>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Suspend User</h3>
            <p className="text-gray-400 mb-4">
              Are you sure you want to suspend <strong>{suspendModal.name}</strong>?
            </p>
            <textarea
              placeholder="Reason for suspension (required)"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-purple-500 mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSuspendModal(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={!suspendReason.trim() || actionLoading !== null}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Suspending..." : "Suspend User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
