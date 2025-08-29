'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Award, WandSparkles, Download, Loader2, UploadCloud, FileText, Type } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

import { generateSuggestions } from '../actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const badgeFormSchema = z.object({
  content: z
    .string()
    .min(50, { message: 'Please provide at least 50 characters for analysis.' }),
  title: z.string(),
  description: z.string(),
  criteria: z.string(),
  image: z.string().optional(),
});
type BadgeFormValues = z.infer<typeof badgeFormSchema>;

function BadgePreview({
  title,
  description,
  imageUrl,
}: {
  title: string;
  description: string;
  imageUrl?: string;
}) {
  return (
    <Card className="sticky top-8 shadow-lg">
      <CardHeader>
        <CardTitle>Badge Preview</CardTitle>
        <CardDescription>This is a live preview of your badge.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-secondary/30 rounded-lg p-8 flex flex-col items-center text-center transition-all duration-300">
          <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center shadow-lg mb-6 ring-4 ring-primary/20 relative">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={title || 'Badge Image'}
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <Award className="w-16 h-16 text-accent" />
            )}
          </div>
          <h3 className="text-2xl font-bold font-headline text-primary">
            {title || 'Badge Title'}
          </h3>
          <p className="text-muted-foreground mt-2 max-w-sm h-16 overflow-hidden">
            {description || 'Badge description will appear here...'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GenAIPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const form = useForm<BadgeFormValues>({
    resolver: zodResolver(badgeFormSchema),
    defaultValues: {
      content: '',
      title: '',
      description: '',
      criteria: '',
      image: '',
    },
    mode: 'onChange',
  });

  const watchedTitle = form.watch('title');
  const watchedDescription = form.watch('description');
  const watchedImage = form.watch('image');

  const handleGenerate = async () => {
    const content = form.getValues('content');
    const contentValidation = badgeFormSchema.shape.content.safeParse(content);

    if (!contentValidation.success) {
      form.setError('content', {
        type: 'manual',
        message: contentValidation.error.issues[0].message,
      });
      return;
    }

    setIsGenerating(true);
    const result = await generateSuggestions(content);
    setIsGenerating(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: result.error,
      });
      return;
    }

    form.setValue('title', result.title || '', { shouldValidate: true });
    form.setValue('description', result.description || '', {
      shouldValidate: true,
    });
    form.setValue('criteria', result.criteria || '', { shouldValidate: true });
    form.setValue('image', result.image || '', { shouldValidate: true });

    toast({
      title: 'Suggestions Generated!',
      description: 'Your badge details have been populated.',
    });
  };

  const handleExport = () => {
    const values = form.getValues();
    const badgeClass = {
      '@context': 'https://w3id.org/openbadges/v3/context.json',
      type: 'BadgeClass',
      name: values.title,
      description: values.description,
      image: {
        id: values.image,
        type: 'Image'
      },
      criteria: {
        type: 'Criteria',
        narrative: values.criteria,
      },
      issuer: {
        type: 'Profile',
        id: 'https://badgesmith.example.com/issuer', // Placeholder
        name: 'BadgeSmith Issuer',
      },
      id: `https://badgesmith.example.com/badges/${values.title
        .toLowerCase()
        .replace(/\s/g, '-')}`, // Placeholder
    };

    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(badgeClass, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute(
      'download',
      `${
        values.title.toLowerCase().replace(/\s/g, '-') || 'badge'
      }.json`
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    toast({
      title: 'Badge Exported!',
      description: 'Your OpenBadge 3.0 JSON file has been downloaded.',
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
       <header className="p-8 border-b bg-card">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold font-headline text-primary flex items-center gap-3">
            <WandSparkles className="w-10 h-10 text-accent" />
            Generate with AI
          </h1>
          <p className="text-muted-foreground mt-2">
            Let AI help you create the perfect badge. Provide some content and watch the magic happen.
          </p>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="grid lg:grid-cols-2 gap-12">
          <FormProvider {...form}>
            <form
              onSubmit={e => e.preventDefault()}
              className="space-y-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle>1. Provide Content</CardTitle>
                  <CardDescription>
                    Provide content for analysis. You can paste text, or upload a file.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="text">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="text"><Type className="mr-2"/>Text</TabsTrigger>
                      <TabsTrigger value="file"><FileText className="mr-2"/>File</TabsTrigger>
                      <TabsTrigger value="image"><UploadCloud className="mr-2"/>Image</TabsTrigger>
                    </TabsList>
                    <TabsContent value="text" className="pt-4">
                       <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="e.g., This course covers the fundamentals of quantum computing, including qubits, superposition, and entanglement..."
                                className="min-h-[150px] text-base"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    <TabsContent value="file" className="pt-4">
                      <div className="flex items-center justify-center w-full">
                          <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/30 hover:bg-secondary/50">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                                  <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                  <p className="text-xs text-muted-foreground">PDF, TXT, DOCX (MAX. 5MB)</p>
                              </div>
                              <Input id="dropzone-file" type="file" className="hidden" />
                          </label>
                      </div>
                    </TabsContent>
                     <TabsContent value="image" className="pt-4">
                       <div className="flex items-center justify-center w-full">
                          <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/30 hover:bg-secondary/50">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                                  <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF (MAX. 2MB)</p>
                              </div>
                              <Input id="image-upload" type="file" className="hidden" accept="image/*" />
                          </label>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleGenerate} disabled={isGenerating}>
                    {isGenerating ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <WandSparkles />
                    )}
                    <span>
                      {isGenerating ? 'Generating...' : 'Generate Suggestions'}
                    </span>
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. Refine Details</CardTitle>
                  <CardDescription>
                    Edit the AI-suggested details for your badge. The preview
                    on the right will update as you type.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="criteria"
                    render={({ field }) => (
                      <FormItem>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleExport}
                    disabled={!watchedTitle}
                  >
                    <Download />
                    <span>Export OpenBadge 3.0</span>
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </FormProvider>

          <div>
            <BadgePreview
              title={watchedTitle}
              description={watchedDescription}
              imageUrl={watchedImage}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
