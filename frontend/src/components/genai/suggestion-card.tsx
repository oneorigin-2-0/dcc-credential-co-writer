'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardFooter} from '@/components/ui/card';
import { CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import Lottie from 'lottie-react';
import type { BadgeSuggestion } from '@/lib/types';

interface SuggestionCardProps {
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
  onClick: () => void;
}

export function SuggestionCard({ id, data, loading, error, progress, streamingText, streamingContent, rawStreamingContent, isStreamingComplete, onClick }: SuggestionCardProps) {
  const preRef = useRef<HTMLPreElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [animationData, setAnimationData] = useState(null);

  // Load Lottie animation data
  useEffect(() => {
    fetch("https://cdn.prod.website-files.com/6177739448baa66404ce1d9c/65af544319dd628383cea301_icon%20stars%20white%20(1).json")
      .then(response => response.json())
      .then(data => setAnimationData(data))
      .catch(error => console.error('Error loading animation:', error));
  }, []);

  // Trigger entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, id * 100); // Stagger animation by card id (100ms delay per card)
    
    return () => clearTimeout(timer);
  }, [id]);

  // Auto-scroll to bottom when rawStreamingContent updates
  useEffect(() => {
    if (preRef.current && rawStreamingContent) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [rawStreamingContent]);

  const getStatus = () => {
    if (loading) return 'loading';
    if (error) return 'error';
    if (data) return 'success';
    return 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return animationData ? (
          <div className="w-5 h-5">
            <Lottie animationData={animationData} loop={true} />
          </div>
        ) : (
          <Sparkles className="h-5 w-5 text-[#429EA6]" />
        );
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-300" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'loading':
        return 'Generating response...';
      case 'error':
        return 'Failed';
      case 'success':
        return 'Ready';
      default:
        return 'Pending';
    }
  };

  const status = getStatus();
  const isCurrentlyStreaming = rawStreamingContent && !isStreamingComplete;
  const isClickable = (status === 'success' || status === 'error') && !loading && !isCurrentlyStreaming;

  return (
    <Card
      className={`overflow-hidden shadow-md transition-all duration-500 rounded-lg ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-4'
      } ${
        isClickable 
          ? 'cursor-pointer hover:shadow-xl border-2 border-transparent hover:border-[#429EA6] bg-gradient-to-br from-white to-gray-50' 
          : 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-transparent'
      } ${status === 'error' ? 'from-red-50 to-red-100 border-red-200' : ''} ${
        status === 'loading' ? 'from-blue-50 to-indigo-50 border-blue-200' : ''
      } ${status === 'error' && isClickable ? 'hover:border-red-400' : ''}`}
      onClick={isClickable ? onClick : undefined}
    >
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            status === 'success' ? 'bg-green-100' :
            status === 'error' ? 'bg-red-100' :
            status === 'loading' ? 'bg-[#429EA6]' :
            'bg-gray-200'
          }`}>
            {getStatusIcon(status)}
          </div>
          <div>
            <CardDescription className="text-sm text-gray-700 font-medium font-body">
              {getStatusText(status)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col">
        {status === 'loading' && (
          <div className="space-y-4">
            {rawStreamingContent ? (
              <div className="space-y-3">
                {/* Raw JSON Content Display */}
                <div className="space-y-1">
                  <div className="p-4 bg-gradient-to-br from-[#234467] to-[#320E3B] rounded-lg border-2 border-[#429EA6]/50 overflow-y-auto shadow-xl">
                    <pre ref={preRef} className="text-xs text-[#DDD78D] font-mono leading-relaxed whitespace-pre-wrap">
                      {rawStreamingContent}
                      {!isStreamingComplete && <span className="animate-pulse text-[#429EA6]">|</span>}
                    </pre>
                  </div>
                </div>
              </div>
            ) : streamingContent && (streamingContent.title || streamingContent.description || streamingContent.criteria) ? (
              <div className="space-y-3">
                
                {/* Streaming Title */}
                {streamingContent.title && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-blue-600 uppercase tracking-wide">Title:</label>
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 shadow-sm">
                      <p className="text-sm text-gray-800 font-semibold">
                        {streamingContent.title}
                        <span className="animate-pulse text-blue-500 ml-1">|</span>
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Streaming Description */}
                {streamingContent.description && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-blue-600 uppercase tracking-wide">Description:</label>
                    <div className="p-3 bg-white/90 rounded-lg border-2 border-blue-200 max-h-32 overflow-y-auto shadow-sm">
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {streamingContent.description}
                        <span className="animate-pulse text-blue-500 ml-1">|</span>
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Streaming Criteria */}
                {streamingContent.criteria && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-blue-600 uppercase tracking-wide">Criteria:</label>
                    <div className="p-3 bg-white/90 rounded-lg border-2 border-blue-200 max-h-32 overflow-y-auto shadow-sm">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {streamingContent.criteria}
                        <span className="animate-pulse text-blue-500 ml-1">|</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : streamingText ? (
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-sm text-[#429EA6] font-medium">{streamingText}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gradient-to-r from-[#429EA6]/30 to-[#234467]/30 rounded-lg animate-pulse"></div>
                  <div className="h-4 bg-gradient-to-r from-[#429EA6]/30 to-[#234467]/30 rounded-lg animate-pulse w-3/4 mx-auto"></div>
                  <div className="h-4 bg-gradient-to-r from-[#429EA6]/30 to-[#234467]/30 rounded-lg animate-pulse w-1/2 mx-auto"></div>
                </div>
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-6">
            <div className="inline-flex p-4 rounded-lg bg-red-100 mb-4">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm font-semibold mb-1 font-headline">
                Generation Failed
              </p>
              <p className="text-red-600 text-xs font-body">
                {error || 'Failed to generate suggestion'}
              </p>
            </div>
          </div>
        )}

        {status === 'success' && data && (
          <div className="space-y-4">
            {/* Badge Image with Gradient Background */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#429EA6]/20 to-[#234467]/20 rounded-lg blur-xl"></div>
                <img
                  src={data.image}
                  alt="Badge preview"
                  className="relative w-40 h-40 object-contain rounded-lg border-2 border-white shadow-xl bg-white"
                />
              </div>
            </div>
            
            {/* Title with Background */}
            <div className="text-center px-3 py-3 bg-gradient-to-r from-[#DDD78D]/20 to-[#429EA6]/20 rounded-lg border border-[#429EA6]/30">
              <h3 className="font-bold text-[#234467] text-base font-headline">
                {data.title}
              </h3>
            </div>
            
            {/* Description Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 shadow-sm">
              <label className="text-xs font-bold text-[#429EA6] uppercase tracking-wide mb-2 block font-subhead">Description</label>
              <p className="text-gray-700 text-sm leading-relaxed font-body">
                {data.description}
              </p>
            </div>
            
            {/* Criteria Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200/50 shadow-sm">
              <label className="text-xs font-bold text-[#234467] uppercase tracking-wide mb-2 block font-subhead">Criteria</label>
              <p className="text-gray-600 text-sm leading-relaxed font-body">
                {data.criteria}
              </p>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Footer - only show for clickable cards */}
      {isClickable && (
        <CardFooter className="pt-2 pb-4 mt-auto">
          <div className="w-full">
            <div className={`text-center py-2 px-4 rounded-lg ${
              status === 'error' 
                ? 'bg-red-100 border border-red-300' 
                : 'bg-gradient-to-r from-[#429EA6]/10 to-[#234467]/10 border border-[#429EA6]/30'
            }`}>
              <p className={`text-xs font-semibold font-body ${
                status === 'error' ? 'text-red-600' : 'text-[#234467]'
              }`}>
                ✨ Click to edit and customise
              </p>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
