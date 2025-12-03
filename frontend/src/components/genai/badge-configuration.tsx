'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, Loader2, Info } from 'lucide-react';

export interface BadgeConfigurationData {
  badge_style: string;
  badge_tone: string;
  criterion_style: string;
  badge_level: string;
  institution: string;
  institute_url?: string;
  user_prompt?: string;
}

interface BadgeConfigurationProps {
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  onConfigurationChange?: (config: BadgeConfigurationData) => void;
  variant?: 'card' | 'inline';
  initialConfig?: BadgeConfigurationData;
}

// Map API format to UI format
const mapFromApiFormat = (apiValue: string | undefined, type: 'style' | 'tone' | 'level' | 'criterion'): string => {
  if (!apiValue) return getDefault(type);

  const mappings = {
    style: {
      'professional': 'Professional',
      'academic': 'Academic',
      'industry': 'Industry',
      'technical': 'Technical',
      'creative': 'Creative'
    },
    tone: {
      'authoritative': 'Authoritative',
      'encouraging': 'Encouraging',
      'detailed': 'Detailed',
      'concise': 'Concise',
      'engaging': 'Engaging'
    },
    level: {
      'not-specified': 'Not Specified',
      'beginner': 'Beginner',
      'intermediate': 'Intermediate',
      'advanced': 'Advanced'
    },
    criterion: {
      'task-oriented': 'Task-Oriented',
      'evidence-based': 'Evidence-Based',
      'outcome-focused': 'Outcome-Focused'
    }
  };
  return mappings[type][apiValue as keyof typeof mappings[typeof type]] || getDefault(type);
};

const getDefault = (type: 'style' | 'tone' | 'level' | 'criterion'): string => {
  const defaults = {
    style: 'Professional',
    tone: 'Authoritative',
    level: 'Not Specified',
    criterion: 'Task-Oriented'
  };
  return defaults[type];
};

export function BadgeConfiguration({ onRegenerate, isRegenerating, onConfigurationChange, variant = 'card', initialConfig }: BadgeConfigurationProps) {
  const [style, setStyle] = useState(() => mapFromApiFormat(initialConfig?.badge_style, 'style'));
  const [tone, setTone] = useState(() => mapFromApiFormat(initialConfig?.badge_tone, 'tone'));
  const [level, setLevel] = useState(() => mapFromApiFormat(initialConfig?.badge_level, 'level'));
  const [criterionTemplate, setCriterionTemplate] = useState(() => mapFromApiFormat(initialConfig?.criterion_style, 'criterion'));
  const [institution, setInstitution] = useState(initialConfig?.institution || '');
  const [instituteUrl, setInstituteUrl] = useState(initialConfig?.institute_url || '');
  const [userPrompt, setUserPrompt] = useState(initialConfig?.user_prompt || '');

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
        badge_level: mapToApiFormat(level, 'level'),
        institution: institution,
        institute_url: instituteUrl,
        user_prompt: userPrompt
      };
      onConfigurationChange(config);
    }
  }, [style, tone, level, criterionTemplate, institution, instituteUrl, userPrompt]); // Remove onConfigurationChange from dependencies

  const isInline = variant === 'inline';
  const borderClass = isInline ? 'border-gray-200 focus:border-[#429EA6] focus:ring-[#429EA6]/20' : 'border-[#429EA6] focus:border-[#234467] focus:ring-[#234467]';
  const labelClass = isInline ? 'text-gray-700 font-medium text-sm' : 'text-[#40464c] font-subhead font-medium text-sm';

  const formContent = (
    <div className={isInline ? 'space-y-4' : 'space-y-6'}>
      {/* Style Descriptions */}
      <div className="space-y-2">
        <Label htmlFor="style" className={labelClass}>
          Style Descriptions
        </Label>
        <Select value={style} onValueChange={setStyle}>
          <SelectTrigger className={borderClass}>
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
        <Label htmlFor="tone" className={labelClass}>
          Tone Descriptions
        </Label>
        <Select value={tone} onValueChange={setTone}>
          <SelectTrigger className={borderClass}>
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
        <Label htmlFor="level" className={labelClass}>
          Level Descriptions
        </Label>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className={borderClass}>
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
        <Label htmlFor="criterion" className={labelClass}>
          Criterion Templates
        </Label>
        <Select value={criterionTemplate} onValueChange={setCriterionTemplate}>
          <SelectTrigger className={borderClass}>
            <SelectValue placeholder="Select template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Task-Oriented">Task-Oriented</SelectItem>
            <SelectItem value="Evidence-Based">Evidence-Based</SelectItem>
            <SelectItem value="Outcome-Focused">Outcome-Focused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Institute Input */}
      <div className="space-y-2">
        <Label htmlFor="institution" className={labelClass}>
          Institute
        </Label>
        <Input
          id="institution"
          placeholder="Enter institution name..."
          className={borderClass}
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
        />
      </div>

      {/* Institute URL Input */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="institute-url" className={labelClass}>
            Institute URL
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-pointer">
                  <Info className="h-4 w-4 text-[#429EA6]" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">The colors for the badge image will be derived from the colors present in the URL.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input
          id="institute-url"
          type="url"
          placeholder="https://example.edu"
          className={borderClass}
          value={instituteUrl}
          onChange={(e) => setInstituteUrl(e.target.value)}
        />
      </div>

      {/* User Prompt Input */}
      <div className="space-y-2">
        <Label htmlFor="user-prompt" className={labelClass}>
          User Prompt
        </Label>
        <Textarea
          id="user-prompt"
          aria-label="Custom instructions for badge generation"
          placeholder="Enter custom instructions for badge generation..."
          className={`min-h-[80px] resize-none ${isInline ? 'border-gray-200 focus:border-[#429EA6] focus:ring-[#429EA6]/20' : 'border-gray-300 focus:border-[#429EA6] focus:ring-[#429EA6]'}`}
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
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
    </div>
  );

  if (isInline) {
    return formContent;
  }

  return (
    <Card className="border-[#429EA6] shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-[#234467] font-headline font-bold text-lg">
          Badge Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
}
