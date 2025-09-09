/**
 * Central export for API services
 * Import all services from this single file
 */

// Generate suggestions service
export * from "./badge";

// Re-export the API client and types
export { apiClient, type ApiResponse } from "../client";
export { API_ENDPOINTS } from "../endpoints";
