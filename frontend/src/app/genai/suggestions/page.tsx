'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { useToast } from '@/hooks/use-toast';
import { SuggestionCard } from '@/components/genai/suggestion-card';
import { StreamingStatus } from '@/components/genai/streaming-status';
import { useStreamingSuggestionGenerator } from '@/hooks/use-streaming-suggestion-generator';

export default function CredentialSuggestionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [originalContent, setOriginalContent] = useState<string>('');
  const { suggestionCards, allCompleted, isGenerating, generateAllSuggestionsStream } = useStreamingSuggestionGenerator();

  useEffect(() => {
    // Get original content from localStorage
    try {
      const storedContent = localStorage.getItem('originalContent');
      if (storedContent) {
        setOriginalContent(storedContent);
      }
      
      // Debug: Check what's in localStorage
      console.log('Suggestions page - localStorage check:');
      console.log('generatedSuggestions:', localStorage.getItem('generatedSuggestions'));
      console.log('finalResponses:', localStorage.getItem('finalResponses'));
      console.log('isGenerating:', localStorage.getItem('isGenerating'));
      console.log('suggestionCards:', suggestionCards);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      toast({
        variant: 'destructive',
        title: 'Storage Error',
        description: 'Unable to access stored content. Please go back and try again.',
      });
    }
  }, [toast, suggestionCards]);

  // Auto-start generation if it was initiated from /genai page
  useEffect(() => {
    if (originalContent) {
      const generationStarted = localStorage.getItem('generationStarted');
      if (generationStarted === 'true') {
        // Start generating suggestions automatically
        generateAllSuggestionsStream(originalContent);
        // Clear the flag so it doesn't restart on refresh
        localStorage.removeItem('generationStarted');
      }
    }
  }, [originalContent, generateAllSuggestionsStream]);

  // Navigation guard - prevent leaving page while streaming
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isGenerating) {
        e.preventDefault();
        e.returnValue = 'You might lose the data halfway. Are you sure you want to leave?';
        return 'You might lose the data halfway. Are you sure you want to leave?';
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (isGenerating) {
        const confirmed = window.confirm('You might lose the data halfway. Are you sure you want to leave?');
        if (!confirmed) {
          e.preventDefault();
          // Push the current state back to prevent navigation
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isGenerating]);

  // Enhanced navigation handler with confirmation
  const handleNavigation = useCallback((path: string) => {
    if (isGenerating) {
      const confirmed = window.confirm('You might lose the data halfway. Are you sure you want to leave?');
      if (confirmed) {
        router.push(path);
      }
    } else {
      router.push(path);
    }
  }, [isGenerating, router]);

  const handleCardClick = (card: any) => {
    // Allow clicking on cards even if they failed or don't have data
    if (!card.data && !card.error) {
      toast({
        variant: 'destructive',
        title: 'Suggestion Not Ready',
        description: 'This suggestion is still being generated. Please wait for it to complete.',
      });
      return;
    }

    // If card has data, use it; if it failed, create a fallback for editing
    const suggestionData = card.data || {
      title: `Suggestion ${card.id}`,
      description: 'This suggestion failed to generate. You can edit and customize it manually.',
      criteria: 'Please define the criteria for this credential.',
      image: undefined
    };

    // Store the selected suggestion and navigate to editor
    localStorage.setItem('selectedBadgeSuggestion', JSON.stringify(suggestionData));
    
    // Navigate to badge suggestion editor
    handleNavigation('/genai/editor');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => handleNavigation('/genai')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Generator
        </Button>

        <div className="flex justify-center">
          <div className="w-full max-w-6xl">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Credential Suggestions
              </h1>
           
            </div>

            {/* Streaming Status */}
            <StreamingStatus
              isGenerating={isGenerating}
              completedCount={suggestionCards.filter(card => card.data).length}
              totalCount={suggestionCards.length}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {suggestionCards
                .filter(card => card.streamingStarted)
                .map((card) => (
                  <SuggestionCard
                    key={card.id}
                    id={card.id}
                    data={card.data}
                    loading={card.loading}
                    error={card.error}
                    progress={card.progress}
                    streamingText={card.streamingText}
                    streamingContent={card.streamingContent}
                    rawStreamingContent={card.rawStreamingContent}
                    isStreamingComplete={card.isStreamingComplete}
                    onClick={() => handleCardClick(card)}
                  />
                ))}
              
              {/* Show message when no cards are visible yet */}
              {suggestionCards.filter(card => card.streamingStarted).length === 0 && isGenerating && (
                <div className="col-span-full flex justify-center items-center py-12">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#429EA6]"></div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#234467] mb-2">Initializing AI Generation</h3>
                      <p className="text-[#626a73] text-sm">
                        Starting up the AI engines... Cards will appear as streaming begins.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {allCompleted && (
              <div className="mt-8 text-center">
                <Card className="max-w-md mx-auto border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center mb-3">
                      <CheckCircle className="h-8 w-8 text-green-500 mr-2" />
                      <h3 className="text-lg font-semibold text-green-800">
                        All Suggestions Generated!
                      </h3>
                    </div>
                    <p className="text-green-700 text-sm">
                      Click on any suggestion card to edit and customize your credential.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}