import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Award, WandSparkles, Pencil } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 border-b bg-card">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-3">
            <Award className="w-10 h-10 text-accent" />
            DCC Gen AI Authoring Tool
          </h1>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-4xl text-center">
          <div>
            <h2 className="text-3xl font-bold">Effortless Badge Creation</h2>
            <p className="text-muted-foreground mt-2">
              Whether you're harnessing the speed of AI or prefer a hands-on approach, creating your perfect badge is just a few clicks away.
            </p>
          </div>
          <div>
            <div className="grid md:grid-cols-2 gap-8 mt-8">
              <div className="flex flex-col items-center p-6 border rounded-lg hover:shadow-md transition-shadow">
                <WandSparkles className="w-12 h-12 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-primary">
                  Generate with AI
                </h3>
                <p className="text-muted-foreground mb-6 text-sm">
                  Let our AI assist you by generating a badge from your
                  content, like a course outline or project summary.
                </p>
                <Button asChild>
                  <Link href="/genai">
                    Generate with AI <WandSparkles className="ml-2" />
                  </Link>
                </Button>
              </div>
              <div className="flex flex-col items-center p-6 border rounded-lg hover:shadow-md transition-shadow">
                <Pencil className="w-12 h-12 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-primary">
                  Create Manually
                </h3>
                <p className="text-muted-foreground mb-6 text-sm">
                  Have all the details ready? Fill out the form yourself to
                  create a custom badge from scratch.
                </p>
                <Button asChild>
                  <Link href="/manual">Create Manually</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
