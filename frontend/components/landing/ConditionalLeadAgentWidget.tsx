"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LeadAgentWidget from "@/components/landing/LeadAgentWidget";
import { api } from "@/lib/api";

const EXCLUDED_PREFIXES = [
  "/admin",
  "/dashboard",
  "/command-center",
  "/analysis",
  "/deep-analysis",
  "/videos",
  "/video",
  "/settings",
  "/clips",
  "/comments",
  "/audience",
  "/traffic",
  "/revenue",
  "/optimize",
  "/onboarding",
];

const EXCLUDED_ROUTES = ["/login"];

export default function ConditionalLeadAgentWidget() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const data = await api.getAuthStatus();
        setIsAuthenticated(data?.authenticated === true);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setChecked(true);
      }
    };
    check();
  }, []);

  if (!checked) return null;
  if (isAuthenticated) return null;

  const excluded =
    EXCLUDED_ROUTES.includes(pathname) ||
    EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));

  if (excluded) return null;

  return <LeadAgentWidget />;
}

