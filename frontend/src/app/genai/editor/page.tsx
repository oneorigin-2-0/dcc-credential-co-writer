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
import { StreamingApiClient } from '@/lib/api';
import type { BadgeSuggestion } from '@/lib/types';

export default function BadgeEditorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [badgeSuggestion, setBadgeSuggestion] = useState<BadgeSuggestion | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    title: string;
    description: string;
    criteria: string;
  }>({ title: '', description: '', criteria: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [originalContent, setOriginalContent] = useState<string>('');
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);
  const [availableCards, setAvailableCards] = useState<string[]>([]);
  const [badgeConfiguration, setBadgeConfiguration] = useState({
    badge_style: 'professional',
    badge_tone: 'authoritative',
    criterion_style: 'task-oriented',
    badge_level: 'not-specified',
    institution: '',
    institution_url: '',
  });
  const [userPrompt, setUserPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingRawContent, setStreamingRawContent] = useState('');
  const [streamingError, setStreamingError] = useState<string | null>(null);
  const [streamingComplete, setStreamingComplete] = useState(false);
  const [isImageEditModalOpen, setIsImageEditModalOpen] = useState(false);
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
    // Get selected badge suggestion from localStorage
    const storedSuggestion = localStorage.getItem('selectedBadgeSuggestion');
    if (storedSuggestion) {
      const parsedSuggestion = JSON.parse(storedSuggestion);
      setBadgeSuggestion(parsedSuggestion);
      
      // Try to find corresponding raw final data
      try {
        const finalResponses = JSON.parse(localStorage.getItem('finalResponses') || '{}');
        const cardIds = Object.keys(finalResponses);
        
        // Use the card ID directly if available
        if (parsedSuggestion.cardId && finalResponses[parsedSuggestion.cardId]) {
          setCurrentCardId(parsedSuggestion.cardId.toString());
          setAvailableCards(cardIds);
        } else {
          // Fallback: Look for raw data that matches this suggestion by name (backwards compatibility)
          for (const cardId of cardIds) {
            if (finalResponses[cardId] && finalResponses[cardId].credentialSubject?.achievement?.name === parsedSuggestion.title) {
              setCurrentCardId(cardId);
              setAvailableCards(cardIds);
              break;
            }
          }
        }
      } catch (error) {
        console.error('Error loading raw final data for selectedBadgeSuggestion:', error);
      }
    } else {
      // Try to load from finalResponses if no selectedBadgeSuggestion
      try {
        const finalResponses = JSON.parse(localStorage.getItem('finalResponses') || '{}');
        const cardIds = Object.keys(finalResponses);
        
        if (cardIds.length > 0) {
          // Use the first available final response
          const firstCardId = cardIds[0];
          const rawFinalData = finalResponses[firstCardId];
          
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
          setCurrentCardId(firstCardId);
          setAvailableCards(cardIds);
        } else {
          toast({
            variant: 'destructive',
            title: 'No Suggestion Available',
            description: 'Please go back and generate suggestions first.',
          });
          router.push('/genai/suggestions');
        }
      } catch (error) {
        console.error('Error loading from finalResponses:', error);
        toast({
          variant: 'destructive',
          title: 'No Suggestion Selected',
          description: 'Please go back and select a suggestion to edit.',
        });
        router.push('/genai/suggestions');
      }
    }

    // Get original content from localStorage
    const storedContent = localStorage.getItem('originalContent');
    if (storedContent) {
      setOriginalContent(storedContent);
    }
  }, []); // Empty dependency array since this should only run once on mount

  const handleConfigurationChange = useCallback((config: any) => {
    setBadgeConfiguration(config);
  }, []);

  const handleUserPromptChange = useCallback((prompt: string) => {
    setUserPrompt(prompt);
  }, []);

  const handleEditImage = async () => {
    // Get image config from finalResponses if available
    const originalConfig = currentCardId ?
      JSON.parse(localStorage.getItem('finalResponses') || '{}')[currentCardId]?.imageConfig || null :
      null;
    setModalImageConfig(originalConfig);
    // Create a deep copy for editing
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

      // Update localStorage - selectedBadgeSuggestion
      localStorage.setItem('selectedBadgeSuggestion', JSON.stringify(updatedSuggestion));

      // Update generatedSuggestions in localStorage if currentCardId exists
      if (currentCardId) {
        try {
          const existing = JSON.parse(localStorage.getItem('generatedSuggestions') || '[]');
          const updated = existing.filter((s: any) => s.id !== parseInt(currentCardId));
          updated.push({ id: parseInt(currentCardId), data: updatedSuggestion });
          localStorage.setItem('generatedSuggestions', JSON.stringify(updated));
        } catch (error) {
          console.error('Failed to update generatedSuggestions:', error);
        }
      }

      // Update finalResponses in localStorage with new imageConfig
      if (currentCardId && editedImageConfig) {
        try {
          const existingFinalResponses = JSON.parse(localStorage.getItem('finalResponses') || '{}');
          existingFinalResponses[currentCardId] = {
            ...existingFinalResponses[currentCardId],
            imageConfig: editedImageConfig
          };
          localStorage.setItem('finalResponses', JSON.stringify(existingFinalResponses));
        } catch (error) {
          console.error('Failed to update finalResponses:', error);
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
      const finalResponses = JSON.parse(localStorage.getItem('finalResponses') || '{}');
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
      
      for await (const response of apiClient.generateSuggestionsStream(originalContent, {
        regenerate: true,
        custom_instructions: userPrompt,
        ...badgeConfiguration,
      })) {
        
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
                  try {
                    const existingFinalResponses = JSON.parse(localStorage.getItem('finalResponses') || '{}');
                    existingFinalResponses[currentCardId] = {
                      ...existingFinalResponses[currentCardId],
                      imageConfig: finalData.imageConfig
                    };
                    localStorage.setItem('finalResponses', JSON.stringify(existingFinalResponses));
                  } catch (error) {
                    console.error('Failed to update imageConfig in finalResponses:', error);
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
            console.log('Stream error:', response.error);
            setStreamingError(response.error || 'Unknown error occurred');
            setIsStreaming(false);
            setStreamingComplete(false);
            break;
            
          default:
            console.log('Unknown response type:', response.type);
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

  // Helper function to update all localStorage keys with new suggestion data
  const updateAllLocalStorageKeys = useCallback((updatedSuggestion: BadgeSuggestion, cardId?: string | null) => {
    try {
      // Update selectedBadgeSuggestion
      localStorage.setItem('selectedBadgeSuggestion', JSON.stringify(updatedSuggestion));
      
      // Update finalResponses if cardId is provided
      if (cardId) {
        const existingFinalResponses = JSON.parse(localStorage.getItem('finalResponses') || '{}');
        const currentFinalResponse = existingFinalResponses[cardId];
        if (currentFinalResponse) {
          // Update the final response with new data
          if (currentFinalResponse.credentialSubject?.achievement) {
            currentFinalResponse.credentialSubject.achievement.name = updatedSuggestion.title;
            currentFinalResponse.credentialSubject.achievement.description = updatedSuggestion.description;
            currentFinalResponse.credentialSubject.achievement.criteria = { narrative: updatedSuggestion.criteria };
            if (updatedSuggestion.image) {
              currentFinalResponse.credentialSubject.achievement.image = { id: updatedSuggestion.image };
            }
          } else {
            currentFinalResponse.badge_name = updatedSuggestion.title;
            currentFinalResponse.badge_description = updatedSuggestion.description;
            currentFinalResponse.criteria = { narrative: updatedSuggestion.criteria };
            if (updatedSuggestion.image) {
              currentFinalResponse.image = updatedSuggestion.image;
            }
          }
          existingFinalResponses[cardId] = currentFinalResponse;
          localStorage.setItem('finalResponses', JSON.stringify(existingFinalResponses));
        }
      }
      
      // Update generatedSuggestions
      const existingSuggestions = JSON.parse(localStorage.getItem('generatedSuggestions') || '[]');
      let targetSuggestionId = cardId ? parseInt(cardId) : null;
      
      // If no cardId, find matching suggestion by title
      if (!targetSuggestionId) {
        const matchingSuggestion = existingSuggestions.find((suggestion: any) => 
          suggestion.data && suggestion.data.title === updatedSuggestion.title
        );
        targetSuggestionId = matchingSuggestion?.id;
      }
      
      if (targetSuggestionId) {
        const updatedSuggestions = existingSuggestions.map((suggestion: any) => {
          if (suggestion.id === targetSuggestionId) {
            return {
              ...suggestion,
              data: updatedSuggestion
            };
          }
          return suggestion;
        });
        localStorage.setItem('generatedSuggestions', JSON.stringify(updatedSuggestions));
      }
    } catch (error) {
      console.error('Error updating localStorage keys:', error);
    }
  }, []);

  const generateBadgeJSON = () => {
    // Use selectedBadgeSuggestion to generate JSON
    if (!badgeSuggestion) return null;
    
    return {
      "achievement": {
        "name": badgeSuggestion.title,
        "description": badgeSuggestion.description,
        "criteria": {
          "narrative": badgeSuggestion.criteria
        },
        "image": {
          "id": badgeSuggestion.image || "",
          "type": "Image"
        }
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

  // Add null check for badgeSuggestion
  if (!badgeSuggestion) {
    return (
        <main className="container mx-auto bg-gray-50 p-4 md:p-8">
          <Button
            variant="outline"
            className="mb-6"
            onClick={() => router.push('/genai/suggestions')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Suggestions
          </Button>
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Suggestion Available</h2>
            <p className="text-gray-600">The selected suggestion could not be loaded.</p>
          </div>
        </main>
    );
  }

  return (
      <main id="main-content" className="container mx-auto bg-gray-50 p-4 md:p-8">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => router.push('/genai/suggestions')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Suggestions
        </Button>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Column 1: Configuration */}
          <div className="lg:col-span-3">
            <BadgeConfiguration 
              onRegenerate={handleRegenerate}
              isRegenerating={isRegenerating}
              onConfigurationChange={handleConfigurationChange}
              userPrompt={userPrompt}
              onUserPromptChange={handleUserPromptChange}
            />
          </div>

          {/* Column 2: Badge Suggestion Editor / Streaming */}
          <div className="lg:col-span-6">
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
              <Card className="border-[#429EA6] shadow-lg bg-white h-full">
                <CardHeader className="pb-8">
                  <div className="mb-3">
                    <CardTitle className="text-3xl font-bold text-gray-900">
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

                {/* <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Badge Image:</label>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <img
                      src={badgeSuggestion.image}
                      alt="Generated badge"
                      className="w-32 h-32 object-contain rounded-lg border border-gray-300"
                    />
                  </div>
                </div> */}
              </CardContent>

              <CardFooter className="px-8 pb-8 flex justify-end">
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-primary hover:bg-primary/90 text-white"
                      onClick={() => setIsModalOpen(true)}
                    >
                      Generate Badge
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-gray-900">
                        Badge JSON
                      </DialogTitle>
                      <DialogDescription className="text-gray-600">
                        Copy or export the badge JSON structure below.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4 border">
                        <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(generateBadgeJSON(), null, 2)}
                        </pre>
                      </div>
                      
                      <div className="flex gap-3">
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
                    </div>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
            )}
          </div>

          {/* Column 3: Badge Image Display */}
          <div className="lg:col-span-3">
            <BadgeImageDisplay 
              imageUrl={badgeSuggestion.image}
              imageConfig={currentCardId ? JSON.parse(localStorage.getItem('finalResponses') || '{}')[currentCardId]?.imageConfig : null}
              onEditImage={handleEditImage}
            />
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
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleApplyImageChanges}
                    disabled={!generatedImage}
                    className="bg-[#429EA6] text-white hover:bg-[#429EA6]/90"
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
                    className="border-[#234467] text-[#234467] hover:bg-[#234467] hover:text-white"
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
                    
                    return (
                      <button
                        key={index} 
                        className={`w-full p-3 mb-2 text-left rounded-lg border transition-all duration-200 ${
                          isActive 
                            ? 'bg-[#429EA6] text-white border-[#429EA6] shadow-md' 
                            : 'bg-white text-gray-700 border-gray-200 hover:border-[#429EA6] hover:bg-[#429EA6]/5'
                        }`}
                        onClick={() => toggleAccordion('layer', index)}
                      >
                        <span className="text-sm font-medium">
                          {layerType}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex">
                {/* Layer Details Panel */}
                <div className={`bg-white border border-gray-200 overflow-y-auto transition-all duration-300 ${
                  editedImageConfig?.layers?.some((_: any, index: number) => accordionStates.layers[index]) 
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
                            {layerType === 'BackgroundLayer' && (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Mode</label>
                                  <select 
                                    value={layer.mode || 'solid'} 
                                    onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.mode`, e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#429EA6] focus:border-transparent"
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
                                      value={layer.color || '#FFFFFF'} 
                                      onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.color`, e.target.value)}
                                      className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                                    />
                                    <input 
                                      type="text" 
                                      value={layer.color || '#FFFFFF'} 
                                      onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.color`, e.target.value)}
                                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#429EA6] focus:border-transparent"
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                              
                            {/* ShapeLayer */}
                            {layerType === 'ShapeLayer' && (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Shape *</label>
                                  <select 
                                    value={layer.shape || ''} 
                                    onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.shape`, e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#429EA6] focus:border-transparent"
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
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#429EA6] focus:border-transparent"
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
                                                value={layer.fill.start_color || '#E76F51'} 
                                                onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.fill.start_color`, e.target.value)}
                                                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                                              />
                                              <input 
                                                type="text" 
                                                value={layer.fill.start_color || '#E76F51'} 
                                                onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.fill.start_color`, e.target.value)}
                                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#429EA6] focus:border-transparent"
                                              />
                                            </div>
                                          </div>
                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">End Color *</label>
                                            <div className="flex items-center space-x-2">
                                              <input 
                                                type="color" 
                                                value={layer.fill.end_color || '#FF8C42'} 
                                                onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.fill.end_color`, e.target.value)}
                                                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                                              />
                                              <input 
                                                type="text" 
                                                value={layer.fill.end_color || '#FF8C42'} 
                                                onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.fill.end_color`, e.target.value)}
                                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#429EA6] focus:border-transparent"
                                              />
                                            </div>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <input 
                                              type="checkbox" 
                                              checked={layer.fill.vertical || true} 
                                              onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.fill.vertical`, e.target.checked)}
                                              className="rounded" 
                                            />
                                            <label className="text-xs text-gray-600">Vertical Gradient</label>
                                          </div>
                                        </>
                                      ) : (
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">Fill Color *</label>
                                          <div className="flex items-center space-x-2">
                                            <input 
                                              type="color" 
                                              value={layer.fill.color || '#00B4D8'} 
                                              onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.fill.color`, e.target.value)}
                                              className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                                            />
                                            <input 
                                              type="text" 
                                              value={layer.fill.color || '#00B4D8'} 
                                              onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.fill.color`, e.target.value)}
                                              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#429EA6] focus:border-transparent"
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
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#429EA6] focus:border-transparent"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Border Color *</label>
                                        <div className="flex items-center space-x-2">
                                          <input 
                                            type="color" 
                                            value={layer.border.color || '#000000'} 
                                            onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.border.color`, e.target.value)}
                                            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                                          />
                                          <input 
                                            type="text" 
                                            value={layer.border.color || '#000000'} 
                                            onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.border.color`, e.target.value)}
                                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#429EA6] focus:border-transparent"
                                          />
                                        </div>
                                      </div>
                                    </>
                                  )}
                                  
                                  {layer.params && (
                                    <>
                                      {layer.params.radius && (
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">Radius</label>
                                          <input 
                                            type="number" 
                                            value={layer.params.radius} 
                                            onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.params.radius`, parseInt(e.target.value))}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#429EA6] focus:border-transparent"
                                          />
                                        </div>
                                      )}
                                      {layer.params.width && (
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">Width</label>
                                          <input 
                                            type="number" 
                                            value={layer.params.width} 
                                            onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.params.width`, parseInt(e.target.value))}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#429EA6] focus:border-transparent"
                                          />
                                        </div>
                                      )}
                                      {layer.params.height && (
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">Height</label>
                                          <input 
                                            type="number" 
                                            value={layer.params.height} 
                                            onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.params.height`, parseInt(e.target.value))}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#429EA6] focus:border-transparent"
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
                                        className="w-full px-3 py-2 text-sm border border-[#429EA6] text-[#429EA6] rounded hover:bg-[#429EA6] hover:text-white transition-colors flex items-center justify-center gap-2"
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
                                  {layer.size && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">Size *</label>
                                      <div className="flex items-center space-x-2">
                                        <input 
                                          type="checkbox" 
                                          checked={layer.size.dynamic || true} 
                                          onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.size.dynamic`, e.target.checked)}
                                          className="rounded" 
                                        />
                                        <label className="text-xs text-gray-600">Dynamic Size</label>
                                      </div>
                                    </div>
                                  )}
                                  {layer.position && (
                                    <>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">X Position</label>
                                        <input 
                                          type="text" 
                                          value={layer.position.x || 'center'} 
                                          onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.position.x`, e.target.value)}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#429EA6] focus:border-transparent"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Y Position *</label>
                                        <input 
                                          type="text" 
                                          value={layer.position.y || 'dynamic'} 
                                          onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.position.y`, e.target.value)}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#429EA6] focus:border-transparent"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Range: 50-550</p>
                                      </div>
                                    </>
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
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#429EA6] focus:border-transparent"
                                    />
                                  </div>
                                  {layer.font && (
                                    <>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Font Path</label>
                                        <input 
                                          type="text" 
                                          value={layer.font.path || ''} 
                                          onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.font.path`, e.target.value)}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#429EA6] focus:border-transparent"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Font Size *</label>
                                        <input 
                                          type="number" 
                                          value={layer.font.size || 12} 
                                          onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.font.size`, parseInt(e.target.value))}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#429EA6] focus:border-transparent"
                                        />
                                      </div>
                                    </>
                                  )}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Text Color *</label>
                                    <div className="flex items-center space-x-2">
                                      <input 
                                        type="color" 
                                        value={layer.color || '#000000'} 
                                        onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.color`, e.target.value)}
                                        className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                                      />
                                      <input 
                                        type="text" 
                                        value={layer.color || '#000000'} 
                                        onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.color`, e.target.value)}
                                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#429EA6] focus:border-transparent"
                                      />
                                    </div>
                                  </div>
                                  {layer.align && (
                                    <>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">X Align</label>
                                        <input 
                                          type="text" 
                                          value={layer.align.x || 'center'} 
                                          onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.align.x`, e.target.value)}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#429EA6] focus:border-transparent"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Y Align *</label>
                                        <input 
                                          type="text" 
                                          value={layer.align.y || 'dynamic'} 
                                          onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.align.y`, e.target.value)}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#429EA6] focus:border-transparent"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Range: 50-550</p>
                                      </div>
                                    </>
                                  )}
                                  {layer.wrap && (
                                    <>
                                      <div className="flex items-center space-x-2">
                                        <input 
                                          type="checkbox" 
                                          checked={layer.wrap.dynamic || false} 
                                          onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.wrap.dynamic`, e.target.checked)}
                                          className="rounded" 
                                        />
                                        <label className="text-xs text-gray-600">Dynamic Wrap</label>
                                      </div>
                                      {layer.wrap.line_gap && (
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">Line Gap</label>
                                          <input 
                                            type="number" 
                                            value={layer.wrap.line_gap} 
                                            onChange={(e) => updateImageConfig(`layers.${activeLayerIndex}.wrap.line_gap`, parseInt(e.target.value))}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#429EA6] focus:border-transparent"
                                          />
                                        </div>
                                      )}
                                    </>
                                  )}
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
                           linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
                           linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
                           linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
                           linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
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
      </main>
  );
}
