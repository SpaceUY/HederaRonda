'use client';

import { useState, useEffect, useCallback } from 'react';

import { tokenFormatter, TokenFormatter } from '@/lib/token-formatter';

interface TokenFormatterState {
  monthlyDeposit: string;
  entryFee: string;
  totalContribution: string;
  isLoading: boolean;
  error: string | null;
}

interface UseTokenFormatterReturn extends TokenFormatterState {
  formatAmount: (rawAmount: string | bigint, decimals: number, symbol: string) => string;
  refreshFormats: () => Promise<void>;
  clearCache: () => void;
}

export function useTokenFormatter(
  contractAddress: string,
  monthlyDepositRaw?: string | bigint,
  participantCount?: number
): UseTokenFormatterReturn {
  const [state, setState] = useState<TokenFormatterState>({
    monthlyDeposit: '0.0000 MTK',
    entryFee: '0.001 MTK',
    totalContribution: '0.0000 MTK',
    isLoading: false,
    error: null,
  });

  const formatAmounts = useCallback(async () => {
    if (!contractAddress) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('🎨 Formatting token amounts for contract:', contractAddress);

      const promises: Promise<string>[] = [];

      // Format monthly deposit
      if (monthlyDepositRaw) {
        promises.push(tokenFormatter.formatMonthlyDeposit(contractAddress, monthlyDepositRaw));
      } else {
        promises.push(Promise.resolve('0.0000 MTK'));
      }

      // Format entry fee
      promises.push(tokenFormatter.formatEntryFee(contractAddress));

      // Format total contribution
      if (monthlyDepositRaw && participantCount) {
        promises.push(tokenFormatter.formatTotalContribution(contractAddress, monthlyDepositRaw, participantCount));
      } else {
        promises.push(Promise.resolve('0.0000 MTK'));
      }

      const [monthlyDeposit, entryFee, totalContribution] = await Promise.all(promises);

      setState({
        monthlyDeposit: monthlyDeposit || '0.0000 MTK',
        entryFee: entryFee || '0.001 MTK',
        totalContribution: totalContribution || '0.0000 MTK',
        isLoading: false,
        error: null,
      });

      console.log('✅ Token amounts formatted:', {
        monthlyDeposit,
        entryFee,
        totalContribution,
      });
    } catch (error: any) {
      console.error('❌ Error formatting token amounts:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to format token amounts',
      }));
    }
  }, [contractAddress, monthlyDepositRaw, participantCount]);

  const refreshFormats = useCallback(async () => {
    await formatAmounts();
  }, [formatAmounts]);

  const clearCache = useCallback(() => {
    tokenFormatter.clearCache(contractAddress);
  }, [contractAddress]);

  const formatAmount = useCallback((rawAmount: string | bigint, decimals: number, symbol: string) => {
    return tokenFormatter.formatAmount(rawAmount, decimals, symbol);
  }, []);

  // Format amounts when dependencies change
  useEffect(() => {
    formatAmounts();
  }, [formatAmounts]);

  return {
    ...state,
    formatAmount,
    refreshFormats,
    clearCache,
  };
}