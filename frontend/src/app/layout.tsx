import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import '@/styles/globals.css';

import { ErrorBoundary } from '@/components/common/error-boundary';
import { Toaster } from '@/components/ui/sonner';
import { Web3Provider } from '@/providers/web3-provider';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'RONDA - Decentralized Rotating Savings',
  description: 'A decentralized platform for rotating savings groups (ROSCAs) built on blockchain technology.',
  keywords: ['DeFi', 'Rotating Savings', 'ROSCA', 'Blockchain', 'Web3', 'Savings Group'],
  authors: [{ name: 'RONDA Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Web3Provider>
          <ErrorBoundary>
            {children}
            <Toaster />
          </ErrorBoundary>
        </Web3Provider>
      </body>
    </html>
  );
}