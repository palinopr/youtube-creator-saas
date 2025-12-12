"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";

export default function HomeRedirect() {
  useEffect(() => {
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
  }, []);

  return null;
}

