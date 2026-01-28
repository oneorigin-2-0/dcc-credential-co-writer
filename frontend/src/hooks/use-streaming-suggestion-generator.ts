'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { streamingApiClient, StreamingApiClient, type StreamingResponse } from '@/lib/api';
import type { BadgeSuggestion } from '@/lib/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setIsGenerating,
  setSuggestionCards,
  updateSuggestionCard,
  resetSuggestionCards,
  setFinalResponse,
  addGeneratedSuggestion,
  setStreamingResponse,
  clearGeneratedSuggestions,
} from '@/store/slices/genaiSlice';

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
  const dispatch = useAppDispatch();
  
  // Get state from Redux
  const suggestionCards = useAppSelector((state) => state.genai.suggestionCards);
  const isGenerating = useAppSelector((state) => state.genai.isGenerating);
  const generatedSuggestions = useAppSelector((state) => state.genai.generatedSuggestions);
  const finalResponses = useAppSelector((state) => state.genai.finalResponses);
  const imageConfig = useAppSelector((state) => state.genai.imageConfig);
  const isLaiserEnabled = useAppSelector((state) => state.genai.isLaiserEnabled);
  const badgeConfig = useAppSelector((state) => state.genai.badgeConfig);
  const userPrompt = useAppSelector((state) => state.genai.userPrompt);
  
  // Local state for completion tracking
  const allCompletedRef = useRef(false);
  const justCompletedRef = useRef(false);
  
  // Restore generation state from Redux on page load (handled by Redux Persist)
  useEffect(() => {
    // Redux Persist automatically restores state, but we need to restore suggestion cards
    // from generatedSuggestions or finalResponses if they exist
    if (generatedSuggestions.length > 0) {
      const restoredCards = suggestionCards.map(card => {
        const storedSuggestion = generatedSuggestions.find((s) => s.id === card.id);
        if (storedSuggestion) {
          const suggestionData = {
            ...storedSuggestion.data,
            enable_image_generation: storedSuggestion.data?.enable_image_generation ?? imageConfig?.enable_image_generation ?? false
          };
          return { ...card, data: suggestionData, loading: false, streamingStarted: true };
        }
        return card;
      });
      dispatch(setSuggestionCards(restoredCards));
      dispatch(setIsGenerating(false));
      return;
    }
    
    // Fallback: try to restore from finalResponses if no generatedSuggestions
    const cardIds = Object.keys(finalResponses);
    if (cardIds.length > 0) {
      const extractSkills = (data: any): any[] | undefined => {
        const skillsArray = data?.skills || 
                           data?.credentialSubject?.skills || 
                           data?.credentialSubject?.achievement?.skills;
        if (skillsArray && Array.isArray(skillsArray)) {
          const skills = skillsArray.filter((skill: any) => skill && typeof skill === 'object');
          return skills.length > 0 ? skills : undefined;
        }
        return undefined;
      };
      
      const restoredCards = suggestionCards.map(card => {
        const cardId = card.id.toString();
        const rawFinalData = finalResponses[cardId];
        
        if (rawFinalData) {
          const metrics = rawFinalData.metrics;
          const skills = extractSkills(rawFinalData);
          
          let mappedSuggestion;
          if (rawFinalData.credentialSubject && rawFinalData.credentialSubject.achievement) {
            const achievement = rawFinalData.credentialSubject.achievement;
            mappedSuggestion = {
              title: achievement.name,
              description: achievement.description,
              criteria: achievement.criteria?.narrative || achievement.description,
              image: achievement.image?.id || undefined,
              enable_image_generation: imageConfig?.enable_image_generation || false,
              metrics: metrics,
              skills: skills,
            };
          } else {
            mappedSuggestion = {
              title: rawFinalData.badge_name,
              description: rawFinalData.badge_description,
              criteria: rawFinalData.criteria?.narrative || rawFinalData.badge_description,
              image: undefined,
              enable_image_generation: imageConfig?.enable_image_generation || false,
              metrics: metrics,
              skills: skills,
            };
          }
          
          if (imageConfig?.enable_image_generation === false && imageConfig?.logo_base64) {
            mappedSuggestion.uploaded_badge_image = imageConfig.logo_base64;
            mappedSuggestion.uploaded_badge_image_name = imageConfig.logo_file_name;
          }
          
          return { 
            ...card, 
            data: mappedSuggestion, 
            loading: false, 
            streamingStarted: true 
          };
        }
        return card;
      });
      
      dispatch(setSuggestionCards(restoredCards));
      dispatch(setIsGenerating(false));
    }
  }, []); // Only run once on mount

  // Check if all suggestions are complete
  useEffect(() => {
    const allHaveData = suggestionCards.every(card => card.data !== null);
    const hasErrors = suggestionCards.some(card => card.error !== null);
    
    if (allHaveData && !hasErrors && !isGenerating && justCompletedRef.current) {
      allCompletedRef.current = true;
    } else if (isGenerating) {
      allCompletedRef.current = false;
      justCompletedRef.current = false;
    }
  }, [suggestionCards, isGenerating]);

  const generateSingleSuggestionStream = useCallback(async (
    cardId: number,
    content: string,
    enableSkillExtraction: boolean = false,
    badgeConfig?: any,
    imageConfig?: any,
    userPrompt?: string
  ) => {
    try {
      // Set loading state
      dispatch(updateSuggestionCard({
        id: cardId,
        updates: { loading: true, error: null, progress: 0, streamingText: 'Connecting to AI service...' }
      }));

      // Construct the API payload
      const payload: any = {
        course_input: content,
        badge_configuration: {
          badge_style: badgeConfig?.badge_style || 'professional',
          badge_tone: badgeConfig?.badge_tone || 'authoritative',
          criterion_style: badgeConfig?.criterion_style || 'task-oriented',
          badge_level: badgeConfig?.badge_level || 'not-specified',
          institution: badgeConfig?.institution || '',
          institute_url: badgeConfig?.institute_url || '',
          custom_instructions: userPrompt || badgeConfig?.user_prompt || ''
        },
        enable_skill_extraction: enableSkillExtraction,
        context_length: null
      };

      // Add image_generation configuration
      if (imageConfig && imageConfig.enable_image_generation === true) {
        payload.image_generation = {
          enable_image_generation: true,
          image_configuration: {
            image_type: '',
            border_color: '',
            border_width: 0,
            primary_color: imageConfig.fill_mode === 'gradient' ? (imageConfig.start_color || '') : (imageConfig.fill_color || ''),
            secondary_color: imageConfig.fill_mode === 'gradient' ? (imageConfig.end_color || '') : '',
            shape: imageConfig.shape || '',
            logo: imageConfig.logo_base64 || ''
          }
        };
      } else {
        payload.image_generation = {
          enable_image_generation: false
        };
      }

      const stream = new StreamingApiClient().generateSuggestionsStream(payload);
      
      for await (const response of stream) {
        switch (response.type) {
          case 'start':
            dispatch(updateSuggestionCard({
              id: cardId,
              updates: { streamingText: 'AI stream started, waiting for response...' }
            }));
            break;
            
          case 'final':
            if (response.data && response.mappedSuggestion) {
              // Store raw final response data in Redux
              dispatch(setFinalResponse({ cardId: cardId.toString(), data: response.data }));
              
              // Add enable_image_generation flag to the mapped suggestion
              const suggestionWithFlag = {
                ...response.mappedSuggestion,
                enable_image_generation: imageConfig?.enable_image_generation || false
              };

              // If user uploaded their own badge image
              if (imageConfig?.enable_image_generation === false && imageConfig?.logo_base64) {
                suggestionWithFlag.uploaded_badge_image = imageConfig.logo_base64;
                suggestionWithFlag.uploaded_badge_image_name = imageConfig.logo_file_name;
              }

              dispatch(updateSuggestionCard({
                id: cardId,
                updates: {
                  data: suggestionWithFlag,
                  loading: false,
                  error: null,
                  streamingText: 'Complete!',
                  rawStreamingContent: undefined,
                  isStreamingComplete: true
                }
              }));

              // Save to generatedSuggestions in Redux
              dispatch(addGeneratedSuggestion({ id: cardId, data: suggestionWithFlag }));

              toast({
                title: `${response.mappedSuggestion?.title || 'Credential'} Generated!`,
                description: 'Your new credential suggestion is ready for review.',
              });
            }
            break;
            
          case 'data':
            if (response.data && response.data.rawContent) {
              const isComplete = response.data.isComplete;
              
              dispatch(updateSuggestionCard({
                id: cardId,
                updates: {
                  rawStreamingContent: response.data.rawContent,
                  isStreamingComplete: isComplete,
                  streamingText: isComplete ? 'Parsing Response...' : 'Generating Response...',
                  streamingStarted: true
                }
              }));
              
              // If streaming is complete, parse the JSON
              if (isComplete) {
                try {
                  let jsonContent = response.data.rawContent;
                  if (jsonContent.includes('```json')) {
                    jsonContent = jsonContent.split('```json')[1] || jsonContent;
                  }
                  if (jsonContent.includes('```')) {
                    jsonContent = jsonContent.split('```')[0] || jsonContent;
                  }
                  jsonContent = jsonContent.trim();
                  
                  const badgeData = JSON.parse(jsonContent);
                  
                  // Store streaming response in Redux
                  dispatch(setStreamingResponse({ cardId: cardId.toString(), data: badgeData }));

                  // Store the raw badge data as final response
                  dispatch(setFinalResponse({ cardId: cardId.toString(), data: badgeData }));
                  
                  // Extract metrics and skills
                  const metrics = badgeData.metrics;
                  
                  const extractSkills = (data: any): any[] | undefined => {
                    const skillsArray = data?.skills || 
                                       data?.credentialSubject?.skills || 
                                       data?.credentialSubject?.achievement?.skills;
                    if (skillsArray && Array.isArray(skillsArray)) {
                      const skills = skillsArray.filter((skill: any) => skill && typeof skill === 'object');
                      return skills.length > 0 ? skills : undefined;
                    }
                    return undefined;
                  };
                  
                  const skills = extractSkills(badgeData);
                  
                  // Map to our format
                  let suggestion: BadgeSuggestion | null = null;
                  if (badgeData.credentialSubject && badgeData.credentialSubject.achievement) {
                    const achievement = badgeData.credentialSubject.achievement;
                    suggestion = {
                      title: achievement.name,
                      description: achievement.description,
                      criteria: achievement.criteria?.narrative || achievement.description,
                      image: achievement.image?.id || undefined,
                      metrics: metrics,
                      skills: skills,
                    };
                  }
                  
                  dispatch(updateSuggestionCard({
                    id: cardId,
                    updates: {
                      data: suggestion,
                      loading: false,
                      error: null,
                      streamingText: 'Generated Successfully!',
                      rawStreamingContent: undefined,
                      isStreamingComplete: true
                    }
                  }));
                  
                  // Save to generatedSuggestions in Redux
                  if (suggestion) {
                    dispatch(addGeneratedSuggestion({ id: cardId, data: suggestion }));
                  }

                  toast({
                    title: `${suggestion?.title || 'Credential'} Generated!`,
                    description: 'Your new credential suggestion is ready for review.'
                  });
                } catch (parseError) {
                  console.error('Failed to parse final JSON:', parseError);
                  dispatch(updateSuggestionCard({
                    id: cardId,
                    updates: {
                      loading: false,
                      error: 'Failed to parse generated JSON',
                      streamingText: 'Parse Error'
                    }
                  }));
                }
              }
            }
            break;
            
          case 'error':
            console.error(`Streaming error for card ${cardId}:`, response.error);
            dispatch(updateSuggestionCard({
              id: cardId,
              updates: {
                loading: false,
                error: response.error || 'Unknown streaming error',
                streamingText: 'Error occurred'
              }
            }));
            
            toast({
              variant: 'destructive',
              title: 'Generation Failed',
              description: `Unable to generate credential: ${response.error}`,
            });
            break;
            
          case 'complete':
            dispatch(updateSuggestionCard({
              id: cardId,
              updates: { loading: false, streamingText: 'Generation complete!' }
            }));
            break;
        }
      }
    } catch (error) {
      console.error(`Error in streaming generation for card ${cardId}:`, error);
      
      dispatch(updateSuggestionCard({
        id: cardId,
        updates: {
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          streamingText: 'Error occurred'
        }
      }));

      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: `Failed to generate credential suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [dispatch, toast]);

  const generateAllSuggestionsStream = useCallback(async (originalContent: string) => {
    if (!originalContent) {
      toast({
        variant: 'destructive',
        title: 'No Content Found',
        description: 'Original content not found. Please go back and generate new suggestions.',
      });
      return;
    }

    dispatch(setIsGenerating(true));
    allCompletedRef.current = false;
    justCompletedRef.current = false;
    
    // Clear previous suggestions when starting new generation
    dispatch(clearGeneratedSuggestions());
    
    // Reset all cards to initial state
    dispatch(resetSuggestionCards());

    // Generate single suggestion (using values from Redux selectors)
    const promise1 = generateSingleSuggestionStream(
      1, 
      originalContent, 
      isLaiserEnabled, 
      badgeConfig, 
      imageConfig, 
      userPrompt
    );

    // Wait for stream to complete
    await Promise.allSettled([promise1]);

    // Mark as just completed (for fresh generation alert)
    justCompletedRef.current = true;
    dispatch(setIsGenerating(false));
  }, [dispatch, generateSingleSuggestionStream, toast, isLaiserEnabled, badgeConfig, imageConfig, userPrompt]);

  // Calculate allCompleted from state
  const allCompleted = suggestionCards.every(card => card.data !== null) && 
                       !suggestionCards.some(card => card.error !== null) && 
                       !isGenerating && 
                       allCompletedRef.current;

  return {
    suggestionCards,
    allCompleted,
    isGenerating,
    generateAllSuggestionsStream,
  };
}
