'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Loader2, ArrowLeft, Paperclip, X, FileText, Edit, Save, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BadgeConfiguration, BadgeConfigurationData } from '@/components/genai/badge-configuration';
import { BadgeImageConfiguration, BadgeImageConfigurationData } from '@/components/genai/badge-image-configuration';

import Lottie from 'lottie-react';

import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { FileParser } from '@/lib/file-parser';

const badgeFormSchema = z.object({
  content: z
    .string()
    .min(50, { message: 'Please provide at least 50 characters for analysis.' }),
});
type BadgeFormValues = z.infer<typeof badgeFormSchema>;

interface AttachedFile {
  file: File;
  content: string;
  name: string;
  size: number;
  type: string;
  wordCount?: number;
}

export default function GenAIPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [animationData, setAnimationData] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isLaiserEnabled, setIsLaiserEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set());
  const [editingFiles, setEditingFiles] = useState<Set<number>>(new Set());
  const [editContent, setEditContent] = useState<{ [key: number]: string }>({});
  const [consentChecked, setConsentChecked] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [badgeConfig, setBadgeConfig] = useState<BadgeConfigurationData>({
    badge_style: 'professional',
    badge_tone: 'authoritative',
    criterion_style: 'task-oriented',
    badge_level: 'not-specified',
    institution: '',
    institute_url: '',
    user_prompt: ''
  });
  const [imageConfig, setImageConfig] = useState<BadgeImageConfigurationData | undefined>(undefined);
  const [isConfigOpen, setIsConfigOpen] = useState(true);

  // Trigger entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Clear badge config from localStorage on mount (fresh start each visit)
  useEffect(() => {
    localStorage.removeItem('badgeConfig');
  }, []);

  // Load Lottie animation data
  useEffect(() => {
    fetch("https://cdn.prod.website-files.com/6177739448baa66404ce1d9c/65af544319dd628383cea301_icon%20stars%20white%20(1).json")
      .then(response => response.json())
      .then(data => setAnimationData(data))
      .catch(error => console.error('Error loading animation:', error));
  }, []);

  // File parsing is now handled by the FileParser utility

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Only allow one file - take the first one
    if (attachedFiles.length > 0) {
      toast({
        title: 'File Already Attached',
        description: 'Please remove the existing file before uploading a new one.',
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Ensure we're in browser environment
    if (typeof window === "undefined") {
      console.error("File upload is only available in browser environment");
      return;
    }

    setIsParsingFile(true);

    try {
      // Only process the first file
      const file = files[0];

      try {
        const parsedFile = await FileParser.parseFile(file);
        setAttachedFiles([{
          file,
          content: parsedFile.content,
          name: file.name,
          size: file.size,
          type: file.type,
          wordCount: parsedFile.metadata?.wordCount,
        }]);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }

    } catch (error) {
      console.error('File processing error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'An error occurred while processing the file.',
      });
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    setExpandedFiles(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const startEdit = (index: number, content: string) => {
    setEditContent(prev => ({ ...prev, [index]: content }));
    setEditingFiles(prev => new Set(prev).add(index));
  };

  const saveEditedContent = (index: number) => {
    const editedContent = editContent[index];
    if (editedContent) {
      setAttachedFiles(prev => prev.map((file, i) => 
        i === index 
          ? { ...file, content: editedContent }
          : file
      ));
      setEditingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
      delete editContent[index];
      toast({
        title: 'Content Updated',
        description: 'File content has been successfully updated.',
      });
    }
  };

  const cancelEdit = (index: number) => {
    delete editContent[index];
    setEditingFiles(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const form = useForm<BadgeFormValues>({
    resolver: zodResolver(badgeFormSchema),
    defaultValues: {
      content: '',
    },
    mode: 'onChange',
  });

  const handleGenerate = async () => {
    const content = form.getValues('content');

    // Combine text content with file content
    let combinedContent = content;
    if (attachedFiles.length > 0) {
      const fileContents = attachedFiles.map(file =>
        `\n\n--- Content from ${file.name} ---\n${file.content}`
      ).join('\n');
      combinedContent = content + fileContents;
    }

    const contentValidation = badgeFormSchema.shape.content.safeParse(combinedContent);

    if (!contentValidation.success) {
      form.setError('content', {
        type: 'manual',
        message: contentValidation.error.issues[0].message,
      });
      return;
    }

    try {
      // Clear all localStorage values to avoid confusion
      try {
        localStorage.removeItem('generatedSuggestions');
        localStorage.removeItem('finalResponses');
        localStorage.removeItem('selectedBadgeSuggestion');
        localStorage.removeItem('isGenerating');
        // console.log('Cleared all localStorage values for fresh generation');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }

      // Store content and generation state in localStorage
      try {
        localStorage.setItem('originalContent', combinedContent);
        localStorage.setItem('generationStarted', 'true');
        localStorage.setItem('isLaiserEnabled', isLaiserEnabled.toString());
        if (badgeConfig) {
          localStorage.setItem('badgeConfig', JSON.stringify(badgeConfig));
        }
        if (imageConfig) {
          localStorage.setItem('imageConfig', JSON.stringify(imageConfig));
        }
      } catch (error) {
        console.error('Error storing content in localStorage:', error);
      }

      // Show immediate feedback
      toast({
        title: 'Starting Generation!',
        description: 'Redirecting to suggestions page...',
      });

      // Redirect immediately to suggestions page
      router.push('/genai/suggestions');
    } catch (error) {
      // Handle unexpected errors
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'An unexpected error occurred. Please try again.',
      });
    }
  };



  return (
    <main id="main-content" className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <div className={`relative flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-center transition-all duration-500 ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 -translate-y-4'
        }`}>
          <Button
            variant="outline"
            className="flex-shrink-0 md:absolute md:left-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">
            Create Credential with AI
          </h1>
        </div>

        <div className="flex justify-center">
          <div className={`w-full max-w-6xl transition-all duration-700 ${
            isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}>
            <FormProvider {...form}>
              <Card className="border-0 shadow-xl bg-white">
                <CardHeader>
                  <CardDescription className="text-lg text-gray-600 leading-relaxed">
                  Upload your course content to build Credentials.
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-8 pb-8">
                  <form onSubmit={e => e.preventDefault()}>
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative mb-4">
                              <Textarea
                                id="content-textarea"
                                aria-label="Content for badge generation"
                                placeholder="Enter your course content, project summary, or other text that describes what the badge represents...."
                                className="min-h-[200px] text-base border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 resize-none text-gray-700 placeholder:text-gray-400 transition-all duration-300"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500 mt-2" />
                          
                          {/* Description and Attach button below textarea */}
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 border border-gray-300 hover:text-secondary hover:border-secondary hover:bg-secondary/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isParsingFile || attachedFiles.length > 0}
                            >
                              {isParsingFile ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <Paperclip className="mr-2 h-4 w-4" />
                                  Attach
                                </>
                              )}
                            </Button>                            
                          </div>
                        </FormItem>
                      )}
                    />


                    {/* Display attached files - Hidden on mobile/tablet */}
                    {attachedFiles.length > 0 && (
                      <div className="hidden lg:block mt-4 space-y-3 animate-in fade-in-0 duration-500">
                        <label className="text-sm font-semibold text-gray-700">Attached Files:</label>
                        {attachedFiles.map((file, index) => (
                          <Collapsible
                            key={index}
                            open={expandedFiles.has(index)}
                            onOpenChange={(open) => {
                              if (open) {
                                setExpandedFiles(prev => new Set(prev).add(index));
                              } else {
                                setExpandedFiles(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(index);
                                  return newSet;
                                });
                              }
                            }}
                            className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:border-secondary hover:shadow-md"
                            style={{
                              animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
                            }}
                          >
                            <div className="flex items-center justify-between p-3">
                              <CollapsibleTrigger asChild>
                                <div className="flex items-center space-x-3 flex-1 cursor-pointer transition-all duration-200">
                                  <FileText className="h-5 w-5 text-secondary transition-transform duration-200 hover:scale-110" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500 font-bold">
                                      {formatFileSize(file.size)}
                                      {file.wordCount && ` • ${file.wordCount} words`}
                                    </p>
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              <div className="flex items-center space-x-2">
                                {editingFiles.has(index) ? (
                                  <>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        cancelEdit(index);
                                      }}
                                      className="transition-all duration-200 hover:scale-105"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        saveEditedContent(index);
                                      }}
                                      className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:scale-105"
                                    >
                                      <Save className="h-4 w-4 mr-1" />
                                      Save
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    {expandedFiles.has(index) && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startEdit(index, file.content);
                                        }}
                                        className="transition-all duration-200 hover:scale-105 hover:text-secondary"
                                      >
                                        <Edit className="h-4 w-4 mr-1 transition-transform duration-200 hover:rotate-12" />
                                        Edit
                                      </Button>
                                    )}
                                    <CollapsibleTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="transition-all duration-200 hover:scale-105"
                                      >
                                        {expandedFiles.has(index) ? (
                                          <>
                                            <ChevronUp className="h-4 w-4 mr-1 transition-transform duration-300" />
                                            Hide
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="h-4 w-4 mr-1 transition-transform duration-300" />
                                            View
                                          </>
                                        )}
                                      </Button>
                                    </CollapsibleTrigger>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(index);
                                      }}
                                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 transition-all duration-200 hover:scale-105"
                                    >
                                      <X className="h-4 w-4 mr-1 transition-transform duration-200 hover:rotate-90" />
                                      Remove
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Expanded Content Section */}
                            <CollapsibleContent className="px-4 pb-4 data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                                {editingFiles.has(index) && (
                                  <Textarea
                                    value={editContent[index] || file.content}
                                    onChange={(e) => setEditContent(prev => ({ ...prev, [index]: e.target.value }))}
                                    className="h-[300px] text-sm font-mono resize-none"
                                    placeholder="Edit the parsed content..."
                                  />
                                )}
                                {!editingFiles.has(index) && (
                                  <div className="h-[300px] overflow-auto border rounded p-3 bg-white transition-all duration-300">
                                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                                      {file.content}
                                    </pre>
                                  </div>
                                )}
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    )}

                    {/* Configuration - Collapsible */}
                    <div className="mt-6">
                      <Collapsible
                        open={isConfigOpen}
                        onOpenChange={setIsConfigOpen}
                        className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-3 cursor-pointer transition-all duration-200">
                            <div className="flex items-center space-x-3">
                              <Settings className="h-5 w-5 text-secondary transition-transform duration-200" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Configuration</p>
                                <p className="text-xs text-gray-500">Customize style, tone, level.</p>
                              </div>
                            </div>
                            <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isConfigOpen ? 'rotate-180' : 'rotate-0'}`} />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-4 data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden transition-all duration-300">
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-[0.6]">
                              <h3 className="text-base font-semibold text-primary mb-4">Style Configuration</h3>
                              <BadgeConfiguration
                                onConfigurationChange={setBadgeConfig}
                                variant="inline"
                              />
                            </div>
                            <div className="flex-[0.4] md:border-l md:border-gray-200 md:pl-6 pt-4 md:pt-0">
                              <BadgeImageConfiguration
                                onConfigurationChange={setImageConfig}
                                variant="inline"
                              />
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>

                    {/* Disclaimer Checkbox */}
                    <div className="mt-6 p-4 border rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="consent-checkbox"
                          checked={consentChecked}
                          onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                          className="mt-1 transition-all duration-200 border-secondary"
                        />
                        <label
                          htmlFor="consent-checkbox"
                          className="text-sm leading-relaxed font-body select-none text-foreground"
                        >
                          I acknowledge and consent to my input being securely utilized for model training and research purposes.
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-end mt-6">
                      <div className="flex items-center space-x-4">
                        {/* Extract Skills(powered by LAiSER) Toggle */}
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="laiser-toggle"
                            checked={isLaiserEnabled}
                            onCheckedChange={setIsLaiserEnabled}
                            className="transition-all duration-200"
                          />
                          <label
                            htmlFor="laiser-toggle"
                            className="text-sm font-medium text-gray-700 cursor-pointer transition-colors duration-200 hover:text-primary"
                          >
                            Extract Skills (powered by{' '}
                            <a
                              href="https://laiser.gwu.edu/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-secondary hover:text-primary hover:underline transition-colors duration-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              LAiSER
                            </a>
                            )
                          </label>
                        </div>

                        <Button
                          onClick={handleGenerate}
                          disabled={isParsingFile || !consentChecked}
                          className="bg-primary text-white px-6 py-2 font-medium transition-all duration-500 ease-in-out shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {animationData && (
                            <div className="w-5 h-5">
                              <Lottie
                                animationData={animationData}
                                loop={true}
                              />
                            </div>
                          )}
                          Generate Badge
                        </Button>
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileUpload}
                      disabled={attachedFiles.length > 0}
                    />

                  </form>
                </CardContent>
              </Card>
            </FormProvider>
          </div>
        </div>
      </div>
    </main>
  );
}
