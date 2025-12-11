import { Youtube, Sparkles, TrendingUp, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: Youtube,
    title: "Connect Your Channel",
    description: "One-click YouTube OAuth. We only read your data - never post or modify anything.",
  },
  {
    number: "2",
    icon: Sparkles,
    title: "Get AI Insights",
    description: "Our AI analyzes your videos, finds patterns, and identifies growth opportunities.",
  },
  {
    number: "3",
    icon: TrendingUp,
    title: "Grow Faster",
    description: "Apply data-driven recommendations to optimize content and increase your reach.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It <span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Start growing your channel in under 2 minutes
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-brand-500/50 via-accent-500/50 to-brand-500/50" />

          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Step Card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-colors relative z-10">
                {/* Number Badge */}
                <div className="w-12 h-12 bg-gradient-to-r from-brand-500 to-accent-500 rounded-full flex items-center justify-center text-xl font-bold text-white mx-auto mb-6">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <step.icon className="w-8 h-8 text-brand-400" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </div>

              {/* Arrow (mobile only) */}
              {index < steps.length - 1 && (
                <div className="md:hidden flex justify-center my-4">
                  <ArrowRight className="w-6 h-6 text-accent-500 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
