"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Plus,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Shield,
  Upload,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { ADMIN_ENDPOINTS, API_URL } from "@/lib/config";

interface KeywordRanking {
  id: number;
  keyword: string;
  position: number;
  previous_position: number;
  change: {
    value: number;
    direction: "up" | "down" | "same" | "none";
  };
  url: string;
  device: string;
  country: string;
  updated_at: string;
}

interface RankingsData {
  total_keywords: number;
  keywords: KeywordRanking[];
  position_distribution: {
    top_3: number;
    top_10: number;
    top_30: number;
    top_100: number;
    not_ranked: number;
  };
  last_updated: string | null;
  error?: string;
  message?: string;
}

interface Domain {
  id: number;
  domain: string;
  slug: string;
}

interface SuggestedKeywords {
  product_keywords: string[];
  content_keywords: string[];
  competitor_keywords: string[];
}

interface HistoryPoint {
  date: string;
  position: number;
}

interface KeywordHistory {
  [keywordId: number]: HistoryPoint[];
}

export default function AdminSeoPage() {
  const [rankings, setRankings] = useState<RankingsData | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [suggestedKeywords, setSuggestedKeywords] = useState<SuggestedKeywords | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serpbearRunning, setSerpbearRunning] = useState(true);

  // Add keyword form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [addingKeyword, setAddingKeyword] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState<number | null>(null);

  // Filter
  const [searchFilter, setSearchFilter] = useState("");

  // Keyword history for sparklines
  const [keywordHistory, setKeywordHistory] = useState<KeywordHistory>({});
  const [loadingHistory, setLoadingHistory] = useState(false);

  // CSV Import
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

  // Fetch history for all keywords
  const fetchKeywordHistory = useCallback(async (domainId: number, keywords: KeywordRanking[]) => {
    if (!domainId || keywords.length === 0) return;

    setLoadingHistory(true);
    const historyMap: KeywordHistory = {};

    // Fetch history for each keyword (limit to first 20 to avoid too many requests)
    const keywordsToFetch = keywords.slice(0, 20);

    await Promise.all(
      keywordsToFetch.map(async (kw) => {
        try {
          const res = await fetch(
            `${API_URL}/api/admin/seo/domains/${domainId}/keywords/${kw.id}/history`,
            { credentials: "include" }
          );
          if (res.ok) {
            const data = await res.json();
            // Transform history data for sparkline (last 30 days)
            const history = (data.history || [])
              .slice(-30)
              .map((h: { date?: string; position?: number; updatedAt?: string }) => ({
                date: h.date || h.updatedAt || "",
                position: h.position || 0,
              }));
            historyMap[kw.id] = history;
          }
        } catch (err) {
          console.error(`Failed to fetch history for keyword ${kw.id}:`, err);
        }
      })
    );

    setKeywordHistory(historyMap);
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check admin status first
      const statusRes = await fetch(ADMIN_ENDPOINTS.STATUS, {
        credentials: "include",
      });

      if (!statusRes.ok) {
        if (statusRes.status === 401) {
          setError("Please authenticate first");
          setLoading(false);
          return;
        }
        if (statusRes.status === 403) {
          setError("Admin access required");
          setLoading(false);
          return;
        }
        throw new Error("Failed to check admin status");
      }

      const statusData = await statusRes.json();
      setSerpbearRunning(statusData.services?.serpbear?.running ?? false);

      // Fetch rankings
      const rankingsRes = await fetch(ADMIN_ENDPOINTS.SEO_RANKINGS, {
        credentials: "include",
      });

      let rankingsData: RankingsData | null = null;
      if (rankingsRes.ok) {
        rankingsData = await rankingsRes.json();
        setRankings(rankingsData);
      }

      // Fetch domains
      const domainsRes = await fetch(ADMIN_ENDPOINTS.SEO_DOMAINS, {
        credentials: "include",
      });

      if (domainsRes.ok) {
        const domainsData = await domainsRes.json();
        setDomains(domainsData.domains || []);
        if (domainsData.domains?.length > 0) {
          const domainId = domainsData.domains[0].id;
          setSelectedDomainId(domainId);

          // Fetch keyword history for sparklines
          if (rankingsData?.keywords?.length) {
            fetchKeywordHistory(domainId, rankingsData.keywords);
          }
        }
      }

      // Fetch suggested keywords
      const suggestedRes = await fetch(ADMIN_ENDPOINTS.SEO_SUGGESTED, {
        credentials: "include",
      });

      if (suggestedRes.ok) {
        const suggestedData = await suggestedRes.json();
        setSuggestedKeywords(suggestedData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!selectedDomainId) return;

    setRefreshing(true);
    try {
      await fetch(`${API_URL}/api/admin/seo/domains/${selectedDomainId}/refresh`, {
        method: "POST",
        credentials: "include",
      });
      // Wait a moment then refetch
      setTimeout(fetchData, 2000);
    } catch (err) {
      console.error("Failed to refresh:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddKeyword = async (keyword: string) => {
    if (!selectedDomainId || !keyword.trim()) return;

    setAddingKeyword(true);
    try {
      const res = await fetch(ADMIN_ENDPOINTS.SEO_KEYWORDS, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain_id: selectedDomainId,
          keyword: keyword.trim(),
          device: "desktop",
          country: "US",
        }),
      });

      if (res.ok) {
        setNewKeyword("");
        setShowAddForm(false);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to add keyword:", err);
    } finally {
      setAddingKeyword(false);
    }
  };

  const handleDeleteKeyword = async (keywordId: number) => {
    if (!selectedDomainId) return;

    try {
      await fetch(`${API_URL}/api/admin/seo/domains/${selectedDomainId}/keywords/${keywordId}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchData();
    } catch (err) {
      console.error("Failed to delete keyword:", err);
    }
  };

  const handleBulkImport = async () => {
    if (!selectedDomainId || !importText.trim()) return;

    setImporting(true);
    try {
      // Parse keywords from text (one per line or comma-separated)
      const keywords = importText
        .split(/[\n,]/)
        .map(k => k.trim())
        .filter(k => k.length > 0);

      if (keywords.length === 0) {
        alert("No valid keywords found");
        return;
      }

      const res = await fetch(`${API_URL}/api/admin/seo/keywords/bulk`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain_id: selectedDomainId,
          keywords: keywords,
          device: "desktop",
          country: "US",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Successfully added ${data.added} keywords`);
        setImportText("");
        setShowImportModal(false);
        fetchData();
      } else {
        const error = await res.json();
        alert(`Failed to import: ${error.detail || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Failed to bulk import:", err);
      alert("Failed to import keywords");
    } finally {
      setImporting(false);
    }
  };

  // Sparkline component for keyword history
  const KeywordSparkline = ({ keywordId }: { keywordId: number }) => {
    const history = keywordHistory[keywordId];

    if (!history || history.length < 2) {
      return (
        <div className="w-24 h-8 flex items-center justify-center text-xs text-gray-500">
          {loadingHistory ? "..." : "No data"}
        </div>
      );
    }

    // Invert positions for chart (lower position = higher on chart)
    const chartData = history.map(h => ({
      ...h,
      displayPosition: h.position > 0 ? 101 - h.position : 0,
    }));

    // Determine trend color
    const firstPos = history[0]?.position || 0;
    const lastPos = history[history.length - 1]?.position || 0;
    const improving = lastPos > 0 && firstPos > 0 && lastPos < firstPos;
    const declining = lastPos > 0 && firstPos > 0 && lastPos > firstPos;

    const strokeColor = improving ? "#4ade80" : declining ? "#f87171" : "#9ca3af";

    return (
      <div className="w-24 h-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as HistoryPoint & { displayPosition: number };
                  return (
                    <div className="bg-gray-900 border border-gray-700 px-2 py-1 rounded text-xs">
                      <p>#{data.position}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="displayPosition"
              stroke={strokeColor}
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const filteredKeywords = rankings?.keywords?.filter(kw =>
    kw.keyword.toLowerCase().includes(searchFilter.toLowerCase())
  ) || [];

  const getPositionColor = (position: number) => {
    if (position === 0) return "text-gray-500";
    if (position <= 3) return "text-green-400";
    if (position <= 10) return "text-blue-400";
    if (position <= 30) return "text-yellow-400";
    return "text-orange-400";
  };

  const getChangeIcon = (direction: string) => {
    switch (direction) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading SEO data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 text-xl mb-2">{error}</p>
          <Link href="/" className="text-purple-400 hover:underline">
            Go back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Search className="w-6 h-6 text-green-400" />
                SEO Rankings (Admin)
              </h1>
              <p className="text-sm text-gray-400">
                Track TubeGrow&apos;s Google rankings
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {serpbearRunning ? (
                <span className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  SerpBear Running
                </span>
              ) : (
                <span className="flex items-center gap-2 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  SerpBear Offline
                </span>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing || !serpbearRunning}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh rankings"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* SerpBear Not Running Warning */}
        {!serpbearRunning && (
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-yellow-300 flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5" />
              SerpBear is not running
            </h2>
            <p className="text-gray-400 mb-3">
              Start SerpBear to track your SEO rankings:
            </p>
            <code className="bg-black/50 px-3 py-2 rounded text-sm text-green-400 block">
              cd serpbear && docker compose up -d
            </code>
            <a
              href="http://localhost:3005"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-purple-400 hover:text-purple-300"
            >
              Open SerpBear Dashboard
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Position Distribution */}
        {rankings && !rankings.error && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-600/20 to-green-800/10 border border-green-500/30 rounded-xl p-4">
              <p className="text-sm text-gray-400">Top 3</p>
              <p className="text-2xl font-bold text-green-300">{rankings.position_distribution.top_3}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 border border-blue-500/30 rounded-xl p-4">
              <p className="text-sm text-gray-400">Top 10</p>
              <p className="text-2xl font-bold text-blue-300">{rankings.position_distribution.top_10}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/10 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-sm text-gray-400">Top 30</p>
              <p className="text-2xl font-bold text-yellow-300">{rankings.position_distribution.top_30}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/10 border border-orange-500/30 rounded-xl p-4">
              <p className="text-sm text-gray-400">Top 100</p>
              <p className="text-2xl font-bold text-orange-300">{rankings.position_distribution.top_100}</p>
            </div>
            <div className="bg-gradient-to-br from-gray-600/20 to-gray-800/10 border border-gray-500/30 rounded-xl p-4">
              <p className="text-sm text-gray-400">Not Ranked</p>
              <p className="text-2xl font-bold text-gray-300">{rankings.position_distribution.not_ranked}</p>
            </div>
          </div>
        )}

        {/* Keywords Table */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-8">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Tracked Keywords ({rankings?.total_keywords || 0})
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Filter keywords..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Keyword
              </button>
            </div>
          </div>

          {/* Add Keyword Form */}
          {showAddForm && (
            <div className="p-4 bg-white/5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Enter keyword to track..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddKeyword(newKeyword)}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => handleAddKeyword(newKeyword)}
                  disabled={addingKeyword || !newKeyword.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {addingKeyword ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          )}

          {/* Keywords List */}
          <div className="divide-y divide-white/10">
            {filteredKeywords.length > 0 ? (
              filteredKeywords.map((kw) => (
                <div key={kw.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{kw.keyword}</p>
                      <p className="text-sm text-gray-400 truncate">
                        {kw.url || "Not ranking"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Sparkline - 30 day trend */}
                      <div className="hidden md:block">
                        <KeywordSparkline keywordId={kw.id} />
                        <p className="text-xs text-gray-500 text-center">30d trend</p>
                      </div>
                      <div className="text-center w-16">
                        <p className={`text-2xl font-bold ${getPositionColor(kw.position)}`}>
                          {kw.position || "-"}
                        </p>
                        <p className="text-xs text-gray-500">Position</p>
                      </div>
                      <div className="flex items-center gap-1 w-16">
                        {getChangeIcon(kw.change.direction)}
                        <span className={`text-sm ${
                          kw.change.direction === "up" ? "text-green-400" :
                          kw.change.direction === "down" ? "text-red-400" :
                          "text-gray-500"
                        }`}>
                          {kw.change.value > 0 ? kw.change.value : "-"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 w-20 hidden lg:block">
                        {kw.device} / {kw.country}
                      </div>
                      <button
                        onClick={() => handleDeleteKeyword(kw.id)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">
                {rankings?.error ? (
                  <p>{rankings.message || rankings.error}</p>
                ) : (
                  <p>No keywords tracked yet. Add some keywords to start tracking!</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Suggested Keywords */}
        {suggestedKeywords && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Suggested Keywords</h2>
            <p className="text-gray-400 mb-6">
              Click any keyword to add it to your tracking list
            </p>

            <div className="space-y-6">
              {/* Product Keywords */}
              <div>
                <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-3">
                  Product Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {suggestedKeywords.product_keywords.map((kw) => (
                    <button
                      key={kw}
                      onClick={() => handleAddKeyword(kw)}
                      className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded-full text-sm transition-colors"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Keywords */}
              <div>
                <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-3">
                  Content Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {suggestedKeywords.content_keywords.map((kw) => (
                    <button
                      key={kw}
                      onClick={() => handleAddKeyword(kw)}
                      className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-full text-sm transition-colors"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>

              {/* Competitor Keywords */}
              <div>
                <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-3">
                  Competitor Alternatives
                </h3>
                <div className="flex flex-wrap gap-2">
                  {suggestedKeywords.competitor_keywords.map((kw) => (
                    <button
                      key={kw}
                      onClick={() => handleAddKeyword(kw)}
                      className="px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/30 rounded-full text-sm transition-colors"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-400" />
              Bulk Import Keywords
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Paste your keywords below, one per line or comma-separated. You can export keywords from Semrush and paste them here.
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="youtube analytics tool
youtube seo tool
viral clips generator
vidiq alternative
tubebuddy alternative"
              className="w-full h-48 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500 text-sm font-mono resize-none"
            />
            <p className="text-xs text-gray-500 mt-2 mb-4">
              {importText.split(/[\n,]/).filter(k => k.trim()).length} keywords detected
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportText("");
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                disabled={importing || !importText.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import Keywords
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
