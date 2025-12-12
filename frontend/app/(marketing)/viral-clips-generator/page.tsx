import { Metadata } from "next";
import Link from "next/link";
import {
  Scissors,
  Play,
  TrendingUp,
  Clock,
  Sparkles,
  Video,
  Share2,
  BarChart3,
  Zap,
  ArrowRight,
  Check,
  Film,
  Music,
  MessageSquare,
  Target,
} from "lucide-react";
import WaitlistForm from "@/components/landing/WaitlistForm";

export const metadata: Metadata = {
  title: "Viral Clips Generator - Turn Videos into YouTube Shorts & TikToks",
  description:
    "AI-powered viral clips generator that finds the best moments in your YouTube videos. Create engaging YouTube Shorts, TikToks, and Instagram Reels automatically. Free clip finder tool.",
  keywords: [
    "viral clips generator",
    "youtube shorts maker",
    "youtube shorts generator",
    "video clip maker",
    "tiktok clip generator",
    "youtube to shorts converter",
    "viral video maker",
    "short form video generator",
    "youtube clips generator",
    "auto clip generator",
    "ai clip generator",
    "best moments finder",
    "youtube shorts creator",
    "vertical video maker",
    "reels generator",
  ],
  openGraph: {
    title: "Viral Clips Generator - AI-Powered YouTube Shorts Maker | TubeGrow",
    description:
      "Turn long videos into viral shorts automatically. Our AI finds the most engaging moments perfect for YouTube Shorts, TikTok, and Reels.",
    type: "website",
  },
};

const features = [
  {
    icon: Sparkles,
    title: "AI Viral Moment Detection",
    description:
      "Our AI analyzes your video transcripts to identify hook moments, emotional peaks, controversial statements, and quotable content that perform best on short-form platforms.",
  },
  {
    icon: Clock,
    title: "Perfect Timing",
    description:
      "Get precise timestamps for each viral moment. Our AI detects the optimal start and end points to maximize engagement and watch time.",
  },
  {
    icon: Film,
    title: "Hook-Body-Loop Structure",
    description:
      "Every clip suggestion follows the proven viral format: attention-grabbing hook, valuable content body, and seamless loop potential for replays.",
  },
  {
    icon: MessageSquare,
    title: "Caption Generation",
    description:
      "Get AI-generated captions optimized for each platform. Includes hashtag suggestions and engagement-driving CTAs.",
  },
  {
    icon: Share2,
    title: "Multi-Platform Ready",
    description:
      "Export clips optimized for YouTube Shorts (60s), TikTok (60s), Instagram Reels (90s), and Twitter/X video with proper aspect ratios.",
  },
  {
    icon: BarChart3,
    title: "Viral Score Prediction",
    description:
      "Each clip gets a viral potential score based on hook strength, content value, emotional impact, and trending topic alignment.",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Paste Video URL",
    description: "Enter any YouTube video URL or select from your channel's uploads",
    icon: Video,
  },
  {
    step: "2",
    title: "AI Analyzes Content",
    description: "Our AI reads the transcript and identifies the most viral-worthy moments",
    icon: Sparkles,
  },
  {
    step: "3",
    title: "Review Suggestions",
    description: "Get 5-15 clip suggestions with timestamps, viral scores, and platform recommendations",
    icon: Target,
  },
  {
    step: "4",
    title: "Export & Publish",
    description: "Download clips or schedule directly to YouTube Shorts, TikTok, and Reels",
    icon: Share2,
  },
];

const clipTypes = [
  {
    title: "Hook Moments",
    description: "Opening statements that immediately grab attention",
    color: "from-red-500 to-orange-500",
  },
  {
    title: "Emotional Peaks",
    description: "High-energy moments with strong emotional resonance",
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "Quotable Gems",
    description: "Memorable statements perfect for sharing",
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Educational Nuggets",
    description: "Quick tips and insights that provide instant value",
    color: "from-green-500 to-emerald-500",
  },
  {
    title: "Controversial Takes",
    description: "Bold opinions that spark engagement and discussion",
    color: "from-yellow-500 to-orange-500",
  },
  {
    title: "Story Climaxes",
    description: "Narrative peaks from storytelling content",
    color: "from-indigo-500 to-purple-500",
  },
];

const platforms = [
  { name: "YouTube Shorts", duration: "Up to 60 seconds", aspect: "9:16 vertical" },
  { name: "TikTok", duration: "Up to 60 seconds", aspect: "9:16 vertical" },
  { name: "Instagram Reels", duration: "Up to 90 seconds", aspect: "9:16 vertical" },
  { name: "Twitter/X", duration: "Up to 140 seconds", aspect: "16:9 or 1:1" },
];

export default function ViralClipsGeneratorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-purple-500/10" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 mb-6">
              <Scissors className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-sm font-medium">AI-Powered Clip Detection</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Viral Clips{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400">
                Generator
              </span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-8">
              Turn your long-form YouTube videos into viral YouTube Shorts, TikToks, and Reels.
              Our AI finds the most engaging moments automatically—no manual scrubbing required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/#waitlist"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-purple-500 text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Join Waitlist <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center justify-center gap-2 bg-zinc-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-zinc-700 transition-colors"
              >
                See How It Works
              </Link>
            </div>
          </div>

          {/* Demo Preview */}
          <div className="mt-16 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <div className="bg-zinc-800 rounded-lg px-4 py-3 text-zinc-500 text-sm">
                  https://youtube.com/watch?v=your-video-id
                </div>
              </div>
              <button className="bg-gradient-to-r from-red-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium">
                Find Viral Moments
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { time: "2:34 - 3:12", score: 94, type: "Hook Moment" },
                { time: "8:45 - 9:30", score: 89, type: "Emotional Peak" },
                { time: "15:22 - 16:05", score: 86, type: "Quotable Gem" },
              ].map((clip, i) => (
                <div key={i} className="bg-zinc-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-400 text-sm">{clip.time}</span>
                    <span className="text-green-400 font-semibold">{clip.score}% Viral</span>
                  </div>
                  <div className="text-white font-medium mb-2">{clip.type}</div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Shorts</span>
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">TikTok</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How the Viral Clips Generator Works
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Go from long video to viral clips in minutes, not hours. Our AI does the heavy lifting.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm text-red-400 font-medium mb-2">Step {item.step}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-zinc-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              AI-Powered Clip Detection Features
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Our advanced AI doesn't just find random moments—it identifies content with true viral potential.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-red-500/50 transition-colors"
              >
                <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clip Types */}
      <section className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Types of Viral Clips We Find
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Our AI is trained to identify six types of high-performing short-form content.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clipTypes.map((type) => (
              <div
                key={type.title}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${type.color}`} />
                <h3 className="text-lg font-semibold text-white mb-2">{type.title}</h3>
                <p className="text-zinc-400">{type.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Support */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Export to Every Platform
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Clips are automatically formatted for each platform's requirements.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center"
              >
                <h3 className="text-lg font-semibold text-white mb-4">{platform.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="text-zinc-400">{platform.duration}</div>
                  <div className="text-zinc-500">{platform.aspect}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Manual Editing vs TubeGrow AI
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-zinc-400 mb-6">Manual Editing</h3>
              <ul className="space-y-4">
                {[
                  "Watch entire video to find moments",
                  "Guess which clips will perform",
                  "Manually cut and export each clip",
                  "Write captions from scratch",
                  "Takes 2-4 hours per video",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-400">
                    <Clock className="w-5 h-5 text-zinc-600 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-zinc-900 border border-red-500/50 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-white mb-6">TubeGrow AI</h3>
              <ul className="space-y-4">
                {[
                  "AI analyzes video in seconds",
                  "Viral score predicts performance",
                  "One-click export to all platforms",
                  "AI-generated captions included",
                  "Takes 5 minutes per video",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-white">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
            Viral Clips Generator FAQ
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "How does the AI find viral moments?",
                a: "Our AI analyzes video transcripts using natural language processing to identify patterns that correlate with high engagement: strong hooks, emotional language, surprising statements, valuable insights, and controversial takes. It's trained on millions of viral short-form videos.",
              },
              {
                q: "What video lengths work best?",
                a: "The clips generator works with any video length, but videos between 10-60 minutes typically yield the best results with 5-15 clip suggestions. Shorter videos (under 5 minutes) usually produce 2-5 clips.",
              },
              {
                q: "Can I customize the clips before exporting?",
                a: "Yes! You can adjust the start and end timestamps, modify the AI-generated captions, select which platforms to export to, and choose vertical or square aspect ratios.",
              },
              {
                q: "Does it work with any YouTube video?",
                a: "The generator works best with your own content (connected via OAuth) but can also analyze any public YouTube video that has captions available. Videos without transcripts will have limited analysis.",
              },
              {
                q: "What makes a clip go viral on YouTube Shorts?",
                a: "Viral shorts typically have: a hook in the first 1-2 seconds, high energy or emotional content, a clear payoff or insight, good loop potential (viewers rewatch), and native vertical framing. Our AI looks for all these elements.",
              },
              {
                q: "How accurate is the viral score prediction?",
                a: "Our viral score is based on content analysis, not a guarantee of performance. However, clips with scores above 80% have historically performed 3x better on average than clips selected manually. External factors like thumbnails, posting time, and trends also affect results.",
              },
            ].map((faq, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">{faq.q}</h3>
                <p className="text-zinc-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-red-500/10 to-purple-500/10 border border-red-500/20 rounded-2xl p-12">
            <Scissors className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Be First to Generate Viral Clips
            </h2>
            <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
              Join the waitlist for early access to our AI-powered viral clip generator. Stop spending hours scrubbing through videos.
            </p>
            <div className="max-w-md mx-auto">
              <WaitlistForm variant="hero" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
