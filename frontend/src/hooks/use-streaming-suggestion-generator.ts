'use client';

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { streamingApiClient, StreamingApiClient, type StreamingResponse } from '@/lib/api';
import type { BadgeSuggestion } from '@/lib/types';

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
  const [justCompleted, setJustCompleted] = useState(false); // Track fresh completions only

  // Restore generation state from localStorage on page load
  useEffect(() => {
    try {
      const storedIsGenerating = localStorage.getItem('isGenerating');
      const storedSuggestions = localStorage.getItem('generatedSuggestions');
      const finalResponses = localStorage.getItem('finalResponses');
      
      
      if (storedIsGenerating === 'true') {
        setIsGenerating(true);
      }
      
      // First try to restore from generatedSuggestions
      if (storedSuggestions) {
        const suggestions = JSON.parse(storedSuggestions);
        if (suggestions.length > 0) {
          setSuggestionCards(prev => 
            prev.map(card => {
              const storedSuggestion = suggestions.find((s: any) => s.id === card.id);
              return storedSuggestion 
                ? { ...card, data: storedSuggestion.data, loading: false, streamingStarted: true }
                : card;
            })
          );
          
          // If we have stored suggestions, just restore them (don't show completion alert)
          setIsGenerating(false);
          return; // Exit early if we found suggestions
        }
      }
      
      // Fallback: try to restore from finalResponses if no generatedSuggestions
      if (finalResponses) {
        const responses = JSON.parse(finalResponses);
        const cardIds = Object.keys(responses);
        
        if (cardIds.length > 0) {
          setSuggestionCards(prev => 
            prev.map(card => {
              const cardId = card.id.toString();
              const rawFinalData = responses[cardId];
              
              if (rawFinalData) {
                // Extract metrics if present
                const metrics = rawFinalData.metrics;
                
                // Extract mapped suggestion from raw final data
                let mappedSuggestion;
                if (rawFinalData.credentialSubject && rawFinalData.credentialSubject.achievement) {
                  // New API format: { credentialSubject: { achievement: { name, description, criteria: { narrative }, image } } }
                  const achievement = rawFinalData.credentialSubject.achievement;
                  mappedSuggestion = {
                    title: achievement.name,
                    description: achievement.description,
                    criteria: achievement.criteria?.narrative || achievement.description,
                    image: achievement.image?.id || undefined,
                    metrics: metrics,
                  };
                } else {
                  // Legacy API format: { badge_name, badge_description, criteria: { narrative } }
                  mappedSuggestion = {
                    title: rawFinalData.badge_name,
                    description: rawFinalData.badge_description,
                    criteria: rawFinalData.criteria?.narrative || rawFinalData.badge_description,
                    image: undefined,
                    metrics: metrics,
                  };
                }
                
                return { 
                  ...card, 
                  data: mappedSuggestion, 
                  loading: false, 
                  streamingStarted: true 
                };
              }
              return card;
            })
          );
          
          // If we have final responses, just restore them (don't show completion alert)
          setIsGenerating(false);
        }
      }
    } catch (error) {
      console.error('Error restoring state from localStorage:', error);
    }
  }, []);

  // Check if all suggestions are complete whenever cards change
  // Only trigger completion alert for fresh generations (not page reloads)
  useEffect(() => {
    const allHaveData = suggestionCards.every(card => card.data !== null);
    const hasErrors = suggestionCards.some(card => card.error !== null);
    const wasGenerating = isGenerating;
    
    if (allHaveData && !hasErrors && !isGenerating && justCompleted) {
      setAllCompleted(true);
    } else if (isGenerating) {
      // Reset states when generation starts
      setAllCompleted(false);
      setJustCompleted(false);
    }
  }, [suggestionCards, isGenerating, justCompleted]);

  const generateSingleSuggestionStream = useCallback(async (cardId: number, content: string) => {
    try {
      
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
        
        switch (response.type) {
          case 'start':
            setSuggestionCards(prev => 
              prev.map(card => 
                card.id === cardId 
                  ? { ...card, streamingText: 'AI stream started, waiting for response...' }
                  : card
              )
            );
            break;
            
          case 'final':
            // Handle final response (type: "final")
            
            if (response.data && response.mappedSuggestion) {
              // Store raw final response data in localStorage
              try {
                // const existingResponses = JSON.parse(localStorage.getItem('streamingResponses') || '{}');
                // existingResponses[cardId] = response.data; // Store raw final data
                // localStorage.setItem('streamingResponses', JSON.stringify(existingResponses));
                // console.log(`Stored raw final response data for card ${cardId}:`, response.data);
                
                // Store raw final data in finalResponses with card ID
                const existingFinalResponses = JSON.parse(localStorage.getItem('finalResponses') || '{}');
                existingFinalResponses[cardId] = response.data; // Store raw final data
                localStorage.setItem('finalResponses', JSON.stringify(existingFinalResponses));
              } catch (error) {
                console.error('Failed to store final response in localStorage:', error);
              }
              
              setSuggestionCards(prev => 
                prev.map(card => 
                  card.id === cardId 
                    ? { 
                        ...card, 
                        data: response.mappedSuggestion, // Use mapped suggestion for UI display
                        loading: false, 
                        error: null,
                        streamingText: 'Complete!',
                        rawStreamingContent: undefined,
                        isStreamingComplete: true
                      }
                    : card
                )
              );
              

              // Save to generatedSuggestions in localStorage
              try {
                const existing = JSON.parse(localStorage.getItem('generatedSuggestions') || '[]');
                const updated = existing.filter((s: any) => s.id !== cardId);
                updated.push({ id: cardId, data: response.mappedSuggestion });
                localStorage.setItem('generatedSuggestions', JSON.stringify(updated));
              } catch (error) {
                console.error('Failed to save suggestion to localStorage:', error);
              }

              toast({
                title: `${response.mappedSuggestion?.title || 'Credential'} Generated!`,
                description: 'Your new credential suggestion is ready for review.',
              });
            }
            break;
            
          case 'data':
            // Handle both token streaming and final response
            if (response.data && response.data.rawContent) {
              // Raw token streaming content - show like ChatGPT
              const isComplete = response.data.isComplete;
              
              setSuggestionCards(prev => 
                prev.map(card => 
                  card.id === cardId 
                    ? { 
                        ...card, 
                        rawStreamingContent: response.data.rawContent,
                        isStreamingComplete: isComplete,
                        streamingText: isComplete ? 'Parsing Response...' : 'Generating Response...',
                        streamingStarted: true
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
                  
                  // Store complete response data in localStorage for debugging
                  try {
                    const existingResponses = JSON.parse(localStorage.getItem('streamingResponses') || '{}');
                    existingResponses[cardId] = badgeData;
                    localStorage.setItem('streamingResponses', JSON.stringify(existingResponses));
                  } catch (error) {
                    console.error('Failed to store streaming response in localStorage:', error);
                  }

                  // Store the raw badge data as final response
                  try {
                    const existingFinalResponses = JSON.parse(localStorage.getItem('finalResponses') || '{}');
                    existingFinalResponses[cardId] = badgeData; // Store raw badge data instead of mapped suggestion
                    localStorage.setItem('finalResponses', JSON.stringify(existingFinalResponses));
                  } catch (error) {
                    console.error('Failed to store final response in localStorage:', error);
                  }
                  
                  // Extract metrics if present
                  const metrics = badgeData.metrics;
                  
                  // Map to our format - handle new API structure
                  let suggestion: BadgeSuggestion | null = null;
                  if (badgeData.credentialSubject && badgeData.credentialSubject.achievement) {
                    // New API format: { credentialSubject: { achievement: { name, description, criteria: { narrative }, image } } }
                    const achievement = badgeData.credentialSubject.achievement;
                    suggestion = {
                      title: achievement.name,
                      description: achievement.description,
                      criteria: achievement.criteria?.narrative || achievement.description,
                      image: achievement.image?.id || undefined,
                      metrics: metrics,
                    };
                  }
                  
          
                  
                  setSuggestionCards(prev => 
                    prev.map(card => 
                      card.id === cardId 
                        ? { 
                            ...card, 
                            data: suggestion,
                            loading: false,
                            error: null,
                            streamingText: 'Generated Successfully!',
                            rawStreamingContent: undefined,
                            isStreamingComplete: true
                          }
                        : card
                    )
                  );
                  
                  
                  // Save to generatedSuggestions in localStorage
                  try {
                    const existingSuggestions = JSON.parse(localStorage.getItem('generatedSuggestions') || '[]');
                    const updatedSuggestions = existingSuggestions.filter((s: any) => s.id !== cardId);
                    updatedSuggestions.push({ id: cardId, data: suggestion });
                    localStorage.setItem('generatedSuggestions', JSON.stringify(updatedSuggestions));
                  } catch (error) {
                    console.error('Error storing suggestion in localStorage:', error);
                  }

                  toast({
                    title: `${suggestion?.title || 'Credential'} Generated!`,
                    description: 'Your new credential suggestion is ready for review.'
                  });
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
              title: 'Generation Failed',
              description: `Unable to generate credential: ${response.error}`,
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
              title: 'Generation Failed',
              description: response.error || 'An error occurred during generation.',
            });
            break;
            
          case 'complete':
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
        title: 'Generation Failed',
        description: `Failed to generate credential suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [toast]);

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
    setJustCompleted(false); // Reset flag for new generation
    
    // Store generation state in localStorage
    try {
      localStorage.setItem('isGenerating', 'true');
      // Clear previous suggestions when starting new generation
      localStorage.removeItem('generatedSuggestions');
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
    
    // Create all promises immediately - they start executing right away
    const promise1 = generateSingleSuggestionStream(1, originalContent);
    const promise2 = generateSingleSuggestionStream(2, originalContent);
    const promise3 = generateSingleSuggestionStream(3, originalContent);
    const promise4 = generateSingleSuggestionStream(4, originalContent);
    
    
    // Wait for all streams to complete
    await Promise.allSettled([promise1, promise2, promise3, promise4]);
    // await Promise.allSettled([promise1]);

    // Note: Suggestions are saved to localStorage individually as they complete
    // (see 'final' and 'data' case handlers above). No bulk save needed here.

    // Mark as just completed (for fresh generation alert)
    setJustCompleted(true);
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
