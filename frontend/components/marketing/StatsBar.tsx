import { Users, Video, Eye, TrendingUp } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "10,000+",
    label: "Creators",
  },
  {
    icon: Video,
    value: "1M+",
    label: "Videos Analyzed",
  },
  {
    icon: Eye,
    value: "500M+",
    label: "Views Optimized",
  },
  {
    icon: TrendingUp,
    value: "35%",
    label: "Avg. Growth Boost",
  },
];

export function StatsBar() {
  return (
    <section className="py-16 bg-gradient-to-r from-brand-500/5 via-accent-500/5 to-brand-500/5 border-y border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/5 rounded-xl mb-4">
                <stat.icon className="w-6 h-6 text-accent-400" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
