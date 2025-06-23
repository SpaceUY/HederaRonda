'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';

import { checkPenaltyTokens, PenaltyCheckResult } from '@/lib/penalty-contract';

interface UsePenaltyCheckReturn extends PenaltyCheckResult {
  checkPenalties: (address?: string) => Promise<void>;
  reset: () => void;
}

export function usePenaltyCheck(): UsePenaltyCheckReturn {
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

      setPenaltyResult((prev) => ({
        ...prev,
        isLoading: true,
        error: undefined,
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

  // Auto-check when wallet connects
  useEffect(() => {
    if (address) {
      checkPenalties(address);
    }
  }, [address, checkPenalties]);

  return {
    ...penaltyResult,
    checkPenalties,
    reset,
  };
}
