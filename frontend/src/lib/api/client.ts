/**
 * Central API client configuration
 * Handles base configuration, interceptors, and error handling
 */

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  cache?: RequestCache;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = "") {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const { method = "GET", headers = {}, body, cache = "no-store" } = config;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...this.defaultHeaders,
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        cache,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("API request failed:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  }

  // HTTP Methods
  async get<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET", headers });
  }

  async post<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "POST", body, headers });
  }

  async put<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PUT", body, headers });
  }

  async patch<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PATCH", body, headers });
  }

  async delete<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE", headers });
  }

  // Set authorization header
  setAuthToken(token: string) {
    this.defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Remove authorization header
  clearAuthToken() {
    delete this.defaultHeaders["Authorization"];
  }
}

// Create and export a singleton instance with base URL from environment
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
export const apiClient = new ApiClient(baseURL);
export type { ApiResponse };
