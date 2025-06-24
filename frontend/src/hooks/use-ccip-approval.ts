'use client';

import { useCallback } from 'react';
import { erc20Abi } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

import { getCCIPNetworkConfig } from '@/constants/ccip-config';

export interface UseCCIPApprovalParams {
  userChainId: number;
  amount: bigint;
}

export interface UseCCIPApprovalReturn {
  approveCCIP: (amount: bigint) => void;
  isApprovalPending: boolean;
  isApprovalConfirming: boolean;
  isApprovalConfirmed: boolean;
  approvalError: any;
  approvalTxHash: string | undefined;
  resetApproval: () => void;
}

export function useCCIPApproval({ 
  userChainId, 
  amount 
}: UseCCIPApprovalParams): UseCCIPApprovalReturn {
  
  const networkConfig = getCCIPNetworkConfig(userChainId);

  const { 
    writeContract: writeApproval, 
    data: approvalTxHash,
    isPending: isApprovalPending,
    error: approvalError,
    reset: resetApproval
  } = useWriteContract();

  const { 
    isLoading: isApprovalConfirming,
    isSuccess: isApprovalConfirmed,
    error: approvalReceiptError
  } = useWaitForTransactionReceipt({
    hash: approvalTxHash,
  });

  const approveCCIP = useCallback((approvalAmount: bigint) => {
    if (!networkConfig) {
      console.error('❌ Network config not found for chain ID:', userChainId);
      return;
    }

    console.log('🔐 Approving LINK tokens for CCIP:', {
      token: networkConfig.linkTokenAddress,
      spender: networkConfig.routerAddress,
      amount: approvalAmount.toString(),
      chainId: userChainId
    });

    writeApproval({
      address: networkConfig.linkTokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'approve',
      args: [networkConfig.routerAddress as `0x${string}`, approvalAmount],
    });
  }, [networkConfig, userChainId, writeApproval]);

  return {
    approveCCIP,
    isApprovalPending,
    isApprovalConfirming,
    isApprovalConfirmed,
    approvalError: approvalError || approvalReceiptError,
    approvalTxHash,
    resetApproval
  };
} 