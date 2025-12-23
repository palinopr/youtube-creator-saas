import { redirect } from "next/navigation";

// Phase 2 feature - redirecting to dashboard for MVP launch
export default function OptimizePage() {
  redirect("/command-center");
}

/* Original Page - Uncomment for Phase 2
"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { api } from "@/lib/api";
... (rest of original code preserved in git history)
*/
