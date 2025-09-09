/**
 * Shared TypeScript types and interfaces
 * Central location for all type definitions used across the application
 */

// Badge suggestion item type
export interface BadgeSuggestion {
  title: string;
  description: string;
  criteria: string;
  image?: string;
}

// Badge generation result type - API returns array of suggestions
export interface BadgeGenerationResult {
  data: BadgeSuggestion[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
