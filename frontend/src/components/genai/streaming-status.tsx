'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface StreamingStatusProps {
  isGenerating: boolean;
  completedCount: number;
  totalCount: number;
}

export function StreamingStatus({ isGenerating, completedCount, totalCount }: StreamingStatusProps) {
  if (!isGenerating && completedCount === totalCount) {
    return null; // Hide if all completed and not generating
  }

  const overallProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getStatusMessage = () => {
    if (completedCount === 0 && isGenerating) return "🤖 AI is analyzing your content...";
    if (completedCount > 0 && completedCount < totalCount && isGenerating) return `✨ Generating personalized suggestions... (${completedCount}/${totalCount} ready)`;
    if (completedCount === totalCount && !isGenerating) return "✅ All suggestions are ready!";
    return "Preparing AI generation...";
  };

  return (
    <Card className="mt-8 mb-8 border-[#429EA6] shadow-lg overflow-hidden relative">
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#DDD78D]/20 to-[#429EA6]/10"></div>
      
      {/* Animated gradient wave when generating */}
      {isGenerating && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#DDD78D]/50 via-[#429EA6]/40 to-[#234467]/30 animate-pulse"></div>
      )}
      
      {/* Moving shimmer effect from right to left */}
      {isGenerating && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          style={{
            animation: 'shimmer 2s ease-in-out infinite',
            transform: 'translateX(-100%)',
          }}
        ></div>
      )}
      
      <CardHeader className="relative z-10">
        <CardTitle className="text-[#234467] font-headline font-bold text-xl">
          Crafting Your Credential Suggestions
        </CardTitle>
        <CardDescription className="text-[#40464c] font-body text-base">
          {getStatusMessage()}
        </CardDescription>
      </CardHeader>
 
      
      {/* Custom CSS animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </Card>
  );
}
