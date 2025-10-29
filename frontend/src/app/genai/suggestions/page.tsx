'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SuggestionCard } from '@/components/genai/suggestion-card';
import { StreamingStatus } from '@/components/genai/streaming-status';
import { useStreamingSuggestionGenerator } from '@/hooks/use-streaming-suggestion-generator';

export default function CredentialSuggestionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [originalContent, setOriginalContent] = useState<string>('');
  const [showCompletionAlert, setShowCompletionAlert] = useState(false);
  const [isAlertFadingOut, setIsAlertFadingOut] = useState(false);
  const { suggestionCards, allCompleted, isGenerating, generateAllSuggestionsStream } = useStreamingSuggestionGenerator();

  useEffect(() => {
    // Get original content from localStorage
    try {
      const storedContent = localStorage.getItem('originalContent');
      if (storedContent) {
        setOriginalContent(storedContent);
      }

      // Debug: Check what's in localStorage
      // console.log('Suggestions page - localStorage check:');
      // console.log('generatedSuggestions:', localStorage.getItem('generatedSuggestions'));
      // console.log('finalResponses:', localStorage.getItem('finalResponses'));
      // console.log('isGenerating:', localStorage.getItem('isGenerating'));
      // console.log('suggestionCards:', suggestionCards);
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

  const handleCopyOriginal = async () => {
    try {
      await navigator.clipboard.writeText(originalContent || '');
      toast({ title: 'Copied', description: 'Original content copied to clipboard.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Copy failed', description: 'Could not copy content.' });
    }
  };

  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => handleNavigation('/genai')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Generator
          </Button>

          <h1 className="text-3xl font-bold text-gray-900">
            Credential Suggestions
          </h1>

          <div className="w-[140px]"></div> {/* Spacer for alignment */}
        </div>

        <div className="flex justify-center">
          <div className="w-full">

            {/* Two-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left: Original Content (sticky) */}
              <div className="md:col-span-4">
                <div className="sticky top-4">
                  <Card className="border-0 bg-gradient-to-br from-[#429EA6]/15 via-[#429EA6]/10 to-blue-50/50 shadow-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div>
                              <h2 className="text-sm font-bold text-[#234467]">Original Content</h2>
                              <p className="text-xs text-[#429EA6] font-medium">Source Input</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCopyOriginal}
                            className="border-[#429EA6] bg-white text-[#429EA6] hover:bg-[#429EA6] hover:text-white transition-all duration-200"
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
              <div className="md:col-span-8">

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
                            All Suggestions Generated!
                          </h3>
                        </div>
                        <p className="text-green-700 text-sm text-center">
                          Click on any suggestion card below to edit and customize your credential.
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
                {suggestionCards.filter(card => card.streamingStarted).length === 0 && isGenerating && (
                  <div className="flex flex-col items-center py-12 space-y-6 mb-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#429EA6]"></div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-[#234467] mb-2">Initializing AI Generation</h3>
                      <p className="text-[#626a73] text-sm">
                        Starting up the AI engines... Cards will appear as streaming begins.
                      </p>
                    </div>
                  </div>
                )}

                {/* Suggestion Cards - Only render columns when cards exist */}
                {suggestionCards.filter(card => card.streamingStarted).length > 0 && (
                  <div className="columns-1 md:columns-2 gap-6">
                    {suggestionCards
                      .filter(card => card.streamingStarted)
                      .map((card) => (
                        <div key={card.id} className="break-inside-avoid mb-6">
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