"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { v1Api, ChangeLogEntry, Confidence } from "@/lib/v1-api";
import { ChevronDown, ChevronRight, AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";

// Map confidence enum to percentage for display
const confidenceToPercent: Record<Confidence, number> = {
  low: 33,
  medium: 66,
  high: 100,
};

export default function ChangeLogPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth({
    requireAuth: true,
    redirectTo: "/",
  });

  const [channelId, setChannelId] = useState("");
  const [limit, setLimit] = useState(50);
  const [entries, setEntries] = useState<ChangeLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // API returns ChangeLogEntry[] directly
      const response = await v1Api.getChangeLog(channelId, limit);
      setEntries(response);
      setHasFetched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch change log");
    } finally {
      setLoading(false);
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case "low":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "medium":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case "high":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case "low":
        return "text-green-400";
      case "medium":
        return "text-yellow-400";
      case "high":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleExpand = (reviewId: string) => {
    setExpandedId(expandedId === reviewId ? null : reviewId);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <DashboardLayout activePath="/v1/change-log">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-medium text-white mb-8">Change Log</h1>

        <form onSubmit={handleFetch} className="mb-8">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-2">
                Channel ID
              </label>
              <input
                type="text"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
                placeholder="UC..."
              />
            </div>
            <div className="w-24">
              <label className="block text-sm text-gray-400 mb-2">Limit</label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 50)}
                min={1}
                max={200}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !channelId.trim()}
              className="px-6 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Fetch"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 p-4 bg-red-400/10 border border-red-400/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {hasFetched && entries.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-400">No entries found for this channel.</p>
          </div>
        )}

        {entries.length > 0 && (
          <div className="space-y-2">
            {/* Key by review_id */}
            {entries.map((entry) => (
              <div
                key={entry.review_id}
                className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleExpand(entry.review_id)}
                  className="w-full px-4 py-3 flex items-center gap-4 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-gray-500">
                    {expandedId === entry.review_id ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </span>
                  <span className="text-sm text-gray-400 w-40 shrink-0">
                    {formatDate(entry.created_at)}
                  </span>
                  {/* Show object_id as video id */}
                  <span className="text-sm text-gray-300 font-mono w-28 shrink-0 truncate">
                    {entry.object_id}
                  </span>
                  <span className="text-sm text-gray-300 flex-1 truncate capitalize">
                    {entry.verdict}
                  </span>
                  <span className="text-xs text-gray-500 w-16">
                    {confidenceToPercent[entry.confidence]}%
                  </span>
                  <span className={`text-sm ${getRiskColor(entry.risk_level)} flex items-center gap-1 capitalize`}>
                    {getRiskIcon(entry.risk_level)}
                    {entry.risk_level}
                  </span>
                </button>

                {expandedId === entry.review_id && (
                  <div className="px-4 pb-4 pt-2 border-t border-white/10 space-y-4">
                    {/* Reasons */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                        Reasons
                      </p>
                      <ul className="space-y-1">
                        {entry.reasons.map((reason, i) => (
                          <li key={i} className="text-sm text-gray-400 flex gap-2">
                            <span className="text-gray-600">{i + 1}.</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Before/After using entry.before and entry.after objects */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                          Before
                        </p>
                        <div className="bg-black/30 p-3 rounded space-y-2">
                          <p className="text-sm text-gray-300">
                            <span className="text-gray-500">Title: </span>
                            {entry.before.title}
                          </p>
                          <p className="text-sm text-gray-400 line-clamp-3">
                            <span className="text-gray-500">Description: </span>
                            {entry.before.description || "(empty)"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                          After
                        </p>
                        <div className="bg-black/30 p-3 rounded space-y-2">
                          <p className="text-sm text-gray-300">
                            <span className="text-gray-500">Title: </span>
                            {entry.after.title}
                          </p>
                          <p className="text-sm text-gray-400 line-clamp-3">
                            <span className="text-gray-500">Description: </span>
                            {entry.after.description || "(empty)"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Additional info */}
                    <div className="flex gap-4 text-xs text-gray-500 pt-2 border-t border-white/10">
                      <span>Review ID: {entry.review_id}</span>
                      <span>Outcome: {entry.outcome_status}</span>
                      {entry.evaluated_at && (
                        <span>Evaluated: {formatDate(entry.evaluated_at)}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
