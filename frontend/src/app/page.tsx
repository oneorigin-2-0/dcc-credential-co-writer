import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { WandSparkles } from 'lucide-react';

export default function LandingPage() {
  return (
      <main id="main-content" className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-4xl text-center">
          <div>
            <h1 className="text-3xl font-headline font-black">Craft Your Recognition</h1>
            <p className="text-muted-foreground mt-2 font-body">
            Instantly craft Open Badges content with the power of AI.
            </p>
          </div>
          <div className="flex justify-center">
            <div className="grid grid-cols-1 gap-8 mt-8">
              <Link href="/genai">
                <Card className="flex flex-col items-center p-6 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <WandSparkles className="w-12 h-12 text-accent mb-4" />
                  <h3 className="text-xl font-subhead font-light mb-2 text-primary">
                    Generate with AI
                  </h3>
                  <p className="text-muted-foreground mb-6 text-sm">
                    Let our AI assist you by generating a badge from your
                    content, like a course outline or project summary.
                  </p>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </main>
  );
}
