import { redirect } from "next/navigation";

// Phase 2 feature - redirecting to dashboard for MVP launch
export default function AdvancedInsightsPage() {
  redirect("/command-center");
}
