"use client";

import { useState } from "react";
import {
  ImageIcon,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Sparkles,
  Type,
  User,
  Palette,
  LayoutGrid,
  Lightbulb,
} from "lucide-react";

interface ThumbnailMetric {
  score: number;
  feedback: string;
  details?: Record<string, unknown>;
}

interface ThumbnailAnalysisData {
  overall_score: number;
  text_readability: ThumbnailMetric;
  face_detection: ThumbnailMetric;
  color_contrast: ThumbnailMetric;
  composition: ThumbnailMetric;
  suggestions: string[];
  summary: string;
}

interface ThumbnailAnalysisProps {
  videoId: string;
  thumbnailUrl: string;
  onAnalyze: () => Promise<ThumbnailAnalysisData>;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-green-500/20 border-green-500/30";
  if (score >= 60) return "bg-yellow-500/20 border-yellow-500/30";
  return "bg-red-500/20 border-red-500/30";
}

function getScoreIcon(score: number) {
  if (score >= 80) return <CheckCircle className="w-4 h-4 text-green-400" />;
  if (score >= 60) return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
  return <XCircle className="w-4 h-4 text-red-400" />;
}

function MetricCard({
  icon,
  label,
  metric,
}: {
  icon: React.ReactNode;
  label: string;
  metric: ThumbnailMetric;
}) {
  return (
    <div className={`p-3 rounded-lg border ${getScoreBg(metric.score)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          {icon}
          {label}
        </div>
        <div className="flex items-center gap-1">
          {getScoreIcon(metric.score)}
          <span className={`text-sm font-bold ${getScoreColor(metric.score)}`}>
            {metric.score}
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-400">{metric.feedback}</p>
    </div>
  );
}

export default function ThumbnailAnalysis({
  videoId,
  thumbnailUrl,
  onAnalyze,
}: ThumbnailAnalysisProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ThumbnailAnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);

    try {
      const result = await onAnalyze();
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-gray-900/50 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-400" />
          <h3 className="font-medium text-white">Thumbnail Analysis</h3>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-70 rounded-lg text-sm font-medium transition-all"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {analysis ? "Re-analyze" : "Analyze"}
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Thumbnail Preview */}
        <div className="flex gap-4 mb-4">
          <div className="w-40 flex-shrink-0">
            <img
              src={thumbnailUrl}
              alt="Video thumbnail"
              className="w-full aspect-video object-cover rounded-lg"
            />
          </div>

          {/* Overall Score */}
          {analysis && (
            <div className="flex-1">
              <div className="text-center mb-3">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreBg(
                    analysis.overall_score
                  )} border-2`}
                >
                  <span
                    className={`text-2xl font-bold ${getScoreColor(
                      analysis.overall_score
                    )}`}
                  >
                    {analysis.overall_score}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">CTR Score</p>
              </div>
              <p className="text-sm text-gray-300 text-center">
                {analysis.summary}
              </p>
            </div>
          )}

          {!analysis && !analyzing && (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Click "Analyze" to get AI-powered thumbnail feedback
            </div>
          )}

          {analyzing && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  Analyzing with GPT-4 Vision...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Metrics Grid */}
        {analysis && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <MetricCard
                icon={<Type className="w-4 h-4 text-blue-400" />}
                label="Text"
                metric={analysis.text_readability}
              />
              <MetricCard
                icon={<User className="w-4 h-4 text-pink-400" />}
                label="Faces"
                metric={analysis.face_detection}
              />
              <MetricCard
                icon={<Palette className="w-4 h-4 text-orange-400" />}
                label="Colors"
                metric={analysis.color_contrast}
              />
              <MetricCard
                icon={<LayoutGrid className="w-4 h-4 text-cyan-400" />}
                label="Layout"
                metric={analysis.composition}
              />
            </div>

            {/* Suggestions */}
            {analysis.suggestions.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">
                    Suggestions
                  </span>
                </div>
                <ul className="space-y-1">
                  {analysis.suggestions.map((suggestion, i) => (
                    <li key={i} className="text-xs text-gray-300 flex gap-2">
                      <span className="text-amber-400">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
