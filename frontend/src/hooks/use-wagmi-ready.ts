'use client';

import { useWagmiContext } from '@/providers/wagmi-context';

export function useWagmiReady() {
  const { isReady } = useWagmiContext();
  return isReady;
} 