import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles, Search, Scissors, BarChart3 } from "lucide-react";
import WaitlistForm from "@/components/landing/WaitlistForm";

export const metadata: Metadata = {
  title: "Free YouTube Tools (Lite)",
  description:
    "Try TubeGrow’s free lite YouTube tools: SEO score, metadata generator, Shorts clip finder, and channel snapshot. Built for creators in 2025.",
  alternates: { canonical: "/tools" },
  openGraph: {
    title: "Free YouTube Tools | TubeGrow",
    description:
      "Lite previews of TubeGrow’s AI workflows for SEO, analytics, and Shorts.",
    type: "website",
  },
};

const tools = [
  {
    name: "YouTube SEO Score (Lite)",
    href: "/tools/youtube-seo-score",
    icon: Search,
    description:
      "Paste a video URL and get a quick SEO score plus top fixes and better metadata suggestions.",
  },
  {
    name: "Metadata Generator (Lite)",
    href: "/tools/youtube-metadata-generator",
    icon: Sparkles,
    description:
      "Generate optimized titles, descriptions, tags, and hashtags for a topic or video.",
  },
  {
    name: "Shorts Clip Finder (Lite)",
    href: "/tools/shorts-clip-finder",
    icon: Scissors,
    description:
      "Find 3–5 viral Shorts moments from a public transcript with timestamps.",
  },
  {
    name: "Channel Snapshot (Lite)",
    href: "/tools/youtube-channel-snapshot",
    icon: BarChart3,
    description:
      "Get a fast read on a channel’s public performance and recent uploads.",
  },
];

export default function ToolsHubPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10" />
        <div className="max-w-6xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">Free Lite Tools</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Try TubeGrow’s{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              Free YouTube Tools
            </span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-8">
            These are lite previews of the same AI workflows inside TubeGrow. Use them to
            score SEO, generate metadata, find Shorts moments, and get a channel snapshot.
            Full access is waitlist‑only.
          </p>
          <Link
            href="/#waitlist"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Join Waitlist <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 hover:border-purple-500/50 transition-colors"
            >
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                <tool.icon className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">{tool.name}</h2>
              <p className="text-zinc-400 mb-4">{tool.description}</p>
              <div className="inline-flex items-center gap-2 text-white font-medium">
                Open tool <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Want the Full Version?
          </h2>
          <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
            The full TubeGrow product connects to your channel via OAuth, runs deeper analysis,
            and saves everything to your dashboard. Join the waitlist and we’ll invite you as spots open.
          </p>
          <div className="max-w-md mx-auto">
            <WaitlistForm variant="hero" />
          </div>
        </div>
      </section>
    </div>
  );
}

