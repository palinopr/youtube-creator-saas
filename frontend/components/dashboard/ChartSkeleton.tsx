"use client";

export function ChartSkeleton() {
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-4 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-32 h-5 rounded bg-white/10" />
        <div className="flex gap-2">
          <div className="w-12 h-6 rounded bg-white/10" />
          <div className="w-12 h-6 rounded bg-white/10" />
        </div>
      </div>
      <div className="h-[200px] flex items-end gap-2 px-4">
        {/* Fake bar chart skeleton */}
        {[40, 60, 45, 80, 55, 70, 50, 65, 75, 60, 85, 70].map((height, i) => (
          <div
            key={i}
            className="flex-1 bg-white/10 rounded-t"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-4 px-4">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="w-8 h-3 rounded bg-white/10" />
        ))}
      </div>
    </div>
  );
}
