'use client';

import { useAccount, useBalance, useChainId } from 'wagmi';
import { useEffect, useState } from 'react';

import { formatEther } from 'viem';
import { useWagmiReady } from './use-wagmi-ready';

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
  const isWagmiReady = useWagmiReady();
  
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  
  const [isLoading, setIsLoading] = useState(true);
  
  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address: address,
    query: { enabled: isWagmiReady && !!address },
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
    address: isWagmiReady ? address : undefined,
    chainId: isWagmiReady ? chainId : undefined,
    chainName: isWagmiReady ? CHAIN_NAMES[chainId] || `Chain ${chainId}` : 'Unknown',
    isConnected: isWagmiReady ? isConnected : false,
    balance: isWagmiReady ? balance : null,
    isLoading: isWagmiReady ? isLoading : false,
    connector: isWagmiReady ? connector?.name : undefined,
  };
}