'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

interface BadgeImageDisplayProps {
  imageUrl?: string;
  imageConfig?: any;
  onEditImage?: () => void;
}

export function BadgeImageDisplay({ imageUrl, imageConfig, onEditImage }: BadgeImageDisplayProps) {
  return (
    <Card className="border-secondary shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-primary font-headline font-bold text-lg">
          Badge Image Preview
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center justify-center space-y-4 h-full">
        {/* Badge Image */}
        <div className="flex flex-col items-center space-y-3">
          <div className="flex justify-center items-center p-3 rounded-lg border-2 border-secondary/20">
            <img
              src={imageUrl}
              alt="Badge image preview for credential"
              className="w-50 h-50 object-contain rounded-lg shadow-lg"
            />
          </div>
          
          {/* Edit Image Button */}
          {onEditImage && (
            <Button
              onClick={onEditImage}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-secondary text-secondary hover:bg-secondary hover:text-white"
            >
              <Edit className="h-4 w-4" />
              Edit Image
            </Button>
          )}
        </div>

        {/* Image Config Display
        {imageConfig && (
          <div className="w-full">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Image Configuration</h4>
            <div className="bg-gray-50 rounded-lg p-3 border">
              <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap overflow-x-auto max-h-40">
                {JSON.stringify(imageConfig, null, 2)}
              </pre>
            </div>
          </div>
        )} */}

      </CardContent>
    </Card>
  );
}
