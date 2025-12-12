"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { confirmWaitlistEmail } from "@/lib/supabase";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Invalid confirmation link");
      return;
    }

    const confirmEmail = async () => {
      const { data, error } = await confirmWaitlistEmail(token);

      if (error) {
        setStatus("error");
        setErrorMessage(error);
        return;
      }

      if (data) {
        setStatus("success");
      }
    };

    confirmEmail();
  }, [token]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
          <Loader2 className="animate-spin text-brand-500" size={32} />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">
          Confirming your email...
        </h1>
        <p className="text-white/60">
          Just a moment while we verify your spot.
        </p>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <XCircle className="text-red-500" size={32} />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">
          Oops, something went wrong
        </h1>
        <p className="text-white/60 mb-8">
          {errorMessage || "We couldn't confirm your email. Please try again."}
        </p>
        <Link href="/" className="btn-cta-primary inline-flex items-center gap-2">
          Back to Home
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  // Success state
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="text-green-500" size={32} />
      </div>
      <h1 className="text-3xl font-semibold text-white mb-2">
        You&apos;re confirmed!
      </h1>
      <p className="text-white/60 mb-8 max-w-md mx-auto">
        Thanks for confirming your email. We&apos;ll let you know as soon as TubeGrow is ready for you.
      </p>

      {/* What to expect */}
      <div className="bg-white/5 rounded-2xl p-6 mb-8 max-w-md mx-auto text-left">
        <h2 className="text-lg font-medium text-white mb-4">What happens next?</h2>
        <ul className="space-y-3 text-white/70">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-brand-500 text-sm font-medium">1</span>
            </div>
            <span>We&apos;ll send you an email when we launch</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-brand-500 text-sm font-medium">2</span>
            </div>
            <span>You&apos;ll get early access before the public</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-brand-500 text-sm font-medium">3</span>
            </div>
            <span>Start growing your YouTube channel with AI</span>
          </li>
        </ul>
      </div>

      <Link href="/" className="text-white/60 hover:text-white transition-colors">
        ← Back to Home
      </Link>
    </div>
  );
}

export default function WaitlistConfirmPage() {
  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-6">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-white">TubeGrow</span>
          </Link>
        </div>

        {/* Content */}
        <Suspense
          fallback={
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="animate-spin text-brand-500" size={32} />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2">
                Loading...
              </h1>
            </div>
          }
        >
          <ConfirmContent />
        </Suspense>
      </div>
    </div>
  );
}
