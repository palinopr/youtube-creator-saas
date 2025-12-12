"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { v1Api, ReviewChangeRequest, ReviewChangeOutput, Confidence } from "@/lib/v1-api";
import { AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";

// Map confidence enum to percentage for progress bar display
const confidenceToPercent: Record<Confidence, number> = {
  low: 33,
  medium: 66,
  high: 100,
};

// Map confidence enum to display label
const confidenceLabel: Record<Confidence, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export default function ReviewPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth({
    requireAuth: true,
    redirectTo: "/",
  });

  const [formData, setFormData] = useState<ReviewChangeRequest>({
    channel_id: "",
    video_id: "",
    current_title: "",
    current_description: "",
    proposed_title: "",
    proposed_description: "",
  });
  const [result, setResult] = useState<ReviewChangeOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await v1Api.reviewChange(formData);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to review change");
    } finally {
      setLoading(false);
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case "low":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "medium":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case "high":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case "low":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "medium":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "high":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  const getConfidenceColor = (confidence: Confidence) => {
    switch (confidence) {
      case "low":
        return "bg-red-400/60";
      case "medium":
        return "bg-yellow-400/60";
      case "high":
        return "bg-green-400/60";
      default:
        return "bg-white/60";
    }
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
    <DashboardLayout activePath="/v1/review">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-medium text-white mb-8">Review Change</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Channel ID
              </label>
              <input
                type="text"
                name="channel_id"
                value={formData.channel_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
                placeholder="UC..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Video ID
              </label>
              <input
                type="text"
                name="video_id"
                value={formData.video_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
                placeholder="dQw4w9WgXcQ"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Current Title
            </label>
            <input
              type="text"
              name="current_title"
              value={formData.current_title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Current Description
            </label>
            <textarea
              name="current_description"
              value={formData.current_description}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/20 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Proposed Title
            </label>
            <input
              type="text"
              name="proposed_title"
              value={formData.proposed_title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Proposed Description
            </label>
            <textarea
              name="proposed_description"
              value={formData.proposed_description}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/20 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Reviewing..." : "Review change"}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-400/10 border border-red-400/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-4">
            <div className="p-6 bg-white/5 border border-white/10 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getRiskIcon(result.risk_level)}
                  <span className="text-lg font-medium text-white capitalize">
                    {result.verdict}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 text-sm rounded-full border capitalize ${getRiskColor(
                    result.risk_level
                  )}`}
                >
                  {result.risk_level} risk
                </span>
              </div>

              {/* Confidence - display label and map to % for bar */}
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Confidence:</span>
                <span className="font-medium text-white">{confidenceLabel[result.confidence]}</span>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getConfidenceColor(result.confidence)}`}
                    style={{ width: `${confidenceToPercent[result.confidence]}%` }}
                  />
                </div>
                <span>{confidenceToPercent[result.confidence]}%</span>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Reasons</p>
                <ul className="space-y-2">
                  {result.reasons.map((reason, i) => (
                    <li key={i} className="text-sm text-gray-300 flex gap-2">
                      <span className="text-gray-500">{i + 1}.</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Conservative Suggestion - render title and description separately */}
              {result.conservative_suggestion && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-400 mb-2">
                    Conservative Suggestion
                  </p>
                  <div className="space-y-2">
                    {result.conservative_suggestion.title && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Title</span>
                        <p className="text-sm text-gray-300 mt-1">
                          {result.conservative_suggestion.title}
                        </p>
                      </div>
                    )}
                    {result.conservative_suggestion.description && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Description</span>
                        <p className="text-sm text-gray-300 mt-1">
                          {result.conservative_suggestion.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {result.metadata && Object.keys(result.metadata).length > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-400 mb-2">Metadata</p>
                  <pre className="text-xs text-gray-400 bg-black/30 p-3 rounded overflow-x-auto">
                    {JSON.stringify(result.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
