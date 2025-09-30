'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Loader2 } from 'lucide-react';

interface BadgeConfigurationProps {
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  onConfigurationChange?: (config: BadgeConfigurationData) => void;
  userPrompt?: string;
  onUserPromptChange?: (prompt: string) => void;
}

interface BadgeConfigurationData {
  badge_style: string;
  badge_tone: string;
  criterion_style: string;
  badge_level: string;
}

export function BadgeConfiguration({ onRegenerate, isRegenerating, onConfigurationChange, userPrompt, onUserPromptChange }: BadgeConfigurationProps) {
  const [style, setStyle] = useState('Professional');
  const [tone, setTone] = useState('Authoritative');
  const [level, setLevel] = useState('Not Specified');
  const [criterionTemplate, setCriterionTemplate] = useState('Task-Oriented');

  // Map UI values to API format
  const mapToApiFormat = (uiValue: string, type: 'style' | 'tone' | 'level' | 'criterion') => {
    const mappings = {
      style: {
        'Professional': 'professional',
        'Academic': 'academic',
        'Industry': 'industry',
        'Technical': 'technical',
        'Creative': 'creative'
      },
      tone: {
        'Authoritative': 'authoritative',
        'Encouraging': 'encouraging',
        'Detailed': 'detailed',
        'Concise': 'concise',
        'Engaging': 'engaging'
      },
      level: {
        'Not Specified': 'not-specified',
        'Beginner': 'beginner',
        'Intermediate': 'intermediate',
        'Advanced': 'advanced'
      },
      criterion: {
        'Task-Oriented': 'task-oriented',
        'Evidence-Based': 'evidence-based',
        'Outcome-Focused': 'outcome-focused'
      }
    };
    return mappings[type][uiValue as keyof typeof mappings[typeof type]] || uiValue.toLowerCase();
  };

  // Notify parent component when configuration changes
  useEffect(() => {
    if (onConfigurationChange) {
      const config: BadgeConfigurationData = {
        badge_style: mapToApiFormat(style, 'style'),
        badge_tone: mapToApiFormat(tone, 'tone'),
        criterion_style: mapToApiFormat(criterionTemplate, 'criterion'),
        badge_level: mapToApiFormat(level, 'level')
      };
      onConfigurationChange(config);
    }
  }, [style, tone, level, criterionTemplate]); // Remove onConfigurationChange from dependencies

  return (
    <Card className="border-[#429EA6] shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-[#234467] font-headline font-bold text-lg">
          Badge Configuration
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Style Descriptions */}
        <div className="space-y-2">
          <Label htmlFor="style" className="text-[#40464c] font-subhead font-medium text-sm">
            Style Descriptions
          </Label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger className="border-[#429EA6] focus:border-[#234467] focus:ring-[#234467]">
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Professional">Professional</SelectItem>
              <SelectItem value="Academic">Academic</SelectItem>
              <SelectItem value="Industry">Industry</SelectItem>
              <SelectItem value="Technical">Technical</SelectItem>
              <SelectItem value="Creative">Creative</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tone Descriptions */}
        <div className="space-y-2">
          <Label htmlFor="tone" className="text-[#40464c] font-subhead font-medium text-sm">
            Tone Descriptions
          </Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger className="border-[#429EA6] focus:border-[#234467] focus:ring-[#234467]">
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Authoritative">Authoritative</SelectItem>
              <SelectItem value="Encouraging">Encouraging</SelectItem>
              <SelectItem value="Detailed">Detailed</SelectItem>
              <SelectItem value="Concise">Concise</SelectItem>
              <SelectItem value="Engaging">Engaging</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Level Descriptions */}
        <div className="space-y-2">
          <Label htmlFor="level" className="text-[#40464c] font-subhead font-medium text-sm">
            Level Descriptions
          </Label>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="border-[#429EA6] focus:border-[#234467] focus:ring-[#234467]">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Not Specified">Not Specified</SelectItem>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Criterion Templates */}
        <div className="space-y-2">
          <Label htmlFor="criterion" className="text-[#40464c] font-subhead font-medium text-sm">
            Criterion Templates
          </Label>
          <Select value={criterionTemplate} onValueChange={setCriterionTemplate}>
            <SelectTrigger className="border-[#429EA6] focus:border-[#234467] focus:ring-[#234467]">
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Task-Oriented">Task-Oriented</SelectItem>
              <SelectItem value="Evidence-Based">Evidence-Based</SelectItem>
              <SelectItem value="Outcome-Focused">Outcome-Focused</SelectItem>
            </SelectContent>
           </Select>
         </div>

         {/* User Prompt Input */}
         <div className="space-y-2">
           <label className="text-sm font-medium text-gray-700">
             User Prompt
           </label>
           <Textarea
             placeholder="Enter custom instructions for badge generation..."
             className="min-h-[80px] resize-none border-gray-300 focus:border-[#429EA6] focus:ring-[#429EA6]"
             value={userPrompt}
             onChange={(e) => onUserPromptChange?.(e.target.value)}
           />
         </div>

         {/* Regenerate Button */}
         {onRegenerate && (
           <div className="flex justify-end pt-4">
             <Button
               onClick={onRegenerate}
               disabled={isRegenerating}
               variant="outline"
               className="flex items-center gap-2 border-[#429EA6] text-[#234467] hover:bg-[#429EA6]/10"
             >
               {isRegenerating ? (
                 <>
                   <Loader2 className="h-4 w-4 animate-spin" />
                   Regenerating...
                 </>
               ) : (
                 <>
                   <RefreshCw className="h-4 w-4" />
                   Regenerate
                 </>
               )}
             </Button>
           </div>
         )}
       </CardContent>
     </Card>
   );
 }
