import { Pencil } from 'lucide-react';

export default function ManualPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-8 border-b bg-card">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold font-headline text-primary flex items-center gap-3">
            <Pencil className="w-10 h-10 text-accent" />
            Create Badge Manually
          </h1>
          <p className="text-muted-foreground mt-2">
            Fill in the details below to create your new badge.
          </p>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-2xl">
            <p className="text-center text-muted-foreground">Manual creation form will be here.</p>
        </div>
      </main>
    </div>
  );
}
