"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AIChatPopup from "./AIChatPopup";
import { api } from "@/lib/api";

// Routes where the AI chat should NOT appear (even for authenticated users)
const EXCLUDED_ROUTES = [
  "/login",
  "/pricing",
  "/features",
  "/about",
  "/blog",
  "/terms",
  "/privacy",
];

// Route prefixes where chat should NOT appear
const EXCLUDED_PREFIXES = ["/admin"];

export default function ConditionalAIChatPopup() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await api.getAuthStatus();
        setIsAuthenticated(data.authenticated === true);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Check if current route is excluded
  const isExcludedRoute =
    EXCLUDED_ROUTES.includes(pathname) ||
    EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // Don't render while loading or if not authenticated or on excluded routes
  if (isLoading || !isAuthenticated || isExcludedRoute) {
    return null;
  }

  return <AIChatPopup />;
}
