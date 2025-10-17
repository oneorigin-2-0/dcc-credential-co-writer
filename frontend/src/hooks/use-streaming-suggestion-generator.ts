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
      const finalResponses = localStorage.getItem('finalResponses');
      
      console.log('Hook - Restoring state from localStorage:');
      console.log('storedIsGenerating:', storedIsGenerating);
      console.log('storedSuggestions:', storedSuggestions);
      console.log('finalResponses:', finalResponses);
      
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
          
          // If we have stored suggestions, mark generation as complete
          setIsGenerating(false);
          setAllCompleted(true);
          console.log('Hook - Restored from generatedSuggestions:', suggestions);
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
                  };
                } else {
                  // Legacy API format: { badge_name, badge_description, criteria: { narrative } }
                  mappedSuggestion = {
                    title: rawFinalData.badge_name,
                    description: rawFinalData.badge_description,
                    criteria: rawFinalData.criteria?.narrative || rawFinalData.badge_description,
                    image: undefined,
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
          
          // If we have final responses, mark generation as complete
          setIsGenerating(false);
          setAllCompleted(true);
          console.log('Hook - Restored from finalResponses:', cardIds);
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
                  ? { ...card, streamingText: 'AI stream started, waiting for response...' }
                  : card
              )
            );
            break;
            
          case 'final':
            // Handle final response (type: "final")
            console.log(`Card ${cardId} received final response:`, response.data);
            console.log(`Card ${cardId} received mapped suggestion:`, response.mappedSuggestion);
            
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
                console.log(`Stored raw final response for card ${cardId} in finalResponses:`, response.data);
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
              
              console.log(`Card ${cardId} marked as complete with mapped suggestion:`, response.mappedSuggestion);

              // Save to generatedSuggestions in localStorage
              try {
                const existing = JSON.parse(localStorage.getItem('generatedSuggestions') || '[]');
                const updated = existing.filter((s: any) => s.id !== cardId);
                updated.push({ id: cardId, data: response.mappedSuggestion });
                localStorage.setItem('generatedSuggestions', JSON.stringify(updated));
                console.log(`Saved suggestion ${cardId} to generatedSuggestions with image:`, response.mappedSuggestion.image ? 'YES' : 'NO');
              } catch (error) {
                console.error('Failed to save suggestion to localStorage:', error);
              }

              toast({
                title: `Suggestion ${cardId} Generated!`,
                description: 'A new credential suggestion is ready.',
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
                console.log(`Card ${cardId} streaming complete, parsing JSON...`);
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
                    console.log(`Stored complete streaming response for card ${cardId}:`, badgeData);
                  } catch (error) {
                    console.error('Failed to store streaming response in localStorage:', error);
                  }

                  // Store the raw badge data as final response
                  try {
                    const existingFinalResponses = JSON.parse(localStorage.getItem('finalResponses') || '{}');
                    existingFinalResponses[cardId] = badgeData; // Store raw badge data instead of mapped suggestion
                    localStorage.setItem('finalResponses', JSON.stringify(existingFinalResponses));
                    console.log(`Stored raw badge data for card ${cardId} in finalResponses:`, badgeData);
                  } catch (error) {
                    console.error('Failed to store final response in localStorage:', error);
                  }
                  
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
                  
                  console.log(`Card ${cardId} marked as complete from token parsing with suggestion:`, suggestion);
                  
                  // Save to generatedSuggestions in localStorage
                  try {
                    const existingSuggestions = JSON.parse(localStorage.getItem('generatedSuggestions') || '[]');
                    const updatedSuggestions = existingSuggestions.filter((s: any) => s.id !== cardId);
                    updatedSuggestions.push({ id: cardId, data: suggestion });
                    localStorage.setItem('generatedSuggestions', JSON.stringify(updatedSuggestions));
                    console.log(`Saved suggestion ${cardId} to generatedSuggestions (from token parsing) with image:`, suggestion.image ? 'YES' : 'NO');
                  } catch (error) {
                    console.error('Error storing suggestion in localStorage:', error);
                  }

                  toast({
                    title: `Suggestion ${cardId} Generated!`,
                    description: 'A new credential suggestion is ready.'
                  });

                  // Check if all cards are completed
                  setTimeout(() => checkAllCompleted(), 100);
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
      // Clear previous suggestions when starting new generation
      localStorage.removeItem('generatedSuggestions');
      localStorage.removeItem('suggestionsGeneratedAt');
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
    // await Promise.allSettled([promise1]);

    // Note: Suggestions are saved to localStorage individually as they complete
    // (see 'final' and 'data' case handlers above). No bulk save needed here.
    try {
      localStorage.setItem('suggestionsGeneratedAt', new Date().toISOString());
    } catch (error) {
      console.error('Error storing timestamp in localStorage:', error);
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
