'use client';

import { useEffect, useState } from 'react';
import { formatEther } from 'viem';
import { useAccount, useChainId, useBalance } from 'wagmi';

interface WalletInfo {
  address: string | undefined;
  chainId: number | undefined;
  chainName: string;
  isConnected: boolean;
  balance: string | null;
  isLoading: boolean;
  connector: string | undefined;
}

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum Mainnet',
  11155111: 'Sepolia Testnet',
  421614: 'Arbitrum Sepolia',
  137: 'Polygon Mainnet',
  80001: 'Polygon Mumbai',
  56: 'BNB Smart Chain',
  97: 'BNB Testnet',
  43114: 'Avalanche C-Chain',
  43113: 'Avalanche Fuji',
  250: 'Fantom Opera',
  4002: 'Fantom Testnet',
  10: 'Optimism',
  420: 'Optimism Goerli',
  42161: 'Arbitrum One',
  421613: 'Arbitrum Goerli',
};

export function useWalletInfo(): WalletInfo {
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const [isLoading, setIsLoading] = useState(true);
  
  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address: address,
  });

  const chainName = CHAIN_NAMES[chainId] || `Chain ${chainId}`;
  const balance = balanceData ? formatEther(balanceData.value) : null;

  useEffect(() => {
    // Set loading to false once we have the initial data
    if (!balanceLoading) {
      setIsLoading(false);
    }
  }, [balanceLoading]);

  return {
    address,
    chainId,
    chainName,
    isConnected,
    balance,
    isLoading,
    connector: connector?.name,
  };
}