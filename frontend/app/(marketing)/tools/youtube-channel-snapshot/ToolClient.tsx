"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, AlertTriangle, Check } from "lucide-react";
import WaitlistForm from "@/components/landing/WaitlistForm";
import { API_URL } from "@/lib/config";

type SnapshotResponse = {
  channel: {
    title: string;
    description: string;
    subscriber_count: number;
    video_count: number;
    thumbnail: string;
    url: string;
  };
  recent_videos: {
    video_id: string;
    title: string;
    view_count: number;
    upload_date: string;
    url: string;
  }[];
  insights?: string[] | null;
};

export default function ToolClient() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SnapshotResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/public/channel-snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url_or_handle: input }),
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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="@channelhandle or https://youtube.com/@handle"
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Loading..." : "Get Snapshot"}
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-start gap-4">
              {result.channel.thumbnail && (
                <img
                  src={result.channel.thumbnail}
                  alt={`${result.channel.title} thumbnail`}
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold text-white">{result.channel.title}</h2>
                <p className="text-zinc-400 text-sm mt-1">
                  {result.channel.subscriber_count.toLocaleString()} subscribers ·{" "}
                  {result.channel.video_count.toLocaleString()} videos
                </p>
                <a
                  href={result.channel.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-300 hover:text-blue-200 inline-flex items-center gap-1 mt-2"
                >
                  Open on YouTube <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-3">Recent videos</h3>
              <div className="space-y-3">
                {result.recent_videos.map((v) => (
                  <div key={v.video_id} className="border border-zinc-800 rounded-lg p-4">
                    <div className="text-white font-semibold mb-1">{v.title}</div>
                    <div className="text-zinc-400 text-sm">
                      {v.view_count.toLocaleString()} views · {v.upload_date || "recent"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {result.insights?.length ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-3">AI insights (lite)</h3>
                <ul className="space-y-2 text-zinc-300 text-sm">
                  {result.insights.map((i, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-3">
                Want analytics on your own channel?
              </h2>
              <p className="text-zinc-400 mb-6">
                TubeGrow connects via OAuth to pull deeper data, track trends, and answer questions with AI.
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
          <Link href="/youtube-analytics-tool" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
            <h3 className="text-white font-semibold mb-1">YouTube Analytics Tool</h3>
            <p className="text-zinc-400 text-sm">Full pillar workflow.</p>
          </Link>
          <Link href="/tools/youtube-seo-score" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
            <h3 className="text-white font-semibold mb-1">SEO Score</h3>
            <p className="text-zinc-400 text-sm">Score a video’s SEO.</p>
          </Link>
          <Link href="/tools/shorts-clip-finder" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
            <h3 className="text-white font-semibold mb-1">Shorts Clip Finder</h3>
            <p className="text-zinc-400 text-sm">Find viral moments.</p>
          </Link>
        </div>
      </section>
    </>
  );
}

