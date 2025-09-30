'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BadgeImageDisplayProps {
  imageUrl?: string;
  imageConfig?: any;
}

export function BadgeImageDisplay({ imageUrl, imageConfig }: BadgeImageDisplayProps) {
  return (
    <Card className="border-[#429EA6] shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-[#234467] font-headline font-bold text-lg">
          Badge Image Preview
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center justify-center space-y-4 h-full">
        {/* Badge Image */}
        <div className="flex justify-center items-center p-6  rounded-lg border-2 border-[#429EA6]/20">
          <img
            src={imageUrl}
            alt="Badge preview"
            className="w-32 h-32 object-contain rounded-lg shadow-lg"
          />
        </div>

        {/* Image Config Display */}
        {imageConfig && (
          <div className="w-full">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Image Configuration</h4>
            <div className="bg-gray-50 rounded-lg p-3 border">
              <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap overflow-x-auto max-h-40">
                {JSON.stringify(imageConfig, null, 2)}
              </pre>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
