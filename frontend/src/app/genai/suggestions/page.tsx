'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, CheckCircle, Copy, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { SuggestionCard } from '@/components/genai/suggestion-card';
import { StreamingStatus } from '@/components/genai/streaming-status';
import { useStreamingSuggestionGenerator } from '@/hooks/use-streaming-suggestion-generator';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setOriginalContent, setGenerationStarted, setSelectedBadgeSuggestion } from '@/store/slices/genaiSlice';

export default function CredentialSuggestionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const originalContent = useAppSelector((state) => state.genai.originalContent);
  const generationStarted = useAppSelector((state) => state.genai.generationStarted);
  const [showCompletionAlert, setShowCompletionAlert] = useState(false);
  const [isAlertFadingOut, setIsAlertFadingOut] = useState(false);
  const { suggestionCards, allCompleted, isGenerating, generateAllSuggestionsStream } = useStreamingSuggestionGenerator();

  useEffect(() => {
    // Original content is now in Redux, no need to read from localStorage
    if (!originalContent) {
      toast({
        variant: 'destructive',
        title: 'Storage Error',
        description: 'Unable to access stored content. Please go back and try again.',
      });
    }
  }, [toast, originalContent]);

  // Auto-start generation if it was initiated from /genai page
  useEffect(() => {
    if (originalContent && generationStarted) {
      // Start generating suggestions automatically
      generateAllSuggestionsStream(originalContent);
      // Clear the flag so it doesn't restart on refresh
      dispatch(setGenerationStarted(false));
    }
  }, [originalContent, generationStarted, generateAllSuggestionsStream, dispatch]);

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

  // Auto-hide completion alert after 5 seconds with fade transition
  useEffect(() => {
    if (allCompleted) {
      setShowCompletionAlert(true);
      setIsAlertFadingOut(false);
      
      // Start fade-out after 4.5 seconds
      const fadeTimer = setTimeout(() => {
        setIsAlertFadingOut(true);
      }, 4500);
      
      // Remove from DOM after fade completes (5 seconds total)
      const removeTimer = setTimeout(() => {
        setShowCompletionAlert(false);
      }, 5000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [allCompleted]);

  // Detect mobile/tablet - disable card clicking on mobile
  const isMobile = useIsMobile();

  const handleCardClick = (card: any) => {
    // Disable navigation on mobile/tablet
    if (isMobile) {
      return;
    }

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

    // Store the selected suggestion with card ID in Redux and navigate to editor
    dispatch(setSelectedBadgeSuggestion({ 
      suggestion: suggestionData, 
      cardId: card.id.toString() 
    }));

    // Navigate to badge suggestion editor
    handleNavigation('/genai/editor');
  };

  const handleCopyOriginal = async () => {
    try {
      await navigator.clipboard.writeText(originalContent || '');
      toast({ title: 'Copied', description: 'Original content copied to clipboard.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Copy failed', description: 'Could not copy content.' });
    }
  };

  // Get prompt_eval_count from the first card that has metrics
  const promptEvalCount = suggestionCards.find(card => card.data?.metrics?.prompt_eval_count)?.data?.metrics?.prompt_eval_count;

  return (
    <main id="main-content" className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <div className="relative flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-center">
          <Button
            variant="outline"
            onClick={() => handleNavigation('/genai')}
            className="flex-shrink-0 md:absolute md:left-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back to Generator</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">
            Credential Suggestion
          </h1>
        </div>

        <div className="flex justify-center">
          <div className="w-full">

            {/* Two-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left: Original Content (sticky) - Hidden on mobile/tablet */}
              <div className="hidden lg:block md:col-span-4">
                <div className="sticky top-4">
                  <Card className="border-0 bg-gradient-to-br from-secondary/15 via-secondary/10 to-blue-50/50 shadow-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div>
                              <h2 className="text-sm font-bold text-primary">Original Content</h2>
                              <p className="text-xs text-secondary font-medium">Source Input</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {promptEvalCount !== undefined && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="cursor-pointer">
                                    <Info className="h-4 w-4 text-primary" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Input Tokens: {promptEvalCount}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCopyOriginal}
                            className="border-secondary bg-white text-secondary hover:bg-secondary hover:text-white transition-all duration-200"
                          >
                            <Copy className="h-4 w-4 mr-1" /> Copy
                          </Button>
                        </div>
                      </div>
                      {originalContent ? (
                        <div className="max-h-[85vh] overflow-auto rounded-lg p-4 bg-white shadow-lg">
                          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">{originalContent}</pre>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 p-4 rounded-lg bg-white/80">
                          No original content found. Go back and add content to generate suggestions.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right: Status + Suggestions */}
              <div className="md:col-span-8 lg:col-span-8">

                {/* Success Alert - Shows when all suggestions are complete (auto-hides after 5s) */}
                {showCompletionAlert && (
                  <div 
                    className={`mb-6 transition-all duration-500 ${
                      isAlertFadingOut 
                        ? 'opacity-0 translate-y-[-10px]' 
                        : 'opacity-100 translate-y-0'
                    }`}
                  >
                    <Card className="border-green-500 bg-green-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-center mb-3">
                          <CheckCircle className="h-8 w-8 text-green-500 mr-2" />
                          <h3 className="text-lg font-semibold text-green-800">
                            Suggestion Generated!
                          </h3>
                        </div>
                        <p className="text-green-700 text-sm text-center">
                          Click on the suggestion card below to edit and customize your credential.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Streaming Status */}
                {(isGenerating || suggestionCards.filter(card => card.data).length < suggestionCards.length) && (
                  <div className="mb-4">
                    <StreamingStatus
                      isGenerating={isGenerating}
                      completedCount={suggestionCards.filter(card => card.data).length}
                      totalCount={suggestionCards.length}
                    />
                  </div>
                )}

                {/* Show message when no cards are visible yet */}
                {suggestionCards.filter(card => card.streamingStarted && !card.error).length === 0 && isGenerating && (
                  <div className="flex flex-col items-center py-12 space-y-6 mb-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-primary mb-2">Initializing AI Generation</h3>
                      <p className="text-muted-foreground text-sm">
                        Starting up the AI engines... Cards will appear as streaming begins.
                      </p>
                    </div>
                  </div>
                )}

                {/* Suggestion Cards - Only render when cards exist, exclude failed ones */}
                {suggestionCards.filter(card => card.streamingStarted && !card.error).length > 0 && (
                  <div>
                    {suggestionCards
                      .filter(card => card.streamingStarted && !card.error)
                      .map((card) => (
                        <div key={card.id} className="w-full">
                          <SuggestionCard
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
                            isMobile={isMobile}
                          />
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}