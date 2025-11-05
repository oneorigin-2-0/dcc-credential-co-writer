'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@/components/ui/card';
import { ArrowLeft, Edit, CheckCircle, Save, X, Copy, FileDown, RefreshCw, Loader2 } from 'lucide-react';
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

interface BadgeResultsData {
    data: BadgeSuggestion[];
}

function ResultsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [badgeResults, setBadgeResults] = useState<BadgeResultsData | null>(null);
    const [selectedSuggestion, setSelectedSuggestion] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
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
        // Get data from URL params or localStorage
        const dataParam = searchParams.get('data');

        if (dataParam) {
            try {
                const decodedData = JSON.parse(decodeURIComponent(dataParam));
                setBadgeResults(decodedData);
                console.log('Loaded badge results:', decodedData);
            } catch (error) {
                console.error('Error parsing badge data:', error);
                // Fallback to localStorage
                const storedData = localStorage.getItem('generatedBadgeData');
                if (storedData) {
                    setBadgeResults(JSON.parse(storedData));
                }
            }
        } else {
            // Try to get from localStorage
            const storedData = localStorage.getItem('generatedBadgeData');
            if (storedData) {
                setBadgeResults(JSON.parse(storedData));
            }
        }

        // Get original content from localStorage
        const storedContent = localStorage.getItem('originalContent');
        if (storedContent) {
            setOriginalContent(storedContent);
        }

        setIsLoading(false);
    }, [searchParams]);

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
            let updatedResults = null;
            
            if (result.response && result.response.badge_name) {
                // New API format: { response: { badge_name, badge_description, criteria: { narrative } } }
                const newSuggestion = {
                    title: result.response.badge_name,
                    description: result.response.badge_description,
                    criteria: result.response.criteria?.narrative || result.response.badge_description,
                    image: undefined, // No image in new format
                };
                updatedResults = { data: [newSuggestion] };
            } else if (result.success && result.data && result.data.data && result.data.data.length > 0) {
                // Format: { success: true, data: { data: [suggestions] } }
                updatedResults = result.data;
            } else if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
                // Format: { success: true, data: [suggestions] }
                updatedResults = { data: result.data };
            } else if (result.success && result.data && result.data.title) {
                // Format: { success: true, data: { title, description, criteria, image } }
                updatedResults = { data: [result.data] };
            } else if (result.title) {
                // Format: { title, description, criteria, image }
                updatedResults = { data: [result] };
            }

            if (updatedResults) {
                setBadgeResults(updatedResults);
                setSelectedSuggestion(0); // Reset to first suggestion
                
                // Update localStorage
                localStorage.setItem('generatedBadgeData', JSON.stringify(updatedResults));
                
                toast({
                    title: 'Suggestions Regenerated!',
                    description: 'New badge suggestions have been generated.',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Regeneration Failed',
                    description: result.error || 'Failed to regenerate suggestions.',
                });
            }
        } catch (error) {
            console.error('Error regenerating suggestions:', error);
            toast({
                variant: 'destructive',
                title: 'Regeneration Failed',
                description: 'An unexpected error occurred. Please try again.',
            });
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleUseSuggestion = (suggestion: BadgeSuggestion) => {
        console.log('Using selected badge suggestion:', suggestion);
        toast({
            title: 'Badge Data Ready!',
            description: 'You can now proceed to create your badge.',
        });
    };

    const handleEditCriteria = (field: string, currentValue: string) => {
        setEditingField(field);
        setEditValues(prev => ({ ...prev, [field]: currentValue }));
    };

    const handleEditField = (field: string, currentValue: string) => {
        setEditingField(field);
        setEditValues(prev => ({ ...prev, [field]: currentValue }));
    };

    const handleSaveField = (field: string) => {
        if (!badgeResults) return;

        const updatedResults = { ...badgeResults };
        const updatedSuggestion = { ...updatedResults.data[selectedSuggestion] };

        // Update the specific field
        (updatedSuggestion as any)[field] = editValues[field as keyof typeof editValues];
        updatedResults.data[selectedSuggestion] = updatedSuggestion;

        setBadgeResults(updatedResults);

        // Update localStorage
        localStorage.setItem('generatedBadgeData', JSON.stringify(updatedResults));

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
                    "id": "",
                    "type": "Image"
                }
            }
        };
    };

    const handleCopyJSON = () => {
        if (!badgeResults) return;
        const currentSuggestion = badgeResults.data[selectedSuggestion];
        const badgeJSON = generateBadgeJSON(currentSuggestion);
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
        if (!badgeResults) return;
        const currentSuggestion = badgeResults.data[selectedSuggestion];
        const badgeJSON = generateBadgeJSON(currentSuggestion);
        const jsonString = JSON.stringify(badgeJSON, null, 2);
        const dataBlob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${currentSuggestion.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        toast({
            title: 'Exported!',
            description: `Badge JSON has been downloaded as ${currentSuggestion.title}.json`,
        });
    };

    if (isLoading) {
        return (
            <div className="bg-gray-50">
                <main className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600 font-body">Loading results...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!badgeResults || !badgeResults.data || badgeResults.data.length === 0) {
        return (
            <div className="bg-gray-50">
                <main className="container mx-auto p-4 md:p-8">
                    <Button
                        variant="outline"
                        className="mb-6"
                        onClick={() => router.push('/genai')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Generator
                    </Button>

                    <div className="flex justify-center">
                        <Card className="w-full max-w-2xl border-yellow-200 bg-yellow-50">
                            <CardHeader>
                                <CardTitle className="text-yellow-800 font-headline">No Results Found</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-yellow-700 font-body">
                                    No badge suggestions were found. Please go back and generate new suggestions.
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={() => router.push('/genai')} className="bg-primary">
                                    Generate New Badge
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </main>
            </div>
        );
    }

    const suggestions = badgeResults.data;
    const currentSuggestion = suggestions[selectedSuggestion];

    // Add null check for currentSuggestion
    if (!currentSuggestion) {
        return (
            <div className="bg-gray-50">
                <main className="container mx-auto p-4 md:p-8">
                    <Button
                        variant="outline"
                        className="mb-6"
                        onClick={() => router.push('/genai')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Generator
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
        <div className="bg-gray-50">
            <main className="container mx-auto p-4 md:p-8">
                <Button
                    variant="outline"
                    className="mb-6"
                    onClick={() => router.push('/genai')}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Generator
                </Button>

                <div className="flex justify-center">
                    <div className="w-full max-w-6xl">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                            {/* Suggestions List - Left Sidebar */}
                            <div className="lg:col-span-1">
                                <Card className="border-0 shadow-lg bg-white">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg font-subhead font-light text-gray-900">
                                            Suggestions
                                        </CardTitle>
                                        {/* <CardDescription className="text-sm text-gray-600 font-body">
                                            Select a suggestion to view details
                                        </CardDescription> */}
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {suggestions.map((suggestion, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedSuggestion(index)}
                                                className={`w-full text-left p-3 rounded-lg border transition-all ${selectedSuggestion === index
                                                    ? 'border-primary bg-primary/5 shadow-sm'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium truncate ${selectedSuggestion === index ? 'text-primary' : 'text-gray-900'
                                                            }`}>
                                                            {suggestion.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                            {suggestion.description}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                            {suggestion.criteria}
                                                        </p>
                                                    </div>
                                                    {selectedSuggestion === index && (
                                                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Selected Suggestion Details - Main Content */}
                            <div className="lg:col-span-3">
                                <Card className="border-0 shadow-xl bg-white">
                                    <CardHeader className="pb-8">
                                        <div className="flex items-center justify-between mb-3">
                                            <CardTitle className="text-3xl font-headline font-black text-gray-900">
                                                Badge Suggestion 
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
                                        <CardDescription className="text-lg text-gray-600 leading-relaxed font-body">
                                            Review the details and customize as needed.
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="px-8 pb-8 space-y-6">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-subhead font-light text-gray-700">Title:</label>
                                                {editingField !== 'title' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditField('title', currentSuggestion.title)}
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
                                                    <p className="text-gray-800 font-body">{currentSuggestion.title}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-subhead font-light text-gray-700">Description:</label>
                                                {editingField !== 'description' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditField('description', currentSuggestion.description)}
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
                                                    <p className="text-gray-800 font-body leading-relaxed">{currentSuggestion.description}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-subhead font-light text-gray-700">Criteria:</label>
                                                {editingField !== 'criteria' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditField('criteria', currentSuggestion.criteria)}
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
                                                    <p className="text-gray-800 font-body leading-relaxed">{currentSuggestion.criteria}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="text-sm font-subhead font-light text-gray-700 mb-2 block">Badge Image:</label>
                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <img
                                                    src={currentSuggestion.image}
                                                    alt={`${currentSuggestion.title} badge image`}
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
                                                    <DialogTitle className="text-2xl font-headline font-black text-gray-900">
                                                        Badge JSON
                                                    </DialogTitle>
                                                    <DialogDescription className="text-gray-600 font-body">
                                                        Copy or export the badge JSON structure below.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                
                                                <div className="space-y-4">
                                                    <div className="bg-gray-50 rounded-lg p-4 border">
                                                        <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto">
                                                            {JSON.stringify(generateBadgeJSON(currentSuggestion), null, 2)}
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
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function ResultsPage() {
    return (
        <Suspense fallback={
            <div className="bg-gray-50">
                <main className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600 font-body">Loading results...</p>
                    </div>
                </main>
            </div>
        }>
            <ResultsContent />
        </Suspense>
    );
}