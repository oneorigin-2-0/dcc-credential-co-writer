import { Header } from "@/components/shared/header";
import { Pencil } from 'lucide-react';

export default function ManualPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header 
        title="Create Badge Manually"
        description="Fill in the details below to create your new badge."
        icon={Pencil}
      />
      <main className="flex-1 container mx-auto p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-2xl">
            <p className="text-center text-muted-foreground">Manual creation form will be here.</p>
        </div>
      </main>
    </div>
  );
}
