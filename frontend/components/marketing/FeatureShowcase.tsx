import { Check, Sparkles, Scissors, Zap, Play, BarChart3, TrendingUp, MessageSquare } from "lucide-react";

export function FeatureShowcase() {
  return (
    <section className="py-24 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful Tools for <span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">Serious Creators</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Everything you need to understand your audience, optimize your content, and grow faster
          </p>
        </div>

        <div className="space-y-32">
          {/* Feature 1: AI Analytics */}
          <FeatureBlock
            badge="AI-Powered"
            title="Deep Analytics That Actually Help"
            description="Stop guessing what works. Our AI analyzes patterns across all your videos to reveal exactly what drives views, watch time, and subscribers."
            features={[
              "Pattern detection across your entire catalog",
              "AI chat to ask questions in plain English",
              "Actionable recommendations, not just charts",
            ]}
            visual={<AnalyticsMockup />}
            reverse={false}
          />

          {/* Feature 2: Viral Clips */}
          <FeatureBlock
            badge="Save Hours"
            title="Turn Long Videos into Viral Shorts"
            description="Our AI watches your videos and identifies the most engaging moments - perfect for YouTube Shorts, TikTok, and Instagram Reels."
            features={[
              "Automatic highlight detection",
              "Hook, body, loop structure for maximum retention",
              "One-click export to multiple formats",
            ]}
            visual={<ClipsMockup />}
            reverse={true}
          />

          {/* Feature 3: SEO Optimizer */}
          <FeatureBlock
            badge="Rank Higher"
            title="SEO Optimization That Works"
            description="Get more views from search with AI-generated titles, descriptions, and tags optimized for YouTube's algorithm."
            features={[
              "Keyword research based on real search data",
              "Competitor video analysis",
              "SEO scoring with improvement suggestions",
            ]}
            visual={<SEOMockup />}
            reverse={false}
          />
        </div>
      </div>
    </section>
  );
}

function FeatureBlock({
  badge,
  title,
  description,
  features,
  visual,
  reverse,
}: {
  badge: string;
  title: string;
  description: string;
  features: string[];
  visual: React.ReactNode;
  reverse: boolean;
}) {
  return (
    <div className={`grid lg:grid-cols-2 gap-12 items-center ${reverse ? "lg:flex-row-reverse" : ""}`}>
      {/* Text Content */}
      <div className={reverse ? "lg:order-2" : ""}>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-500/10 border border-accent-500/20 rounded-full mb-6">
          <Sparkles className="w-3 h-3 text-accent-400" />
          <span className="text-xs font-medium text-accent-400">{badge}</span>
        </div>

        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">{title}</h3>
        <p className="text-gray-400 text-lg mb-6">{description}</p>

        <ul className="space-y-3">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 bg-accent-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-accent-400" />
              </div>
              <span className="text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Visual */}
      <div className={reverse ? "lg:order-1" : ""}>
        {visual}
      </div>
    </div>
  );
}

function AnalyticsMockup() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 to-accent-500/20 blur-3xl" />
      <div className="relative bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-400" />
            <span className="font-medium text-white">Channel Analytics</span>
          </div>
          <span className="text-xs text-gray-500">Last 28 days</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Views</p>
            <p className="text-lg font-bold text-white">847K</p>
            <p className="text-xs text-emerald-400">+23.5%</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Watch Time</p>
            <p className="text-lg font-bold text-white">12.4K hrs</p>
            <p className="text-xs text-emerald-400">+18.2%</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Subscribers</p>
            <p className="text-lg font-bold text-white">+2.1K</p>
            <p className="text-xs text-emerald-400">+45%</p>
          </div>
        </div>

        {/* AI Insight */}
        <div className="bg-gradient-to-r from-brand-500/10 to-accent-500/10 border border-brand-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-brand-500 to-accent-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white mb-1">AI Insight</p>
              <p className="text-xs text-gray-400">
                Videos posted on Tuesdays get 34% more views in the first 24 hours. Your best performing thumbnail style uses close-up faces with bold text.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClipsMockup() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 blur-3xl" />
      <div className="relative bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-pink-400" />
            <span className="font-medium text-white">Viral Clip Generator</span>
          </div>
          <span className="px-2 py-1 bg-pink-500/20 text-pink-400 text-xs rounded-full">3 clips found</span>
        </div>

        {/* Video Timeline */}
        <div className="mb-6">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="flex h-full">
              <div className="w-[15%] bg-white/20" />
              <div className="w-[8%] bg-gradient-to-r from-pink-500 to-purple-500" />
              <div className="w-[22%] bg-white/20" />
              <div className="w-[6%] bg-gradient-to-r from-pink-500 to-purple-500" />
              <div className="w-[30%] bg-white/20" />
              <div className="w-[10%] bg-gradient-to-r from-pink-500 to-purple-500" />
              <div className="flex-1 bg-white/20" />
            </div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>0:00</span>
            <span>12:34</span>
          </div>
        </div>

        {/* Detected Clips */}
        <div className="space-y-3">
          <ClipItem time="2:15" duration="45s" title="The moment that changes everything..." score={95} />
          <ClipItem time="5:42" duration="32s" title="This hack saved me 10 hours..." score={88} />
          <ClipItem time="9:18" duration="28s" title="You won't believe what happened next" score={82} />
        </div>
      </div>
    </div>
  );
}

function ClipItem({ time, duration, title, score }: { time: string; duration: string; title: string; score: number }) {
  return (
    <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer">
      <div className="w-16 h-10 bg-white/10 rounded flex items-center justify-center flex-shrink-0">
        <Play className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{title}</p>
        <p className="text-xs text-gray-500">{time} • {duration}</p>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-pink-400">{score}%</div>
        <div className="text-xs text-gray-500">viral score</div>
      </div>
    </div>
  );
}

function SEOMockup() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-3xl" />
      <div className="relative bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            <span className="font-medium text-white">SEO Optimizer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="w-[85%] h-full bg-emerald-500" />
            </div>
            <span className="text-sm font-medium text-emerald-400">85</span>
          </div>
        </div>

        {/* Title Suggestion */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 mb-2 block">Optimized Title</label>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <p className="text-white text-sm">I Tried YouTube Shorts for 30 Days - Here&apos;s What Happened</p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="text-xs text-gray-400">Great length (56 characters)</span>
          </div>
        </div>

        {/* Tags */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 mb-2 block">Suggested Tags</label>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded">youtube shorts</span>
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded">30 day challenge</span>
            <span className="px-2 py-1 bg-white/10 text-gray-400 text-xs rounded">short form content</span>
            <span className="px-2 py-1 bg-white/10 text-gray-400 text-xs rounded">youtube growth</span>
          </div>
        </div>

        {/* Competitor Analysis */}
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-white">Top Ranking Videos</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">1.</span>
              <span className="text-gray-300 truncate">I Posted YouTube Shorts Every Day...</span>
              <span className="text-emerald-400 ml-auto">2.1M</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">2.</span>
              <span className="text-gray-300 truncate">YouTube Shorts Changed My Life</span>
              <span className="text-emerald-400 ml-auto">1.8M</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
