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
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Loader2, ArrowLeft, Paperclip, X, FileText } from 'lucide-react';

import Lottie from 'lottie-react';

import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

import { Header } from '@/components/layout/header';
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

    // Ensure we're in browser environment
    if (typeof window === "undefined") {
      console.error("File upload is only available in browser environment");
      return;
    }

    setIsParsingFile(true);

    try {
      const newAttachedFiles: AttachedFile[] = [];

      for (const file of Array.from(files)) {
        // Check for duplicate files by name and size
        const isDuplicate = attachedFiles.some(
          existingFile => existingFile.name === file.name && existingFile.size === file.size
        );

        if (isDuplicate) {
          toast({
            title: 'Duplicate File Skipped',
            description: `File "${file.name}" is already attached.`,
          });
          continue;
        }

        try {
          const parsedFile = await FileParser.parseFile(file);
          // console.log(">>>parsedFile", parsedFile)
          newAttachedFiles.push({
            file,
            content: parsedFile.content,
            name: file.name,
            size: file.size,
            type: file.type,
            wordCount: parsedFile.metadata?.wordCount,
          });
        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error);
          continue;
        }
      }

      if (newAttachedFiles.length > 0) {
        setAttachedFiles(prev => [...prev, ...newAttachedFiles]);
      }

    } catch (error) {
      console.error('File processing error:', error);
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
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
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <FormProvider {...form}>
              <Card className="border-0 shadow-xl bg-white">
                <CardHeader className="pb-8">
                  <CardTitle className="text-3xl font-bold text-gray-900 mb-3">
                    Create a New Credential with AI
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600 leading-relaxed">
                    Upload your course syllabus or content to get AI-generated credential suggestions.
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
                            <div className="relative">
                              <Textarea
                                placeholder="Specify a writing task..."
                                className="min-h-[200px] text-base border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-gray-300 resize-none text-gray-700 placeholder:text-gray-400"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500 mt-2" />
                        </FormItem>
                      )}
                    />


                    {/* Display attached files */}
                    {attachedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Attached Files:</label>
                        {attachedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-gray-500" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(file.size)}
                                  {file.wordCount && ` • ${file.wordCount} words`}
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-6">
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isParsingFile}
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

                      <div className="flex items-center space-x-4">
                        {/* Skills from LAiSER Toggle */}
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="laiser-toggle"
                            checked={isLaiserEnabled}
                            onCheckedChange={setIsLaiserEnabled}
                          />
                          <label
                            htmlFor="laiser-toggle"
                            className="text-sm font-medium text-gray-700 cursor-pointer"
                          >
                            Skills from LAiSER
                          </label>
                        </div>

                        <Button
                          onClick={handleGenerate}
                          disabled={isParsingFile}
                          className="bg-primary hover:bg-gradient-to-r hover:from-pink-500 hover:via-red-500 hover:to-yellow-500 text-white px-6 py-2 font-medium transition-all duration-500 ease-in-out transform  shadow-lg hover:shadow-xl"
                        >
                          {animationData && (
                            <div className="w-5 h-5">
                              <Lottie
                                animationData={animationData}
                                loop={true}
                              />
                            </div>
                          )}
                          Generate Suggestions
                        </Button>
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      multiple
                      onChange={handleFileUpload}
                    />

                  </form>
                </CardContent>
              </Card>

            </FormProvider>
          </div>
        </div>
      </main>
    </div>
  );
}
