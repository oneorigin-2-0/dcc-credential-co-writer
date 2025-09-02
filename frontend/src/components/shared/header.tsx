'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === '/';

  return (
    <header className="p-4 border-b bg-card">
      <div className="container mx-auto flex items-center gap-4">
        {!isHomePage && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
        )}
        <h1 className="text-3xl font-bold font-headline text-primary">
          <Link href="/">DCC Gen AI Authoring Tool</Link>
        </h1>
      </div>
    </header>
  );
}
