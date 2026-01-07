'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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

// Single source of truth for all badge configuration option mappings
// Structure: API key -> UI display value
const badgeOptionMappings = {
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
    'beginner': 'Beginner',
    'intermediate': 'Intermediate',
    'advanced': 'Advanced'
  },
  criterion: {
    'task-oriented': 'Task-Oriented',
    'evidence-based': 'Evidence-Based',
    'outcome-focused': 'Outcome-Focused'
  }
} as const;

type BadgeOptionType = keyof typeof badgeOptionMappings;

// Map API format to UI format
const mapFromApiFormat = (apiValue: string | undefined, type: BadgeOptionType): string => {
  if (!apiValue) return getDefault(type);
  return badgeOptionMappings[type][apiValue as keyof typeof badgeOptionMappings[typeof type]] || getDefault(type);
};

const getDefault = (type: BadgeOptionType): string => {
  const defaults: Record<BadgeOptionType, string> = {
    style: 'Professional',
    tone: 'Authoritative',
    level: 'Beginner',
    criterion: 'Task-Oriented'
  };
  return defaults[type];
};

// Map UI values to API format
const mapToApiFormat = (uiValue: string, type: BadgeOptionType): string => {
  const optionMapping = badgeOptionMappings[type];
  // Find the API key for the given UI value
  const apiKey = Object.entries(optionMapping).find(([_, displayValue]) => displayValue === uiValue)?.[0];
  return apiKey || uiValue.toLowerCase();
};

// Get UI display values for a given option type
const getDisplayValues = (type: BadgeOptionType): string[] => {
  return Object.values(badgeOptionMappings[type]);
};

export function BadgeConfiguration({ onRegenerate, isRegenerating, onConfigurationChange, variant = 'card', initialConfig }: BadgeConfigurationProps) {
  const [style, setStyle] = useState(() => mapFromApiFormat(initialConfig?.badge_style, 'style'));
  const [tone, setTone] = useState(() => mapFromApiFormat(initialConfig?.badge_tone, 'tone'));
  const [level, setLevel] = useState(() => mapFromApiFormat(initialConfig?.badge_level, 'level'));
  const [criterionTemplate, setCriterionTemplate] = useState(() => mapFromApiFormat(initialConfig?.criterion_style, 'criterion'));
  const [institution, setInstitution] = useState(initialConfig?.institution || '');
  const [instituteUrl, setInstituteUrl] = useState(initialConfig?.institute_url || '');
  const [userPrompt, setUserPrompt] = useState(initialConfig?.user_prompt || '');

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
        user_prompt: userPrompt,
      };
      onConfigurationChange(config);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style, tone, level, criterionTemplate, institution, instituteUrl, userPrompt]);

  const isInline = variant === 'inline';
  const borderClass = isInline ? 'border-gray-200 focus:border-secondary focus:ring-secondary/20' : 'border-secondary focus:border-primary focus:ring-primary';
  const labelClass = isInline ? 'text-gray-700 font-medium text-sm mb-2' : 'text-foreground font-subhead font-medium text-sm mb-2';

  // Prepare options for tiles
  const styleOptions = getDisplayValues('style').map(value => ({ value, label: value }));
  const toneOptions = getDisplayValues('tone').map(value => ({ value, label: value }));
  const levelOptions = getDisplayValues('level').map(value => ({ value, label: value }));
  const criterionOptions = getDisplayValues('criterion').map(value => ({ value, label: value }));

  const formContent = (
    <div className={isInline ? 'space-y-4' : 'space-y-4'}>
      {/* Select Style Tiles */}
      <div>
        <Label className={labelClass}>Select Style</Label>
        <div className="flex flex-wrap gap-2">
          {styleOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStyle(option.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md border-2 transition-all shadow-sm ${
                style === option.value
                  ? 'bg-secondary text-white border-secondary shadow-md ring-2 ring-secondary/20'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-secondary hover:bg-secondary/5 hover:shadow-md'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Select Tone Tiles */}
      <div>
        <Label className={labelClass}>Select Tone</Label>
        <div className="flex flex-wrap gap-2">
          {toneOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTone(option.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md border-2 transition-all shadow-sm ${
                tone === option.value
                  ? 'bg-secondary text-white border-secondary shadow-md ring-2 ring-secondary/20'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-secondary hover:bg-secondary/5 hover:shadow-md'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Select Level Descriptions Tiles */}
      <div>
        <Label className={labelClass}>Select Level</Label>
        <div className="flex flex-wrap gap-2">
          {levelOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setLevel(option.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md border-2 transition-all shadow-sm ${
                level === option.value
                  ? 'bg-secondary text-white border-secondary shadow-md ring-2 ring-secondary/20'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-secondary hover:bg-secondary/5 hover:shadow-md'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Select Criterion Templates Tiles */}
      <div>
        <Label className={labelClass}>Select Criterion</Label>
        <div className="flex flex-wrap gap-2">
          {criterionOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setCriterionTemplate(option.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md border-2 transition-all shadow-sm ${
                criterionTemplate === option.value
                  ? 'bg-secondary text-white border-secondary shadow-md ring-2 ring-secondary/20'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-secondary hover:bg-secondary/5 hover:shadow-md'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Institute Input */}
      {/* <div className="space-y-2">
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
          </div> */}

      {/* Institute URL Input */}
      {/* <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="institute-url" className={labelClass}>
                Institute URL
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-pointer">
                      <Info className="h-4 w-4 text-secondary" />
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
          </div> */}

      {/* Custom Instructions Input */}
      <div>
        <Label htmlFor="user-prompt" className={labelClass}>Custom Instructions</Label>
        <Textarea
          id="user-prompt"
          aria-label="Custom instructions for badge generation"
          placeholder="Enter custom instructions for badge generation..."
          className={`min-h-[100px] resize-none mt-1 ${isInline ? 'border-gray-200 focus:border-secondary focus:ring-secondary/20' : 'border-gray-300 focus:border-secondary focus:ring-secondary'}`}
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
            className="flex items-center gap-2 border-secondary text-primary hover:bg-secondary/10"
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
    <Card className="border-secondary shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-primary font-headline font-bold text-lg">
          Badge Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
}
