'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { erc20Abi, formatEther, parseEther } from 'viem';
import {
  useAccount,
  useBalance,
  useChainId,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';

import { RONDA_ABI } from '@/constants/abis/ronda-abi';
import { usePenaltyCheck } from '@/hooks/use-penalty-check';
import { NETWORK_CONFIG } from '@/lib/contracts';
import { getContractJoinConfig } from '@/utils/contract-utils';


type JoinStep = 'idle' | 'checking' | 'estimating' | 'approving' | 'joining' | 'success' | 'error';

export function useRoscaJoin({
  roscaContractAddress,
  paymentToken,
  entryFeeFormatted,
  onSuccess,
}: {
  roscaContractAddress: string;
  paymentToken: string;
  entryFeeFormatted: number;
  onSuccess?: () => void;
}) {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<JoinStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<bigint | null>(null);
  const [estimatedGasCost, setEstimatedGasCost] = useState<bigint | null>(null);

  // Penalty check
  const { hasPenalties, penaltyCount } = usePenaltyCheck();

  // Check if user is already a member
  const { data: isAlreadyMember } = useReadContract({
    address: roscaContractAddress as `0x${string}`,
    abi: RONDA_ABI,
    functionName: 'hasParticipantJoined',
    args: [address as `0x${string}`],
  });

  // Check if user has enough balance
  const { data: balance } = useBalance({
    address,
  });

  const hasEnoughBalance = useMemo(() => {
    if (!balance) {
      return false;
    }
    // If we have an estimated gas cost, use that, otherwise use a fallback of 0.01 HBAR
    const requiredGas = estimatedGasCost || parseEther('0.01');
    console.log('💰 Balance check:', {
      balance: formatEther(balance.value),
      required: formatEther(requiredGas),
      hasEnough: balance.value >= requiredGas,
    });
    return balance.value >= requiredGas;
  }, [balance, estimatedGasCost]);

  // Check if user has enough token balance
  const { data: tokenBalance } = useBalance({
    address,
    token: paymentToken as `0x${string}`,
  });

  const hasEnoughTokenBalance = useMemo(() => {
    if (!tokenBalance) {
      return false;
    }
    return tokenBalance.value >= parseEther(entryFeeFormatted.toString());
  }, [tokenBalance, entryFeeFormatted]);

  // Check if user needs to approve tokens
  const { data: allowance } = useReadContract({
    address: paymentToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address as `0x${string}`, roscaContractAddress as `0x${string}`],
  });

  const needsApproval = useMemo(() => {
    if (!allowance) {
      return true;
    }
    // USDC uses 6 decimals
    const requiredAmount = BigInt(entryFeeFormatted * 1_000_000);
    return allowance < requiredAmount;
  }, [allowance, entryFeeFormatted]);

  // Approve tokens
  const { writeContract: writeApproval } = useWriteContract();

  // Join RONDA
  const { writeContract: writeJoin } = useWriteContract();

  // Estimate gas
  const estimateGas = useCallback(async () => {
    if (!publicClient || !address || !roscaContractAddress) {
      return;
    }

    try {
      console.log('⛽ Estimating gas for joinRonda...');

      // Use a higher default gas limit for safety
      const defaultGas = 300000n;
      let estimatedGas = defaultGas;

      try {
        const gas = await publicClient.estimateContractGas({
          address: roscaContractAddress as `0x${string}`,
          abi: RONDA_ABI,
          functionName: 'joinRonda',
          args: [],
          account: address,
        });

        console.log('✅ Gas estimation:', {
          gas: gas.toString(),
        });

        // Add 20% buffer
        estimatedGas = (gas * 120n) / 100n;
      } catch (err) {
        console.warn('⚠️ Gas estimation failed, using default:', err);
      }

      setEstimatedGas(estimatedGas);

      // Get gas price
      const gasPrice = await publicClient.getGasPrice();
      const gasCost = estimatedGas * gasPrice;

      console.log('💰 Gas cost:', {
        gasPrice: formatEther(gasPrice),
        gasCost: formatEther(gasCost),
        estimatedGas: estimatedGas.toString(),
      });

      setEstimatedGasCost(gasCost);
    } catch (err) {
      console.error('❌ Failed to estimate gas:', err);
      // Use fallback values
      const fallbackGas = 300000n; // 300k gas units
      const gasPrice = await publicClient.getGasPrice();
      const gasCost = fallbackGas * gasPrice;

      console.log('⚠️ Using fallback gas estimate:', {
        gas: fallbackGas.toString(),
        gasPrice: formatEther(gasPrice),
        gasCost: formatEther(gasCost),
      });

      setEstimatedGas(fallbackGas);
      setEstimatedGasCost(gasCost);
    }
  }, [publicClient, address, roscaContractAddress]);

  // Decode contract errors
  const decodeContractError = useCallback((err: any): string => {
    console.log('🔍 Decoding contract error:', err);

    try {
      const cause = err.cause || err;
      const errorName = cause.name || '';
      const errorMessage = cause.message || cause.shortMessage || '';
      const errorData = cause.data?.message || '';

      console.log('📋 Error details:', {
        name: errorName,
        message: errorMessage,
        data: errorData,
        cause: cause,
      });

      // Map common contract errors to user-friendly messages
      if (
        errorName.includes('AlreadyJoined') ||
        errorMessage.includes('already joined') ||
        errorData.includes('already joined') ||
        errorMessage.includes('Already joined')
      ) {
        return 'You have already joined this RONDA';
      }

      if (
        errorName.includes('RondaNotOpen') ||
        errorMessage.includes('not open') ||
        errorData.includes('not open') ||
        errorMessage.includes('Ronda is not open')
      ) {
        return 'This RONDA is not currently accepting new participants';
      }

      if (
        errorName.includes('RondaFull') ||
        errorMessage.includes('full') ||
        errorData.includes('full')
      ) {
        return 'This RONDA has reached its maximum number of participants';
      }

      if (
        errorName.includes('InsufficientContribution') ||
        errorMessage.includes('insufficient') ||
        errorData.includes('insufficient')
      ) {
        return 'The contribution amount is insufficient for this RONDA';
      }

      if (
        errorName.includes('InvalidContribution') ||
        errorMessage.includes('invalid') ||
        errorData.includes('invalid')
      ) {
        return 'The contribution amount is not valid for this RONDA';
      }

      if (
        errorName.includes('RondaEnded') ||
        errorMessage.includes('ended') ||
        errorData.includes('ended')
      ) {
        return 'This RONDA has already ended';
      }

      if (
        errorName.includes('ERC20InsufficientAllowance') ||
        errorMessage.includes('insufficient allowance')
      ) {
        return 'Insufficient token allowance. Please approve tokens first.';
      }

      if (
        errorName.includes('ERC20InsufficientBalance') ||
        errorMessage.includes('insufficient balance')
      ) {
        return 'Insufficient token balance for this transaction';
      }

      if (
        errorName.includes('SafeERC20FailedOperation') ||
        errorMessage.includes('SafeERC20: operation did not succeed')
      ) {
        return 'Token transfer failed. Please check your balance and try again.';
      }

      if (
        errorName.includes('NotParticipant') ||
        errorMessage.includes('Not a participant') ||
        errorData.includes('Not a participant')
      ) {
        return 'You are not a participant in this RONDA';
      }

      if (
        errorName.includes('RondaNotRunning') ||
        errorMessage.includes('Ronda is not running') ||
        errorData.includes('Ronda is not running')
      ) {
        return 'This RONDA is not currently in the running state';
      }

      if (
        errorName.includes('AlreadyPaid') ||
        errorMessage.includes('Already paid') ||
        errorData.includes('Already paid')
      ) {
        return 'You have already paid for this milestone';
      }

      if (
        errorName.includes('InvalidMilestone') ||
        errorMessage.includes('Invalid milestone') ||
        errorData.includes('Invalid milestone')
      ) {
        return 'Invalid milestone index';
      }

      // Return the most descriptive error message available
      if (errorData) {
        return errorData;
      }
      if (errorMessage) {
        return errorMessage;
      }
      if (errorName) {
        return `Contract error: ${errorName}`;
      }
    } catch (decodeError) {
      console.log('⚠️ Could not decode contract error:', decodeError);
    }

    // Fallback to analyzing the raw error message
    const errorMessage = err.message || err.toString();

    if (errorMessage.includes('insufficient funds')) {
      return 'Insufficient HBAR for gas fees';
    }

    if (errorMessage.includes('user rejected')) {
      return 'Transaction was rejected by user';
    }

    if (errorMessage.includes('execution reverted')) {
      const revertMatch = errorMessage.match(
        /reverted with reason string '([^']+)'/
      );
      if (revertMatch) {
        return `Transaction failed: ${revertMatch[1]}`;
      }
      return 'Transaction failed - please check the RONDA requirements and try again';
    }

    return 'Transaction failed - please try again';
  }, []);

  const executeJoinFlow = useCallback(async () => {
    if (!address) {
      setError('Wallet not connected');
      setStep('error');
      onSuccess?.(); // Close modal on error
      return;
    }

    if (!roscaContractAddress) {
      setError('Missing RONDA contract address');
      setStep('error');
      onSuccess?.(); // Close modal on error
      return;
    }

    // Check for penalty tokens first
    if (hasPenalties) {
      setError(
        `You cannot participate in rounds due to contract violations. You have ${penaltyCount} penalty token${
          penaltyCount !== 1 ? 's' : ''
        }. Please resolve your penalties before joining.`
      );
      setStep('error');
      onSuccess?.(); // Close modal on error
      return;
    }

    // Check if user is already a member
    if (isAlreadyMember) {
      setError('You have already joined this RONDA');
      setStep('error');
      onSuccess?.(); // Close modal on error
      return;
    }

    if (!hasEnoughBalance) {
      if (!hasEnoughTokenBalance) {
        setError(`Insufficient token balance. Need ${entryFeeFormatted} tokens for entry fee.`);
      } else {
        setError(`Insufficient HBAR balance. Need ${formatEther(estimatedGasCost || parseEther('0.01'))} HBAR for gas.`);
      }
      setStep('error');
      onSuccess?.(); // Close modal on error
      return;
    }

    try {
      setError(null);

      // Step 0: Final membership and penalty check
      setStep('checking');
      console.log('🔍 Performing final membership and penalty verification...');

      // Small delay to show checking state
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (hasPenalties) {
        setError(
          `Cannot join: You have ${penaltyCount} penalty token${
            penaltyCount !== 1 ? 's' : ''
          } in your wallet`
        );
        setStep('error');
        onSuccess?.(); // Close modal on error
        return;
      }

      if (isAlreadyMember) {
        setError('You have already joined this RONDA');
        setStep('error');
        onSuccess?.(); // Close modal on error
        return;
      }

      // Re-estimate gas before transaction if needed
      if (!estimatedGas) {
        setStep('estimating');
        await estimateGas();
      }

      // Step 1: Approve tokens if needed (ERC20 only)
      if (needsApproval) {
        setStep('approving');

        // USDC uses 6 decimals
        const approvalAmount = BigInt(entryFeeFormatted * 1_000_000); // Convert to 6 decimals

        console.log('🔐 Approving ERC20 tokens:', {
          tokenContract: paymentToken,
          owner: address,
          spender: roscaContractAddress,
          amount: approvalAmount.toString(),
          amountFormatted: entryFeeFormatted,
        });

        // Approve RONDA contract to spend tokens
        writeApproval({
          address: paymentToken as `0x${string}`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [
            roscaContractAddress as `0x${string}`, // Spender (RONDA contract)
            approvalAmount // Amount to approve in proper decimals
          ],
          gas: 100000n,
        });

        return; 
      }

      // Step 2: Join RONDA
      setStep('joining');

      console.log('🚀 Executing joinRonda transaction:', {
        roscaContract: roscaContractAddress,
        userAddress: address,
        paymentToken,
        entryFee: entryFeeFormatted,
        estimatedGas: estimatedGas?.toString(),
      });

      const gasConfig = estimatedGas ? { gas: estimatedGas } : { gas: 300000n };

      writeJoin({
        address: roscaContractAddress as `0x${string}`,
        abi: RONDA_ABI,
        functionName: 'joinRonda',
        args: [] as const,
        ...gasConfig
      });

    } catch (err: any) {
      console.error('❌ Error in join flow:', err);
      const decodedError = decodeContractError(err);
      setError(decodedError);
      setStep('error');
      onSuccess?.(); // Close modal on error
    }
  }, [
    address,
    roscaContractAddress,
    hasPenalties,
    penaltyCount,
    isAlreadyMember,
    hasEnoughBalance,
    hasEnoughTokenBalance,
    paymentToken,
    entryFeeFormatted,
    estimatedGasCost,
    estimatedGas,
    estimateGas,
    needsApproval,
    writeApproval,
    writeJoin,
    decodeContractError,
    onSuccess,
  ]);

  // Watch for transaction success
  const { data: hash, error: writeError, isPending } = useWriteContract();

  // Log transaction hash when it changes
  useEffect(() => {
    if (hash) {
      console.log('📝 Transaction submitted:', {
        hash,
        step,
        type: step === 'approving' ? 'Token Approval' : 'Join RONDA'
      });
      // Update step to show confirming state
      setStep(step === 'approving' ? 'approving' : 'joining');
    }
  }, [hash, step]);

  const { isLoading: isConfirming, isSuccess: isConfirmed, error: waitError } = useWaitForTransactionReceipt({
    hash,
    onReplaced: (response) => {
      console.log('🔄 Transaction replaced:', response);
    },
  });

  // Log confirmation status changes
  useEffect(() => {
    console.log('🔄 Transaction status:', {
      isPending,
      isConfirming,
      isConfirmed,
      step,
      hash,
      error: writeError || waitError
    });
  }, [isPending, isConfirming, isConfirmed, step, hash, writeError, waitError]);

  // Watch for approval success
  useEffect(() => {
    if (isConfirmed && (step === 'joining' || step === 'approving')) {
      console.log('🎉 Transaction confirmed:', {
        step,
        type: step === 'approving' ? 'Token Approval' : 'Join RONDA',
        hash
      });
      
      if (step === 'joining') {
        // Invalidate only the relevant queries
        queryClient.invalidateQueries({
          queryKey: ['ronda', roscaContractAddress],
        });
        
        setStep('success');
        onSuccess?.();
      } else if (step === 'approving') {
        // Proceed with join after approval
        setTimeout(() => {
          executeJoinFlow();
        }, 1000);
      }
    }
  }, [isConfirmed, step, onSuccess, queryClient, roscaContractAddress, executeJoinFlow, hash]);

  // Watch for errors with enhanced logging
  useEffect(() => {
    const error = writeError || waitError;
    if (error) {
      console.error('❌ Transaction error:', {
        error,
        step,
        hash
      });
      const decodedError = decodeContractError(error);
      console.log('🔍 Decoded error:', decodedError);
      setError(decodedError);
      setStep('error');
      onSuccess?.();
    }
  }, [writeError, waitError, decodeContractError, onSuccess, step, hash]);

  return {
    step,
    error,
    isConfirming: isPending || isConfirming,
    isConfirmed,
    executeJoinFlow,
  };
}
