'use client';

import { Header } from "@/components/shared/header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { useRouter } from "next/navigation";

export default function ManualPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="flex items-center justify-center">
          <div className="w-full max-w-2xl">
              <p className="text-center text-muted-foreground">Manual creation form will be here.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
