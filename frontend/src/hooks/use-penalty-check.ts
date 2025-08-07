'use client';

import { PenaltyCheckResult, checkPenaltyTokens } from '@/lib/penalty-contract';
import { useCallback, useEffect, useState } from 'react';

import { useAccount } from 'wagmi';
import { useWagmiReady } from './use-wagmi-ready';

interface UsePenaltyCheckReturn extends PenaltyCheckResult {
  checkPenalties: (address?: string) => Promise<void>;
  reset: () => void;
}

export function usePenaltyCheck(): UsePenaltyCheckReturn {
  const isWagmiReady = useWagmiReady();
  const { address } = useAccount();
  
  const [penaltyResult, setPenaltyResult] = useState<PenaltyCheckResult>({
    hasPenalties: false,
    penaltyCount: 0,
    isLoading: false,
  });

  const checkPenalties = useCallback(
    async (targetAddress?: string) => {
      const addressToCheck = targetAddress || address;

      if (!addressToCheck) {
        setPenaltyResult({
          hasPenalties: false,
          penaltyCount: 0,
          error: 'No wallet address provided',
          isLoading: false,
        });
        return;
      }

      setPenaltyResult((prev: PenaltyCheckResult) => ({
        ...prev,
        isLoading: true,
        error: '',
      }));

      try {
        const result = await checkPenaltyTokens(addressToCheck);
        setPenaltyResult(result);
      } catch (error: any) {
        setPenaltyResult({
          hasPenalties: false,
          penaltyCount: 0,
          error: error.message || 'Failed to check penalty tokens',
          isLoading: false,
        });
      }
    },
    [address]
  );

  const reset = useCallback(() => {
    setPenaltyResult({
      hasPenalties: false,
      penaltyCount: 0,
      isLoading: false,
    });
  }, []);

  useEffect(() => {
    if (isWagmiReady && address) {
      checkPenalties(address);
    }
  }, [isWagmiReady, address, checkPenalties]);

  return {
    ...penaltyResult,
    checkPenalties,
    reset,
  };
}
