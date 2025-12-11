"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/lib/config";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface QuickWin {
  action: string;
  impact: string;
  effort: string;
}

interface ContentIdea {
  title: string;
  why: string;
  predicted_views: string;
  celebrities: string[];
  priority: string;
}

interface CelebrityInfo {
  name: string;
  why?: string;
  avg_views?: string;
  reliability?: string;
  volume?: string;
  change?: string;
  risk?: string;
}

interface ScoreResult {
  score: number;
  max_score: number;
  grade: string;
  prediction: string;
  feedback: string[];
  quick_fixes: string[];
}

interface GeneratedTitles {
  titles: Array<{
    title: string;
    predicted_performance: string;
    why: string;
  }>;
  best_pick: string;
}

export default function OptimizePage() {
  const [activeTab, setActiveTab] = useState<"blueprint" | "score" | "generate" | "next">("blueprint");
  const [loading, setLoading] = useState(false);
  
  // Blueprint data
  const [blueprint, setBlueprint] = useState<any>(null);
  const [quickWins, setQuickWins] = useState<QuickWin[]>([]);
  const [nextVideo, setNextVideo] = useState<any>(null);
  
  // Score form
  const [scoreTitle, setScoreTitle] = useState("");
  const [scoreDescription, setScoreDescription] = useState("");
  const [scoreCelebrities, setScoreCelebrities] = useState("");
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  
  // Generate form
  const [generateTopic, setGenerateTopic] = useState("");
  const [generateCelebrities, setGenerateCelebrities] = useState("");
  const [generatedTitles, setGeneratedTitles] = useState<GeneratedTitles | null>(null);

  useEffect(() => {
    loadBlueprint();
  }, []);

  const loadBlueprint = async () => {
    setLoading(true);
    try {
      const [blueprintRes, quickWinsRes, nextVideoRes] = await Promise.all([
        fetch(`${API_URL}/api/analysis/optimize`),
        fetch(`${API_URL}/api/analysis/optimize/quick-wins`),
        fetch(`${API_URL}/api/analysis/optimize/next-video`),
      ]);
      
      const blueprintData = await blueprintRes.json();
      const quickWinsData = await quickWinsRes.json();
      const nextVideoData = await nextVideoRes.json();
      
      setBlueprint(blueprintData.optimization_blueprint);
      setQuickWins(quickWinsData.quick_wins || []);
      setNextVideo(nextVideoData);
    } catch (error) {
      console.error("Error loading blueprint:", error);
    }
    setLoading(false);
  };

  const scoreVideo = async () => {
    if (!scoreTitle) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/analysis/optimize/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: scoreTitle,
          description: scoreDescription,
          celebrities: scoreCelebrities.split(",").map(c => c.trim()).filter(c => c),
        }),
      });
      const data = await res.json();
      setScoreResult(data);
    } catch (error) {
      console.error("Error scoring video:", error);
    }
    setLoading(false);
  };

  const generateTitles = async () => {
    if (!generateTopic) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/analysis/optimize/generate-title`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: generateTopic,
          celebrities: generateCelebrities.split(",").map(c => c.trim()).filter(c => c),
        }),
      });
      const data = await res.json();
      // Parse the JSON from the generated_titles string
      try {
        const parsed = JSON.parse(data.generated_titles.replace(/```json\n?|```/g, ""));
        setGeneratedTitles(parsed);
      } catch {
        setGeneratedTitles(null);
      }
    } catch (error) {
      console.error("Error generating titles:", error);
    }
    setLoading(false);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "text-green-400 bg-green-400/20";
      case "B": return "text-yellow-400 bg-yellow-400/20";
      case "C": return "text-orange-400 bg-orange-400/20";
      default: return "text-red-400 bg-red-400/20";
    }
  };

  return (
    <DashboardLayout activePath="/optimize">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">🚀</span>
              Content Optimizer
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              AI-powered recommendations from 5,000+ videos
            </p>
          </div>
          <a
            href="/videos"
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg text-white text-sm transition font-medium"
          >
            🎬 Edit Existing Videos
          </a>
        </div>

        {/* Tabs */}
        <div>
        <div className="flex gap-2 mb-8">
          {[
            { id: "blueprint", label: "📋 Blueprint", desc: "Full Strategy" },
            { id: "next", label: "🎯 Next Video", desc: "What to Make" },
            { id: "score", label: "📊 Score Video", desc: "Before Publishing" },
            { id: "generate", label: "✨ AI Titles", desc: "Generate Ideas" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl transition flex-1 ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className="text-lg font-medium">{tab.label}</div>
              <div className="text-xs opacity-70">{tab.desc}</div>
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        )}

        {/* Blueprint Tab */}
        {activeTab === "blueprint" && blueprint && !loading && (
          <div className="space-y-8">
            {/* Quick Wins */}
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                ⚡ Quick Wins - Do These TODAY
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickWins.map((win, i) => (
                  <div key={i} className="bg-black/30 rounded-xl p-4">
                    <div className="text-white font-medium mb-2">{win.action}</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-400">{win.impact}</span>
                      <span className="text-gray-500">{win.effort}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optimal Formula */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                🎯 Your Winning Formula
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title Rules */}
                <div className="bg-black/30 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-purple-400 mb-3">📝 Title Rules</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Length</span>
                      <span className="text-white font-mono">{blueprint.optimal_video_formula?.title?.length}</span>
                    </div>
                    <div className="text-gray-400 mb-2">Must Have:</div>
                    {blueprint.optimal_video_formula?.title?.must_have?.map((item: string, i: number) => (
                      <div key={i} className="text-green-400 flex items-center gap-2">
                        <span>✓</span> {item}
                      </div>
                    ))}
                    <div className="mt-3 text-gray-400">Power Words:</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {blueprint.optimal_video_formula?.title?.power_words?.map((word: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-purple-500/30 text-purple-300 rounded text-xs">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Celebrity Count */}
                <div className="bg-black/30 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-3">👥 Celebrity Strategy</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ideal Count</span>
                      <span className="text-white">{blueprint.optimal_video_formula?.celebrities?.ideal_count}</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {blueprint.optimal_video_formula?.celebrities?.sweet_spot}
                    </div>
                    <div className="text-gray-400 mt-3">Best Combos:</div>
                    {blueprint.optimal_video_formula?.celebrities?.best_combos?.map((combo: string, i: number) => (
                      <div key={i} className="text-white">{combo}</div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="bg-black/30 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-blue-400 mb-3">📄 Description</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Length</span>
                      <span className="text-white">{blueprint.optimal_video_formula?.description?.length}</span>
                    </div>
                    {blueprint.optimal_video_formula?.description?.must_include?.map((item: string, i: number) => (
                      <div key={i} className="text-green-400 flex items-center gap-2">
                        <span>✓</span> {item}
                      </div>
                    ))}
                    <div className="text-red-400 mt-3 flex items-center gap-2">
                      <span>❌</span> {blueprint.optimal_video_formula?.description?.avoid}
                    </div>
                  </div>
                </div>

                {/* Content Type */}
                <div className="bg-black/30 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-pink-400 mb-3">🎬 Content Type</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-400">Best Type:</span>
                      <div className="text-white font-medium">{blueprint.optimal_video_formula?.content_type?.best}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Duration:</span>
                      <div className="text-white">{blueprint.optimal_video_formula?.content_type?.duration}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Structure:</span>
                      <div className="text-white">{blueprint.optimal_video_formula?.content_type?.structure}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Celebrity Strategy */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                👑 Celebrity Playbook
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rising Stars */}
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-xl p-5 border border-green-500/20">
                  <h3 className="text-lg font-semibold text-green-400 mb-3">🚀 Rising Stars - Feature NOW</h3>
                  <div className="space-y-3">
                    {blueprint.celebrity_strategy?.feature_now?.rising_stars?.map((celeb: CelebrityInfo, i: number) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-white font-medium">{celeb.name}</span>
                        <span className="text-green-400 text-sm">{celeb.why}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Consistent Performers */}
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-xl p-5 border border-blue-500/20">
                  <h3 className="text-lg font-semibold text-blue-400 mb-3">✅ Consistent Performers</h3>
                  <div className="space-y-3">
                    {blueprint.celebrity_strategy?.feature_now?.consistent_performers?.map((celeb: CelebrityInfo, i: number) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-white font-medium">{celeb.name}</span>
                        <span className="text-blue-400 text-sm">{celeb.avg_views} avg</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Declining */}
                <div className="bg-gradient-to-br from-red-500/20 to-orange-500/10 rounded-xl p-5 border border-red-500/20">
                  <h3 className="text-lg font-semibold text-red-400 mb-3">⚠️ Use Carefully - Declining</h3>
                  <div className="space-y-3">
                    {blueprint.celebrity_strategy?.use_carefully?.declining?.map((celeb: CelebrityInfo, i: number) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-white font-medium">{celeb.name}</span>
                        <span className="text-red-400 text-sm">{celeb.change}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Golden Combos */}
                <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/10 rounded-xl p-5 border border-yellow-500/20">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-3">💡 Golden Combos</h3>
                  <div className="space-y-2">
                    {blueprint.celebrity_strategy?.golden_combos?.map((combo: string, i: number) => (
                      <div key={i} className="text-white text-sm">{combo}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next Video Tab */}
        {activeTab === "next" && nextVideo && !loading && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/30 rounded-2xl p-8">
              <div className="text-sm text-purple-300 mb-2">YOUR NEXT VIDEO SHOULD BE:</div>
              <h2 className="text-3xl font-bold text-white mb-4">
                {nextVideo.next_video_recommendation?.title}
              </h2>
              <div className="flex flex-wrap gap-3 mb-6">
                {nextVideo.next_video_recommendation?.celebrities?.map((celeb: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-white/20 text-white rounded-full text-sm">
                    {celeb}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="text-gray-400 text-sm">Why This Video?</div>
                  <div className="text-white mt-1">{nextVideo.next_video_recommendation?.why}</div>
                </div>
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="text-gray-400 text-sm">Predicted Views</div>
                  <div className="text-2xl font-bold text-green-400">{nextVideo.next_video_recommendation?.predicted_views}</div>
                </div>
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="text-gray-400 text-sm">Priority</div>
                  <div className="text-xl font-bold text-yellow-400">{nextVideo.next_video_recommendation?.priority}</div>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">✅ Pre-Publish Checklist</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {nextVideo.quick_checklist?.map((item: string, i: number) => (
                  <div 
                    key={i} 
                    className={`p-3 rounded-lg ${
                      item.startsWith("✅") 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Score Video Tab */}
        {activeTab === "score" && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">📊 Score Your Video Idea</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Video Title *</label>
                  <input
                    type="text"
                    value={scoreTitle}
                    onChange={(e) => setScoreTitle(e.target.value)}
                    placeholder="Daddy Yankee REVELA todo sobre..."
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                  <div className="text-xs text-gray-500 mt-1">{scoreTitle.length} characters (aim for 70-90)</div>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Celebrities (comma separated)</label>
                  <input
                    type="text"
                    value={scoreCelebrities}
                    onChange={(e) => setScoreCelebrities(e.target.value)}
                    placeholder="Daddy Yankee, Nicky Jam, Don Omar"
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Description (optional)</label>
                  <textarea
                    value={scoreDescription}
                    onChange={(e) => setScoreDescription(e.target.value)}
                    placeholder="#daddyyankee #reggaeton Sigue a Molusco..."
                    rows={4}
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                
                <button
                  onClick={scoreVideo}
                  disabled={!scoreTitle}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition"
                >
                  🎯 Score This Video
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">📈 Score Results</h2>
              
              {scoreResult ? (
                <div className="space-y-6">
                  {/* Score Circle */}
                  <div className="flex items-center justify-center gap-8">
                    <div className="text-center">
                      <div className={`text-6xl font-bold ${getGradeColor(scoreResult.grade).split(" ")[0]}`}>
                        {scoreResult.score}
                      </div>
                      <div className="text-gray-400">out of {scoreResult.max_score}</div>
                    </div>
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold ${getGradeColor(scoreResult.grade)}`}>
                      {scoreResult.grade}
                    </div>
                  </div>
                  
                  {/* Prediction */}
                  <div className="bg-black/30 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{scoreResult.prediction}</div>
                  </div>
                  
                  {/* Feedback */}
                  <div className="space-y-2">
                    {scoreResult.feedback.map((item, i) => (
                      <div 
                        key={i}
                        className={`p-3 rounded-lg ${
                          item.startsWith("✅") ? "bg-green-500/20 text-green-400" :
                          item.startsWith("⚠️") ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                  
                  {/* Quick Fixes */}
                  {scoreResult.quick_fixes.length > 0 && (
                    <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4">
                      <div className="text-orange-400 font-bold mb-2">🔧 Fix These:</div>
                      {scoreResult.quick_fixes.map((fix, i) => (
                        <div key={i} className="text-orange-300">{fix}</div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Enter a video idea and click "Score This Video" to see predictions
                </div>
              )}
            </div>
          </div>
        )}

        {/* Generate Titles Tab */}
        {activeTab === "generate" && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">✨ AI Title Generator</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-2">What's the video about? *</label>
                  <textarea
                    value={generateTopic}
                    onChange={(e) => setGenerateTopic(e.target.value)}
                    placeholder="La pelea entre Bad Bunny y Arcangel, la reacción de Anuel..."
                    rows={3}
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Celebrities to include (comma separated)</label>
                  <input
                    type="text"
                    value={generateCelebrities}
                    onChange={(e) => setGenerateCelebrities(e.target.value)}
                    placeholder="Bad Bunny, Arcangel, Anuel"
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                
                <button
                  onClick={generateTitles}
                  disabled={!generateTopic}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold rounded-lg transition"
                >
                  ✨ Generate AI Titles
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">🎯 Generated Titles</h2>
              
              {generatedTitles ? (
                <div className="space-y-4">
                  {/* Best Pick */}
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
                    <div className="text-green-400 text-sm font-bold mb-2">⭐ BEST PICK</div>
                    <div className="text-white text-lg">{generatedTitles.best_pick}</div>
                  </div>
                  
                  {/* All Options */}
                  <div className="space-y-3">
                    {generatedTitles.titles.map((title, i) => (
                      <div 
                        key={i}
                        className="bg-black/30 rounded-xl p-4 hover:bg-black/50 transition cursor-pointer"
                        onClick={() => {
                          navigator.clipboard.writeText(title.title);
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            title.predicted_performance === "HIGH" 
                              ? "bg-green-500/30 text-green-400"
                              : "bg-yellow-500/30 text-yellow-400"
                          }`}>
                            {title.predicted_performance}
                          </span>
                          <span className="text-gray-500 text-xs">Click to copy</span>
                        </div>
                        <div className="text-white mb-2">{title.title}</div>
                        <div className="text-gray-400 text-sm">{title.why}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Enter your video topic and click "Generate AI Titles" to see suggestions
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </DashboardLayout>
  );
}

