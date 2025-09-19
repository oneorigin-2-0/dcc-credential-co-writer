/**
 * Centralized API configuration and utilities
 */

// Environment configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001/api/v1',
  ENDPOINTS: {
    GENERATE: '/generate/stream',
  },
} as const;

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Badge suggestion types
export interface BadgeSuggestion {
  title: string;
  description: string;
  criteria: string;
  image?: string;
}

export interface BadgeGenerationResult {
  data: BadgeSuggestion[];
}

// API client class
export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
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
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  async generateSuggestions(content: string): Promise<ApiResponse<BadgeGenerationResult>> {
    const response = await this.request<any>(API_CONFIG.ENDPOINTS.GENERATE, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });

    if (!response.success) {
      return response;
    }

    // Transform the new API response format to our internal format
    const result = response.data;
    let transformedData: BadgeGenerationResult;

    if (result.response && result.response.badge_name) {
      // New API format: { response: { badge_name, badge_description, criteria: { narrative } } }
      transformedData = {
        data: [{
          title: result.response.badge_name,
          description: result.response.badge_description,
          criteria: result.response.criteria?.narrative || result.response.badge_description,
          image: undefined, // No image in new format
        }]
      };
    } else if (result.data && Array.isArray(result.data)) {
      // Legacy format: { data: [suggestions] }
      transformedData = { data: result.data };
    } else {
      // Fallback
      transformedData = { data: [] };
    }

    return {
      success: true,
      data: transformedData,
    };
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;

// Streaming types
export interface StreamingResponse {
  type: 'start' | 'data' | 'error' | 'complete';
  data?: any;
  error?: string;
  progress?: number;
  isPartial?: boolean;
}

// Streaming API client
export class StreamingApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL;
  }

  async *generateSuggestionsStream(content: string): AsyncGenerator<StreamingResponse, void, unknown> {
    const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.GENERATE}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        yield {
          type: 'error',
          error: `HTTP error! status: ${response.status}`,
        };
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        yield {
          type: 'error',
          error: 'No response body reader available',
        };
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      yield { type: 'start' };

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            yield { type: 'complete' };
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                yield { type: 'complete' };
                return;
              }

              try {
                const parsed = JSON.parse(data);
                
                // Handle different streaming response formats
                if (parsed.type === 'error') {
                  yield {
                    type: 'error',
                    error: parsed.error || parsed.message || 'API returned an error',
                  };
                  return;
                } else if (parsed.type === 'progress') {
                  yield {
                    type: 'data',
                    data: parsed,
                    progress: parsed.progress,
                  };
                } else if (parsed.type === 'token' && parsed.accumulated) {
                  // Token-by-token streaming - show raw content like ChatGPT
                  yield {
                    type: 'data',
                    data: {
                      rawContent: parsed.accumulated,
                      latestToken: parsed.content,
                      isPartial: !parsed.done,
                      isComplete: parsed.done,
                    },
                  };
                } else if (parsed.response) {
                  // Final response with badge data
                  const suggestion = {
                    title: parsed.response.badge_name,
                    description: parsed.response.badge_description,
                    criteria: parsed.response.criteria?.narrative || parsed.response.badge_description,
                    image: undefined,
                  };
                  yield {
                    type: 'data',
                    data: suggestion,
                  };
                } else if (parsed.title || parsed.description || parsed.criteria) {
                  // Partial streaming content
                  yield {
                    type: 'data',
                    data: parsed,
                  };
                } else {
                  yield {
                    type: 'data',
                    data: parsed,
                  };
                }
              } catch (e) {
                // Handle non-JSON streaming text
                console.warn('Failed to parse SSE data:', data);
                yield {
                  type: 'data',
                  data: data,
                };
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

// Export streaming client instance
export const streamingApiClient = new StreamingApiClient();

// Standalone function for badge generation (legacy)
export async function generateSuggestions(content: string): Promise<ApiResponse<BadgeGenerationResult>> {
  return apiClient.generateSuggestions(content);
}
