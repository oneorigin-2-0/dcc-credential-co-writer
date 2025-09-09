/**
 * Custom React hook for API calls
 * Provides loading states, error handling, and data management
 */

import { useState, useCallback } from "react";
import type { ApiResponse } from "@/lib/api";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * Generic hook for API calls with loading and error states
 */
export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiFunction(...args);

        if (response.success && response.data) {
          setState({
            data: response.data,
            loading: false,
            error: null,
          });
          return response.data;
        } else {
          setState({
            data: null,
            loading: false,
            error: response.error || "An unknown error occurred",
          });
          return null;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });
        return null;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook specifically for badge generation
 */
export function useBadgeGeneration() {
  return useApi(async (content: string) => {
    const { generateSuggestions } = await import("@/lib/api");
    return generateSuggestions({ content });
  });
}
