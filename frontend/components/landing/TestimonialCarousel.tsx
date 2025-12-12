import { Sparkles, Search, Scissors, BarChart3, TrendingUp, Target } from "lucide-react";

const useCases = [
  {
    title: "Spot what’s working",
    description: "Identify the videos and topics driving subscribers and watch time.",
    icon: BarChart3,
  },
  {
    title: "Fix SEO fast",
    description: "Improve titles, descriptions, and keywords with actionable checklists.",
    icon: Search,
  },
  {
    title: "Find viral opportunities",
    description: "See which formats, hooks, and upload patterns are winning in your niche.",
    icon: TrendingUp,
  },
  {
    title: "Get “why it worked”",
    description: "Causal + deep analysis to explain performance patterns (not just charts).",
    icon: Target,
  },
  {
    title: "Repurpose into Shorts",
    description: "Turn long videos into timestamped clips and generate Shorts ideas.",
    icon: Scissors,
  },
  {
    title: "Ask your analytics",
    description: "Chat with an AI that understands your channel data and history.",
    icon: Sparkles,
  },
];

export default function TestimonialCarousel() {
  return (
    <section className="py-20 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-brand-500 text-sm font-medium uppercase tracking-wider mb-3">
            Outcomes
          </p>
          <h2 className="text-4xl md:text-5xl font-medium text-white mb-4">
            A clearer path from data → decisions
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            TubeGrow focuses on the next best actions—not just dashboards.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {useCases.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="landing-card p-6">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-brand-500" />
                </div>
                <div className="text-white font-semibold mb-2">{item.title}</div>
                <div className="text-white/60 text-sm leading-relaxed">{item.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
