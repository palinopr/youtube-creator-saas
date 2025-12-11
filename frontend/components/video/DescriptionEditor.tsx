"use client";

import { useState } from "react";
import { Sparkles, CheckCircle, AlertCircle } from "lucide-react";

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

interface DescriptionEditorProps {
  editDescription: string;
  onDescriptionChange: (desc: string) => void;
  descSuggestion: string | null;
  descZones: DescZones | null;
  descLoading: boolean;
  transcriptSource: string | null;
  socialLinks: SocialLinks;
  onSocialLinksChange: (links: SocialLinks) => void;
  onSaveSocialLinks: () => void;
  onApplyDescription: () => void;
}

export default function DescriptionEditor({
  editDescription,
  onDescriptionChange,
  descSuggestion,
  descZones,
  descLoading,
  transcriptSource,
  socialLinks,
  onSocialLinksChange,
  onSaveSocialLinks,
  onApplyDescription,
}: DescriptionEditorProps) {
  const [showLinksEditor, setShowLinksEditor] = useState(false);

  const handleSaveSocialLinks = () => {
    onSaveSocialLinks();
    setShowLinksEditor(false);
  };

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-5">
      <label className="block text-sm font-medium text-gray-400 mb-3">
        Description
      </label>
      <textarea
        value={editDescription}
        onChange={(e) => onDescriptionChange(e.target.value)}
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
            <p className="text-xs text-gray-500 mb-2">
              These will be included in description suggestions
            </p>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={socialLinks.instagram}
                onChange={(e) =>
                  onSocialLinksChange({ ...socialLinks, instagram: e.target.value })
                }
                placeholder="Instagram URL"
                className="px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white text-sm"
              />
              <input
                type="text"
                value={socialLinks.twitter}
                onChange={(e) =>
                  onSocialLinksChange({ ...socialLinks, twitter: e.target.value })
                }
                placeholder="Twitter/X URL"
                className="px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white text-sm"
              />
              <input
                type="text"
                value={socialLinks.tiktok}
                onChange={(e) =>
                  onSocialLinksChange({ ...socialLinks, tiktok: e.target.value })
                }
                placeholder="TikTok URL"
                className="px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white text-sm"
              />
              <input
                type="text"
                value={socialLinks.website}
                onChange={(e) =>
                  onSocialLinksChange({ ...socialLinks, website: e.target.value })
                }
                placeholder="Website URL"
                className="px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white text-sm"
              />
            </div>
            <button
              onClick={handleSaveSocialLinks}
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
            <div
              className={`mb-3 px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                transcriptSource === "youtube_captions"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : transcriptSource === "whisper"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              }`}
            >
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
              onClick={onApplyDescription}
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
                <p className="text-gray-400 mt-1 truncate">
                  {descZones.zone1_hook.slice(0, 50)}...
                </p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded">
                <span className="text-blue-400 font-medium">Zone 2: SEO</span>
                <p className="text-gray-400 mt-1">
                  {descZones.zone2_summary ? "✓ Keywords included" : "—"}
                </p>
              </div>
              <div className="p-2 bg-green-500/10 rounded">
                <span className="text-green-400 font-medium">Zone 3: Chapters</span>
                <p className="text-gray-400 mt-1">
                  {descZones.zone3_chapters?.length || 0} timestamps
                </p>
              </div>
              <div className="p-2 bg-orange-500/10 rounded">
                <span className="text-orange-400 font-medium">Zone 4: Funnel</span>
                <p className="text-gray-400 mt-1">Links + CTA</p>
              </div>
            </div>
          )}

          <div
            className={`p-3 rounded-lg border ${
              descLoading
                ? "bg-gray-500/10 border-gray-500/30"
                : "bg-blue-500/10 border-blue-500/30"
            }`}
          >
            {descLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-gray-600/50 rounded w-3/4"></div>
                <div className="h-4 bg-gray-600/50 rounded w-full"></div>
                <div className="h-4 bg-gray-600/50 rounded w-5/6"></div>
                <div className="h-4 bg-gray-600/50 rounded w-2/3"></div>
              </div>
            ) : (
              <p className="text-white text-sm whitespace-pre-wrap">
                {descSuggestion}
              </p>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-2">
            💡 Hook shows in search • Chapters power "Key Moments" • 3 hashtags max
          </p>
        </div>
      )}
    </div>
  );
}
