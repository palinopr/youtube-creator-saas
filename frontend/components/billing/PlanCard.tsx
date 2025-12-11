"use client";

import { Check, X } from "lucide-react";

interface PlanFeature {
  name: string;
  included: boolean;
  value?: string | number;
}

interface PlanCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  features: PlanFeature[];
  highlights: string[];
  isCurrent: boolean;
  isPopular?: boolean;
  onSelect: (planId: string) => void;
  loading?: boolean;
}

export function PlanCard({
  id,
  name,
  description,
  price,
  highlights,
  isCurrent,
  isPopular = false,
  onSelect,
  loading = false,
}: PlanCardProps) {
  return (
    <div
      className={`relative rounded-2xl border p-6 flex flex-col ${
        isPopular
          ? "border-accent-500 bg-gradient-to-br from-brand-500/10 to-accent-500/10"
          : isCurrent
          ? "border-emerald-500 bg-emerald-500/5"
          : "border-white/10 bg-white/5"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-brand-500 to-accent-500 text-white text-xs font-medium px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-emerald-500 text-white text-xs font-medium px-3 py-1 rounded-full">
            Current Plan
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white">
            {price === 0 ? "Free" : `$${price}`}
          </span>
          {price > 0 && <span className="text-gray-400">/month</span>}
        </div>
      </div>

      <ul className="space-y-3 mb-6 flex-1">
        {highlights.map((highlight, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-accent-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300">{highlight}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(id)}
        disabled={isCurrent || loading}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          isCurrent
            ? "bg-white/10 text-gray-400 cursor-not-allowed"
            : isPopular
            ? "bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-600 hover:to-accent-600 text-white"
            : "bg-white/10 hover:bg-white/20 text-white"
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Processing...
          </span>
        ) : isCurrent ? (
          "Current Plan"
        ) : price === 0 ? (
          "Downgrade to Free"
        ) : (
          "Upgrade"
        )}
      </button>
    </div>
  );
}
