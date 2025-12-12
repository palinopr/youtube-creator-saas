import { Metadata } from "next";
import { Scissors } from "lucide-react";
import ToolClient from "./ToolClient";

export const metadata: Metadata = {
  title: "Free Shorts Clip Finder (Lite)",
  description:
    "Paste a YouTube video link and get AI‑picked viral Shorts moments with timestamps. Lite preview of TubeGrow’s viral clips generator.",
  alternates: { canonical: "/tools/shorts-clip-finder" },
};

export default function ShortsClipFinderToolPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      <section className="relative pt-24 pb-10 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-purple-500/10" />
        <div className="max-w-4xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 mb-5">
            <Scissors className="w-4 h-4 text-red-400" />
            <span className="text-red-300 text-sm font-medium">Lite Clip Finder</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Free Shorts Clip Finder (Lite)
          </h1>
          <p className="text-zinc-400 mb-6">
            Paste a YouTube video link. If the video has public captions, TubeGrow AI will surface
            3–5 viral Shorts moments with timestamps and hooks. This does not render clips — it’s a preview.
          </p>
        </div>
      </section>

      <ToolClient />
    </div>
  );
}

