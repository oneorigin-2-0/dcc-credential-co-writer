/**
 * Generate suggestions API service
 * Handles badge suggestion generation via REST API
 */

import { apiClient, type ApiResponse } from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type { BadgeGenerationResult, BadgeSuggestion } from "@/lib/types";

export interface GenerateSuggestionsRequest {
  content: string;
}

/**
 * Generate suggestions for badge creation via REST API
 */
export async function generateSuggestions(
  request: GenerateSuggestionsRequest
): Promise<ApiResponse<BadgeGenerationResult>> {
  return apiClient.post<BadgeGenerationResult>(
    API_ENDPOINTS.GENERATE_SUGGESTIONS,
    request
  );
}

// Re-export types for convenience
export type { BadgeGenerationResult, BadgeSuggestion };
