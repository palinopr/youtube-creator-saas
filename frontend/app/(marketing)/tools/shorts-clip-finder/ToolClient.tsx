"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import GetStartedButton from "@/components/landing/GetStartedButton";
import { API_URL } from "@/lib/config";

type Clip = {
  start: string;
  end: string;
  hook_title: string;
  reason: string;
  viral_score: number;
};

type ClipsResponse = { clips: Clip[] };

export default function ToolClient() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClipsResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/public/shorts-clip-finder`, {
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
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
            <button
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-purple-500 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Finding..." : "Find Clips"}
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
              <h2 className="text-xl font-semibold text-white mb-3">Suggested Shorts moments</h2>
              {result.clips?.length ? (
                <div className="space-y-4">
                  {result.clips.map((c, idx) => (
                    <div key={idx} className="border border-zinc-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-white font-semibold">
                          {c.start} → {c.end}
                        </div>
                        <div className="text-sm text-zinc-400">Viral score: {c.viral_score}</div>
                      </div>
                      <div className="text-zinc-200 mb-1">{c.hook_title}</div>
                      <div className="text-zinc-400 text-sm">{c.reason}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-400">No clips returned. Try another video.</p>
              )}
            </div>

            <div className="bg-gradient-to-r from-red-500/10 to-purple-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-3">
                Want full clip generation?
              </h2>
              <p className="text-zinc-400 mb-6">
                TubeGrow's full Viral Clips Generator finds more moments, scores them,
                and lets you render/export Shorts. Get started free today.
              </p>
              <div className="max-w-md mx-auto">
                <GetStartedButton variant="inline" text="Get Full Access" />
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-12 px-4 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-4">
          <Link href="/viral-clips-generator" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-red-500/50 transition-colors">
            <h3 className="text-white font-semibold mb-1">Viral Clips Generator</h3>
            <p className="text-zinc-400 text-sm">Full pillar page workflow.</p>
          </Link>
          <Link href="/tools/youtube-seo-score" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-red-500/50 transition-colors">
            <h3 className="text-white font-semibold mb-1">SEO Score</h3>
            <p className="text-zinc-400 text-sm">Check video SEO.</p>
          </Link>
          <Link href="/tools/youtube-channel-snapshot" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-red-500/50 transition-colors">
            <h3 className="text-white font-semibold mb-1">Channel Snapshot</h3>
            <p className="text-zinc-400 text-sm">Quick channel readout.</p>
          </Link>
        </div>
      </section>
    </>
  );
}

