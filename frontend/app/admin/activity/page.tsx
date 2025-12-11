"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Eye,
  Edit,
  UserX,
  UserCheck,
  Trash2,
  Users,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ADMIN_ENDPOINTS } from "@/lib/config";

interface ActivityLog {
  id: number;
  admin_user_id: string;
  admin_name: string;
  admin_email: string;
  action_type: string;
  target_user_id: string | null;
  target_user_email: string | null;
  description: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

interface PaginatedResponse {
  items: ActivityLog[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  user_view: <Eye className="w-4 h-4" />,
  user_edit: <Edit className="w-4 h-4" />,
  user_suspend: <UserX className="w-4 h-4" />,
  user_unsuspend: <UserCheck className="w-4 h-4" />,
  user_delete: <Trash2 className="w-4 h-4" />,
  user_impersonate: <Users className="w-4 h-4" />,
  subscription_change: <CreditCard className="w-4 h-4" />,
  usage_reset: <RefreshCw className="w-4 h-4" />,
};

const ACTION_COLORS: Record<string, string> = {
  user_view: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  user_edit: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  user_suspend: "text-red-400 bg-red-500/10 border-red-500/30",
  user_unsuspend: "text-green-400 bg-green-500/10 border-green-500/30",
  user_delete: "text-red-400 bg-red-500/10 border-red-500/30",
  user_impersonate: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  subscription_change: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  usage_reset: "text-orange-400 bg-orange-500/10 border-orange-500/30",
};

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [actionFilter, setActionFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      if (search) params.set("search", search);
      if (actionFilter) params.set("action_type", actionFilter);

      const res = await fetch(`${ADMIN_ENDPOINTS.ACTIVITY_LOG}?${params}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch activity log");
      }

      const data: PaginatedResponse = await res.json();
      setActivities(data.items);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, actionFilter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchActivities();
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatActionType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Activity className="w-7 h-7 text-orange-400" />
            Admin Activity Log
          </h1>
          <p className="text-gray-400">Audit trail of all admin actions</p>
        </div>
        <button
          onClick={fetchActivities}
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
              placeholder="Search by admin or target email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="">All Actions</option>
            <option value="user_view">User View</option>
            <option value="user_edit">User Edit</option>
            <option value="user_suspend">User Suspend</option>
            <option value="user_unsuspend">User Unsuspend</option>
            <option value="user_delete">User Delete</option>
            <option value="user_impersonate">User Impersonate</option>
            <option value="subscription_change">Subscription Change</option>
            <option value="usage_reset">Usage Reset</option>
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

      {/* Activity List */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="divide-y divide-white/10">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4">
                <div className="animate-pulse h-16 bg-white/10 rounded"></div>
              </div>
            ))
          ) : activities.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No activity logs found
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="hover:bg-white/5 transition-colors">
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => toggleExpand(activity.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* Action Icon */}
                      <div
                        className={`p-2 rounded-lg border ${
                          ACTION_COLORS[activity.action_type] || "text-gray-400 bg-gray-500/10 border-gray-500/30"
                        }`}
                      >
                        {ACTION_ICONS[activity.action_type] || <Activity className="w-4 h-4" />}
                      </div>

                      {/* Details */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-purple-400">
                            {activity.admin_name || activity.admin_email}
                          </span>
                          <span className="text-gray-500">performed</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${
                              ACTION_COLORS[activity.action_type] || "text-gray-400 bg-gray-500/10 border-gray-500/30"
                            }`}
                          >
                            {formatActionType(activity.action_type)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-400">{activity.description}</p>

                        {activity.target_user_email && (
                          <p className="text-xs text-gray-500 mt-1">
                            Target: {activity.target_user_email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="text-xs text-gray-400">{formatDateTime(activity.created_at)}</p>
                        {activity.ip_address && (
                          <p className="text-xs text-gray-500">IP: {activity.ip_address}</p>
                        )}
                      </div>
                      {(activity.old_value || activity.new_value) && (
                        <div className="text-gray-500">
                          {expandedId === activity.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === activity.id && (activity.old_value || activity.new_value) && (
                  <div className="px-4 pb-4 border-t border-white/10 bg-black/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      {activity.old_value && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-400 mb-2">Previous Value</h4>
                          <pre className="text-xs bg-red-900/20 border border-red-500/30 rounded-lg p-3 overflow-x-auto">
                            {JSON.stringify(activity.old_value, null, 2)}
                          </pre>
                        </div>
                      )}
                      {activity.new_value && (
                        <div>
                          <h4 className="text-xs font-medium text-gray-400 mb-2">New Value</h4>
                          <pre className="text-xs bg-green-900/20 border border-green-500/30 rounded-lg p-3 overflow-x-auto">
                            {JSON.stringify(activity.new_value, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
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
