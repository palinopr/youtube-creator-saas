import { Play, Users, Eye, TrendingUp, BarChart3 } from "lucide-react";

export function DashboardPreview() {
  return (
    <section className="py-20 border-t border-white/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your YouTube <span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">Command Center</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Everything you need to understand and grow your channel, in one beautiful dashboard
          </p>
        </div>

        {/* Dashboard Mockup */}
        <div className="relative">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 via-accent-500/20 to-brand-500/20 blur-3xl" />

          {/* Dashboard Container */}
          <div className="relative bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Browser Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#0a0a0a] border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 bg-white/5 rounded-lg text-xs text-gray-500">
                  tubegrow.io/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-6">
              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <MockStatCard icon={<Users className="w-5 h-5" />} label="Subscribers" value="125.4K" change="+2.3%" />
                <MockStatCard icon={<Eye className="w-5 h-5" />} label="Views" value="2.1M" change="+12.5%" />
                <MockStatCard icon={<Play className="w-5 h-5" />} label="Videos" value="847" change="+3" />
                <MockStatCard icon={<TrendingUp className="w-5 h-5" />} label="Watch Time" value="45.2K hrs" change="+8.1%" />
              </div>

              {/* Charts Row */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Views Chart */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-white">Views Trend</h4>
                    <span className="text-xs text-gray-500">Last 30 days</span>
                  </div>
                  <MockChart color="brand" />
                </div>

                {/* Subscribers Chart */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-white">Subscriber Growth</h4>
                    <span className="text-xs text-gray-500">Last 30 days</span>
                  </div>
                  <MockChart color="accent" />
                </div>
              </div>

              {/* Recent Videos */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-brand-400" />
                    Recent Videos
                  </h4>
                  <span className="text-xs text-accent-400">View all</span>
                </div>
                <div className="space-y-3">
                  <MockVideoRow title="How I Grew to 100K Subscribers" views="45.2K" date="2 days ago" />
                  <MockVideoRow title="My YouTube Studio Setup Tour 2024" views="32.1K" date="5 days ago" />
                  <MockVideoRow title="10 Tips for Better Thumbnails" views="28.7K" date="1 week ago" />
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-brand-500/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-accent-500/30 rounded-full blur-3xl" />
        </div>
      </div>
    </section>
  );
}

function MockStatCard({ icon, label, value, change }: { icon: React.ReactNode; label: string; value: string; change: string }) {
  const isPositive = change.startsWith("+");
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-white">{value}</span>
        <span className={`text-xs ${isPositive ? "text-emerald-400" : "text-red-400"}`}>{change}</span>
      </div>
    </div>
  );
}

function MockChart({ color }: { color: "brand" | "accent" }) {
  const colorClass = color === "brand" ? "from-brand-500 to-brand-400" : "from-accent-500 to-accent-400";

  // Generate random-ish bar heights for visual variety
  const bars = [40, 55, 45, 70, 60, 80, 65, 75, 85, 70, 90, 75];

  return (
    <div className="flex items-end gap-1 h-24">
      {bars.map((height, i) => (
        <div
          key={i}
          className={`flex-1 bg-gradient-to-t ${colorClass} rounded-t opacity-80`}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

function MockVideoRow({ title, views, date }: { title: string; views: string; date: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
        <Play className="w-4 h-4 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{title}</p>
        <p className="text-xs text-gray-500">{views} views • {date}</p>
      </div>
    </div>
  );
}
