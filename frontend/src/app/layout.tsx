import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

import '@/styles/globals.css';

import { ErrorBoundary } from '@/components/common/error-boundary';
import { Toaster } from '@/components/ui/sonner';
import { SpaceBadge } from '@/components/ui/space-badge';

// Dynamically import Web3Provider with SSR disabled
const Web3Provider = dynamic(
  () =>
    import('@/providers/web3-provider').then((mod) => ({
      default: mod.Web3Provider,
    })),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'RONDA - Decentralized Rotating Savings',
  description:
    'A decentralized platform for rotating savings groups (ROSCAs) built on blockchain technology.',
  keywords: [
    'DeFi',
    'Rotating Savings',
    'ROSCA',
    'Blockchain',
    'Web3',
    'Savings Group',
  ],
  authors: [{ name: 'RONDA Team' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/x-icon" href="favicon.png" />
      </head>

      <body className="font-sans">
        <Web3Provider>
          <ErrorBoundary>
            {children}
            <Toaster />
            <SpaceBadge />
          </ErrorBoundary>
        </Web3Provider>
      </body>
    </html>
  );
}
