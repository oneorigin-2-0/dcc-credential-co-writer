'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { ArrowLeft, Edit, Save, X, Copy, FileDown, RefreshCw, Loader2, Upload, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BadgeConfiguration } from '@/components/genai/badge-configuration';
import { BadgeImageDisplay } from '@/components/genai/badge-image-display';
import { SuggestionCard } from '@/components/genai/suggestion-card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { StreamingApiClient } from '@/lib/api';
import type { BadgeSuggestion } from '@/lib/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setSelectedBadgeSuggestion,
  setFinalResponse,
  addGeneratedSuggestion,
  setGeneratedSuggestions,
  setFinalResponses,
} from '@/store/slices/genaiSlice';

// Default colors for badge image editor layer configuration
const IMAGE_EDITOR_DEFAULTS = {
  backgroundColor: '#FFFFFF',
  textColor: '#000000',
  borderColor: '#000000',
  fillColor: '#00B4D8',
  gradientStart: '#E76F51',
  gradientEnd: '#FF8C42',
} as const;

export default function BadgeEditorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const selectedBadgeSuggestion = useAppSelector((state) => state.genai.selectedBadgeSuggestion);
  const selectedCardId = useAppSelector((state) => state.genai.selectedCardId);
  const finalResponses = useAppSelector((state) => state.genai.finalResponses);
  const originalContent = useAppSelector((state) => state.genai.originalContent);
  const badgeConfig = useAppSelector((state) => state.genai.badgeConfig);
  const imageConfig = useAppSelector((state) => state.genai.imageConfig);
  const isLaiserEnabled = useAppSelector((state) => state.genai.isLaiserEnabled);
  const [badgeSuggestion, setBadgeSuggestion] = useState<BadgeSuggestion | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    title: string;
    description: string;
    criteria: string;
  }>({ title: '', description: '', criteria: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);
  const [availableCards, setAvailableCards] = useState<string[]>([]);
  const [badgeConfiguration, setBadgeConfiguration] = useState({
    badge_style: 'professional',
    badge_tone: 'authoritative',
    criterion_style: 'task-oriented',
    badge_level: 'not-specified',
    institution: '',
    institute_url: '',
    user_prompt: ''
  });
  const [userPrompt, setUserPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingRawContent, setStreamingRawContent] = useState('');
  const [streamingError, setStreamingError] = useState<string | null>(null);
  const [streamingComplete, setStreamingComplete] = useState(false);
  const [isImageEditModalOpen, setIsImageEditModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<any | null>(null);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [modalImageConfig, setModalImageConfig] = useState<any>(null);
  const [editedImageConfig, setEditedImageConfig] = useState<any>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [accordionStates, setAccordionStates] = useState<{
    canvas: boolean;
    layers: { [key: number]: boolean };
  }>({
    canvas: true,
    layers: {}
  });
  const [uploadedLogo, setUploadedLogo] = useState<File | null>(null);
  const [logoFileName, setLogoFileName] = useState<string>('');

  // Auto-hide streaming status after completion
  useEffect(() => {
    if (streamingComplete) {
      const timer = setTimeout(() => {
        setIsStreaming(false);
        setStreamingComplete(false);
      }, 2000); // Hide after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [streamingComplete]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  useEffect(() => {
    // Helper function to extract skills from raw data
    const extractSkills = (data: any): any[] | undefined => {
      const skillsArray = data?.skills ||
        data?.credentialSubject?.skills ||
        data?.credentialSubject?.achievement?.skills;
      if (skillsArray && Array.isArray(skillsArray)) {
        const skills = skillsArray.filter((skill: any) => skill && typeof skill === 'object');
        return skills.length > 0 ? skills : undefined;
      }
      return undefined;
    };

    // Get selected badge suggestion from Redux
    if (selectedBadgeSuggestion) {
      const parsedSuggestion = { ...selectedBadgeSuggestion };
      const cardIds = Object.keys(finalResponses);

      let rawFinalData = null;
      let cardId = selectedCardId;

      // Use the card ID directly if available
      if (cardId && finalResponses[cardId]) {
        rawFinalData = finalResponses[cardId];
        setCurrentCardId(cardId);
        setAvailableCards(cardIds);
      } else {
        // Fallback: Look for raw data that matches this suggestion by name
        for (const id of cardIds) {
          if (finalResponses[id] && finalResponses[id].credentialSubject?.achievement?.name === parsedSuggestion.title) {
            cardId = id;
            rawFinalData = finalResponses[id];
            setCurrentCardId(cardId);
            setAvailableCards(cardIds);
            break;
          }
        }
      }

      // Extract skills from raw final data and merge with parsedSuggestion
      if (rawFinalData) {
        const skills = extractSkills(rawFinalData);
        if (skills) {
          parsedSuggestion.skills = skills;
        }
      }

      setBadgeSuggestion(parsedSuggestion);
    } else {
      // Try to load from finalResponses if no selectedBadgeSuggestion
      const cardIds = Object.keys(finalResponses);

      if (cardIds.length > 0) {
        const firstCardId = cardIds[0];
        const rawFinalData = finalResponses[firstCardId];

        const skills = extractSkills(rawFinalData);

        let mappedSuggestion;
        if (rawFinalData.credentialSubject && rawFinalData.credentialSubject.achievement) {
          const achievement = rawFinalData.credentialSubject.achievement;
          mappedSuggestion = {
            title: achievement.name,
            description: achievement.description,
            criteria: achievement.criteria?.narrative || achievement.description,
            image: achievement.image?.id || undefined,
            skills: skills,
          };
        } else {
          mappedSuggestion = {
            title: rawFinalData.badge_name,
            description: rawFinalData.badge_description,
            criteria: rawFinalData.criteria?.narrative || rawFinalData.badge_description,
            image: undefined,
            skills: skills,
          };
        }

        // Check for uploaded badge image from imageConfig
        if (imageConfig?.enable_image_generation === false && imageConfig?.logo_base64) {
          mappedSuggestion.uploaded_badge_image = imageConfig.logo_base64;
          mappedSuggestion.uploaded_badge_image_name = imageConfig.logo_file_name;
          mappedSuggestion.enable_image_generation = false;
        }

        setBadgeSuggestion(mappedSuggestion);
        setCurrentCardId(firstCardId);
        setAvailableCards(cardIds);
      } else {
        toast({
          variant: 'destructive',
          title: 'No Suggestion Available',
          description: 'Please go back and generate suggestions first.',
        });
        router.push('/suggestions');
      }
    }

    // Get badge configuration from Redux
    if (badgeConfig) {
      setBadgeConfiguration(badgeConfig);
    }
  }, [selectedBadgeSuggestion, selectedCardId, finalResponses, imageConfig, badgeConfig, toast, router]);

  const handleConfigurationChange = useCallback((config: any) => {
    setBadgeConfiguration(config);
  }, []);

  const handleEditImage = async () => {
    // Get image config from finalResponses if available
    let originalConfig = currentCardId ?
      finalResponses[currentCardId]?.imageConfig || null :
      null;

    // Process config to ensure default values for all shapes
    if (originalConfig) {
      const configWithDefaults = JSON.parse(JSON.stringify(originalConfig));
      if (configWithDefaults.layers) {
        configWithDefaults.layers.forEach((layer: any) => {
          if (layer.shape === 'rounded_rect') {
            if (!layer.params) {
              layer.params = {};
            }
            // Always set radius to 50 for rounded_rect
            layer.params.radius = 50;
            // Set width and height to 450 if not already set
            layer.params.width = layer.params.width || 450;
            layer.params.height = layer.params.height || 450;
          } else if (layer.shape === 'hexagon' || layer.shape === 'circle') {
            if (!layer.params) {
              layer.params = {};
            }
            // Always set radius to 250 for hexagon and circle
            layer.params.radius = 250;
          }
        });
      }
      // Use the processed config as the source of truth
      originalConfig = configWithDefaults;
    }

    setModalImageConfig(originalConfig);
    setEditedImageConfig(originalConfig ? JSON.parse(JSON.stringify(originalConfig)) : null);
    setGeneratedImage(null);
    setIsImageEditModalOpen(true);

    let restoredLogoFile: File | null = null;

    // Restore uploaded logo if it exists in config
    if (originalConfig?.logoBase64 && originalConfig?.logoFileName) {
      try {
        // Convert base64 to File object
        const response = await fetch(originalConfig.logoBase64);
        const blob = await response.blob();
        const file = new File([blob], originalConfig.logoFileName, {
          type: originalConfig.logoFileType || 'image/png'
        });
        setUploadedLogo(file);
        setLogoFileName(originalConfig.logoFileName);
        restoredLogoFile = file; // Store the restored file to pass to generateImage
      } catch (error) {
        console.error('Failed to restore logo from config:', error);
      }
    } else {
      // Clear logo state if no logo in config
      setUploadedLogo(null);
      setLogoFileName('');
    }

    // Generate initial image immediately with restored logo file (if exists)
    if (originalConfig) {
      generateImage(originalConfig, restoredLogoFile);
    }
  };

  const handleApplyImageChanges = () => {
    // Apply the generated image to the badge suggestion
    if (generatedImage && badgeSuggestion) {
      const updatedSuggestion = {
        ...badgeSuggestion,
        image: generatedImage
      };

      setBadgeSuggestion(updatedSuggestion);

      // Update Redux - selectedBadgeSuggestion
      dispatch(setSelectedBadgeSuggestion({ 
        suggestion: updatedSuggestion, 
        cardId: currentCardId || undefined 
      }));

      // Update generatedSuggestions in Redux if currentCardId exists
      if (currentCardId) {
        dispatch(addGeneratedSuggestion({ 
          id: parseInt(currentCardId), 
          data: updatedSuggestion 
        }));
      }

      // Update finalResponses in Redux with new imageConfig
      if (currentCardId && editedImageConfig) {
        const currentFinalResponse = finalResponses[currentCardId];
        if (currentFinalResponse) {
          dispatch(setFinalResponse({
            cardId: currentCardId,
            data: {
              ...currentFinalResponse,
              imageConfig: editedImageConfig
            }
          }));
        }
      }

      toast({
        title: 'Image Updated',
        description: 'Badge image has been successfully updated.',
      });
    }

    setIsImageEditModalOpen(false);
  };

  const toggleAccordion = (type: 'canvas' | 'layer', key?: number) => {
    setAccordionStates(prev => {
      if (type === 'canvas') {
        return { ...prev, canvas: !prev.canvas };
      } else if (type === 'layer' && typeof key === 'number') {
        // Close all other layers and toggle the clicked one
        const newLayers: { [key: number]: boolean } = {};
        // First, close all layers
        Object.keys(prev.layers).forEach(k => {
          newLayers[parseInt(k)] = false;
        });
        // Then, open only the clicked layer if it wasn't already open
        newLayers[key] = !prev.layers[key];
        return { ...prev, layers: newLayers };
      }
      return prev;
    });
  };

  const updateImageConfig = (path: string, value: any) => {
    setEditedImageConfig((prev: any) => {
      if (!prev) return prev;
      const newConfig = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = newConfig;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;

      // Trigger debounced image generation with the updated config
      debouncedGenerateImageWithConfig(newConfig);

      return newConfig;
    });
  };

  const generateImage = async (config?: any, logo?: File | null) => {
    const configToUse = config || editedImageConfig;
    if (!configToUse) return;

    setIsGeneratingImage(true);
    try {
      let response;

      // Use the logo parameter if provided, otherwise fall back to uploadedLogo state
      const logoToUse = logo !== undefined ? logo : uploadedLogo;

      // If logo is uploaded, use FormData API
      if (logoToUse) {
        const formData = new FormData();
        formData.append('logo', logoToUse);
        formData.append('config', JSON.stringify(configToUse));

        response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/badge/generate-with-logo`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Use regular JSON API
        response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/badge/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(configToUse),
        });
      }

      const result = await response.json();

      if (result.success && result.data?.base64) {
        setGeneratedImage(result.data.base64);
      } else {
        console.error('Image generation failed:', result);
      }
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };


  const debouncedGenerateImageWithConfig = (config: any) => {
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer
    const newTimer = setTimeout(() => {
      generateImage(config);
    }, 500);

    setDebounceTimer(newTimer);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a PNG or SVG file only.',
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Please upload a file smaller than 5MB.',
      });
      return;
    }

    // Store the file and its name
    setUploadedLogo(file);
    setLogoFileName(file.name);

    // Convert file to base64 synchronously (wait for it to complete)
    const base64String = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    // Update config with base64 (this completes before generateImage is called)
    setEditedImageConfig((prev: any) => ({
      ...prev,
      logoBase64: base64String,
      logoFileName: file.name,
      logoFileType: file.type
    }));

    toast({
      title: 'Logo Uploaded',
      description: `${file.name} has been uploaded successfully.`,
    });

    // Trigger immediate image generation with the uploaded logo
    generateImage(editedImageConfig, file);
  };

  const handleRemoveLogo = () => {
    setUploadedLogo(null);
    setLogoFileName('');

    // Remove logo data from config
    setEditedImageConfig((prev: any) => {
      const { logoBase64, logoFileName, logoFileType, ...rest } = prev || {};
      return rest;
    });

    toast({
      title: 'Logo Removed',
      description: 'The logo has been removed.',
    });

    // Trigger immediate image regeneration without logo
    generateImage(editedImageConfig, null);
  };

  const switchToCard = (cardId: string) => {
    try {
      const rawFinalData = finalResponses[cardId];
      if (rawFinalData) {
        // Extract mapped suggestion from raw final data
        let mappedSuggestion;
        if (rawFinalData.credentialSubject && rawFinalData.credentialSubject.achievement) {
          // New API format: { credentialSubject: { achievement: { name, description, criteria: { narrative }, image } } }
          const achievement = rawFinalData.credentialSubject.achievement;
          mappedSuggestion = {
            title: achievement.name,
            description: achievement.description,
            criteria: achievement.criteria?.narrative || achievement.description,
            image: achievement.image?.id || undefined,
          };
        } else {
          // Legacy API format: { badge_name, badge_description, criteria: { narrative } }
          mappedSuggestion = {
            title: rawFinalData.badge_name,
            description: rawFinalData.badge_description,
            criteria: rawFinalData.criteria?.narrative || rawFinalData.badge_description,
            image: undefined,
          };
        }

        setBadgeSuggestion(mappedSuggestion);
        setCurrentCardId(cardId);
      }
    } catch (error) {
      console.error('Error switching to card:', error);
    }
  };

  const handleRegenerate = async () => {
    if (!originalContent) {
      toast({
        variant: 'destructive',
        title: 'No Content Found',
        description: 'Original content not found. Please go back and generate new suggestions.',
      });
      return;
    }

    setIsRegenerating(true);
    setIsStreaming(true);
    setStreamingContent('');
    setStreamingRawContent('');
    setStreamingError(null);

    try {
      const apiClient = new StreamingApiClient();

      // Build API payload
      const payload = {
        course_input: originalContent,
        badge_configuration: {
          badge_style: badgeConfiguration.badge_style || 'professional',
          badge_tone: badgeConfiguration.badge_tone || 'authoritative',
          criterion_style: badgeConfiguration.criterion_style || 'task-oriented',
          badge_level: badgeConfiguration.badge_level || 'not-specified',
          institution: badgeConfiguration.institution || '',
          institute_url: badgeConfiguration.institute_url || '',
          custom_instructions: badgeConfiguration.user_prompt || ''
        },
        enable_skill_extraction: isLaiserEnabled,
        context_length: null,
        image_generation: {
          enable_image_generation: false // Regeneration doesn't re-generate image
        }
      };

      for await (const response of apiClient.generateSuggestionsStream(payload)) {

        switch (response.type) {
          case 'start':
            setStreamingContent('AI stream started, waiting for response...');
            break;

          case 'data':
            // Our StreamingApiClient emits { rawContent, latestToken, ... } for token events
            // but may also surface plain strings or objects when parsing fails.
            const raw = (response?.data?.rawContent
              ?? response?.data?.accumulated
              ?? (typeof response?.data === 'string' ? response.data : '')) as string;
            setStreamingRawContent(raw);

            // Try to parse JSON fenced in ```json ... ``` blocks from the raw content
            try {
              const jsonMatch = raw?.match(/```json\s*([\s\S]*?)\s*```/);
              if (jsonMatch) {
                const jsonStr = jsonMatch[1];
                const parsed = JSON.parse(jsonStr);
                setStreamingContent(JSON.stringify(parsed, null, 2));
              } else {
                // Fallback: show raw content while streaming
                setStreamingContent(raw || '');
              }
            } catch (e) {
              // If JSON parsing fails, still surface the raw content so the user sees progress
              setStreamingContent(raw || '');
            }
            break;

          case 'final':

            // Handle final response
            const finalData = response.data;
            const mappedSuggestion = response.mappedSuggestion;

            if (mappedSuggestion) {
              setBadgeSuggestion(mappedSuggestion);
              updateAllLocalStorageKeys(mappedSuggestion, currentCardId);

              toast({
                title: 'Badge Regenerated',
                description: 'Your badge has been successfully regenerated.',
              });
            }

            // Use base64 image from final payload when available
            try {
              const base64: string | undefined = (
                finalData?.credentialSubject?.achievement?.image?.image_base64 ||
                finalData?.image?.image_base64
              );
              if (base64) {
                const imageSrc = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
                setBadgeSuggestion(prev => {
                  if (!prev) return prev;
                  const updated = { ...prev, image: imageSrc };
                  updateAllLocalStorageKeys(updated, currentCardId);
                  return updated;
                });

                // Also update imageConfig in finalResponses if available
                if (currentCardId && finalData?.imageConfig) {
                  const currentFinalResponse = finalResponses[currentCardId];
                  if (currentFinalResponse) {
                    dispatch(setFinalResponse({
                      cardId: currentCardId,
                      data: {
                        ...currentFinalResponse,
                        imageConfig: finalData.imageConfig
                      }
                    }));
                  }
                }
              }
            } catch (e) {
              console.error('Failed to use base64 image from final payload:', e);
            }

            setStreamingComplete(true);
            // Keep isStreaming true to show completion message
            setStreamingContent('');
            setStreamingRawContent('');
            break;

          case 'error':
            setStreamingError(response.error || 'Unknown error occurred');
            setIsStreaming(false);
            setStreamingComplete(false);
            break;

          default:
            break;
        }
      }
    } catch (error) {
      console.error('Error regenerating badge:', error);
      setStreamingError('Failed to regenerate the badge. Please try again.');
      setIsStreaming(false);
      setStreamingComplete(false);
      toast({
        variant: 'destructive',
        title: 'Regeneration Failed',
        description: 'Failed to regenerate the badge. Please try again.',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSkillClick = (skill: any) => {
    setSelectedSkill(skill);
    setIsSkillModalOpen(true);
  };

  const handleEditField = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValues(prev => ({ ...prev, [field]: currentValue }));
  };

  const handleSaveField = (field: string) => {
    if (!badgeSuggestion) return;

    const updatedSuggestion = { ...badgeSuggestion };
    (updatedSuggestion as any)[field] = editValues[field as keyof typeof editValues];

    setBadgeSuggestion(updatedSuggestion);
    updateAllLocalStorageKeys(updatedSuggestion, currentCardId);

    setEditingField(null);

    toast({
      title: 'Field Updated!',
      description: `${field.charAt(0).toUpperCase() + field.slice(1)} has been updated successfully.`,
    });
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValues({ title: '', description: '', criteria: '' });
  };

  // Helper function to update all Redux state with new suggestion data
  const updateAllLocalStorageKeys = useCallback((updatedSuggestion: BadgeSuggestion, cardId?: string | null) => {
    try {
      // Update selectedBadgeSuggestion in Redux
      dispatch(setSelectedBadgeSuggestion({ 
        suggestion: updatedSuggestion, 
        cardId: cardId || undefined 
      }));

      // Update finalResponses if cardId is provided
      if (cardId) {
        const currentFinalResponse = finalResponses[cardId];
        if (currentFinalResponse) {
          const updatedResponse = { ...currentFinalResponse };
          // Update the final response with new data
          if (updatedResponse.credentialSubject?.achievement) {
            updatedResponse.credentialSubject.achievement.name = updatedSuggestion.title;
            updatedResponse.credentialSubject.achievement.description = updatedSuggestion.description;
            updatedResponse.credentialSubject.achievement.criteria = { narrative: updatedSuggestion.criteria };
            if (updatedSuggestion.image) {
              updatedResponse.credentialSubject.achievement.image = { id: updatedSuggestion.image };
            }
          } else {
            updatedResponse.badge_name = updatedSuggestion.title;
            updatedResponse.badge_description = updatedSuggestion.description;
            updatedResponse.criteria = { narrative: updatedSuggestion.criteria };
            if (updatedSuggestion.image) {
              updatedResponse.image = updatedSuggestion.image;
            }
          }
          dispatch(setFinalResponse({ cardId, data: updatedResponse }));
        }
      }

      // Update generatedSuggestions in Redux
      const targetSuggestionId = cardId ? parseInt(cardId) : null;
      if (targetSuggestionId) {
        dispatch(addGeneratedSuggestion({ 
          id: targetSuggestionId, 
          data: updatedSuggestion 
        }));
      }
    } catch (error) {
      console.error('Error updating Redux state:', error);
    }
  }, [dispatch, finalResponses]);

  const generateBadgeJSON = () => {
    // Use selectedBadgeSuggestion to generate JSON
    if (!badgeSuggestion) return null;

    const achievement: any = {
      "name": badgeSuggestion.title,
      "description": badgeSuggestion.description,
      "criteria": {
        "narrative": badgeSuggestion.criteria
      }
    };

    // Only include image if image generation was enabled and image exists
    if (badgeSuggestion.enable_image_generation !== false && badgeSuggestion.image) {
      achievement.image = {
        "id": badgeSuggestion.image,
        "type": "Image"
      };
    }

    // Add alignment array if skills exist
    if (badgeSuggestion.skills && badgeSuggestion.skills.length > 0) {
      achievement.alignment = badgeSuggestion.skills.map((skill: any) => ({
        type: skill.type || "Alignment",
        targetType: skill.targetType || "ESCO:Skill",
        targetName: skill.targetName,
        targetDescription: skill.targetDescription,
        targetUrl: skill.targetUrl
      }));
    }

    return {
      "credentialSubject": {
        "achievement": achievement
      }
    };
  };

  const handleCopyJSON = () => {
    const badgeJSON = generateBadgeJSON();
    if (!badgeJSON) return;

    const jsonString = JSON.stringify(badgeJSON, null, 2);

    navigator.clipboard.writeText(jsonString).then(() => {
      toast({
        title: 'Copied!',
        description: 'Badge JSON has been copied to clipboard.',
      });
    }).catch(() => {
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Failed to copy JSON to clipboard.',
      });
    });
  };

  const handleExportJSON = () => {
    const badgeJSON = generateBadgeJSON();
    if (!badgeJSON) return;

    const jsonString = JSON.stringify(badgeJSON, null, 2);
    const dataBlob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;

    // Use title from mapped suggestion for filename
    const title = badgeSuggestion?.title || 'badge';
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Exported!',
      description: `Badge JSON has been downloaded as ${title}.json`,
    });
  };

  if (!badgeSuggestion) {
    return (
      <main className="container mx-auto bg-gray-50 p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-body">Loading badge suggestion...</p>
        </div>
      </main>
    );
  }

  // Determine if Column 3 (Image/Skills) should be shown
  const hasUploadedBadgeImage = badgeSuggestion.uploaded_badge_image ? true : false;
  const hasGeneratedImage = badgeSuggestion.enable_image_generation !== false && badgeSuggestion.image;
  const hasImagePreview = hasUploadedBadgeImage || hasGeneratedImage;
  const hasSkills = badgeSuggestion.skills && badgeSuggestion.skills.length > 0;
  const showColumn3 = hasImagePreview || hasSkills;
  
  // Determine which image to display (prioritize uploaded badge image)
  const displayImageUrl = badgeSuggestion.uploaded_badge_image || badgeSuggestion.image;

  // Adjust column spans based on whether Column 3 is visible
  const column1Span = showColumn3 ? "lg:col-span-3" : "lg:col-span-4";
  const column2Span = showColumn3 ? "lg:col-span-6" : "lg:col-span-8";

  return (
    <main id="main-content" className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => router.push('/suggestions')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex justify-center">
          {/* 3-Column Layout */}
          <div className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Column 1: Configuration */}
              <div className={column1Span}>
                <BadgeConfiguration
                  onRegenerate={handleRegenerate}
                  isRegenerating={isRegenerating}
                  onConfigurationChange={handleConfigurationChange}
                  initialConfig={badgeConfiguration}
                />
              </div>

              {/* Column 2: Badge Suggestion Editor / Streaming */}
              <div className={column2Span}>
                {isStreaming ? (
                  streamingError ? (
                    <Card className="border-red-300 shadow-lg bg-red-50 h-full">
                      <CardHeader className="pb-8">
                        <div className="mb-3">
                          <CardTitle className="text-3xl font-bold text-red-800 flex items-center gap-3">
                            <div className="rounded-full h-6 w-6 border-2 border-red-500 flex items-center justify-center">
                              <span className="text-red-500 text-sm">!</span>
                            </div>
                            Regeneration Failed
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="px-8 pb-8">
                        <div className="text-red-700 bg-red-100 p-4 rounded-lg border border-red-200">
                          <h4 className="font-semibold mb-2">Error:</h4>
                          <p>{streamingError}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <SuggestionCard
                      id={currentCardId ? parseInt(currentCardId) : 1}
                      data={streamingComplete ? badgeSuggestion : null}
                      loading={isStreaming && !streamingComplete}
                      error={streamingError}
                      progress={streamingComplete ? 100 : (streamingContent ? 50 : 0)}
                      streamingText="Regenerating badge..."
                      streamingContent={streamingContent ? {
                        title: streamingContent.includes('badge_name') ? 'Parsing...' : undefined,
                        description: streamingContent.includes('badge_description') ? 'Parsing...' : undefined,
                        criteria: streamingContent.includes('criteria') ? 'Parsing...' : undefined,
                      } : undefined}
                      rawStreamingContent={streamingRawContent}
                      isStreamingComplete={streamingComplete}
                      onClick={() => {
                        // No navigation needed in editor context
                      }}
                    />
                  )
                ) : (
                  <Card className="border-secondary shadow-lg bg-white">
                    <CardHeader className='pb-4'>
                      <div className="mb-3">
                        <CardTitle className="text-primary font-headline font-bold text-lg">
                          Badge Suggestion Editor
                        </CardTitle>
                      </div>
                    </CardHeader>

                    <CardContent className="px-8 pb-8 space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-gray-700">Title:</label>
                          {editingField !== 'title' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditField('title', badgeSuggestion.title)}
                              className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {editingField === 'title' ? (
                          <div className="space-y-2">
                            <Input
                              value={editValues.title}
                              onChange={(e) => setEditValues(prev => ({ ...prev, title: e.target.value }))}
                              className="font-body"
                              placeholder="Enter badge title..."
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveField('title')}
                                className="bg-primary hover:bg-primary/90 text-white"
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-800 font-body">{badgeSuggestion.title}</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-gray-700">Description:</label>
                          {editingField !== 'description' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditField('description', badgeSuggestion.description)}
                              className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {editingField === 'description' ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editValues.description}
                              onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                              className="font-body min-h-[100px]"
                              placeholder="Enter badge description..."
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveField('description')}
                                className="bg-primary hover:bg-primary/90 text-white"
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-800 font-body leading-relaxed">{badgeSuggestion.description}</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-gray-700">Criteria:</label>
                          {editingField !== 'criteria' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditField('criteria', badgeSuggestion.criteria)}
                              className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {editingField === 'criteria' ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editValues.criteria}
                              onChange={(e) => setEditValues(prev => ({ ...prev, criteria: e.target.value }))}
                              className="font-body min-h-[120px]"
                              placeholder="Enter badge criteria..."
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveField('criteria')}
                                className="bg-primary hover:bg-primary/90 text-white"
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-800 font-body leading-relaxed">{badgeSuggestion.criteria}</p>
                          </div>
                        )}
                      </div>

                    </CardContent>

                    <CardFooter className="px-8 pb-8 flex justify-end">
                      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                          <Button
                            className="bg-primary hover:bg-primary/90 text-white"
                            onClick={() => setIsModalOpen(true)}
                          >
                            Generate JSON
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                          {/* Fixed Header */}
                          <div className="flex-shrink-0 -mx-6 -mt-6 px-6 py-4 border-b bg-white">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-bold text-gray-900">
                                Badge JSON
                              </DialogTitle>
                              {/* <DialogDescription className="text-gray-600">
                          Copy or export the badge JSON structure below.
                        </DialogDescription> */}
                            </DialogHeader>
                          </div>

                          {/* Scrollable JSON Content */}
                          <div className="flex-1 overflow-auto -mx-6 px-6 py-4 min-h-0">
                            <div className="bg-gray-50 rounded-lg p-4 border overflow-auto">
                              <pre className="text-sm font-mono text-gray-800 whitespace-pre">
                                {JSON.stringify(generateBadgeJSON(), null, 2)}
                              </pre>
                            </div>
                          </div>

                          {/* Fixed Footer */}
                          <div className="flex-shrink-0 -mx-6 -mb-6 px-6 py-4 border-t bg-white flex gap-3">
                            <Button
                              variant="outline"
                              onClick={handleCopyJSON}
                              className="flex items-center gap-2"
                            >
                              <Copy className="h-4 w-4" />
                              Copy JSON
                            </Button>
                            <Button
                              onClick={handleExportJSON}
                              className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
                            >
                              <FileDown className="h-4 w-4" />
                              Export JSON
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardFooter>
                  </Card>
                )}

                {/* Skill Details Modal */}
                <Dialog open={isSkillModalOpen} onOpenChange={setIsSkillModalOpen}>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-gray-900">
                        {selectedSkill?.targetName || 'Skill Details'}
                      </DialogTitle>
                      {selectedSkill?.targetUrl && (
                        <DialogDescription>
                          <a
                            href={selectedSkill.targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-secondary hover:underline inline-flex items-center gap-1"
                          >
                            View URL →
                          </a>
                        </DialogDescription>
                      )}
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                      {/* Description */}
                      {selectedSkill?.targetDescription && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                          <p className="text-sm text-gray-600 leading-relaxed">{selectedSkill.targetDescription}</p>
                        </div>
                      )}

                      {/* Knowledge Required */}
                      {selectedSkill?.['Knowledge Required'] && Array.isArray(selectedSkill['Knowledge Required']) && selectedSkill['Knowledge Required'].length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Knowledge Required</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedSkill['Knowledge Required'].map((item: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-sm py-1 px-3">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Task Abilities */}
                      {selectedSkill?.['Task Abilities'] && Array.isArray(selectedSkill['Task Abilities']) && selectedSkill['Task Abilities'].length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Task Abilities</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedSkill['Task Abilities'].map((item: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-sm py-1 px-3">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skill Tag */}
                      {selectedSkill?.['Skill Tag'] && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Skill Tag</h4>
                          <Badge variant="secondary" className="text-sm py-1 px-3">
                            {selectedSkill['Skill Tag']}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Column 3: Badge Image Display and Skills - Only render if there's content */}
              {showColumn3 && (
                <div className="lg:col-span-3 space-y-6">
                  {/* Show image if uploaded or generated */}
                  {hasImagePreview && (
                    <BadgeImageDisplay
                      imageUrl={displayImageUrl}
                      imageConfig={currentCardId ? finalResponses[currentCardId]?.imageConfig : null}
                      onEditImage={hasGeneratedImage ? handleEditImage : undefined}
                    />
                  )}

                  {/* Skills Section */}
                  {hasSkills && (
                  <Card className="border-secondary shadow-lg">
                    <CardContent className="p-0">
                      <Accordion type="single" collapsible defaultValue="skills">
                        <AccordionItem value="skills" className="border-secondary bg-gray-50 rounded-lg border-b-0 [&:hover]:border-secondary">
                          <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-4">
                              <h3 className="text-primary font-headline font-bold text-md">Skills (powered by LAiSER)</h3>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-4 mt-2 h-[calc(100vh-400px)] overflow-y-auto pr-2">
                              {badgeSuggestion.skills?.map((skillObj, index) => (
                                skillObj.targetName && (
                                  <div
                                    key={index}
                                    className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
                                  >
                                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                                      {skillObj.targetName}
                                    </h4>
                                    {skillObj.targetDescription && (
                                      <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                                        {skillObj.targetDescription}
                                      </p>
                                    )}
                                    {skillObj.targetType && (
                                      <div className="mb-2">
                                        <span className="text-xs text-gray-500 mr-2">Type:</span>
                                        {skillObj.targetUrl ? (
                                          <a
                                            href={skillObj.targetUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-secondary hover:underline inline-flex items-center gap-1"
                                          >
                                            {skillObj.targetType} →
                                          </a>
                                        ) : (
                                          <span className="text-xs text-gray-700">{skillObj.targetType}</span>
                                        )}
                                      </div>
                                    )}
                                    {skillObj.targetUrl && !skillObj.targetType && (
                                      <a
                                        href={skillObj.targetUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-secondary hover:underline inline-flex items-center gap-1"
                                      >
                                        View URL →
                                      </a>
                                    )}
                                  </div>
                                )
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Image Edit Modal */}
        <Dialog open={isImageEditModalOpen} onOpenChange={(open) => {
          if (!open) {
            // When closing, don't auto-apply changes - let user decide
            setIsImageEditModalOpen(false);
            // Reset any unsaved changes
            setGeneratedImage(null);
            setEditedImageConfig(null);
          } else {
            setIsImageEditModalOpen(open);
          }
        }}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    Edit Badge Image
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Customize your badge image settings and configuration.
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-3 pr-8">
                  <Button
                    onClick={handleApplyImageChanges}
                    disabled={!generatedImage}
                    className="bg-secondary text-white hover:bg-secondary/90"
                  >
                    Apply Changes
                  </Button>
                  <Button
                    onClick={() => {
                      if (generatedImage) {
                        const link = document.createElement('a');
                        link.href = generatedImage;
                        link.download = `${badgeSuggestion?.title || 'badge'}.png`;
                        link.click();
                      }
                    }}
                    disabled={!generatedImage}
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary hover:text-white"
                  >
                    Download PNG
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex h-[70vh] overflow-hidden">
              {/* Left Section: Layer Navigation */}
              <div className="w-64 bg-white border border-gray-200 rounded-l-lg flex flex-col">
                <div className="flex-1 overflow-y-auto p-2">
                  {editedImageConfig?.layers?.map((layer: any, index: number) => {
                    const layerType = layer.type;
                    const isActive = accordionStates.layers[index];

                    // Don't render BackgroundLayer
                    if (layerType === 'BackgroundLayer') {
                      return null;
                    }

                    // Get display name for layer
                    let displayName = layerType;
                    if (layerType === 'ShapeLayer') {
                      displayName = 'Shape';
                    } else if (layerType === 'LogoLayer') {
                      displayName = 'Logo';
                    } else if (layerType === 'ImageLayer') {
                      displayName = 'Image';
                    } else if (layerType === 'TextLayer') {
                      // Count how many TextLayers appear before this one
                      const textLayerCount = editedImageConfig.layers
                        .slice(0, index)
                        .filter((l: any) => l.type === 'TextLayer').length + 1;
                      displayName = `Text ${textLayerCount}`;
                    }

                    return (
                      <button
                        key={index}
                        className={`w-full p-3 mb-2 text-left rounded-lg border transition-all duration-200 ${isActive
                          ? 'bg-secondary text-white border-secondary shadow-md'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-secondary hover:bg-secondary/5'
                          }`}
                        onClick={() => toggleAccordion('layer', index)}
                      >
                        <span className="text-sm font-medium">
                          {displayName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex">
                {/* Layer Details Panel */}
                <div className={`bg-white border border-gray-200 overflow-y-auto transition-all duration-300 ${editedImageConfig?.layers?.some((_: any, index: number) => accordionStates.layers[index])
                  ? 'w-80'
                  : 'w-0'
                  }`}>
                  {editedImageConfig?.layers?.some((_: any, index: number) => accordionStates.layers[index]) && (
                    <>
                      <div className="p-4">
                        {(() => {
                          // Find the active layer
                          const activeLayerIndex = editedImageConfig?.layers?.findIndex((_: any, index: number) => accordionStates.layers[index]);
                          if (activeLayerIndex === -1 || activeLayerIndex === undefined) return null;

                          const layer = editedImageConfig.layers[activeLayerIndex];
                          const layerType = layer.type;

                          return (
                            <div className="space-y-4">
                              {/* BackgroundLayer */}
                              {/* {layerType === 'BackgroundLayer' && (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Mode</label>
                                  <select
                                    value={layer.mode || 'solid'}
                                    onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.mode`, e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-transparent"
                                  >
                                    <option value="solid">Solid</option>
                                    <option value="gradient">Gradient</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="color"
                                      value={layer.color || IMAGE_EDITOR_DEFAULTS.backgroundColor}
                                      onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.color`, e.target.value)}
                                      className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                                    />
                                    <input
                                      type="text"
                                      value={layer.color || IMAGE_EDITOR_DEFAULTS.backgroundColor}
                                      onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.color`, e.target.value)}
                                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-transparent"
                                    />
                                  </div>
                                </div>
                              </>
                            )} */}

                              {/* ShapeLayer */}
                              {layerType === 'ShapeLayer' && (
                                <>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Shape *</label>
                                    <select
                                      value={layer.shape || ''}
                                      onChange={(e) => {
                                        const newShape = e.target.value;

                                        // Create a deep copy of the config
                                        const updatedConfig = JSON.parse(JSON.stringify(editedImageConfig));

                                        // Update the shape
                                        updatedConfig.layers[activeLayerIndex].shape = newShape;

                                        // Set default params based on shape type
                                        if (newShape === 'rounded_rect') {
                                          if (!updatedConfig.layers[activeLayerIndex].params) {
                                            updatedConfig.layers[activeLayerIndex].params = {};
                                          }
                                          updatedConfig.layers[activeLayerIndex].params.radius = 50;
                                          updatedConfig.layers[activeLayerIndex].params.width = updatedConfig.layers[activeLayerIndex].params.width || 450;
                                          updatedConfig.layers[activeLayerIndex].params.height = updatedConfig.layers[activeLayerIndex].params.height || 450;
                                        } else if (newShape === 'hexagon' || newShape === 'circle') {
                                          if (!updatedConfig.layers[activeLayerIndex].params) {
                                            updatedConfig.layers[activeLayerIndex].params = {};
                                          }
                                          updatedConfig.layers[activeLayerIndex].params.radius = 250;
                                        }

                                        // Update state and generate image
                                        setEditedImageConfig(updatedConfig);
                                        generateImage(updatedConfig);
                                      }}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-transparent"
                                    >
                                      <option value="hexagon">Hexagon</option>
                                      <option value="circle">Circle</option>
                                      <option value="rounded_rect">Rounded Rectangle</option>
                                    </select>
                                  </div>

                                  {layer.fill && (
                                    <>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Fill Mode *</label>
                                        <select
                                          value={layer.fill.mode || 'solid'}
                                          onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.fill.mode`, e.target.value)}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-transparent"
                                        >
                                          <option value="solid">Solid</option>
                                          <option value="gradient">Gradient</option>
                                        </select>
                                      </div>
                                      {layer.fill.mode === 'gradient' ? (
                                        <>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Start Color *</label>
                                            <div className="flex items-center space-x-2">
                                              <input
                                                type="color"
                                                value={layer.fill.start_color || IMAGE_EDITOR_DEFAULTS.gradientStart}
                                                onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.fill.start_color`, e.target.value)}
                                                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                                              />
                                              <input
                                                type="text"
                                                value={layer.fill.start_color || IMAGE_EDITOR_DEFAULTS.gradientStart}
                                                onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.fill.start_color`, e.target.value)}
                                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-transparent"
                                              />
                                            </div>
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">End Color *</label>
                                            <div className="flex items-center space-x-2">
                                              <input
                                                type="color"
                                                value={layer.fill.end_color || IMAGE_EDITOR_DEFAULTS.gradientEnd}
                                                onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.fill.end_color`, e.target.value)}
                                                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                                              />
                                              <input
                                                type="text"
                                                value={layer.fill.end_color || IMAGE_EDITOR_DEFAULTS.gradientEnd}
                                                onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.fill.end_color`, e.target.value)}
                                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-transparent"
                                              />
                                            </div>
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Gradient Direction</label>
                                            <select
                                              value={layer.fill.vertical ? 'vertical' : 'horizontal'}
                                              onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.fill.vertical`, e.target.value === 'vertical')}
                                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-transparent"
                                            >
                                              <option value="vertical">Vertical</option>
                                              <option value="horizontal">Horizontal</option>
                                            </select>
                                          </div>
                                        </>
                                      ) : (
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">Fill Color *</label>
                                          <div className="flex items-center space-x-2">
                                            <input
                                              type="color"
                                              value={layer.fill.color || IMAGE_EDITOR_DEFAULTS.fillColor}
                                              onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.fill.color`, e.target.value)}
                                              className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                                            />
                                            <input
                                              type="text"
                                              value={layer.fill.color || IMAGE_EDITOR_DEFAULTS.fillColor}
                                              onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.fill.color`, e.target.value)}
                                              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-transparent"
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}

                                  {layer.border && (
                                    <>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Border Width *</label>
                                        <input
                                          type="number"
                                          value={layer.border.width || 0}
                                          onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.border.width`, parseInt(e.target.value))}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-transparent"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Border Color *</label>
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="color"
                                            value={layer.border.color || IMAGE_EDITOR_DEFAULTS.borderColor}
                                            onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.border.color`, e.target.value)}
                                            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                                          />
                                          <input
                                            type="text"
                                            value={layer.border.color || IMAGE_EDITOR_DEFAULTS.borderColor}
                                            onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.border.color`, e.target.value)}
                                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-transparent"
                                          />
                                        </div>
                                      </div>
                                    </>
                                  )}

                                  {layer.params && (
                                    <>
                                      {(layer.shape === 'hexagon' || layer.shape === 'circle' || layer.shape === 'rounded_rect') && (
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">
                                            {layer.shape === 'rounded_rect' ? 'Corner Radius' : 'Size'}
                                          </label>
                                          <input
                                            type="number"
                                            value={layer.params?.radius || (layer.shape === 'rounded_rect' ? 50 : 250)}
                                            onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.params.radius`, parseInt(e.target.value))}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-transparent"
                                          />
                                        </div>
                                      )}
                                      {layer.shape === 'rounded_rect' && (
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">Width</label>
                                          <input
                                            type="number"
                                            value={layer.params?.width || 450}
                                            onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.params.width`, parseInt(e.target.value))}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-transparent"
                                          />
                                        </div>
                                      )}
                                      {layer.shape === 'rounded_rect' && (
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">Height</label>
                                          <input
                                            type="number"
                                            value={layer.params?.height || 450}
                                            onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.params.height`, parseInt(e.target.value))}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-transparent"
                                          />
                                        </div>
                                      )}
                                    </>
                                  )}
                                </>
                              )}

                              {/* LogoLayer */}
                              {layerType === 'LogoLayer' && (
                                <>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Upload Logo</label>
                                    <input
                                      type="file"
                                      id="logo-upload-input"
                                      accept=".png,.svg"
                                      onChange={handleLogoUpload}
                                      className="hidden"
                                    />
                                    {!logoFileName ? (
                                      <button
                                        type="button"
                                        onClick={() => document.getElementById('logo-upload-input')?.click()}
                                        className="w-full px-3 py-2 text-sm border border-secondary text-secondary rounded hover:bg-secondary hover:text-white transition-colors flex items-center justify-center gap-2"
                                      >
                                        <Upload className="h-4 w-4" />
                                        Choose Logo File
                                      </button>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700 truncate">
                                          {logoFileName}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={handleRemoveLogo}
                                          className="px-2 py-2 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                                          title="Remove logo"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">Supported: PNG, SVG (max 5MB)</p>
                                  </div>
                                  {layer.size !== undefined && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Size *</label>
                                      <div className="space-y-2">
                                        <input
                                          type="range"
                                          min="50"
                                          max="1000"
                                          value={typeof layer.size === 'object' ? 400 : layer.size}
                                          onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.size`, parseInt(e.target.value))}
                                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                                        />
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="text-gray-500">50px</span>
                                          <span className="text-sm font-medium text-gray-700">{typeof layer.size === 'object' ? 400 : layer.size}px</span>
                                          <span className="text-gray-500">1000px</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {layer.position && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Y Position *</label>
                                      <div className="space-y-2">
                                        <input
                                          type="range"
                                          min="50"
                                          max="550"
                                          value={layer.position.y || 300}
                                          onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.position.y`, parseInt(e.target.value))}
                                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                                        />
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="text-gray-500">50</span>
                                          <span className="text-sm font-medium text-gray-700">{layer.position.y || 300}</span>
                                          <span className="text-gray-500">550</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}

                              {/* ImageLayer */}
                              {layerType === 'ImageLayer' && (
                                <>
                                  {layer.size !== undefined && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Size *</label>
                                      <div className="space-y-2">
                                        <input
                                          type="range"
                                          min="50"
                                          max="500"
                                          value={typeof layer.size === 'object' ? 400 : layer.size}
                                          onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.size`, parseInt(e.target.value))}
                                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                                        />
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="text-gray-500">50px</span>
                                          <span className="text-sm font-medium text-gray-700">{typeof layer.size === 'object' ? 400 : layer.size}px</span>
                                          <span className="text-gray-500">500px</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}

                              {/* TextLayer */}
                              {layerType === 'TextLayer' && (
                                <>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Text *</label>
                                    <input
                                      type="text"
                                      value={layer.text || ''}
                                      onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.text`, e.target.value)}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-transparent"
                                    />
                                  </div>
                                  {layer.font && (
                                    <>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Font Path</label>
                                        <select
                                          value={layer.font.path?.replace('assets/fonts/', '').replace('.ttf', '') || 'Arial'}
                                          onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.font.path`, `assets/fonts/${e.target.value}.ttf`)}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-transparent"
                                        >
                                          <option value="Arial">Arial</option>
                                          <option value="ArialBold">Arial Bold</option>
                                          <option value="OpenSans">Open Sans</option>
                                          <option value="Roboto">Roboto</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Font Size *</label>
                                        <input
                                          type="number"
                                          value={layer.font.size || 12}
                                          onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.font.size`, parseInt(e.target.value))}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-transparent"
                                        />
                                      </div>
                                    </>
                                  )}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Text Color *</label>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="color"
                                        value={layer.color || IMAGE_EDITOR_DEFAULTS.textColor}
                                        onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.color`, e.target.value)}
                                        className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                                      />
                                      <input
                                        type="text"
                                        value={layer.color || IMAGE_EDITOR_DEFAULTS.textColor}
                                        onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.color`, e.target.value)}
                                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-transparent"
                                      />
                                    </div>
                                  </div>
                                  {layer.align && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Y Align *</label>
                                      <div className="space-y-2">
                                        <input
                                          type="range"
                                          min="150"
                                          max="850"
                                          value={layer.align.y || 500}
                                          onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.align.y`, parseInt(e.target.value))}
                                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                                        />
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="text-gray-500">150</span>
                                          <span className="text-sm font-medium text-gray-700">{layer.align.y || 500}</span>
                                          <span className="text-gray-500">850</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {/* Line Gap */}
                                  {/* {layer.wrap && layer.wrap.line_gap && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Line Gap</label>
                                      <input
                                        type="number"
                                        value={layer.wrap.line_gap}
                                        onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.wrap.line_gap`, parseInt(e.target.value))}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-transparent"
                                      />
                                    </div>
                                  )} */}
                                </>
                              )}

                            </div>
                          );
                        })()}

                        {(!editedImageConfig?.layers || editedImageConfig.layers.length === 0) && (
                          <div className="text-center p-4 text-gray-500 text-sm">
                            No layers found in image configuration
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Image Preview Section */}
                <div className="flex-1 flex flex-col border border-gray-200 rounded-r-lg overflow-hidden">
                  <div className="flex-1 flex items-center justify-center p-4 overflow-auto"
                    style={{
                      backgroundImage: `
                           linear-gradient(45deg, hsl(var(--muted) / 0.3) 25%, transparent 25%), 
                           linear-gradient(-45deg, hsl(var(--muted) / 0.3) 25%, transparent 25%), 
                           linear-gradient(45deg, transparent 75%, hsl(var(--muted) / 0.3) 75%), 
                           linear-gradient(-45deg, transparent 75%, hsl(var(--muted) / 0.3) 75%)
                         `,
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}>
                    {generatedImage ? (
                      <img
                        src={generatedImage}
                        alt={badgeSuggestion?.title ? `${badgeSuggestion.title} generated badge image` : "Generated badge image"}
                        className="max-w-full max-h-full object-contain relative z-10"
                      />
                    ) : (
                      <div className="text-center relative z-10">
                        <p className="text-sm text-gray-500">Badge Preview</p>
                        <p className="text-xs text-gray-400 mt-2">Image will generate automatically when you make changes</p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

    </main>
  );
}
