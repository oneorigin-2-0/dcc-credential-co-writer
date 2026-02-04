'use client';

import Link from 'next/link';

export function Header() {
  return (
    <header className="p-4 border-b bg-card">
      <div className="container mx-auto flex items-center gap-4">
        <a href="https://digitalcredentials.mit.edu/" >
          <img
            src="/assets/DCC_LOGO.png"
            alt="DCC Digital Credentials Consortium"
            className="h-8 max-h-16 w-auto object-contain"
          />
        </a>
        <h1 className="text-3xl font-bold font-headline text-primary">
          <Link href="/">Credential Co-writer</Link>
        </h1>
      </div>
    </header>
  );
}
