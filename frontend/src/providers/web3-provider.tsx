'use client';

import '@rainbow-me/rainbowkit/styles.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiContextProvider } from './wagmi-context';
import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/wagmi';

interface Web3ProviderProps {
  children: React.ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [mounted, setMounted] = useState(false);
  
  // Use useRef to ensure QueryClient is only created once
  const queryClientRef = useRef<QueryClient>();
  
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          // Prevent refetching on window focus in development
          refetchOnWindowFocus: false,
          // Reduce retry attempts to prevent multiple initializations
          retry: 1,
        },
      },
    });
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render wallet providers on the client side
  if (!mounted) {
    return (
      <div style={{ visibility: 'hidden', height: '100vh', pointerEvents: 'none' }}>
        {children}
      </div>
    );
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClientRef.current}>
        <RainbowKitProvider>
          <WagmiContextProvider>
            {children}
          </WagmiContextProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}