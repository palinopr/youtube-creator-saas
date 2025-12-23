"use client";

import {
  BarChart3,
  Users,
  Globe,
  DollarSign,
  Search,
  Scissors,
  MessageCircle,
  Sparkles,
  PenLine,
  Bot,
} from "lucide-react";

const capabilities = [
  {
    category: "Analytics & Insights",
    icon: BarChart3,
    color: "from-blue-500 to-cyan-500",
    items: [
      { name: "Channel Performance", prompt: "How is my channel doing?" },
      { name: "Demographics", prompt: "Who watches my videos?" },
      { name: "Traffic Sources", prompt: "Where do my viewers come from?" },
      { name: "Geography", prompt: "What countries watch me most?" },
      { name: "Device Breakdown", prompt: "Mobile vs desktop viewers?" },
    ],
  },
  {
    category: "Revenue & Growth",
    icon: DollarSign,
    color: "from-green-500 to-emerald-500",
    items: [
      { name: "Revenue Tracking", prompt: "How much am I earning?" },
      { name: "Top Videos", prompt: "What's my best video?" },
      { name: "Subscriber Sources", prompt: "Where do subs come from?" },
      { name: "Watch Time Analysis", prompt: "Which videos keep viewers?" },
    ],
  },
  {
    category: "SEO Optimization",
    icon: Search,
    color: "from-purple-500 to-pink-500",
    items: [
      { name: "SEO Analysis", prompt: "Analyze SEO for my last video" },
      { name: "Title Suggestions", prompt: "Suggest a better title" },
      { name: "Tag Research", prompt: "What tags should I use?" },
      { name: "Apply Changes", prompt: "Update my video with these suggestions" },
    ],
  },
  {
    category: "Viral Clips",
    icon: Scissors,
    color: "from-orange-500 to-red-500",
    items: [
      { name: "Find Viral Moments", prompt: "Find clips from my last video" },
      { name: "Hook Analysis", prompt: "What makes a good hook?" },
      { name: "Timestamp Suggestions", prompt: "Best moments for Shorts?" },
    ],
  },
  {
    category: "Comment Intelligence",
    icon: MessageCircle,
    color: "from-indigo-500 to-purple-500",
    items: [
      { name: "Sentiment Analysis", prompt: "What are people saying?" },
      { name: "Questions to Answer", prompt: "What questions should I reply to?" },
      { name: "Content Ideas", prompt: "What do viewers want next?" },
      { name: "Notable Commenters", prompt: "Any creators commenting?" },
    ],
  },
];

export default function YouTubeCapabilitiesSection() {
  return (
    <section id="capabilities" className="py-20 bg-gradient-to-b from-transparent to-black/20">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 mb-6">
            <Bot className="w-4 h-4 text-brand-500" />
            <span className="text-brand-500 text-sm font-medium">AI Copilot</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-medium text-white mb-4">
            Your personal YouTube assistant
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            One conversation. Full channel control. Ask anything and get instant insights,
            suggestions, or take action on your videos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.category}
                className="landing-card p-6 hover:border-white/20 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cap.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-4">{cap.category}</h3>
                <ul className="space-y-3">
                  {cap.items.map((item) => (
                    <li key={item.name} className="flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-white text-sm">{item.name}</span>
                        <p className="text-white/40 text-xs mt-0.5">"{item.prompt}"</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* Special Action Card */}
          <div className="landing-card p-6 border-brand-500/30 bg-gradient-to-br from-brand-500/5 to-transparent">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center mb-4">
              <PenLine className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-4">Take Action</h3>
            <p className="text-white/60 text-sm mb-4">
              Not just insights - your AI can actually update your videos when you approve.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-white text-sm">Update Titles</span>
                  <p className="text-white/40 text-xs mt-0.5">"Apply the suggested title"</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-white text-sm">Update Descriptions</span>
                  <p className="text-white/40 text-xs mt-0.5">"Use your SEO description"</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-white text-sm">Update Tags</span>
                  <p className="text-white/40 text-xs mt-0.5">"Add those tags to my video"</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Example Conversation */}
        <div className="mt-16 max-w-2xl mx-auto">
          <p className="text-center text-white/40 text-sm uppercase tracking-wider mb-6">
            Example Conversation
          </p>
          <div className="landing-card p-6 space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="bg-blue-600 rounded-2xl rounded-bl-md px-4 py-2">
                <p className="text-white text-sm">Analyze SEO for my last video and suggest improvements</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
              <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3 max-w-md">
                <p className="text-white/80 text-sm">
                  Your video "Morning Routine Tips" has an SEO score of 62/100. The title is good but could be stronger.
                  Here's what I suggest: "My 5AM Morning Routine That Changed Everything" - it adds curiosity and a number hook.
                  Want me to apply this change?
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="bg-blue-600 rounded-2xl rounded-bl-md px-4 py-2">
                <p className="text-white text-sm">Yes, update the title</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
              <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                <p className="text-white/80 text-sm">
                  Done! I've updated your video title. Your new SEO score is 78/100.
                  Want me to also optimize the description and tags?
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
