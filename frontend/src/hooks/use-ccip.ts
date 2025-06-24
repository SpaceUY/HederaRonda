'use client';

import * as CCIP from '@chainlink/ccip-js';
import { useState, useCallback, useEffect } from 'react';
import { formatEther } from 'viem';
import { useAccount, usePublicClient, useChainId } from 'wagmi';

import { 
  getCCIPNetworkConfig, 
  needsCrossChainCommunication, 
  getContractAddress,
  isCCIPSupported 
} from '@/constants/ccip-config';

export interface CCIPState {
  isCrossChain: boolean;
  ccipSupported: boolean;
  ccipFee: bigint | null;
  isEstimatingCCIPFee: boolean;
  needsCCIPApproval: boolean;
  contractAddress: string;
  networkConfig: any;
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
  const [needsCCIPApproval, setNeedsCCIPApproval] = useState(false);

  // Initialize CCIP client
  const ccipClient = CCIP.createClient();

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
  }, [address, publicClient, isCrossChain, ccipSupported, networkConfig, sepoliaNetworkConfig, ccipClient, amount, targetContractAddress, userChainId, targetChainId]);

  // Check CCIP approval status
  const checkCCIPApproval = useCallback(async () => {
    if (!address || !isCrossChain || !ccipSupported || !networkConfig || !publicClient) {
      return;
    }

    try {
      // Check if user has approved the router to spend their LINK tokens
      const allowance = await publicClient.readContract({
        address: networkConfig.linkTokenAddress as `0x${string}`,
        abi: [
          {
            "type": "function",
            "name": "allowance",
            "inputs": [
              { "name": "owner", "type": "address" },
              { "name": "spender", "type": "address" }
            ],
            "outputs": [{ "name": "", "type": "uint256" }],
            "stateMutability": "view"
          }
        ],
        functionName: 'allowance',
        args: [address, networkConfig.routerAddress as `0x${string}`],
      });

      setNeedsCCIPApproval(allowance < amount);

    } catch (err: any) {
      console.error('❌ CCIP approval check failed:', err);
      setNeedsCCIPApproval(true); // Assume approval is needed if check fails
    }
  }, [address, isCrossChain, ccipSupported, networkConfig, publicClient, amount]);

  // Estimate CCIP fee when cross-chain and parameters change
  useEffect(() => {
    if (address && amount && targetContractAddress && isCrossChain && ccipSupported && userChainId !== targetChainId) {
      console.log('🔄 Triggering CCIP fee estimation:', {
        userChainId,
        targetChainId,
        isCrossChain,
        ccipSupported
      });
      estimateCCIPFee();
      checkCCIPApproval();
    }
  }, [address, amount, targetContractAddress, isCrossChain, ccipSupported, userChainId, targetChainId, estimateCCIPFee, checkCCIPApproval]);


  return {
    isCrossChain,
    ccipSupported,
    ccipFee,
    isEstimatingCCIPFee,
    needsCCIPApproval,
    contractAddress,
    networkConfig
  };
} 