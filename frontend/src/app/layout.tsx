import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'BadgeSmith - AI-Powered Badge Creator',
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
      <body className={`${openSans.variable} font-sans antialiased`} style={{
          background: 'radial-gradient(circle at center top, rgb(138, 30, 30) 0%, rgb(116, 28, 28) 25%, rgb(255, 255, 255) 100%)',
        }}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
