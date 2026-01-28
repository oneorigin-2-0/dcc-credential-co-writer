import type { Metadata } from 'next';
import { Roboto, Roboto_Serif, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ReduxProvider } from '@/providers/ReduxProvider';

// DCC Brand Fonts - Roboto family
const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-website'
});

const robotoSerif = Roboto_Serif({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-headline'
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-subhead'
});

// Set body font variable to Roboto Light
const robotoBody = Roboto({
  subsets: ['latin'],
  weight: ['300'],
  variable: '--font-body'
});

export const metadata: Metadata = {
  title: 'Credential Co-writer',
  description:
    'Create OpenBadges with AI assistance. Analyze content, get suggestions for title, description, and criteria, and export in OpenBadge 3.0 format.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${roboto.variable} ${robotoSerif.variable} ${robotoMono.variable} ${robotoBody.variable} font-website antialiased`}>
        {/* Skip Links for Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:shadow-lg"
        >
          Skip to main content
        </a>
        <ReduxProvider>
          <Header />
          {children}
          <Footer />
          <Toaster />
        </ReduxProvider>
      </body>
    </html>
  );
}
