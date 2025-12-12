"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import WaitlistForm from "@/components/landing/WaitlistForm";
import { API_URL } from "@/lib/config";

type MetadataResponse = {
  suggestions: {
    titles?: string[];
    description?: string;
    tags?: string[];
    hashtags?: string[];
    top_fixes?: string[];
  };
};

export default function ToolClient() {
  const [topic, setTopic] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MetadataResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/public/metadata-generator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic || undefined, url: url || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Request failed");
      }
      setResult(await res.json());
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="py-8 px-4">
        <div className="max-w-3xl mx-auto bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Video topic (e.g., “how to start a faceless YouTube channel in 2025”)"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="text-center text-xs text-zinc-500">or</div>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="YouTube video URL (optional)"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              disabled={loading || (!topic && !url)}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Generating..." : "Generate Metadata"}
            </button>
          </form>
          {error && (
            <div className="mt-4 text-sm text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}
        </div>
      </section>

      {result?.suggestions && (
        <section className="py-10 px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
              <h2 className="text-xl font-semibold text-white">AI metadata (lite)</h2>

              {result.suggestions.titles?.length && (
                <div>
                  <h3 className="text-white font-semibold mb-2">Title options</h3>
                  <ul className="space-y-1 text-zinc-300 text-sm">
                    {result.suggestions.titles.map((t, idx) => (
                      <li key={idx}>• {t}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.suggestions.description && (
                <div>
                  <h3 className="text-white font-semibold mb-2">Optimized description</h3>
                  <p className="text-zinc-300 text-sm whitespace-pre-line">
                    {result.suggestions.description}
                  </p>
                </div>
              )}

              {result.suggestions.tags?.length && (
                <div>
                  <h3 className="text-white font-semibold mb-2">Suggested tags</h3>
                  <p className="text-zinc-300 text-sm">{result.suggestions.tags.join(", ")}</p>
                </div>
              )}

              {result.suggestions.hashtags?.length && (
                <div>
                  <h3 className="text-white font-semibold mb-2">Suggested hashtags</h3>
                  <p className="text-zinc-300 text-sm">{result.suggestions.hashtags.join(" ")}</p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-3">
                Want one‑click publishing and tracking?
              </h2>
              <p className="text-zinc-400 mb-6">
                TubeGrow’s full SEO tool scores every video, suggests fixes, and tracks the impact over time.
                Join the waitlist for early access.
              </p>
              <div className="max-w-md mx-auto">
                <WaitlistForm variant="hero" />
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-12 px-4 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-4">
          <Link href="/tools/youtube-seo-score" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
            <h3 className="text-white font-semibold mb-1">SEO Score</h3>
            <p className="text-zinc-400 text-sm">Check a video’s SEO fast.</p>
          </Link>
          <Link href="/youtube-seo-tool" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
            <h3 className="text-white font-semibold mb-1">YouTube SEO Tool</h3>
            <p className="text-zinc-400 text-sm">Full workflow pillar page.</p>
          </Link>
          <Link href="/tools/shorts-clip-finder" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
            <h3 className="text-white font-semibold mb-1">Shorts Clip Finder</h3>
            <p className="text-zinc-400 text-sm">Find viral moments.</p>
          </Link>
        </div>
      </section>
    </>
  );
}

