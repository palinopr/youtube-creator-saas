"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, AlertTriangle } from "lucide-react";
import WaitlistForm from "@/components/landing/WaitlistForm";
import { API_URL } from "@/lib/config";

type SeoScoreResponse = {
  seo_score: number;
  issues: { issue: string; severity: string }[];
  video: { title: string; url: string; tags: string[]; description: string };
  suggestions?: {
    titles?: string[];
    description?: string;
    tags?: string[];
    hashtags?: string[];
    top_fixes?: string[];
  } | null;
};

export default function ToolClient() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SeoScoreResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/public/seo-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
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
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <button
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Analyzing..." : "Get Score"}
            </button>
          </form>
          {error && (
            <div className="mt-4 text-sm text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}
        </div>
      </section>

      {result && (
        <section className="py-10 px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="text-sm text-zinc-400 mb-2">SEO score</div>
              <div className="text-5xl font-bold text-white">{result.seo_score}/100</div>
              <div className="text-zinc-400 mt-2">{result.video.title}</div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-3">Top issues</h2>
              {result.issues?.length ? (
                <ul className="space-y-2 text-zinc-300">
                  {result.issues.map((i, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-zinc-500 mt-0.5" />
                      <span>{i.issue}</span>
                      <span className="text-xs text-zinc-500">({i.severity})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-400">No major issues detected.</p>
              )}
            </div>

            {result.suggestions && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-semibold text-white">AI suggestions (lite)</h2>
                {result.suggestions.top_fixes?.length && (
                  <div>
                    <h3 className="text-white font-semibold mb-2">Fix first</h3>
                    <ul className="space-y-1 text-zinc-300 text-sm">
                      {result.suggestions.top_fixes.map((f, idx) => (
                        <li key={idx}>• {f}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.suggestions.titles?.length && (
                  <div>
                    <h3 className="text-white font-semibold mb-2">Better title options</h3>
                    <ul className="space-y-1 text-zinc-300 text-sm">
                      {result.suggestions.titles.map((t, idx) => (
                        <li key={idx}>• {t}</li>
                      ))}
                    </ul>
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
            )}

            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-3">
                Want the full TubeGrow SEO tool?
              </h2>
              <p className="text-zinc-400 mb-6">
                The full version scores your whole library, suggests keyword gaps, and tracks performance over time.
                TubeGrow is waitlist‑only right now.
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
          <Link href="/youtube-seo-tool" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
            <h3 className="text-white font-semibold mb-1">YouTube SEO Tool</h3>
            <p className="text-zinc-400 text-sm">Pillar page with full workflow.</p>
          </Link>
          <Link href="/tools/youtube-metadata-generator" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
            <h3 className="text-white font-semibold mb-1">Metadata Generator</h3>
            <p className="text-zinc-400 text-sm">Generate optimized metadata.</p>
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

