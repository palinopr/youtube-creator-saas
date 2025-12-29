import { Metadata } from "next";
import { Sparkles } from "lucide-react";
import ToolClient from "./ToolClient";

export const metadata: Metadata = {
  title: "Free YouTube Metadata Generator (Lite)",
  description:
    "Generate AI‑optimized YouTube titles, descriptions, tags, and hashtags for 2025. Lite preview of TubeGrow’s metadata generator.",
  alternates: { canonical: "/tools/youtube-metadata-generator" },
};

export default function YouTubeMetadataGeneratorToolPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      <section className="relative pt-24 pb-10 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10" />
        <div className="max-w-4xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-5">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">Lite Generator</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Free YouTube Metadata Generator (Lite)
          </h1>
          <p className="text-zinc-400 mb-6">
            Write better titles, descriptions, and tags in minutes. Enter a topic or paste a video URL
            and TubeGrow AI will generate optimized metadata aligned to YouTube search and Shorts discovery.
            This is a lite preview — full workflows are inside TubeGrow (free tier available).
          </p>
        </div>
      </section>

      <ToolClient />
    </div>
  );
}

