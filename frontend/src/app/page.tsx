import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WandSparkles, Pencil } from 'lucide-react';
import { Header } from '@/components/shared/header';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header subtitle="Welcome" />
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
              <Card className="flex flex-col items-center p-6 border rounded-lg hover:shadow-md transition-shadow">
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
              </Card>
              <Card className="flex flex-col items-center p-6 border rounded-lg hover:shadow-md transition-shadow">
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
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
