/**
 * Main API export file
 * Single entry point for all API-related imports
 */

// Export everything from services
export * from "./services";

// Export client and endpoints directly
export { apiClient, type ApiResponse } from "./client";
export { API_ENDPOINTS } from "./endpoints";
