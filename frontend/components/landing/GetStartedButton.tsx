"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface GetStartedButtonProps {
  variant?: "hero" | "inline";
  text?: string;
  showSubtext?: boolean;
}

export default function GetStartedButton({
  variant = "hero",
  text = "Get Started Free",
  showSubtext = true,
}: GetStartedButtonProps) {
  const authUrl = `${process.env.NEXT_PUBLIC_API_URL || ""}/auth/login`;

  if (variant === "hero") {
    return (
      <div className="w-full max-w-md mx-auto">
        <Link
          href={authUrl}
          className="btn-cta-primary flex items-center justify-center gap-2 w-full py-4 text-lg"
        >
          <span>{text}</span>
          <ArrowRight size={20} />
        </Link>

        {showSubtext && (
          <p className="text-white/40 text-sm text-center mt-4">
            Free tier includes 10 video analyses & 20 AI queries/month
          </p>
        )}
      </div>
    );
  }

  // Inline variant
  return (
    <div className="w-full max-w-lg">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
        <Link
          href={authUrl}
          className="btn-cta-primary flex items-center justify-center gap-2 text-sm whitespace-nowrap px-6 py-3"
        >
          <span>{text}</span>
          <ArrowRight size={16} />
        </Link>
        <Link
          href="/pricing"
          className="text-white/60 hover:text-white transition-colors text-sm"
        >
          See pricing
        </Link>
      </div>
    </div>
  );
}
