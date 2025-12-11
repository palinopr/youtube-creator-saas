"use client";

import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  /** Override active path for sidebar highlighting */
  activePath?: string;
}

/**
 * Unified layout wrapper for all authenticated dashboard pages.
 * Provides consistent sidebar navigation across the app.
 */
export default function DashboardLayout({
  children,
  activePath
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar activePath={activePath} />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
