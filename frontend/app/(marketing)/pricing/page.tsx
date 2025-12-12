import type { Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose a TubeGrow plan that fits your channel. Start free, then upgrade for deeper analytics, AI insights, and SEO optimization.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing | TubeGrow",
    description:
      "Start free and upgrade when you're ready. TubeGrow pricing for AI-powered YouTube analytics and growth tools.",
    type: "website",
  },
};

export default function PricingPage() {
  return <PricingClient />;
}

