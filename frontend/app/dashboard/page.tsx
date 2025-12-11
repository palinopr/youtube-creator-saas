"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function DashboardRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for authentication query param
    const authenticated = searchParams.get("authenticated");

    if (authenticated === "true") {
      // Redirect to home with authenticated state
      router.replace("/");
    } else {
      router.replace("/");
    }
  }, [router, searchParams]);

  return null;
}

export default function DashboardRedirect() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">Redirecting to dashboard...</p>
      </div>
      <Suspense fallback={null}>
        <DashboardRedirectContent />
      </Suspense>
    </div>
  );
}
