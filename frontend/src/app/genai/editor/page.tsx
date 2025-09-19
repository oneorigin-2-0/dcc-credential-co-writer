'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { ArrowLeft, Edit, Save, X, Copy, FileDown, RefreshCw, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
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

  useEffect(() => {
    // Get selected badge suggestion from localStorage
    const storedSuggestion = localStorage.getItem('selectedBadgeSuggestion');
    if (storedSuggestion) {
      setBadgeSuggestion(JSON.parse(storedSuggestion));
    } else {
      toast({
        variant: 'destructive',
        title: 'No Suggestion Selected',
        description: 'Please go back and select a suggestion to edit.',
      });
      router.push('/genai/suggestions');
    }

    // Get original content from localStorage
    const storedContent = localStorage.getItem('originalContent');
    if (storedContent) {
      setOriginalContent(storedContent);
    }
  }, []); // Empty dependency array since this should only run once on mount

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
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: originalContent,
          regenerate: true,
        }),
      });

      const result = await response.json();

      // Handle different response formats
      let newSuggestion = null;
      
      if (result.response && result.response.badge_name) {
        // New API format: { response: { badge_name, badge_description, criteria: { narrative } } }
        newSuggestion = {
          title: result.response.badge_name,
          description: result.response.badge_description,
          criteria: result.response.criteria?.narrative || result.response.badge_description,
          image: undefined, // No image in new format
        };
      } else if (result.success && result.data && result.data.data && result.data.data.length > 0) {
        // Format: { success: true, data: { data: [suggestions] } }
        newSuggestion = result.data.data[0];
      } else if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
        // Format: { success: true, data: [suggestions] }
        newSuggestion = result.data[0];
      } else if (result.success && result.data && result.data.title) {
        // Format: { success: true, data: { title, description, criteria, image } }
        newSuggestion = result.data;
      } else if (result.title) {
        // Format: { title, description, criteria, image }
        newSuggestion = result;
      }

      if (newSuggestion) {
        setBadgeSuggestion(newSuggestion);
        
        // Update localStorage
        localStorage.setItem('selectedBadgeSuggestion', JSON.stringify(newSuggestion));
        
        toast({
          title: 'Suggestion Regenerated!',
          description: 'A new badge suggestion has been generated.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Regeneration Failed',
          description: result.error || 'Failed to regenerate suggestion.',
        });
      }
    } catch (error) {
      console.error('Error regenerating suggestion:', error);
      toast({
        variant: 'destructive',
        title: 'Regeneration Failed',
        description: 'An unexpected error occurred. Please try again.',
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

    // Update localStorage
    localStorage.setItem('selectedBadgeSuggestion', JSON.stringify(updatedSuggestion));

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

  const generateBadgeJSON = (suggestion: BadgeSuggestion) => {
    return {
      "achievement": {
        "name": suggestion.title,
        "description": suggestion.description,
        "criteria": {
          "narrative": suggestion.criteria
        },
        "image": {
          "id": "https://example.com//achievements/c3c1ea5b-9d6b-416d-ab7f-76da1df3e8d6/image",
          "type": "Image"
        }
      }
    };
  };

  const handleCopyJSON = () => {
    if (!badgeSuggestion) return;
    const badgeJSON = generateBadgeJSON(badgeSuggestion);
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
    if (!badgeSuggestion) return;
    const badgeJSON = generateBadgeJSON(badgeSuggestion);
    const jsonString = JSON.stringify(badgeJSON, null, 2);
    const dataBlob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${badgeSuggestion.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Exported!',
      description: `Badge JSON has been downloaded as ${badgeSuggestion.title}.json`,
    });
  };

  if (!badgeSuggestion) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-1 container mx-auto p-4 md:p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-body">Loading badge suggestion...</p>
          </div>
        </main>
      </div>
    );
  }

  // Add null check for badgeSuggestion
  if (!badgeSuggestion) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-1 container mx-auto p-4 md:p-8">
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
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => router.push('/genai/suggestions')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Suggestions
        </Button>

        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <Card className="border-0 shadow-xl bg-white">
              <CardHeader className="pb-8">
                <div className="flex items-center justify-between mb-3">
                  <CardTitle className="text-3xl font-bold text-gray-900">
                    Badge Suggestion Editor
                  </CardTitle>
                  <Button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    variant="outline"
                    className="flex items-center gap-2"
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
                <CardDescription className="text-lg text-gray-600 leading-relaxed">
                  Edit and customize your badge suggestion before generating the final credential.
                </CardDescription>
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

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Badge Image:</label>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <img
                      src={badgeSuggestion.image || "https://nwccu.org/wp-content/uploads/2024/01/WGU-Logo.png"}
                      alt="Generated badge"
                      className="w-32 h-32 object-contain rounded-lg border border-gray-300"
                    />
                  </div>
                </div>
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
                          {JSON.stringify(generateBadgeJSON(badgeSuggestion), null, 2)}
                        </pre>
                      </div>
                      
                      <div className="flex gap-3 justify-end">
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
          </div>
        </div>
      </main>
    </div>
  );
}
