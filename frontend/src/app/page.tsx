import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { WandSparkles } from 'lucide-react';
import { Header } from '@/components/layout/header';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-4xl text-center">
          <div>
            <h2 className="text-3xl font-headline font-black">Forge Your Recognition</h2>
            <p className="text-muted-foreground mt-2 font-body">
              Instantly craft beautiful, verifiable digital badges with the power of AI.
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
    </div>
  );
}
