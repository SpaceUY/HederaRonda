'use client';

import * as CCIP from '@chainlink/ccip-js';
import { useState, useCallback, useEffect, useRef } from 'react';
import { formatEther } from 'viem';
import { useAccount, usePublicClient, useChainId } from 'wagmi';

import { 
  getCCIPNetworkConfig, 
  needsCrossChainCommunication, 
  getContractAddress,
  isCCIPSupported, 
  CCIPNetworkConfig
} from '@/constants/ccip-config';

export interface CCIPState {
  isCrossChain: boolean;
  ccipSupported: boolean;
  ccipFee: bigint | null;
  isEstimatingCCIPFee: boolean;
  contractAddress: string;
  networkConfig: CCIPNetworkConfig | null;
}

export interface UseCCIPParams {
  targetChainId: number;
  targetContractAddress: string;
  amount: bigint;
}

export function useCCIP({ 
  targetChainId, 
  targetContractAddress, 
  amount
}: UseCCIPParams): CCIPState {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const userChainId = useChainId();
  
  // CCIP-related state
  const [ccipFee, setCcipFee] = useState<bigint | null>(null);
  const [isEstimatingCCIPFee, setIsEstimatingCCIPFee] = useState(false);

  // Initialize CCIP client
  const ccipClient = CCIP.createClient();
  
  // Track last estimation to prevent duplicate calls
  const lastEstimationKey = useRef<string>('');

  // Cross-chain configuration
  const isCrossChain = needsCrossChainCommunication(userChainId, targetChainId);
  const ccipSupported = isCCIPSupported(userChainId);

  // Get the appropriate contract address
  const contractAddress = getContractAddress(
    userChainId, 
    targetChainId, 
    targetContractAddress
  );
  
  const networkConfig = getCCIPNetworkConfig(userChainId);
  const sepoliaNetworkConfig = getCCIPNetworkConfig(11155111);

  // CCIP fee estimation function
  const estimateCCIPFee = useCallback(async () => {
    if (!address || !publicClient || !isCrossChain || !ccipSupported || !networkConfig || !sepoliaNetworkConfig) {
      console.log('🚫 CCIP fee estimation skipped:', {
        hasAddress: !!address,
        hasPublicClient: !!publicClient,
        isCrossChain,
        ccipSupported,
        hasNetworkConfig: !!networkConfig,
        hasSepoliaConfig: !!sepoliaNetworkConfig
      });
      return;
    }

    try {
      setIsEstimatingCCIPFee(true);
      console.log('🌐 Starting CCIP fee estimation...');

      const fee = await ccipClient.getFee({
        client: publicClient as any,
        routerAddress: networkConfig.routerAddress as `0x${string}`,
        tokenAddress: networkConfig.mainTokenAddress as `0x${string}`,
        amount: BigInt(amount),
        destinationAccount: targetContractAddress as `0x${string}`,
        destinationChainSelector: sepoliaNetworkConfig.chainSelector,
      });
      
      console.log('✅ CCIP fee estimation:', {
        fee: fee.toString(),
        feeFormatted: formatEther(fee) + ' ETH'
      });

      setCcipFee(fee);

    } catch (err: any) {
      console.error('❌ CCIP fee estimation failed:', err);
      console.error('Error details:', {
        message: err.message,
        cause: err.cause,
        data: err.data,
        stack: err.stack
      });
    } finally {
      setIsEstimatingCCIPFee(false);
    }
  }, [address, publicClient, isCrossChain, ccipSupported, networkConfig, sepoliaNetworkConfig, ccipClient, amount, targetContractAddress]);

  // Estimate CCIP fee when cross-chain and parameters change
  useEffect(() => {
    // Only estimate if we have all required data and haven't estimated for these exact parameters yet  
    if (address && amount > 0n && targetContractAddress && isCrossChain && ccipSupported && userChainId !== targetChainId && !isEstimatingCCIPFee) {
      const estimationKey = `${userChainId}-${targetChainId}-${amount.toString()}-${targetContractAddress}`;
      
      // Skip if we've already estimated for these exact parameters
      if (lastEstimationKey.current === estimationKey) {
        return;
      }
      
      console.log('🔄 Triggering CCIP fee estimation:', {
        userChainId,
        targetChainId,
        isCrossChain,
        ccipSupported,
        estimationKey
      });
      
      lastEstimationKey.current = estimationKey;
      estimateCCIPFee();
    }
  }, [address, amount, targetContractAddress, isCrossChain, ccipSupported, userChainId, targetChainId, isEstimatingCCIPFee, estimateCCIPFee]);


  return {
    isCrossChain,
    ccipSupported,
    ccipFee,
    isEstimatingCCIPFee,
    contractAddress,
    networkConfig
  };
} 