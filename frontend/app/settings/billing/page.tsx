"use client";

import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import { ArrowLeft, CreditCard } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Settings
            </Link>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <CreditCard className="w-7 h-7" />
              Billing
            </h1>
            <p className="text-gray-400 mt-1">
              TubeGrow is in waitlist-only early access. Billing is disabled for
              now.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-gray-300">
              We&apos;ll enable billing when the public beta opens. For now, use the
              product and we&apos;ll notify you as early access expands.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/#waitlist"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors"
              >
                Join the waitlist
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                Read the blog
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

