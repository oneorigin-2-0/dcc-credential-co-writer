'use client';

import Link from 'next/link';

export function Header() {
  return (
    <header className="p-4 border-b bg-card">
      <div className="container mx-auto flex items-center justify-between gap-4">
        {/* Left: DCC Logo linking back to home */}
        <Link href="/" className="flex items-center">
          <img
            src="/assets/DCC_LOGO.png"
            alt="DCC Digital Credentials Consortium"
            className="h-10 max-h-20 w-auto object-contain"
          />
        </Link>

        {/* Center: App title */}
        <h1 className="flex-1 text-center text-3xl font-bold font-headline text-primary">
          <Link href="/">Credential Co-writer</Link>
        </h1>

        {/* Right: Navigation links */}
        <nav className="flex items-center gap-4">
          <Link
            href="/about"
            className="text-sm font-medium text-primary hover:underline"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
