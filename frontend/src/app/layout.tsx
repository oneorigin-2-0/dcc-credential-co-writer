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
    <html lang="en">
      <body className={`${openSans.variable} font-sans antialiased`} style={{
          background: 'radial-gradient(circle at center top, rgb(30, 58, 138) 0%, rgb(28, 52, 116) 25%, rgb(0, 0, 0) 70%)',
        }}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
