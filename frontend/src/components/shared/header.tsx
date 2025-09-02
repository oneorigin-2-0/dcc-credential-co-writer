'use client';

import Link from 'next/link';

export function Header() {
  return (
    <header className="p-4 border-b bg-card">
      <div className="container mx-auto flex items-center gap-4">
        <h1 className="text-3xl font-bold font-headline text-primary">
          <Link href="/">DCC Gen AI Authoring Tool</Link>
        </h1>
      </div>
    </header>
  );
}
