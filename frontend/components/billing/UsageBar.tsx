"use client";

interface UsageBarProps {
  label: string;
  used: number;
  limit: number;
  unlimited?: boolean;
}

export function UsageBar({ label, used, limit, unlimited = false }: UsageBarProps) {
  const percentage = unlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isNearLimit = !unlimited && percentage >= 80;
  const isAtLimit = !unlimited && percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className={`font-medium ${isAtLimit ? "text-red-400" : isNearLimit ? "text-yellow-400" : "text-gray-300"}`}>
          {unlimited ? (
            <span className="text-emerald-400">Unlimited</span>
          ) : (
            <>
              {used.toLocaleString()} / {limit.toLocaleString()}
            </>
          )}
        </span>
      </div>
      {!unlimited && (
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isAtLimit
                ? "bg-red-500"
                : isNearLimit
                ? "bg-yellow-500"
                : "bg-emerald-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
