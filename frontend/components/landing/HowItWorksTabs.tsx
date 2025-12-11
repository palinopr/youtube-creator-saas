"use client";

import { useState } from "react";
import {
  Link2,
  BarChart3,
  Lightbulb,
  TrendingUp,
  ChevronRight,
  Play,
  Eye,
  Users,
  ThumbsUp,
  Clock,
  Zap,
  Target,
  ArrowUpRight,
  CheckCircle2,
  Youtube,
} from "lucide-react";

const steps = [
  {
    id: "connect",
    step: "STEP 1",
    icon: Link2,
    title: "Connect Your Channel",
    description:
      "Link your YouTube channel in one click using secure OAuth. We never post on your behalf or access private data.",
  },
  {
    id: "analyze",
    step: "STEP 2",
    icon: BarChart3,
    title: "Analyze Performance",
    description:
      "Our AI scans your entire video library, analyzing thumbnails, titles, descriptions, and engagement patterns to identify what works.",
  },
  {
    id: "recommend",
    step: "STEP 3",
    icon: Lightbulb,
    title: "Get Recommendations",
    description:
      "Receive personalized, actionable recommendations based on your niche, audience, and top-performing content patterns.",
  },
  {
    id: "grow",
    step: "STEP 4",
    icon: TrendingUp,
    title: "Watch Your Growth",
    description:
      "Track your improvements in real-time. See how each optimization impacts views, subscribers, and revenue over time.",
  },
];

// Mini Dashboard Components for each step
function ConnectMockup() {
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="text-center flex-1 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4 shadow-lg shadow-red-500/20">
          <Youtube size={32} className="text-white" />
        </div>
        <h4 className="text-white font-semibold text-lg mb-2">Connect YouTube</h4>
        <p className="text-white/50 text-sm mb-6 max-w-xs">
          Securely link your channel with one click
        </p>
        <button className="bg-gradient-to-r from-brand-500 to-accent-500 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </button>
        <div className="flex items-center gap-2 mt-4 text-white/40 text-xs">
          <CheckCircle2 size={14} className="text-green-500" />
          <span>Read-only access • No posting</span>
        </div>
      </div>
    </div>
  );
}

function AnalyzeMockup() {
  return (
    <div className="p-4 h-full flex flex-col">
      {/* Mini header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
            <BarChart3 size={16} className="text-brand-500" />
          </div>
          <span className="text-white font-medium text-sm">Analytics Dashboard</span>
        </div>
        <span className="text-white/40 text-xs">Last 28 days</span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Eye size={14} className="text-blue-400" />
            <span className="text-white/50 text-xs">Views</span>
          </div>
          <p className="text-white font-bold text-lg">2.4M</p>
          <span className="text-green-400 text-xs flex items-center gap-1">
            <ArrowUpRight size={12} /> +24%
          </span>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-purple-400" />
            <span className="text-white/50 text-xs">Subscribers</span>
          </div>
          <p className="text-white font-bold text-lg">847K</p>
          <span className="text-green-400 text-xs flex items-center gap-1">
            <ArrowUpRight size={12} /> +12%
          </span>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <ThumbsUp size={14} className="text-pink-400" />
            <span className="text-white/50 text-xs">Engagement</span>
          </div>
          <p className="text-white font-bold text-lg">8.2%</p>
          <span className="text-green-400 text-xs flex items-center gap-1">
            <ArrowUpRight size={12} /> +3.1%
          </span>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-orange-400" />
            <span className="text-white/50 text-xs">Watch Time</span>
          </div>
          <p className="text-white font-bold text-lg">156K</p>
          <span className="text-white/40 text-xs">hours</span>
        </div>
      </div>

      {/* Mini chart */}
      <div className="flex-1 bg-white/5 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/50 text-xs">Views over time</span>
          <span className="text-brand-500 text-xs font-medium">+24% vs last month</span>
        </div>
        <div className="flex items-end gap-1 h-16">
          {[40, 55, 45, 60, 50, 75, 65, 80, 70, 85, 90, 95].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-brand-500 to-accent-500 rounded-t opacity-80"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function RecommendMockup() {
  const recommendations = [
    { score: 92, title: "Optimize thumbnail contrast", impact: "High", color: "text-green-400" },
    { score: 87, title: "Add keywords to description", impact: "Medium", color: "text-yellow-400" },
    { score: 78, title: "Improve first 30 seconds", impact: "High", color: "text-green-400" },
  ];

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Mini header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <Lightbulb size={16} className="text-yellow-500" />
          </div>
          <span className="text-white font-medium text-sm">AI Recommendations</span>
        </div>
        <span className="bg-brand-500/20 text-brand-500 text-xs px-2 py-1 rounded-full">3 new</span>
      </div>

      {/* Recommendations list */}
      <div className="space-y-3 flex-1">
        {recommendations.map((rec, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-3 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">{rec.score}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium mb-1">{rec.title}</p>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${rec.color}`}>● {rec.impact} Impact</span>
                <span className="text-white/30 text-xs">•</span>
                <span className="text-white/40 text-xs">SEO</span>
              </div>
            </div>
            <Zap size={16} className="text-brand-500 flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* Action button */}
      <button className="w-full mt-4 bg-gradient-to-r from-brand-500 to-accent-500 text-white py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
        Apply All Recommendations
      </button>
    </div>
  );
}

function GrowthMockup() {
  return (
    <div className="p-4 h-full flex flex-col">
      {/* Mini header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
            <TrendingUp size={16} className="text-green-500" />
          </div>
          <span className="text-white font-medium text-sm">Growth Tracker</span>
        </div>
        <span className="text-green-400 text-xs font-medium flex items-center gap-1">
          <ArrowUpRight size={12} /> On track
        </span>
      </div>

      {/* Growth metrics */}
      <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 mb-4 border border-green-500/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/60 text-sm">Monthly Growth</span>
          <Target size={16} className="text-green-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">+34.2%</span>
          <span className="text-green-400 text-sm">↑ 12% vs goal</span>
        </div>
      </div>

      {/* Progress bars */}
      <div className="space-y-3 flex-1">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/60 text-xs">Subscriber Goal</span>
            <span className="text-white text-xs font-medium">847K / 1M</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full" style={{ width: '85%' }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/60 text-xs">Views Goal</span>
            <span className="text-white text-xs font-medium">2.4M / 3M</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '80%' }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/60 text-xs">Engagement Goal</span>
            <span className="text-white text-xs font-medium">8.2% / 10%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: '82%' }} />
          </div>
        </div>
      </div>

      {/* Milestone */}
      <div className="mt-4 flex items-center gap-3 bg-white/5 rounded-lg p-3">
        <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <span className="text-yellow-500 text-lg">🎯</span>
        </div>
        <div>
          <p className="text-white text-sm font-medium">Next milestone: 1M subs</p>
          <p className="text-white/40 text-xs">Estimated in 3 months</p>
        </div>
      </div>
    </div>
  );
}

// Map step IDs to mockup components
const stepMockups: Record<string, React.ComponentType> = {
  connect: ConnectMockup,
  analyze: AnalyzeMockup,
  recommend: RecommendMockup,
  grow: GrowthMockup,
};

export default function HowItWorksTabs() {
  const [activeStep, setActiveStep] = useState(steps[0].id);
  const ActiveMockup = stepMockups[activeStep];

  return (
    <section id="how-it-works" className="py-20">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-brand-500 text-sm font-medium uppercase tracking-wider mb-3">
            How It Works
          </p>
          <h2 className="text-4xl md:text-5xl font-medium text-white mb-4">
            Start growing in minutes
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Get up and running in less than 5 minutes. No complex setup,
            no technical knowledge required.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Left: Step tabs */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;

              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`w-full text-left p-6 rounded-xl transition-all duration-300 feature-tab ${
                    isActive ? "tab-active landing-card" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Step number badge */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isActive
                          ? "bg-gradient-to-br from-brand-500 to-accent-500"
                          : "bg-white/5"
                      }`}
                    >
                      {isActive ? (
                        <Icon size={24} className="text-white" />
                      ) : (
                        <span className="text-white/40 font-semibold">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                              isActive ? "text-brand-500" : "text-white/40"
                            }`}
                          >
                            {step.step}
                          </p>
                          <h3
                            className={`text-lg font-medium ${
                              isActive ? "text-white" : "text-white/70"
                            }`}
                          >
                            {step.title}
                          </h3>
                        </div>
                        <ChevronRight
                          size={18}
                          className={`flex-shrink-0 transition-transform ${
                            isActive
                              ? "text-brand-500 rotate-90"
                              : "text-white/30"
                          }`}
                        />
                      </div>
                      {isActive && (
                        <p className="text-white/60 text-sm mt-3 leading-relaxed">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Mini dashboard mockup */}
          <div className="lg:sticky lg:top-32">
            <div className="landing-card overflow-hidden">
              <div className="aspect-[4/3] bg-navy-900 relative">
                {/* Step number indicator */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className={`w-8 h-1 rounded-full transition-colors ${
                        activeStep === step.id
                          ? "bg-brand-500"
                          : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>

                {/* Dynamic mockup content */}
                <ActiveMockup />
              </div>
            </div>

            {/* Additional info card */}
            <div className="mt-4 p-4 landing-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">
                    No credit card required
                  </p>
                  <p className="text-white/50 text-xs">
                    Start your free trial instantly
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
