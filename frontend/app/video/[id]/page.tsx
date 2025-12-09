"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Eye, 
  ThumbsUp, 
  MessageSquare, 
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Check,
  Youtube,
  Home,
  Video,
  Zap,
  LogOut,
  BarChart3,
  TrendingUp,
  Wand2,
  X,
  Save,
  FileText,
  Scissors,
} from "lucide-react";

const API_URL = "http://localhost:8000";

interface VideoData {
  video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at: string;
  tags: string[];
}

interface TitleSuggestion {
  title: string;
  score: number;
}

export default function VideoDetailPage() {
  const params = useParams();
  const videoId = params.id as string;
  
  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit states
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  
  // Analysis
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [seoScore, setSeoScore] = useState<number | null>(null);
  
  // Suggestions
  const [titleSuggestions, setTitleSuggestions] = useState<TitleSuggestion[]>([]);
  const [descSuggestion, setDescSuggestion] = useState<string | null>(null);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  
  // Transcript-based meta tags (15-20 tags extracted from video content)
  const [transcriptTags, setTranscriptTags] = useState<string[]>([]);
  
  // Description zones (for hybrid loading)
  const [descZones, setDescZones] = useState<{
    zone1_hook: string;
    zone2_summary: string;
    zone3_chapters: Array<{time: string; title: string}>;
    zone4_funnel: string;
    hashtags: string[];
  } | null>(null);
  const [descLoading, setDescLoading] = useState(false);
  const [transcriptSource, setTranscriptSource] = useState<string | null>(null);
  const [descProgress, setDescProgress] = useState<string>("");


  
  // Social links (stored in localStorage)
  const [socialLinks, setSocialLinks] = useState({
    instagram: "",
    twitter: "",
    tiktok: "",
    website: "",
  });
  const [showLinksEditor, setShowLinksEditor] = useState(false);

  // Load social links from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("channelSocialLinks");
    if (saved) {
      setSocialLinks(JSON.parse(saved));
    }
  }, []);

  const saveSocialLinks = () => {
    localStorage.setItem("channelSocialLinks", JSON.stringify(socialLinks));
    setShowLinksEditor(false);
  };
  
  // Saving
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (videoId) loadVideo();
  }, [videoId]);

  const loadVideo = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/seo/video/${videoId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setVideo(data);
        setEditTitle(data.title || "");
        setEditDescription(data.description || "");
        setEditTags(data.tags || []);
      } else {
        const basicRes = await fetch(`${API_URL}/api/videos/recent?limit=50`, { credentials: "include" });
        if (basicRes.ok) {
          const videos = await basicRes.json();
          const found = videos.find((v: any) => v.video_id === videoId);
          if (found) {
            setVideo(found);
            setEditTitle(found.title || "");
            setEditDescription(found.description || "");
            setEditTags(found.tags || []);
          }
        }
      }
    } catch (error) {
      console.error("Error loading video:", error);
    }
    setLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return "bg-green-500/30 text-green-400";
    if (score >= 90) return "bg-blue-500/30 text-blue-400";
    if (score >= 85) return "bg-cyan-500/30 text-cyan-400";
    if (score >= 80) return "bg-yellow-500/30 text-yellow-400";
    if (score >= 75) return "bg-orange-500/30 text-orange-400";
    return "bg-gray-500/30 text-gray-400";
  };

  const analyzeAll = async () => {
    if (!video) return;
    setAnalyzing(true);
    setDescSuggestion("loading");
    setDescLoading(true);
    setDescProgress("Step 1/3: Fetching transcript...");
    
    try {
      // Helper function with timeout
      const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number = 30000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetch(url, { ...options, signal: controller.signal });
          clearTimeout(id);
          return res;
        } catch (e) {
          clearTimeout(id);
          throw e;
        }
      };

      // ============================================
      // STEP 1: GET TRANSCRIPT (check cache first!)
      // ============================================
      let transcriptText: string | null = null;
      let transcriptSource: string | null = null;
      
      // Check browser cache first
      const cacheKey = `transcript_${video.video_id}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          transcriptText = cachedData.text;
          transcriptSource = cachedData.source + " (cached)";
          setDescProgress("✓ Using cached transcript (free!)");
          console.log("Using cached transcript for", video.video_id);
        } catch (e) {
          localStorage.removeItem(cacheKey); // Clear invalid cache
        }
      }
      
      // If no cache, fetch from API
      if (!transcriptText) {
        setDescProgress("Step 1/4: Fetching transcript...");
        try {
          const transcriptRes = await fetchWithTimeout(
            `${API_URL}/api/analysis/transcripts/get/${video.video_id}`,
            { credentials: "include" },
            15000 // 15 second timeout for transcript
          );
          
          if (transcriptRes.ok) {
            const transcriptData = await transcriptRes.json();
            if (transcriptData.status === "success" && transcriptData.full_text) {
              transcriptText = transcriptData.full_text;
              transcriptSource = "youtube_captions";
              setDescProgress("✓ Transcript found!");
              
              // Save to browser cache
              localStorage.setItem(cacheKey, JSON.stringify({
                text: transcriptText,
                source: transcriptSource,
                cached_at: new Date().toISOString()
              }));
              console.log("Cached transcript for", video.video_id);
            }
          }
        } catch (e) {
          console.log("Transcript fetch timed out, continuing without...");
        }
      }
      
      if (!transcriptText) {
        setDescProgress("No captions available - using title-based generation...");
      }
      
      setTranscriptSource(transcriptSource);
      
      // ============================================
      // STEP 2: GENERATE TITLES (with or without transcript)
      // ============================================
      setDescProgress("Step 2/3: Generating titles" + (transcriptText ? " from transcript..." : "..."));
      
      let finalTitles: TitleSuggestion[] = [];
      try {
        const titlesRes = await fetchWithTimeout(
          `${API_URL}/api/analysis/optimize/generate-title`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ 
              topic: video.title, 
              celebrities: [],
              transcript: transcriptText  // Pass transcript if we have it
            }),
          },
          45000 // 45 second timeout
        );
        
        if (titlesRes.ok) {
          const titlesData = await titlesRes.json();
          try {
            const parsed = JSON.parse(titlesData.generated_titles.replace(/```json\n?|```/g, ""));
            finalTitles = parsed.titles.map((t: any, i: number) => ({
              title: t.title,
              score: 97 - (i * 3),
            }));
          } catch (e) {
            console.log("Parse error:", e);
          }
        }
      } catch (e) {
        console.log("Title generation timed out");
      }
      setTitleSuggestions(finalTitles);
      
      // ============================================
      // STEP 3: GENERATE DESCRIPTION (sequential - needs transcript first)
      // ============================================
      setDescProgress("Step 3/4: Generating AI description...");
      
      let descRes = null;
      try {
        descRes = await fetchWithTimeout(
          `${API_URL}/api/seo/generate-description`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ 
              video_id: video.video_id,
              social_links: socialLinks.instagram || socialLinks.twitter || socialLinks.tiktok || socialLinks.website 
                ? socialLinks 
                : null,
              original_description: video.description
            }),
          },
          120000 // 120 seconds for description (Whisper can take time)
        );
      } catch (e) {
        console.log("Description generation timed out or failed");
      }
      
      // ============================================
      // STEP 4: EXTRACT META TAGS (after description)
      // ============================================
      setDescProgress("Step 4/4: Extracting meta tags...");
      
      // Get SEO analysis (correct endpoint - GET with video_id in path)
      let seoRes = null;
      try {
        seoRes = await fetchWithTimeout(
          `${API_URL}/api/seo/analyze/${video.video_id}`,
          { credentials: "include" },
          30000
        );
      } catch (e) {
        console.log("SEO analysis failed");
      }
      
      // Extract meta tags from transcript if available
      let metaTagsRes = null;
      if (transcriptText) {
        try {
          metaTagsRes = await fetchWithTimeout(
            `${API_URL}/api/analysis/optimize/extract-meta-tags`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
            body: JSON.stringify({ 
              transcript: transcriptText,
              title: video.title
            }),
            },
            30000
          );
        } catch (e) {
          console.log("Meta tags extraction failed");
        }
      }

      // Process SEO/Tags
      let finalTags: string[] = ["MoluscoTV", "podcast", "entretenimiento", "viral"];
      if (seoRes?.ok) {
        const seoData = await seoRes.json();
        if (seoData.recommendations) {
          setSeoScore(seoData.recommendations.seo_score || 50);
          if (seoData.recommendations.suggested_tags?.length > 0) {
            finalTags = seoData.recommendations.suggested_tags;
          }
        }
      }
      setTagSuggestions(finalTags);
      
      // Process transcript-based meta tags
      if (metaTagsRes?.ok) {
        try {
          const metaData = await metaTagsRes.json();
          const parsed = JSON.parse(metaData.meta_tags_response.replace(/```json\n?|```/g, ""));
          if (parsed.tags && Array.isArray(parsed.tags)) {
            setTranscriptTags(parsed.tags);
          }
        } catch (e) {
          console.log("Meta tags parse error:", e);
        }
      }

      // Process Description
      if (descRes?.ok) {
        const descData = await descRes.json();
        setTranscriptSource(descData.transcript_source || transcriptSource);
        
        // Cache transcript if Whisper was used (saves ~$0.18 next time!)
        if (descData.transcript_text && descData.transcript_source === "whisper" && !cached) {
          localStorage.setItem(cacheKey, JSON.stringify({
            text: descData.transcript_text,
            source: "whisper",
            cached_at: new Date().toISOString()
          }));
          console.log("Cached Whisper transcript for", video.video_id, "(saves ~$0.18 next time)");
        }
        
        if (descData.success) {
          setDescZones({
            zone1_hook: descData.zone1_hook || "",
            zone2_summary: descData.zone2_summary || "",
            zone3_chapters: descData.zone3_chapters || [],
            zone4_funnel: descData.zone4_funnel || "",
            hashtags: descData.hashtags || []
          });
          setDescSuggestion(descData.full_description);
        } else {
          setDescSuggestion(descData.full_description || `🔥 ${video.title}\n\n#MoluscoTV`);
        }
      } else {
        setDescSuggestion(`🔥 ${video.title}\n\n#MoluscoTV #Podcast #Entretenimiento`);
      }
      
      setDescProgress("");
      setDescLoading(false);
      setAnalyzed(true);
    } catch (error) {
      console.error("Error analyzing:", error);
      // Provide fallback suggestions even on error
      const fallbackDesc = `🔥 ${video.title}\n\n📺 Contenido que no te puedes perder.\n\n#MoluscoTV`;
      const fallbackTags = ["MoluscoTV", "podcast", "entretenimiento"];
      setDescSuggestion(fallbackDesc);
      setTagSuggestions(fallbackTags);
      setAnalyzed(true);
    }
    
    setAnalyzing(false);
  };

  const applyTitle = (title: string) => {
    if (editTitle !== title) {
      setEditTitle(title);
    }
  };
  
  const applyDescription = () => {
    if (descSuggestion) {
      setEditDescription(descSuggestion);
    }
  };

  const addTag = (tag: string) => {
    if (!editTags.includes(tag)) {
      setEditTags([...editTags, tag]);
    }
  };

  const addAllTags = () => {
    if (tagSuggestions.length > 0) {
      setEditTags([...new Set([...editTags, ...tagSuggestions])]);
    }
  };

  const removeTag = (tag: string) => setEditTags(editTags.filter(t => t !== tag));

  const handleAddTag = () => {
    if (newTag.trim() && !editTags.includes(newTag.trim())) {
      setEditTags([...editTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const saveChanges = async () => {
    if (!video) return;
    setSaving(true);
    setSaveError(null);
    
    try {
      const res = await fetch(`${API_URL}/api/seo/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          video_id: video.video_id,
          title: editTitle,
          description: editDescription,
          tags: editTags,
        }),
      });
      
      if (res.ok) {
        setSaveSuccess(true);
        setVideo({ ...video, title: editTitle, description: editDescription, tags: editTags });
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const errorData = await res.json();
        setSaveError(errorData.detail || "Failed to save");
      }
    } catch (error) {
      setSaveError("Network error");
    }
    setSaving(false);
  };

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleLogout = async () => {
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    window.location.href = "/";
  };

  const hasChanges = video && (
    editTitle !== video.title || 
    editDescription !== (video.description || "") ||
    JSON.stringify(editTags) !== JSON.stringify(video.tags || [])
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Video not found</h2>
          <Link href="/" className="text-purple-400">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111] border-r border-white/10 flex-shrink-0 hidden lg:flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Youtube className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white">CreatorSaaS</h1>
              <p className="text-xs text-gray-500">YouTube Analytics</p>
            </div>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <NavItem icon={<Home />} label="Dashboard" href="/" />
          <NavItem icon={<Video />} label="Videos" href="/videos" active />
          
          <div className="pt-4 pb-2">
            <p className="text-xs text-gray-600 uppercase tracking-wider px-3">Tools</p>
          </div>
          
          <NavItem icon={<Scissors />} label="Clips" href="/clips" color="pink" />
          <NavItem icon={<Zap />} label="Content Ideas" href="/optimize" color="purple" />
          
          <div className="pt-4 pb-2">
            <p className="text-xs text-gray-600 uppercase tracking-wider px-3">Analytics</p>
          </div>
          
          <NavItem icon={<BarChart3 />} label="Channel Analysis" href="/analysis" />
          <NavItem icon={<TrendingUp />} label="Deep Analysis" href="/deep-analysis" />
          <NavItem icon={<Sparkles />} label="AI Insights" href="/advanced-insights" />
        </nav>
        
        {/* User Section */}
        <div className="p-3 border-t border-white/10">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 w-full p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-white/10">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/videos" className="p-2 hover:bg-white/10 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="font-semibold text-white">Video Details</h1>
              {seoScore !== null && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  seoScore >= 80 ? "bg-green-500/20 text-green-400" :
                  seoScore >= 60 ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-red-500/20 text-red-400"
                }`}>
                  SEO: {seoScore}/100
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {saveSuccess && (
                <span className="flex items-center gap-1 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" /> Saved to YouTube!
                </span>
              )}
              <a
                href={`https://youtube.com/watch?v=${video.video_id}`}
                target="_blank"
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
              >
                <ExternalLink className="w-4 h-4" /> YouTube
              </a>
              {hasChanges && (
                <button
                  onClick={saveChanges}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save to YouTube
                </button>
              )}
            </div>
          </div>
        </div>

        {saveError && (
          <div className="mx-6 mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {saveError}
          </div>
        )}

        {/* Progress Bar - Shows at TOP during optimization */}
        {analyzing && descProgress && (
          <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl">
            <div className="flex items-center gap-4">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin flex-shrink-0" />
              <div className="flex-1">
                <p className="text-white font-medium">{descProgress}</p>
                <p className="text-purple-300/70 text-xs mt-1">This may take 30-60 seconds for long videos</p>
              </div>
            </div>
            {/* Progress Steps */}
            <div className="flex gap-2 mt-3">
              <div className={`flex-1 h-1 rounded-full ${descProgress.includes("1/3") ? "bg-purple-500" : descProgress.includes("2/3") || descProgress.includes("3/3") ? "bg-green-500" : "bg-gray-600"}`} />
              <div className={`flex-1 h-1 rounded-full ${descProgress.includes("2/3") ? "bg-purple-500" : descProgress.includes("3/3") ? "bg-green-500" : "bg-gray-600"}`} />
              <div className={`flex-1 h-1 rounded-full ${descProgress.includes("3/3") ? "bg-purple-500" : "bg-gray-600"}`} />
            </div>
          </div>
        )}

        <div className="flex">
          {/* Left Column - Video Preview */}
          <div className="w-80 flex-shrink-0 p-6 border-r border-white/10">
            <div className="rounded-xl overflow-hidden mb-4">
              <img src={video.thumbnail_url} alt="" className="w-full aspect-video object-cover" />
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-2"><Eye className="w-4 h-4" /> Views</span>
                <span className="text-white font-medium">{formatNumber(video.view_count)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-2"><ThumbsUp className="w-4 h-4" /> Likes</span>
                <span className="text-white font-medium">{formatNumber(video.like_count)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Comments</span>
                <span className="text-white font-medium">{formatNumber(video.comment_count)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Published</span>
                <span className="text-white">{formatDate(video.published_at)}</span>
              </div>
            </div>

            {/* Optimize Button - Always Available */}
            <button
              onClick={analyzeAll}
              disabled={analyzing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-70 rounded-xl font-medium transition-all"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Optimize
                </>
              )}
            </button>
            
            {analyzed && (
              <p className="text-center text-xs text-gray-500 mt-2">
                ✓ Same content = same suggestions
              </p>
            )}
          </div>

          {/* Right Column - Edit Form */}
          <div className="flex-1 p-6 space-y-6">
            
            {/* TITLE */}
            <div className="bg-[#111] border border-white/10 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-400 mb-3">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white text-lg focus:outline-none focus:border-purple-500"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{editTitle.length}/100</span>
                <span className={editTitle.length >= 50 && editTitle.length <= 70 ? "text-green-400" : ""}>
                  Optimal: 50-70
                </span>
              </div>

              {/* Title Suggestions */}
              {titleSuggestions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-purple-400 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Click to apply
                  </p>
                  <div className="space-y-2">
                    {titleSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => applyTitle(s.title)}
                        className={`w-full text-left p-3 rounded-lg transition-all flex items-center gap-3 ${
                          editTitle === s.title 
                            ? "bg-purple-500/30 border border-purple-500" 
                            : "bg-black/30 border border-transparent hover:border-purple-500/50"
                        }`}
                      >
                        <span className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${getScoreColor(s.score)}`}>
                          {s.score}
                        </span>
                        <span className="text-white flex-1">{s.title}</span>
                        {editTitle === s.title && <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* DESCRIPTION */}
            <div className="bg-[#111] border border-white/10 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-400 mb-3">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Tell viewers about your video..."
              />
              <div className="text-xs text-gray-500 mt-2">
                {editDescription.length} characters
              </div>

              {/* Social Links Editor */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => setShowLinksEditor(!showLinksEditor)}
                  className="text-sm text-gray-400 hover:text-white mb-3"
                >
                  {showLinksEditor ? "▼" : "▶"} Your Social Links (for suggestions)
                </button>
                
                {showLinksEditor && (
                  <div className="p-4 bg-black/30 rounded-lg mb-4 space-y-3">
                    <p className="text-xs text-gray-500 mb-2">These will be included in description suggestions</p>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={socialLinks.instagram}
                        onChange={(e) => setSocialLinks({...socialLinks, instagram: e.target.value})}
                        placeholder="Instagram URL"
                        className="px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white text-sm"
                      />
                      <input
                        type="text"
                        value={socialLinks.twitter}
                        onChange={(e) => setSocialLinks({...socialLinks, twitter: e.target.value})}
                        placeholder="Twitter/X URL"
                        className="px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white text-sm"
                      />
                      <input
                        type="text"
                        value={socialLinks.tiktok}
                        onChange={(e) => setSocialLinks({...socialLinks, tiktok: e.target.value})}
                        placeholder="TikTok URL"
                        className="px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white text-sm"
                      />
                      <input
                        type="text"
                        value={socialLinks.website}
                        onChange={(e) => setSocialLinks({...socialLinks, website: e.target.value})}
                        placeholder="Website URL"
                        className="px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white text-sm"
                      />
                    </div>
                    <button
                      onClick={saveSocialLinks}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm"
                    >
                      Save Links
                    </button>
                  </div>
                )}
              </div>

              {/* Description Suggestion */}
              {descSuggestion && (
                <div className="mt-2">
                  {/* Transcript Source Indicator */}
                  {!descLoading && transcriptSource !== undefined && (
                    <div className={`mb-3 px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                      transcriptSource === "youtube_captions" 
                        ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                        : transcriptSource === "whisper" 
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    }`}>
                      {transcriptSource === "youtube_captions" && (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>✓ Using YouTube captions (free)</span>
                        </>
                      )}
                      {transcriptSource === "whisper" && (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>🎤 Transcribed with Whisper AI</span>
                        </>
                      )}
                      {!transcriptSource && (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          <span>⚠️ No transcript available - generated from title only</span>
                        </>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-blue-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> 4-Zone SEO Description
                    </p>
                    <button
                      onClick={applyDescription}
                      disabled={descLoading || !descSuggestion}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium"
                    >
                      Apply
                    </button>
                  </div>
                  
                  {/* Zone breakdown */}
                  {descZones && !descLoading && descZones.zone1_hook && (
                    <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-purple-500/10 rounded">
                        <span className="text-purple-400 font-medium">Zone 1: Hook</span>
                        <p className="text-gray-400 mt-1 truncate">{descZones.zone1_hook.slice(0, 50)}...</p>
                      </div>
                      <div className="p-2 bg-blue-500/10 rounded">
                        <span className="text-blue-400 font-medium">Zone 2: SEO</span>
                        <p className="text-gray-400 mt-1">{descZones.zone2_summary ? "✓ Keywords included" : "—"}</p>
                      </div>
                      <div className="p-2 bg-green-500/10 rounded">
                        <span className="text-green-400 font-medium">Zone 3: Chapters</span>
                        <p className="text-gray-400 mt-1">{descZones.zone3_chapters?.length || 0} timestamps</p>
                      </div>
                      <div className="p-2 bg-orange-500/10 rounded">
                        <span className="text-orange-400 font-medium">Zone 4: Funnel</span>
                        <p className="text-gray-400 mt-1">Links + CTA</p>
                      </div>
                    </div>
                  )}
                  
                  <div className={`p-3 rounded-lg border ${descLoading ? "bg-gray-500/10 border-gray-500/30" : "bg-blue-500/10 border-blue-500/30"}`}>
                    {descLoading ? (
                      <div className="space-y-2 animate-pulse">
                        <div className="h-4 bg-gray-600/50 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-600/50 rounded w-full"></div>
                        <div className="h-4 bg-gray-600/50 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-600/50 rounded w-2/3"></div>
                      </div>
                    ) : (
                      <p className="text-white text-sm whitespace-pre-wrap">{descSuggestion}</p>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Hook shows in search • Chapters power "Key Moments" • 3 hashtags max
                  </p>
                </div>
              )}
            </div>

            {/* TAGS */}
            <div className="bg-[#111] border border-white/10 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-400 mb-3">Tags</label>
              
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  className="flex-1 px-4 py-2 bg-black/50 border border-white/20 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Add a tag..."
                />
                <button onClick={handleAddTag} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium">
                  Add
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {editTags.map((tag, i) => (
                  <span key={i} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-sm">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-white ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {editTags.length === 0 && <span className="text-gray-500 text-sm">No tags yet</span>}
              </div>

              {/* AI Suggested Tags - Combined */}
              {(tagSuggestions.length > 0 || transcriptTags.length > 0) && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-emerald-400 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> AI Suggested Tags
                      </p>
                      {transcriptTags.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {[...new Set([...tagSuggestions, ...transcriptTags])].join(", ").length}/500 chars
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        const allSuggested = [...new Set([...tagSuggestions, ...transcriptTags])];
                        const newTags = allSuggested.filter(t => !editTags.includes(t));
                        setEditTags([...editTags, ...newTags]);
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-medium"
                    >
                      Add All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set([...tagSuggestions, ...transcriptTags])].map((tag, i) => (
                      <button
                        key={i}
                        onClick={() => addTag(tag)}
                        disabled={editTags.includes(tag)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          editTags.includes(tag)
                            ? "bg-emerald-500/40 text-emerald-200"
                            : "bg-white/10 text-white hover:bg-emerald-500/30"
                        }`}
                      >
                        {editTags.includes(tag) && <Check className="w-3 h-3 inline mr-1" />}
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ 
  icon, 
  label, 
  href, 
  active = false, 
  color = "default"
}: { 
  icon: React.ReactNode; 
  label: string; 
  href: string;
  active?: boolean;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    default: active ? "text-white bg-white/10" : "text-gray-400 hover:text-white hover:bg-white/5",
    purple: "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10",
    pink: "text-pink-400 hover:text-pink-300 hover:bg-pink-500/10",
    emerald: "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10",
    blue: "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10",
  };
  
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${colorClasses[color] || colorClasses.default}`}
    >
      <span className="w-5 h-5">{icon}</span>
      {label}
    </Link>
  );
}
