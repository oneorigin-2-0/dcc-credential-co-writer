'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
import { Award, WandSparkles, Download, Loader2, UploadCloud, FileText, Type, ArrowLeft, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

import { generateSuggestions } from '../actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/shared/header';

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

export default function GenAIPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

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
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <Button
          variant="outline"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <FormProvider {...form}>
              <form
                onSubmit={e => e.preventDefault()}
                className="space-y-8"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Add Content</CardTitle>
                    <CardDescription>
                      Provide content for analysis. You can paste text or attach a file.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Textarea
                              placeholder="e.g., This course covers the fundamentals of quantum computing, including qubits, superposition, and entanglement..."
                              className="min-h-[150px] text-base pr-12"
                              {...field}
                            />
                            <div className="absolute bottom-2 right-2 flex items-center gap-2">
                               <Button variant="ghost" size="icon" onClick={() => document.getElementById('file-upload')?.click()} aria-label="Attach file">
                                <Paperclip className="h-5 w-5" />
                               </Button>
                            </div>
                            <Input
                              id="file-upload"
                              type="file"
                              className="hidden"
                              accept="image/*,application/pdf,.txt,.md"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </CardContent>
                  <CardFooter>
                  <div className="relative group">
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="relative font-semibold text-primary-foreground rounded-lg transition-all duration-300 ease-out overflow-hidden shadow-lg"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:animate-gradient group-hover:shadow-[0_0_20px_rgba(255,0,0,0.6)]"></div>
                      <span className="relative z-10 flex items-center">
                        {isGenerating ? (
                          <Loader2 className="animate-spin mr-2" />
                        ) : (
                          <WandSparkles className="mr-2" />
                        )}
                        <span>
                          {isGenerating ? 'Generating...' : 'Generate Suggestions'}
                        </span>
                      </span>
                      <span className="absolute inset-0 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 opacity-0 group-hover:opacity-50 blur-xl group-hover:animate-pulse transition-opacity duration-300"></span>
                    </Button>
                    </div>
                  </CardFooter>
                </Card>
              </form>
            </FormProvider>
          </div>
        </div>
      </main>
    </div>
  );
}
