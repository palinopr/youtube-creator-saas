"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";

export default function HomeRedirect() {
  useEffect(() => {
    const run = () => {
      api
        .getAuthStatus()
        .then((data: any) => {
          if (data?.authenticated) {
            window.location.replace("/command-center");
          }
        })
        .catch(() => {
          // ignore auth errors on marketing home
        });
    };

    // Avoid delaying initial paint on the landing page.
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const w = window as any;
      const handle = w.requestIdleCallback(run, { timeout: 1500 });
      return () => w.cancelIdleCallback(handle);
    }

    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, []);

  return null;
}
