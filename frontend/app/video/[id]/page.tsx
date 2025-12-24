"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Save,
  Video,
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { formatNumber, formatDate, getDetailedScoreColor } from "@/lib/utils";
import Sidebar from "@/components/layout/Sidebar";
import VideoPreview from "@/components/video/VideoPreview";
import TitleEditor from "@/components/video/TitleEditor";
import DescriptionEditor from "@/components/video/DescriptionEditor";
import TagsEditor from "@/components/video/TagsEditor";
import ThumbnailAnalysis from "@/components/video/ThumbnailAnalysis";
import { useToast } from "@/components/providers/ErrorProvider";
import { api } from "@/lib/api";

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

interface DescZones {
  zone1_hook: string;
  zone2_summary: string;
  zone3_chapters: Array<{ time: string; title: string }>;
  zone4_funnel: string;
  hashtags: string[];
}

interface SocialLinks {
  instagram: string;
  twitter: string;
  tiktok: string;
  website: string;
}

export default function VideoDetailPage() {
  const params = useParams();
  const videoId = params.id as string;
  const { showSuccess, showError, showWarning } = useToast();

  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);

  // Analysis
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [seoScore, setSeoScore] = useState<number | null>(null);

  // Suggestions
  const [titleSuggestions, setTitleSuggestions] = useState<TitleSuggestion[]>([]);
  const [descSuggestion, setDescSuggestion] = useState<string | null>(null);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [transcriptTags, setTranscriptTags] = useState<string[]>([]);

  // Description zones
  const [descZones, setDescZones] = useState<DescZones | null>(null);
  const [descLoading, setDescLoading] = useState(false);
  const [transcriptSource, setTranscriptSource] = useState<string | null>(null);
  const [descProgress, setDescProgress] = useState<string>("");

  // Social links
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: "",
    twitter: "",
    tiktok: "",
    website: "",
  });

  // Saving
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Channel data for preview
  const [channelName, setChannelName] = useState<string>("Your Channel");
  const [channelAvatarUrl, setChannelAvatarUrl] = useState<string | null>(null);

  // Load social links from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("channelSocialLinks");
    if (saved) {
      setSocialLinks(JSON.parse(saved));
    }
  }, []);

  // Fetch channel data for preview (avatar, name)
  useEffect(() => {
    const fetchChannelData = async () => {
      try {
        const data = await api.getChannelStats();
        if (data) {
          setChannelName(data.title || "Your Channel");
          setChannelAvatarUrl(data.thumbnail_url || null);
        }
      } catch (error) {
        console.log("Could not fetch channel data for preview");
      }
    };
    fetchChannelData();
  }, []);

  const saveSocialLinks = () => {
    localStorage.setItem("channelSocialLinks", JSON.stringify(socialLinks));
  };

  useEffect(() => {
    if (videoId) loadVideo();
  }, [videoId]);

  const loadVideo = async () => {
    setLoading(true);
    try {
      try {
        const data = await api.getSeoVideo(videoId);
        setVideo(data);
        setEditTitle(data.title || "");
        setEditDescription(data.description || "");
        setEditTags(data.tags || []);
      } catch {
        const videos = await api.getRecentVideos(50);
        const found = (videos as any[]).find((v: any) => v.video_id === videoId);
        if (found) {
          setVideo(found);
          setEditTitle(found.title || "");
          setEditDescription(found.description || "");
          setEditTags(found.tags || []);
        }
      }
    } catch (error) {
      showError("Failed to load video details");
    }
    setLoading(false);
  };

  const analyzeAll = async () => {
    if (!video) return;
    setAnalyzing(true);
    setDescSuggestion("loading");
    setDescLoading(true);
    setDescProgress("Step 1/3: Fetching transcript...");

    try {
      const fetchWithTimeout = async (
        url: string,
        options: RequestInit,
        timeoutMs: number = 30000
      ) => {
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

      // STEP 1: GET TRANSCRIPT
      let transcriptText: string | null = null;
      let currentTranscriptSource: string | null = null;

      const cacheKey = `transcript_${video.video_id}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          transcriptText = cachedData.text;
          currentTranscriptSource = cachedData.source + " (cached)";
          setDescProgress("✓ Using cached transcript (free!)");
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }

      if (!transcriptText) {
        setDescProgress("Step 1/4: Fetching transcript...");
        try {
          const transcriptRes = await fetchWithTimeout(
            `${API_URL}/api/analysis/transcripts/get/${video.video_id}`,
            { credentials: "include" },
            15000
          );

          if (transcriptRes.ok) {
            const transcriptData = await transcriptRes.json();
            if (transcriptData.status === "success" && transcriptData.full_text) {
              transcriptText = transcriptData.full_text;
              currentTranscriptSource = "youtube_captions";
              setDescProgress("✓ Transcript found!");

              localStorage.setItem(
                cacheKey,
                JSON.stringify({
                  text: transcriptText,
                  source: currentTranscriptSource,
                  cached_at: new Date().toISOString(),
                })
              );
            }
          }
        } catch (e) {
          console.log("Transcript fetch timed out, continuing without...");
        }
      }

      if (!transcriptText) {
        setDescProgress("No captions available - using title-based generation...");
      }

      setTranscriptSource(currentTranscriptSource);

      // STEP 2: GENERATE TITLES
      setDescProgress(
        "Step 2/3: Generating titles" +
          (transcriptText ? " from transcript..." : "...")
      );

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
              transcript: transcriptText,
            }),
          },
          45000
        );

        if (titlesRes.ok) {
          const titlesData = await titlesRes.json();
          try {
            const parsed = JSON.parse(
              titlesData.generated_titles.replace(/```json\n?|```/g, "")
            );
            finalTitles = parsed.titles.map((t: any, i: number) => ({
              title: t.title,
              score: 97 - i * 3,
            }));
          } catch (e) {
            console.log("Parse error:", e);
          }
        }
      } catch (e) {
        console.log("Title generation timed out");
      }
      setTitleSuggestions(finalTitles);

      // STEP 3: GENERATE DESCRIPTION
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
              social_links:
                socialLinks.instagram ||
                socialLinks.twitter ||
                socialLinks.tiktok ||
                socialLinks.website
                  ? socialLinks
                  : null,
              original_description: video.description,
            }),
          },
          120000
        );
      } catch (e) {
        console.log("Description generation timed out or failed");
      }

      // STEP 4: EXTRACT META TAGS
      setDescProgress("Step 4/4: Extracting meta tags...");

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
                title: video.title,
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
          const parsed = JSON.parse(
            metaData.meta_tags_response.replace(/```json\n?|```/g, "")
          );
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
        setTranscriptSource(descData.transcript_source || currentTranscriptSource);

        if (
          descData.transcript_text &&
          descData.transcript_source === "whisper" &&
          !cached
        ) {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              text: descData.transcript_text,
              source: "whisper",
              cached_at: new Date().toISOString(),
            })
          );
        }

        if (descData.success) {
          setDescZones({
            zone1_hook: descData.zone1_hook || "",
            zone2_summary: descData.zone2_summary || "",
            zone3_chapters: descData.zone3_chapters || [],
            zone4_funnel: descData.zone4_funnel || "",
            hashtags: descData.hashtags || [],
          });
          setDescSuggestion(descData.full_description);
        } else {
          setDescSuggestion(
            descData.full_description || `🔥 ${video.title}\n\n#MoluscoTV`
          );
        }
      } else {
        setDescSuggestion(
          `🔥 ${video.title}\n\n#MoluscoTV #Podcast #Entretenimiento`
        );
      }

      setDescProgress("");
      setDescLoading(false);
      setAnalyzed(true);
    } catch (error) {
      showWarning("Some optimization features failed - using fallback suggestions");
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

  const saveChanges = async () => {
    if (!video) return;
    setSaving(true);
    setSaveError(null);

    try {
      await api.updateVideoMetadata({
        video_id: video.video_id,
        title: editTitle,
        description: editDescription,
        tags: editTags,
      });

      setSaveSuccess(true);
      setVideo({
        ...video,
        title: editTitle,
        description: editDescription,
        tags: editTags,
      });
      showSuccess("Changes saved to YouTube!");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Network error - please try again";
      setSaveError(msg);
      showError(msg);
    }
    setSaving(false);
  };

  const hasChanges =
    video &&
    (editTitle !== video.title ||
      editDescription !== (video.description || "") ||
      JSON.stringify(editTags) !== JSON.stringify(video.tags || []));

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
          <Link href="/" className="text-purple-400">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar activePath="/videos" />

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
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    seoScore >= 80
                      ? "bg-green-500/20 text-green-400"
                      : seoScore >= 60
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
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
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
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

        {/* Progress Bar */}
        {analyzing && descProgress && (
          <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl">
            <div className="flex items-center gap-4">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin flex-shrink-0" />
              <div className="flex-1">
                <p className="text-white font-medium">{descProgress}</p>
                <p className="text-purple-300/70 text-xs mt-1">
                  This may take 30-60 seconds for long videos
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <div
                className={`flex-1 h-1 rounded-full ${
                  descProgress.includes("1/3")
                    ? "bg-purple-500"
                    : descProgress.includes("2/3") || descProgress.includes("3/3")
                    ? "bg-green-500"
                    : "bg-gray-600"
                }`}
              />
              <div
                className={`flex-1 h-1 rounded-full ${
                  descProgress.includes("2/3")
                    ? "bg-purple-500"
                    : descProgress.includes("3/3")
                    ? "bg-green-500"
                    : "bg-gray-600"
                }`}
              />
              <div
                className={`flex-1 h-1 rounded-full ${
                  descProgress.includes("3/3") ? "bg-purple-500" : "bg-gray-600"
                }`}
              />
            </div>
          </div>
        )}

        <div className="flex">
          {/* Left Column - Video Preview */}
          <VideoPreview
            video={video}
            analyzing={analyzing}
            analyzed={analyzed}
            onOptimize={analyzeAll}
            currentTitle={editTitle}
            currentDescription={editDescription}
            channelName={channelName}
            channelAvatarUrl={channelAvatarUrl}
          />

          {/* Right Column - Edit Form */}
          <div className="flex-1 p-6 space-y-6">
            {/* Thumbnail Analysis */}
            <ThumbnailAnalysis
              videoId={video.video_id}
              thumbnailUrl={video.thumbnail_url}
              onAnalyze={async () => {
                const result = await api.analyzeThumbnail(video.video_id);
                return result.analysis;
              }}
            />

            <TitleEditor
              editTitle={editTitle}
              onTitleChange={setEditTitle}
              titleSuggestions={titleSuggestions}
              onApplyTitle={applyTitle}
            />

            <DescriptionEditor
              editDescription={editDescription}
              onDescriptionChange={setEditDescription}
              descSuggestion={descSuggestion}
              descZones={descZones}
              descLoading={descLoading}
              transcriptSource={transcriptSource}
              socialLinks={socialLinks}
              onSocialLinksChange={setSocialLinks}
              onSaveSocialLinks={saveSocialLinks}
              onApplyDescription={applyDescription}
            />

            <TagsEditor
              editTags={editTags}
              onTagsChange={setEditTags}
              tagSuggestions={tagSuggestions}
              transcriptTags={transcriptTags}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
