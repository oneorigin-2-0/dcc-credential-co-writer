/**
 * API endpoints configuration
 * Centralized place to manage all API endpoints
 */

export const API_ENDPOINTS = {
  // Generate suggestions endpoint
  GENERATE_SUGGESTIONS: "/generate-suggestions",
} as const;

// Type for endpoint values
export type ApiEndpoint = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];
