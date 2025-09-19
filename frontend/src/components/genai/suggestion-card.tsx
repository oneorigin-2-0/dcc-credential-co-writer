'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle, Sparkles, Brain } from 'lucide-react';
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
  const getStatus = () => {
    if (loading) return 'loading';
    if (error) return 'error';
    if (data) return 'success';
    return 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Brain className="h-5 w-5 animate-pulse text-blue-500" />;
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
        return 'Generating...';
      case 'error':
        return 'Failed';
      case 'success':
        return 'Ready';
      default:
        return 'Pending';
    }
  };

  const status = getStatus();
  const isClickable = status === 'success' && !loading && !rawStreamingContent;

  return (
    <Card
      className={`border-0 shadow-lg transition-all duration-500 ${
        isClickable 
          ? 'cursor-pointer hover:shadow-xl hover:scale-105 bg-white' 
          : 'bg-gray-50'
      } ${status === 'error' ? 'border-red-200 bg-red-50' : ''} ${
        status === 'loading' ? 'border-blue-200 bg-blue-50' : ''
      }`}
      onClick={isClickable ? onClick : undefined}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            {status === 'loading' && <Sparkles className="h-4 w-4 text-blue-500 animate-spin" />}
            Suggestion {id}
          </CardTitle>
          {getStatusIcon(status)}
        </div>
        <CardDescription className="text-sm text-gray-600">
          {getStatusText(status)}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {status === 'loading' && (
          <div className="space-y-4">
            {rawStreamingContent ? (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Brain className="h-4 w-4 text-[#429EA6] animate-pulse" />
                    <span className="text-sm text-[#429EA6] font-medium font-subhead">
                      {isStreamingComplete ? 'Parsing Response...' : 'Generating Response...'}
                    </span>
                  </div>
                </div>
                
                {/* Raw JSON Content Display */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#40464c] font-subhead">AI Generated Response:</label>
                  <div className="p-4 bg-[#234467] rounded-lg border border-[#429EA6] max-h-64 overflow-y-auto shadow-lg">
                    <pre className="text-xs text-[#DDD78D] font-mono leading-relaxed whitespace-pre-wrap">
                      {rawStreamingContent}
                      {!isStreamingComplete && <span className="animate-pulse text-[#429EA6]">|</span>}
                    </pre>
                  </div>
                </div>
                
                {/* Status Message */}
                <div className="text-center">
                  <p className="text-xs text-[#626a73] font-body">
                    {isStreamingComplete ? 'Response generation complete, parsing...' : 'AI is generating response...'}
                  </p>
                </div>
              </div>
            ) : streamingContent && (streamingContent.title || streamingContent.description || streamingContent.criteria) ? (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Brain className="h-4 w-4 text-blue-500 animate-pulse" />
                    <span className="text-sm text-blue-600 font-medium">Streaming Content...</span>
                  </div>
                </div>
                
                {/* Streaming Title */}
                {streamingContent.title && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Title:</label>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-800 font-medium">
                        {streamingContent.title}
                        <span className="animate-pulse text-blue-500 ml-1">|</span>
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Streaming Description */}
                {streamingContent.description && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Description:</label>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 max-h-32 overflow-y-auto">
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
                    <label className="text-xs font-medium text-gray-500">Criteria:</label>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 max-h-32 overflow-y-auto">
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
                  <Brain className="h-4 w-4 text-blue-500 animate-pulse" />
                  <p className="text-sm text-blue-600 font-medium">{streamingText}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Brain className="h-5 w-5 text-blue-500 animate-pulse" />
                  <span className="text-sm text-blue-600">Preparing AI generation...</span>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-blue-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-blue-200 rounded animate-pulse w-3/4 mx-auto"></div>
                  <div className="h-3 bg-blue-200 rounded animate-pulse w-1/2 mx-auto"></div>
                </div>
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 text-sm">
              {error || 'Failed to generate suggestion'}
            </p>
          </div>
        )}

        {status === 'success' && data && (
          <div className="space-y-4">
            {/* 1. Image First */}
            <div className="flex justify-center">
              <img
                src={data.image || "https://nwccu.org/wp-content/uploads/2024/01/WGU-Logo.png"}
                alt="Badge preview"
                className="w-20 h-20 object-contain rounded-lg border border-gray-300 shadow-sm"
              />
            </div>
            
            {/* 2. Title / Badge Name */}
            <div className="text-center">
              <h3 className="font-semibold text-[#234467] text-base mb-2 font-headline">
                {data.title}
              </h3>
            </div>
            
            {/* 3. Description / Badge Description */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#40464c] font-subhead">Description:</label>
              <p className="text-gray-700 text-sm leading-relaxed font-body">
                {data.description}
              </p>
            </div>
            
            {/* 4. Criteria */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#40464c] font-subhead">Criteria:</label>
              <p className="text-gray-600 text-sm leading-relaxed font-body">
                {data.criteria}
              </p>
            </div>
            
            {/* Click to edit message */}
            <div className="text-center pt-2 border-t border-gray-200">
              <p className="text-xs text-[#626a73] font-body">Click to edit and customise</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
