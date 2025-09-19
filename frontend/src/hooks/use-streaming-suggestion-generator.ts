'use client';

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { streamingApiClient, StreamingApiClient, type StreamingResponse } from '@/lib/api';
import type { BadgeSuggestion } from '@/lib/api';

interface SuggestionCard {
  id: number;
  data: BadgeSuggestion | null;
  loading: boolean;
  error: string | null;
  progress?: number;
  streamingText?: string;
  streamingContent?: {
    title?: string;
    description?: string;
    criteria?: string;
  };
  rawStreamingContent?: string;
  isStreamingComplete?: boolean;
  streamingStarted?: boolean;
}

export function useStreamingSuggestionGenerator() {
  const { toast } = useToast();
  const [suggestionCards, setSuggestionCards] = useState<SuggestionCard[]>([
    { id: 1, data: null, loading: false, error: null, streamingStarted: false },
    { id: 2, data: null, loading: false, error: null, streamingStarted: false },
    { id: 3, data: null, loading: false, error: null, streamingStarted: false },
    { id: 4, data: null, loading: false, error: null, streamingStarted: false },
  ]);
  const [allCompleted, setAllCompleted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Restore generation state from localStorage on page load
  useEffect(() => {
    try {
      const storedIsGenerating = localStorage.getItem('isGenerating');
      const storedSuggestions = localStorage.getItem('generatedSuggestions');
      
      if (storedIsGenerating === 'true') {
        setIsGenerating(true);
      }
      
      if (storedSuggestions) {
        const suggestions = JSON.parse(storedSuggestions);
        if (suggestions.length > 0) {
          setSuggestionCards(prev => 
            prev.map(card => {
              const storedSuggestion = suggestions.find((s: any) => s.id === card.id);
              return storedSuggestion 
                ? { ...card, data: storedSuggestion.data, loading: false }
                : card;
            })
          );
        }
      }
    } catch (error) {
      console.error('Error restoring state from localStorage:', error);
    }
  }, []);

  // Function to check if all cards are completed and update allCompleted state
  const checkAllCompleted = useCallback(() => {
    const allCardsCompleted = suggestionCards.every(card => card.data || card.error);
    const hasAnyErrors = suggestionCards.some(card => card.error);
    
    // Only set allCompleted to true if all cards are done AND none have errors
    if (allCardsCompleted && !hasAnyErrors) {
      setAllCompleted(true);
    } else {
      setAllCompleted(false);
    }
  }, [suggestionCards]);

  const generateSingleSuggestionStream = useCallback(async (cardId: number, content: string) => {
    try {
      console.log(`🚀 Starting API call for card ${cardId} at ${new Date().toISOString()}`);
      
      // Set loading state (but don't mark as streaming started yet)
      setSuggestionCards(prev => 
        prev.map(card => 
          card.id === cardId 
            ? { ...card, loading: true, error: null, progress: 0, streamingText: 'Connecting to AI service...' }
            : card
        )
      );

      const stream = new StreamingApiClient().generateSuggestionsStream(content);
      
      for await (const response of stream) {
        console.log(`Stream response for card ${cardId}:`, response);
        
        switch (response.type) {
          case 'start':
            setSuggestionCards(prev => 
              prev.map(card => 
                card.id === cardId 
                  ? { ...card, streamingText: 'AI stream started, generating response...', streamingStarted: true }
                  : card
              )
            );
            break;
            
          case 'data':
            if (response.progress !== undefined) {
              // Progress update with contextual messages
              let statusMessage = 'Generating...';
              if (response.progress < 20) {
                statusMessage = 'Analyzing content...';
              } else if (response.progress < 40) {
                statusMessage = 'Creating badge concept...';
              } else if (response.progress < 60) {
                statusMessage = 'Writing description...';
              } else if (response.progress < 80) {
                statusMessage = 'Defining criteria...';
              } else if (response.progress < 100) {
                statusMessage = 'Finalizing suggestion...';
              }
              
              setSuggestionCards(prev => 
                prev.map(card => 
                  card.id === cardId 
                    ? { 
                        ...card, 
                        progress: response.progress,
                        streamingText: `${statusMessage} ${response.progress}%`
                      }
                    : card
                )
              );
            } else if (response.data && (response.data.title || response.data.description || response.data.criteria)) {
              // Partial streaming content (parsed JSON)
              const isPartial = (response as any).isPartial !== false;
              setSuggestionCards(prev => 
                prev.map(card => 
                  card.id === cardId 
                    ? { 
                        ...card, 
                        streamingContent: {
                          title: response.data.title || card.streamingContent?.title,
                          description: response.data.description || card.streamingContent?.description,
                          criteria: response.data.criteria || card.streamingContent?.criteria,
                        },
                        streamingText: isPartial ? 'Streaming content...' : 'Generation complete!'
                      }
                    : card
                )
              );
              
              // If this is the final data, mark as complete
              if (!isPartial) {
                setSuggestionCards(prev => 
                  prev.map(card => 
                    card.id === cardId 
                      ? { 
                          ...card, 
                          data: response.data,
                          loading: false,
                          error: null,
                          progress: 100,
                          streamingText: 'Generated Successfully!'
                        }
                      : card
                  )
                );
                toast({ 
                  title: `Suggestion ${cardId} Generated!`, 
                  description: 'A new credential suggestion is ready.' 
                });
              }
            } else if (response.data && response.data.rawContent) {
              // Raw token streaming content - show like ChatGPT
              const isComplete = response.data.isComplete;
              
              setSuggestionCards(prev => 
                prev.map(card => 
                  card.id === cardId 
                    ? { 
                        ...card, 
                        rawStreamingContent: response.data.rawContent,
                        isStreamingComplete: isComplete,
                        streamingText: isComplete ? 'Parsing JSON...' : 'Generating JSON...'
                      }
                    : card
                )
              );
              
              // If streaming is complete, parse the JSON
              if (isComplete) {
                try {
                  // Extract JSON from accumulated content (remove markdown code blocks)
                  let jsonContent = response.data.rawContent;
                  if (jsonContent.includes('```json')) {
                    jsonContent = jsonContent.split('```json')[1] || jsonContent;
                  }
                  if (jsonContent.includes('```')) {
                    jsonContent = jsonContent.split('```')[0] || jsonContent;
                  }
                  jsonContent = jsonContent.trim();
                  
                  // Parse the accumulated JSON
                  const badgeData = JSON.parse(jsonContent);
                  
                  // Map to our format
                  const suggestion = {
                    title: badgeData.badge_name,
                    description: badgeData.badge_description,
                    criteria: badgeData.criteria?.narrative || badgeData.badge_description,
                    image: undefined,
                  };
                  
                  setSuggestionCards(prev => 
                    prev.map(card => 
                      card.id === cardId 
                        ? { 
                            ...card, 
                            data: suggestion,
                            loading: false,
                            error: null,
                            streamingText: 'Generated Successfully!'
                          }
                        : card
                    )
                  );
                  
                  toast({ 
                    title: `Suggestion ${cardId} Generated!`, 
                    description: 'A new credential suggestion is ready.' 
                  });
                  
                  // Check if all cards are completed
                  setTimeout(() => checkAllCompleted(), 100);
                  
                  // Store the generated suggestion in localStorage
                  try {
                    const existingSuggestions = JSON.parse(localStorage.getItem('generatedSuggestions') || '[]');
                    const updatedSuggestions = existingSuggestions.filter((s: any) => s.id !== cardId);
                    updatedSuggestions.push({ id: cardId, data: suggestion });
                    localStorage.setItem('generatedSuggestions', JSON.stringify(updatedSuggestions));
                  } catch (error) {
                    console.error('Error storing suggestion in localStorage:', error);
                  }
                } catch (parseError) {
                  console.error('Failed to parse final JSON:', parseError);
                  setSuggestionCards(prev => 
                    prev.map(card => 
                      card.id === cardId 
                        ? { 
                            ...card, 
                            loading: false,
                            error: 'Failed to parse generated JSON',
                            streamingText: 'Parse Error'
                          }
                        : card
                    )
                  );
                }
              }
            } else if (response.data && typeof response.data === 'string') {
              // Handle non-JSON streaming text
              setSuggestionCards(prev => 
                prev.map(card => 
                  card.id === cardId 
                    ? { ...card, streamingText: response.data }
                    : card
                )
              );
            } else if (response.data && response.data.title) {
              // Final suggestion data
              setSuggestionCards(prev => 
                prev.map(card => 
                  card.id === cardId 
                    ? { 
                        ...card, 
                        data: response.data, 
                        loading: false, 
                        error: null,
                        streamingText: 'Complete!'
                      }
                    : card
                )
              );
              
              toast({
                title: `Suggestion ${cardId} Generated!`,
                description: 'A new credential suggestion is ready.',
              });
            } else if (response.data && typeof response.data === 'string') {
              // Streaming text update
              setSuggestionCards(prev => 
                prev.map(card => 
                  card.id === cardId 
                    ? { ...card, streamingText: response.data }
                    : card
                )
              );
            }
            break;
            
          case 'error':
            console.error(`Streaming error for card ${cardId}:`, response.error);
            setSuggestionCards(prev => 
              prev.map(card => 
                card.id === cardId 
                  ? { 
                      ...card, 
                      loading: false, 
                      error: response.error || 'Unknown streaming error',
                      streamingText: 'Error occurred'
                    }
                  : card
              )
            );
            
            toast({
              variant: 'destructive',
              title: `Suggestion ${cardId} Failed`,
              description: `Streaming error: ${response.error}`,
            });
            break;
            
          case 'error':
            console.error(`Streaming error for card ${cardId}:`, response.error);
            setSuggestionCards(prev => 
              prev.map(card => 
                card.id === cardId 
                  ? { 
                      ...card, 
                      loading: false, 
                      error: response.error || 'Streaming error occurred',
                      streamingText: 'Generation failed'
                    }
                  : card
              )
            );
            
            toast({
              variant: 'destructive',
              title: `Suggestion ${cardId} Failed`,
              description: response.error || 'An error occurred during generation.',
            });
            
            // Check if all cards are completed
            setTimeout(() => checkAllCompleted(), 100);
            break;
            
          case 'complete':
            console.log(`Streaming completed for card ${cardId}`);
            setSuggestionCards(prev => 
              prev.map(card => 
                card.id === cardId 
                  ? { ...card, loading: false, streamingText: 'Generation complete!' }
                  : card
              )
            );
            break;
        }
      }
    } catch (error) {
      console.error(`Error in streaming generation for card ${cardId}:`, error);
      
      setSuggestionCards(prev => 
        prev.map(card => 
          card.id === cardId 
            ? { 
                ...card, 
                loading: false, 
                error: error instanceof Error ? error.message : 'Unknown error',
                streamingText: 'Error occurred'
              }
            : card
        )
      );

      toast({
        variant: 'destructive',
        title: `Suggestion ${cardId} Failed`,
        description: `Failed to generate this credential suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      
      // Check if all cards are completed
      setTimeout(() => checkAllCompleted(), 100);
    }
  }, [toast, checkAllCompleted]);

  const generateAllSuggestionsStream = useCallback(async (originalContent: string) => {
    if (!originalContent) {
      toast({
        variant: 'destructive',
        title: 'No Content Found',
        description: 'Original content not found. Please go back and generate new suggestions.',
      });
      return;
    }

    setIsGenerating(true);
    setAllCompleted(false);
    
    // Store generation state in localStorage
    try {
      localStorage.setItem('isGenerating', 'true');
      localStorage.setItem('generationStartedAt', new Date().toISOString());
    } catch (error) {
      console.error('Error storing generation state:', error);
    }
    
    // Reset all cards to initial state
    setSuggestionCards([
      { id: 1, data: null, loading: false, error: null, streamingStarted: false },
      { id: 2, data: null, loading: false, error: null, streamingStarted: false },
      { id: 3, data: null, loading: false, error: null, streamingStarted: false },
      { id: 4, data: null, loading: false, error: null, streamingStarted: false },
    ]);

    // Generate all 4 suggestions in TRUE PARALLEL (no delays)
    console.log(`🔥 Creating ${[1, 2, 3, 4].length} parallel promises at ${new Date().toISOString()}`);
    
    // Create all promises immediately - they start executing right away
    const promise1 = generateSingleSuggestionStream(1, originalContent);
    const promise2 = generateSingleSuggestionStream(2, originalContent);
    const promise3 = generateSingleSuggestionStream(3, originalContent);
    const promise4 = generateSingleSuggestionStream(4, originalContent);
    
    console.log(`✅ All 4 promises started simultaneously`);
    
    // Wait for all streams to complete
    await Promise.allSettled([promise1, promise2, promise3, promise4]);
    
    // Store all completed suggestions in localStorage
    try {
      const completedSuggestions = suggestionCards
        .filter(card => card.data)
        .map(card => ({ id: card.id, data: card.data }));
      
      if (completedSuggestions.length > 0) {
        localStorage.setItem('generatedSuggestions', JSON.stringify(completedSuggestions));
        localStorage.setItem('suggestionsGeneratedAt', new Date().toISOString());
      }
    } catch (error) {
      console.error('Error storing suggestions in localStorage:', error);
    }
    
    setIsGenerating(false);
    
    // Clear generation state from localStorage
    try {
      localStorage.removeItem('isGenerating');
    } catch (error) {
      console.error('Error clearing generation state:', error);
    }
  }, [generateSingleSuggestionStream, toast]);

  return {
    suggestionCards,
    allCompleted,
    isGenerating,
    generateAllSuggestionsStream,
  };
}
