import { redirect } from "next/navigation";

// Phase 2 feature - redirecting to dashboard for MVP launch
export default function TrafficPage() {
  redirect("/command-center");
}
