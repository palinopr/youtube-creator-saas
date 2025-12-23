"use client";

import { useState } from "react";
import { ArrowRight, Loader2, CheckCircle, Mail } from "lucide-react";
import { submitWaitlistSignup } from "@/lib/waitlist";

interface WaitlistFormProps {
  variant?: "hero" | "inline";
  /** Optional anchor id for #waitlist navigation */
  anchorId?: string;
  /** Optional source for tracking where signup came from */
  source?: string;
}

export default function WaitlistForm({ variant = "hero", anchorId, source }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    const { data, error: signupError } = await submitWaitlistSignup({
      email,
      referral_source: source || (typeof window !== "undefined" ? document.referrer || "direct" : "direct"),
    });

    setIsLoading(false);

    if (signupError) {
      setError(signupError);
      return;
    }

    if (data) {
      setIsSuccess(true);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className={`flex flex-col items-center ${variant === "hero" ? "gap-4" : "gap-3"}`}>
        <div className="flex items-center gap-2 text-green-500">
          <CheckCircle size={24} />
          <span className="text-lg font-medium">You&apos;re on the list!</span>
        </div>
        <p className="text-white/60 text-center max-w-sm">
          Check your email to confirm your spot and get early access when we launch.
        </p>
      </div>
    );
  }

  // Hero variant - larger, centered
  if (variant === "hero") {
    return (
      <div id={anchorId} className="w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-white/40" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-cta-primary flex items-center justify-center gap-2 w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Joining...</span>
              </>
            ) : (
              <>
                <span>Join Waitlist</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
        </form>

        <p className="text-white/40 text-sm text-center mt-4">
          Be first to know when we launch. No spam, ever.
        </p>
      </div>
    );
  }

  // Inline variant - horizontal, compact
  return (
    <div id={anchorId} className="w-full max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-white/40" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-cta-primary flex items-center justify-center gap-2 text-sm whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              <span>Joining...</span>
            </>
          ) : (
            <>
              <span>Join Waitlist</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {error && (
        <p className="text-red-400 text-sm text-center mt-2">{error}</p>
      )}
    </div>
  );
}
