"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * State for async operations
 */
export interface UseAsyncState<T> {
  /** The data returned from the async function */
  data: T | null;
  /** Whether the async operation is in progress */
  loading: boolean;
  /** Error message if the operation failed */
  error: string | null;
}

/**
 * Return type for useAsync hook
 */
export interface UseAsyncReturn<T> extends UseAsyncState<T> {
  /** Manually trigger a refetch */
  refetch: () => Promise<void>;
  /** Reset state to initial values */
  reset: () => void;
  /** Set data manually (useful for optimistic updates) */
  setData: (data: T | null) => void;
}

/**
 * Options for useAsync hook
 */
export interface UseAsyncOptions {
  /** Whether to run the async function immediately on mount (default: true) */
  immediate?: boolean;
  /** Reset error state on refetch (default: true) */
  resetErrorOnRefetch?: boolean;
  /** Called when the async function succeeds */
  onSuccess?: (data: any) => void;
  /** Called when the async function fails */
  onError?: (error: string) => void;
}

/**
 * Hook for handling async operations with loading, error, and data states.
 *
 * Replaces the common pattern of:
 * ```tsx
 * const [data, setData] = useState(null);
 * const [loading, setLoading] = useState(true);
 * const [error, setError] = useState(null);
 *
 * useEffect(() => {
 *   fetchData();
 * }, []);
 *
 * const fetchData = async () => {
 *   setLoading(true);
 *   try { ... } catch { ... } finally { setLoading(false); }
 * };
 * ```
 *
 * With:
 * ```tsx
 * const { data, loading, error, refetch } = useAsync(fetchData);
 * ```
 *
 * @param asyncFn - The async function to execute
 * @param deps - Dependencies array (like useEffect deps)
 * @param options - Configuration options
 *
 * @example
 * // Basic usage - runs on mount
 * const { data, loading, error } = useAsync(() => api.getVideos());
 *
 * @example
 * // With dependencies - re-runs when videoId changes
 * const { data, loading, error } = useAsync(
 *   () => api.getVideo(videoId),
 *   [videoId]
 * );
 *
 * @example
 * // Manual trigger only
 * const { data, loading, refetch } = useAsync(
 *   () => api.analyzeVideo(videoId),
 *   [],
 *   { immediate: false }
 * );
 * // Later: await refetch();
 *
 * @example
 * // With callbacks
 * const { data, loading } = useAsync(
 *   () => api.saveVideo(data),
 *   [],
 *   {
 *     immediate: false,
 *     onSuccess: () => toast.success('Saved!'),
 *     onError: (err) => toast.error(err),
 *   }
 * );
 */
export function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseAsyncOptions = {}
): UseAsyncReturn<T> {
  const {
    immediate = true,
    resetErrorOnRefetch = true,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  // Track the current request to handle race conditions
  const requestId = useRef(0);

  const execute = useCallback(async () => {
    // Increment request ID to track current request
    const currentRequestId = ++requestId.current;

    setState((prev) => ({
      ...prev,
      loading: true,
      error: resetErrorOnRefetch ? null : prev.error,
    }));

    try {
      const result = await asyncFn();

      // Only update state if this is still the current request and component is mounted
      if (isMounted.current && currentRequestId === requestId.current) {
        setState({ data: result, loading: false, error: null });
        onSuccess?.(result);
      }
    } catch (err) {
      // Only update state if this is still the current request and component is mounted
      if (isMounted.current && currentRequestId === requestId.current) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        onError?.(errorMessage);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asyncFn, resetErrorOnRefetch, ...deps]);

  const reset = useCallback(() => {
    requestId.current++;
    setState({ data: null, loading: false, error: null });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  // Run on mount and when dependencies change
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    ...state,
    refetch: execute,
    reset,
    setData,
  };
}

/**
 * Hook for handling async operations that should only run on demand (not on mount).
 *
 * This is a convenience wrapper around useAsync with immediate: false.
 *
 * @example
 * const { execute, loading, error, data } = useLazyAsync<AnalysisResult>();
 *
 * const handleAnalyze = async () => {
 *   const result = await execute(() => api.analyzeVideo(videoId));
 *   // result is typed as AnalysisResult
 * };
 */
export function useLazyAsync<T>() {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const isMounted = useRef(true);

  const execute = useCallback(async (asyncFn: () => Promise<T>): Promise<T | null> => {
    setState({ data: null, loading: true, error: null });

    try {
      const result = await asyncFn();
      if (isMounted.current) {
        setState({ data: result, loading: false, error: null });
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      if (isMounted.current) {
        setState({ data: null, loading: false, error: errorMessage });
      }
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

export default useAsync;
