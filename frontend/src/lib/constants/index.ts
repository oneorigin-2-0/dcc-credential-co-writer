/**
 * Application constants
 * Centralized place for all constant values used across the application
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "",
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Badge Generation Constants
export const BADGE_CONFIG = {
  MIN_CONTENT_LENGTH: 50,
  MAX_CONTENT_LENGTH: 5000,
} as const;

// UI Constants
export const UI_CONFIG = {
  TOAST_DURATION: 5000,
  LOADING_DELAY: 300,
  DEBOUNCE_DELAY: 500,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  SERVER_ERROR: "Server error. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  BADGE_GENERATED: "Badge suggestions generated successfully!",
} as const;
