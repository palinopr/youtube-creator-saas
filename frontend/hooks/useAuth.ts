"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AUTH_ENDPOINTS } from "@/lib/config";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UseAuthOptions {
  /** If true, redirect to login when not authenticated */
  requireAuth?: boolean;
  /** Custom redirect path (default: /) */
  redirectTo?: string;
}

export function useAuth(options: UseAuthOptions = {}) {
  const { requireAuth = false, redirectTo = "/" } = options;
  const router = useRouter();
  const pathname = usePathname();

  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const checkAuth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(AUTH_ENDPOINTS.STATUS, {
        credentials: "include",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const isAuthenticated = data.authenticated === true;

      setState({
        isAuthenticated,
        isLoading: false,
        error: null,
      });

      // Redirect if auth is required but user is not authenticated
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo);
      }

      return isAuthenticated;
    } catch (error) {
      setState({
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : "Auth check failed",
      });

      // Redirect on auth error if auth is required
      if (requireAuth) {
        router.push(redirectTo);
      }

      return false;
    }
  }, [requireAuth, redirectTo, router]);

  const login = useCallback(() => {
    // Store current path for redirect after login
    if (pathname !== "/") {
      sessionStorage.setItem("auth_redirect", pathname);
    }
    window.location.href = AUTH_ENDPOINTS.LOGIN;
  }, [pathname]);

  const logout = useCallback(async () => {
    try {
      await fetch(AUTH_ENDPOINTS.LOGOUT, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      // Logout failed, but continue with local cleanup
    }

    setState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    router.push("/");
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle redirect after login
  useEffect(() => {
    if (state.isAuthenticated && !state.isLoading) {
      const redirectPath = sessionStorage.getItem("auth_redirect");
      if (redirectPath) {
        sessionStorage.removeItem("auth_redirect");
        router.push(redirectPath);
      }
    }
  }, [state.isAuthenticated, state.isLoading, router]);

  return {
    ...state,
    login,
    logout,
    checkAuth,
  };
}

export default useAuth;
