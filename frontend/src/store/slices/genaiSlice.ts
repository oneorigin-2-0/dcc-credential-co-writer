import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { BadgeSuggestion } from '@/lib/types';
import type { BadgeConfigurationData } from '@/components/genai/badge-configuration';
import type { BadgeImageConfigurationData } from '@/components/genai/badge-image-configuration';

// SuggestionCard interface matching the hook
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

interface BadgeResultsData {
  data: BadgeSuggestion[];
}

interface GenAIState {
  // Content & Configuration
  originalContent: string | null;
  badgeConfig: BadgeConfigurationData | null;
  imageConfig: BadgeImageConfigurationData | null;
  isLaiserEnabled: boolean;
  userPrompt: string;
  
  // Generation State
  isGenerating: boolean;
  generationStarted: boolean;
  
  // Suggestions & Results
  suggestionCards: SuggestionCard[];
  generatedSuggestions: Array<{ id: number; data: BadgeSuggestion }>;
  finalResponses: Record<string, any>; // cardId -> raw API response
  selectedBadgeSuggestion: BadgeSuggestion | null;
  selectedCardId: string | null; // Track which card is selected
  generatedBadgeData: BadgeResultsData | null;
  
  // Streaming State (for debugging)
  streamingResponses: Record<string, any>;
}

const initialState: GenAIState = {
  originalContent: null,
  badgeConfig: null,
  imageConfig: null,
  isLaiserEnabled: false,
  userPrompt: '',
  isGenerating: false,
  generationStarted: false,
  suggestionCards: [
    { id: 1, data: null, loading: false, error: null, streamingStarted: false },
  ],
  generatedSuggestions: [],
  finalResponses: {},
  selectedBadgeSuggestion: null,
  selectedCardId: null,
  generatedBadgeData: null,
  streamingResponses: {},
};

const genaiSlice = createSlice({
  name: 'genai',
  initialState,
  reducers: {
    // Content & Configuration Actions
    setOriginalContent: (state, action: PayloadAction<string>) => {
      state.originalContent = action.payload;
    },
    clearOriginalContent: (state) => {
      state.originalContent = null;
    },
    setBadgeConfig: (state, action: PayloadAction<BadgeConfigurationData | null>) => {
      state.badgeConfig = action.payload;
    },
    setImageConfig: (state, action: PayloadAction<BadgeImageConfigurationData | null>) => {
      state.imageConfig = action.payload;
    },
    setIsLaiserEnabled: (state, action: PayloadAction<boolean>) => {
      state.isLaiserEnabled = action.payload;
    },
    setUserPrompt: (state, action: PayloadAction<string>) => {
      state.userPrompt = action.payload;
    },
    
    // Generation State Actions
    setIsGenerating: (state, action: PayloadAction<boolean>) => {
      state.isGenerating = action.payload;
    },
    setGenerationStarted: (state, action: PayloadAction<boolean>) => {
      state.generationStarted = action.payload;
    },
    
    // Suggestion Cards Actions
    setSuggestionCards: (state, action: PayloadAction<SuggestionCard[]>) => {
      state.suggestionCards = action.payload;
    },
    updateSuggestionCard: (state, action: PayloadAction<{ id: number; updates: Partial<SuggestionCard> }>) => {
      const index = state.suggestionCards.findIndex(card => card.id === action.payload.id);
      if (index !== -1) {
        state.suggestionCards[index] = { ...state.suggestionCards[index], ...action.payload.updates };
      }
    },
    resetSuggestionCards: (state) => {
      state.suggestionCards = [
        { id: 1, data: null, loading: false, error: null, streamingStarted: false },
      ];
    },
    
    // Generated Suggestions Actions
    addGeneratedSuggestion: (state, action: PayloadAction<{ id: number; data: BadgeSuggestion }>) => {
      const existing = state.generatedSuggestions.filter(s => s.id !== action.payload.id);
      state.generatedSuggestions = [...existing, action.payload];
    },
    setGeneratedSuggestions: (state, action: PayloadAction<Array<{ id: number; data: BadgeSuggestion }>>) => {
      state.generatedSuggestions = action.payload;
    },
    clearGeneratedSuggestions: (state) => {
      state.generatedSuggestions = [];
    },
    
    // Final Responses Actions
    setFinalResponse: (state, action: PayloadAction<{ cardId: string; data: any }>) => {
      state.finalResponses[action.payload.cardId] = action.payload.data;
    },
    setFinalResponses: (state, action: PayloadAction<Record<string, any>>) => {
      state.finalResponses = action.payload;
    },
    clearFinalResponses: (state) => {
      state.finalResponses = {};
    },
    
    // Selected Badge Suggestion Actions
    setSelectedBadgeSuggestion: (state, action: PayloadAction<{ suggestion: BadgeSuggestion; cardId?: string }>) => {
      state.selectedBadgeSuggestion = action.payload.suggestion;
      if (action.payload.cardId) {
        state.selectedCardId = action.payload.cardId;
      }
    },
    clearSelectedBadgeSuggestion: (state) => {
      state.selectedBadgeSuggestion = null;
      state.selectedCardId = null;
    },
    
    // Generated Badge Data Actions
    setGeneratedBadgeData: (state, action: PayloadAction<BadgeResultsData | null>) => {
      state.generatedBadgeData = action.payload;
    },
    
    // Streaming Responses Actions
    setStreamingResponse: (state, action: PayloadAction<{ cardId: string; data: any }>) => {
      state.streamingResponses[action.payload.cardId] = action.payload.data;
    },
    clearStreamingResponses: (state) => {
      state.streamingResponses = {};
    },
    
    // Clear All Generation Data
    clearGenerationData: (state) => {
      state.generatedSuggestions = [];
      state.finalResponses = {};
      state.selectedBadgeSuggestion = null;
      state.selectedCardId = null;
      state.isGenerating = false;
      state.streamingResponses = {};
    },
    
    // Clear All Data (for fresh start)
    clearAllData: (state) => {
      return initialState;
    },
  },
});

export const {
  setOriginalContent,
  clearOriginalContent,
  setBadgeConfig,
  setImageConfig,
  setIsLaiserEnabled,
  setUserPrompt,
  setIsGenerating,
  setGenerationStarted,
  setSuggestionCards,
  updateSuggestionCard,
  resetSuggestionCards,
  addGeneratedSuggestion,
  setGeneratedSuggestions,
  clearGeneratedSuggestions,
  setFinalResponse,
  setFinalResponses,
  clearFinalResponses,
  setSelectedBadgeSuggestion,
  clearSelectedBadgeSuggestion,
  setGeneratedBadgeData,
  setStreamingResponse,
  clearStreamingResponses,
  clearGenerationData,
  clearAllData,
} = genaiSlice.actions;

export default genaiSlice.reducer;
