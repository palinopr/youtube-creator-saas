"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  HelpCircle,
  Lightbulb,
  Users,
  RefreshCw,
  ExternalLink,
  Star,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  overall_mood: string;
  key_positive_themes: string[];
  key_negative_themes: string[];
}

interface Question {
  text: string;
  author: string;
  likes: number;
  suggested_response: string;
  priority: "high" | "medium" | "low";
}

interface ContentIdea {
  topic: string;
  evidence: string;
  mentions: number;
  potential: "high" | "medium" | "low";
}

interface NotableCommenter {
  channel_id: string;
  channel_name: string;
  subscriber_count: number;
  video_count: number;
  thumbnail_url: string;
  comment_text: string;
  comment_likes: number;
  video_commented_on: string;
  channel_url: string;
}

interface CommentAnalysis {
  sentiment_breakdown: SentimentBreakdown;
  questions_to_answer: Question[];
  content_ideas: ContentIdea[];
  notable_commenters: NotableCommenter[];
  summary: string;
  analyzed_count: number;
  generated_at: string;
}

const SENTIMENT_COLORS = {
  positive: "#22c55e",
  neutral: "#6b7280",
  negative: "#ef4444",
};

const PRIORITY_STYLES = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const POTENTIAL_STYLES = {
  high: "bg-green-500/20 text-green-400",
  medium: "bg-blue-500/20 text-blue-400",
  low: "bg-gray-500/20 text-gray-400",
};

export default function CommentsPage() {
  const [analysis, setAnalysis] = useState<CommentAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "questions" | "ideas" | "notable">("overview");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalysis = async () => {
    try {
      setRefreshing(true);
      const data = await api.analyzeChannelComments(50, true);
      setAnalysis(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to analyze comments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getMoodEmoji = (mood: string): string => {
    const moods: Record<string, string> = {
      great: "🎉",
      good: "😊",
      mixed: "😐",
      concerning: "😟",
      poor: "😔",
    };
    return moods[mood] || "📊";
  };

  if (loading) {
    return (
      <DashboardLayout activePath="/comments">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold flex items-center gap-2 mb-8">
            <MessageSquare className="w-7 h-7 text-purple-400" />
            Comment Intelligence
          </h1>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-white/60">Analyzing comments with AI...</p>
              <p className="text-white/40 text-sm mt-2">This may take 10-20 seconds</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout activePath="/comments">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold flex items-center gap-2 mb-8">
            <MessageSquare className="w-7 h-7 text-purple-400" />
            Comment Intelligence
          </h1>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchAnalysis}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const sentiment = analysis?.sentiment_breakdown;
  const sentimentData = sentiment
    ? [
        { name: "Positive", value: sentiment.positive, color: SENTIMENT_COLORS.positive },
        { name: "Neutral", value: sentiment.neutral, color: SENTIMENT_COLORS.neutral },
        { name: "Negative", value: sentiment.negative, color: SENTIMENT_COLORS.negative },
      ]
    : [];

  return (
    <DashboardLayout activePath="/comments">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-7 h-7 text-purple-400" />
              Comment Intelligence
            </h1>
            <p className="text-gray-400 mt-1">
              AI-powered insights from {analysis?.analyzed_count || 0} comments
            </p>
          </div>
          <button
            onClick={fetchAnalysis}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Summary Banner */}
        {analysis?.summary && (
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{getMoodEmoji(sentiment?.overall_mood || "mixed")}</div>
              <div>
                <h3 className="font-semibold mb-1">AI Summary</h3>
                <p className="text-white/80">{analysis.summary}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <ThumbsUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Positive</p>
                <p className="text-2xl font-bold text-green-400">{sentiment?.positive || 0}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-500/20 rounded-lg">
                <Minus className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Neutral</p>
                <p className="text-2xl font-bold text-gray-400">{sentiment?.neutral || 0}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <ThumbsDown className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Negative</p>
                <p className="text-2xl font-bold text-red-400">{sentiment?.negative || 0}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Analyzed</p>
                <p className="text-2xl font-bold">{analysis?.analyzed_count || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
          {[
            { id: "overview", label: "Overview", icon: MessageSquare },
            { id: "questions", label: `Questions (${analysis?.questions_to_answer?.length || 0})`, icon: HelpCircle },
            { id: "ideas", label: `Content Ideas (${analysis?.content_ideas?.length || 0})`, icon: Lightbulb },
            { id: "notable", label: `Notable (${analysis?.notable_commenters?.length || 0})`, icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment Donut */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Sentiment Breakdown</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value}%`, ""]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Themes */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Key Themes</h3>
              <div className="space-y-4">
                {sentiment?.key_positive_themes && sentiment.key_positive_themes.length > 0 && (
                  <div>
                    <p className="text-green-400 text-sm font-medium mb-2 flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4" /> Positive Themes
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sentiment.key_positive_themes.map((theme, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {sentiment?.key_negative_themes && sentiment.key_negative_themes.length > 0 && (
                  <div>
                    <p className="text-red-400 text-sm font-medium mb-2 flex items-center gap-2">
                      <ThumbsDown className="w-4 h-4" /> Negative Themes
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sentiment.key_negative_themes.map((theme, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(!sentiment?.key_positive_themes?.length && !sentiment?.key_negative_themes?.length) && (
                  <p className="text-white/40 text-sm">No specific themes detected</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "questions" && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Questions to Answer</h3>
                <p className="text-white/40 text-sm">Answering questions boosts engagement</p>
              </div>
              {analysis?.questions_to_answer && analysis.questions_to_answer.length > 0 ? (
                <div className="space-y-4">
                  {analysis.questions_to_answer.map((question, i) => (
                    <div
                      key={i}
                      className="bg-white/5 border border-white/10 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium mb-1">"{question.text}"</p>
                          <p className="text-white/40 text-sm">— {question.author}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-white/60 text-sm">
                            <ThumbsUp className="w-3 h-3" /> {question.likes}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs border ${
                              PRIORITY_STYLES[question.priority]
                            }`}
                          >
                            {question.priority}
                          </span>
                        </div>
                      </div>
                      {question.suggested_response && (
                        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <p className="text-blue-400 text-xs font-medium mb-1">Suggested Response:</p>
                          <p className="text-white/80 text-sm">{question.suggested_response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-center py-8">No questions found in recent comments</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "ideas" && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Content Ideas from Your Audience</h3>
                <p className="text-white/40 text-sm">Topics your viewers are asking for</p>
              </div>
              {analysis?.content_ideas && analysis.content_ideas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.content_ideas.map((idea, i) => (
                    <div
                      key={i}
                      className="bg-white/5 border border-white/10 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-yellow-400" />
                          <h4 className="font-medium">{idea.topic}</h4>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            POTENTIAL_STYLES[idea.potential]
                          }`}
                        >
                          {idea.potential} potential
                        </span>
                      </div>
                      <p className="text-white/60 text-sm mb-2">{idea.evidence}</p>
                      <p className="text-white/40 text-xs">~{idea.mentions} mentions</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-center py-8">No content ideas extracted yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "notable" && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Notable Commenters</h3>
                <p className="text-white/40 text-sm">Creators with 1K+ subscribers who commented</p>
              </div>
              {analysis?.notable_commenters && analysis.notable_commenters.length > 0 ? (
                <div className="space-y-4">
                  {analysis.notable_commenters.map((commenter, i) => (
                    <div
                      key={i}
                      className="bg-white/5 border border-white/10 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-4">
                        {commenter.thumbnail_url && (
                          <img
                            src={commenter.thumbnail_url}
                            alt={commenter.channel_name}
                            className="w-12 h-12 rounded-full"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{commenter.channel_name}</h4>
                              <div className="flex items-center gap-3 text-white/60 text-sm">
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {formatNumber(commenter.subscriber_count)} subscribers
                                </span>
                                <span>{commenter.video_count} videos</span>
                              </div>
                            </div>
                            <a
                              href={commenter.channel_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                          <div className="mt-3 p-3 bg-white/5 rounded-lg">
                            <p className="text-white/80 text-sm">"{commenter.comment_text}"</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-white/40 text-xs">
                                On: {commenter.video_commented_on}
                              </p>
                              <span className="flex items-center gap-1 text-white/40 text-xs">
                                <ThumbsUp className="w-3 h-3" /> {commenter.comment_likes}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-center py-8">
                  No notable commenters found (creators with 1K+ subscribers)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-8 text-center text-white/40 text-sm">
          <p>
            Analysis generated at{" "}
            {analysis?.generated_at
              ? new Date(analysis.generated_at).toLocaleString()
              : "N/A"}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
