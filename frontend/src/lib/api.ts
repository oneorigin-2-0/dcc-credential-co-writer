/**
 * Centralized API configuration and utilities
 */

// Environment configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001/api/v1',
  ENDPOINTS: {
    GENERATE: '/generate-badge-suggestions/stream',
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
  type: 'start' | 'data' | 'error' | 'complete' | 'final';
  data?: any;
  mappedSuggestion?: any; // For final responses, includes the mapped suggestion
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

  async *generateSuggestionsStream(content: string, additionalParams?: Record<string, any>): AsyncGenerator<StreamingResponse, void, unknown> {
    const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.GENERATE}`;
    
    try {
      console.log(`Making API request to: ${url}`);
      console.log(`Request body:`, JSON.stringify({ course_input: content, ...additionalParams }));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ 
          course_input: content,
          ...additionalParams 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP Error Response:`, errorText);
        yield {
          type: 'error',
          error: `HTTP error! status: ${response.status}, message: ${errorText}`,
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
                  console.error(`API Error Response for card:`, parsed);
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
                } else if (parsed.type === 'final' && parsed.content) {
                  // Final response with complete badge data
                  const finalData = parsed.content;
                  let suggestion;
                  
                  if (finalData.credentialSubject && finalData.credentialSubject.achievement) {
                    // New API format: { credentialSubject: { achievement: { name, description, criteria: { narrative }, image } } }
                    const achievement = finalData.credentialSubject.achievement;
                    const rawImageBase64 = achievement.image?.image_base64 as string | undefined;
                    const imageSrc = rawImageBase64
                      ? (rawImageBase64.startsWith('data:') ? rawImageBase64 : `data:image/png;base64,${rawImageBase64}`)
                      : (achievement.image?.id && typeof achievement.image.id === 'string' && !achievement.image.id.includes('example.com')
                        ? achievement.image.id
                        : undefined);
                    suggestion = {
                      title: achievement.name,
                      description: achievement.description,
                      criteria: achievement.criteria?.narrative || achievement.description,
                      image: imageSrc,
                    };
                  } else {
                    // Fallback to legacy format
                    const rawImageBase64 = finalData?.image?.image_base64 as string | undefined;
                    const legacyImage = rawImageBase64
                      ? (rawImageBase64.startsWith('data:') ? rawImageBase64 : `data:image/png;base64,${rawImageBase64}`)
                      : (finalData.image?.id || finalData.image);
                    const sanitizedLegacyImage = legacyImage && typeof legacyImage === 'string' && legacyImage.includes('example.com')
                      ? undefined
                      : legacyImage;
                    suggestion = {
                      title: finalData.badge_name || finalData.title,
                      description: finalData.badge_description || finalData.description,
                      criteria: finalData.criteria?.narrative || finalData.criteria || finalData.description,
                      image: sanitizedLegacyImage,
                    };
                  }
                  
                  console.log(`API Client yielding raw final data:`, finalData);
                  yield {
                    type: 'final',
                    data: finalData, // Store the raw final data instead of mapped suggestion
                    mappedSuggestion: suggestion, // Include mapped suggestion for UI display
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
