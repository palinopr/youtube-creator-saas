import { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import ToolClient from "./ToolClient";

export const metadata: Metadata = {
  title: "Free YouTube Channel Snapshot (Lite)",
  description:
    "Get a quick public snapshot of any YouTube channel’s recent performance. Lite preview of TubeGrow analytics.",
  alternates: { canonical: "/tools/youtube-channel-snapshot" },
};

export default function ChannelSnapshotToolPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      <section className="relative pt-24 pb-10 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-500/10" />
        <div className="max-w-4xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-5">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">Lite Snapshot</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Free YouTube Channel Snapshot (Lite)
          </h1>
          <p className="text-zinc-400 mb-6">
            Get a fast public readout on any channel: subscribers, upload cadence, and recent videos.
            This is a lite preview of TubeGrow Analytics (waitlist‑only).
          </p>
        </div>
      </section>

      <ToolClient />
    </div>
  );
}

