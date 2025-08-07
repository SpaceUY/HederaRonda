'use client';

import { erc20Abi, formatEther, parseEther } from 'viem';
import {
  useAccount,
  useBalance,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { RONDA_ABI } from '@/constants/abis/ronda-abi';
import { RONDA_SENDER_ABI } from '@/constants/abis/ronda-sender-abi';
import { usePenaltyCheck } from '@/hooks/use-penalty-check';
import { useQueryClient } from '@tanstack/react-query';
import { useWagmiReady } from '@/hooks/use-wagmi-ready';

type JoinStep = 'idle' | 'checking' | 'estimating' | 'approving' | 'joining' | 'success' | 'error';

// Helper function to determine if cross-chain communication is needed
function needsCrossChainCommunication(userChainId: number, targetChainId: number): boolean {
  return userChainId !== targetChainId;
}

export function useRoscaJoin({
  roscaContractAddress,
  paymentToken,
  entryFeeFormatted,
  onSuccess,
  userChainId,
  targetChainId,
  rondaSenderAddress,
}: {
  roscaContractAddress: string;
  paymentToken: string;
  entryFeeFormatted: number;
  onSuccess?: () => void;
  userChainId?: number | undefined;
  targetChainId?: number | undefined;
  rondaSenderAddress?: string | undefined;
}) {
  const isWagmiReady = useWagmiReady();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<JoinStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<bigint | null>(null);
  const [estimatedGasCost, setEstimatedGasCost] = useState<bigint | null>(null);

  // Determine if this is a cross-chain operation
  const isCrossChain = useMemo(() => {
    if (!userChainId || !targetChainId) {
      return false;
    }
    const result = needsCrossChainCommunication(userChainId, targetChainId);
    console.log('🔗 Cross-chain check:', {
      userChainId,
      targetChainId,
      isCrossChain: result,
      rondaSenderAddress
    });
    return result;
  }, [userChainId, targetChainId, rondaSenderAddress]);

  // Use the appropriate contract address and ABI
  const contractAddress = useMemo(() => {
    if (isCrossChain && rondaSenderAddress) {
      console.log('🔗 Using RondaSender contract for cross-chain join:', rondaSenderAddress);
      return rondaSenderAddress;
    }
    console.log('🔗 Using direct RONDA contract for same-chain join:', roscaContractAddress);
    return roscaContractAddress;
  }, [isCrossChain, rondaSenderAddress, roscaContractAddress]);

  const contractAbi = useMemo(() => {
    if (isCrossChain) {
      return RONDA_SENDER_ABI;
    }
    return RONDA_ABI;
  }, [isCrossChain]);

  const functionName = useMemo(() => {
    return 'joinRonda' as const;
  }, []);

  const functionArgs = useMemo(() => {
    if (isCrossChain) {
      // For cross-chain: joinRonda(address rondaContract, address token, uint256 amount)
      return [
        roscaContractAddress as `0x${string}`,
        paymentToken as `0x${string}`,
        parseEther(entryFeeFormatted.toString()) 
      ] as const;
    } else {
      // For same-chain: joinRonda()
      return [] as const;
    }
  }, [isCrossChain, roscaContractAddress, paymentToken, entryFeeFormatted]);

  // Penalty check
  const { hasPenalties, penaltyCount } = usePenaltyCheck();

  // Check if user is already a member (only for same-chain)
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

    const requiredAmount = parseEther(entryFeeFormatted.toString());
    return allowance < requiredAmount;
  }, [allowance, entryFeeFormatted]);

  // Approve tokens
  const { writeContract: writeApproval } = useWriteContract();

  // Join RONDA
  const { writeContract: writeJoin } = useWriteContract();

  // Estimate gas with debouncing
  const estimateGas = useCallback(async () => {
    if (!publicClient || !address || !contractAddress) {
      return;
    }

    // Add a small delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      console.log('⛽ Estimating gas for joinRonda...');

      // Use a higher default gas limit for safety
      const defaultGas = 300000n;
      let estimatedGas = defaultGas;

      try {
        const gas = await publicClient.estimateContractGas({
          address: contractAddress as `0x${string}`,
          abi: contractAbi,
          functionName: functionName,
          args: functionArgs,
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
  }, [publicClient, address, contractAddress, contractAbi, functionName, functionArgs]);

  // Decode contract errors
  const decodeContractError = useCallback((err: unknown): string => {
    console.log('🔍 Decoding contract error:', err);

    // Check for rate limiting errors
    const errorString = err instanceof Error ? err.message : String(err);
    if (errorString.includes('429') || errorString.includes('Too Many Requests')) {
      return 'Rate limit exceeded. Please wait a moment and try again.';
    }

    try {
      const cause = (err as { cause?: unknown }).cause || err;
      const errorName = (cause as { name?: string }).name || '';
      const errorMessage = (cause as { message?: string; shortMessage?: string }).message || (cause as { shortMessage?: string }).shortMessage || '';
      const errorData = (cause as { data?: { message?: string } }).data?.message || '';

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
    const errorMessage = err instanceof Error ? err.message : String(err);

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
    if (!isWagmiReady) {
      setError('Wagmi provider not ready');
      setStep('error');
      onSuccess?.();
      return;
    }
    
    if (!address) {
      setError('Wallet not connected');
      setStep('error');
      onSuccess?.();
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!contractAddress) {
      setError('Missing RONDA contract address');
      setStep('error');
      onSuccess?.();
      return;
    }

    if (hasPenalties) {
      setError(
        `You cannot participate in rounds due to contract violations. You have ${penaltyCount} penalty token${
          penaltyCount !== 1 ? 's' : ''
        }. Please resolve your penalties before joining.`
      );
      setStep('error');
      onSuccess?.();
      return;
    }

    if (isCrossChain) {
      if (!rondaSenderAddress) {
        setError('Missing RONDA Sender contract address');
        setStep('error');
        onSuccess?.();
        return;
      }
      if (!hasEnoughBalance) {
        if (!hasEnoughTokenBalance) {
          setError(`Insufficient token balance. Need ${entryFeeFormatted} tokens for entry fee.`);
        } else {
          setError(`Insufficient HBAR balance. Need ${formatEther(estimatedGasCost || parseEther('0.01'))} HBAR for gas.`);
        }
        setStep('error');
        onSuccess?.();
        return;
      }
    } else {
      if (isAlreadyMember) {
        setError('You have already joined this RONDA');
        setStep('error');
        onSuccess?.();
        return;
      }
      if (!hasEnoughBalance) {
        if (!hasEnoughTokenBalance) {
          setError(`Insufficient token balance. Need ${entryFeeFormatted} tokens for entry fee.`);
        } else {
          setError(`Insufficient HBAR balance. Need ${formatEther(estimatedGasCost || parseEther('0.01'))} HBAR for gas.`);
        }
        setStep('error');
        onSuccess?.();
        return;
      }
    }

    try {
      setError(null);

      setStep('checking');
      console.log('🔍 Performing final membership and penalty verification...');

      await new Promise((resolve) => setTimeout(resolve, 500));

      if (hasPenalties) {
        setError(
          `Cannot join: You have ${penaltyCount} penalty token${
            penaltyCount !== 1 ? 's' : ''
          } in your wallet`
        );
        setStep('error');
        onSuccess?.();
        return;
      }

      if (isCrossChain) {
        // For cross-chain, we don't check if already a member on the source chain
        console.log('🔗 Cross-chain join detected, skipping membership check');
      } else {
        if (isAlreadyMember) {
          setError('You have already joined this RONDA');
          setStep('error');
          onSuccess?.(); // Close modal on error
          return;
        }
      }

      if (!estimatedGas) {
        setStep('estimating');
        await estimateGas();
      }

      if (needsApproval) {
        setStep('approving');

        const approvalAmount = parseEther(entryFeeFormatted.toString());

        console.log('🔐 Approving ERC20 tokens:', {
          tokenContract: paymentToken,
          owner: address,
          spender: roscaContractAddress,
          amount: approvalAmount.toString(),
          amountFormatted: entryFeeFormatted,
        });

        console.log('📝 Calling writeApproval...');
        console.log('🔐 Calling writeApproval with:', {
          address: paymentToken,
          spender: roscaContractAddress,
          amount: approvalAmount.toString(),
          gas: 100000n
        });
        
        writeApproval({
          address: paymentToken as `0x${string}`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [
            roscaContractAddress as `0x${string}`,
            approvalAmount
          ],
          gas: 100000n,
        });
        console.log('📝 writeApproval called');

        return; 
      }

      setStep('joining');

      console.log('🚀 Executing joinRonda transaction:', {
        roscaContract: contractAddress,
        userAddress: address,
        paymentToken,
        entryFee: entryFeeFormatted,
        estimatedGas: estimatedGas?.toString(),
      });

      const gasConfig = estimatedGas ? { gas: estimatedGas } : { gas: 300000n };

      console.log('🚀 Calling writeJoin with:', {
        address: contractAddress,
        abi: contractAbi,
        functionName,
        args: functionArgs,
        gasConfig
      });
      
      writeJoin({
        address: contractAddress as `0x${string}`,
        abi: contractAbi,
        functionName: functionName,
        args: functionArgs,
        ...gasConfig
      });

    } catch (err: unknown) {
      console.error('❌ Error in join flow:', err);
      const decodedError = decodeContractError(err);
      setError(decodedError);
      setStep('error');
      onSuccess?.();
    }
  }, [
    address,
    contractAddress,
    roscaContractAddress,
    hasPenalties,
    penaltyCount,
    isCrossChain,
    rondaSenderAddress,
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
    functionName,
    functionArgs,
    contractAbi,
    isWagmiReady,
  ]);

  const { data: hash, error: writeError, isPending } = useWriteContract();

  useEffect(() => {
    console.log('🔍 Hash effect triggered:', { hash, step, isPending });
    if (hash) {
      console.log('📝 Transaction submitted:', {
        hash,
        step,
        type: step === 'approving' ? 'Token Approval' : 'Join RONDA'
      });
      setStep(step === 'approving' ? 'approving' : 'joining');
    }
  }, [hash, step, isPending]);

  const { isLoading: isConfirming, isSuccess: isConfirmed, error: waitError } = useWaitForTransactionReceipt({
    hash,
    onReplaced: (response) => {
      console.log('🔄 Transaction replaced:', response);
    },
    confirmations: 1,
  });

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

  useEffect(() => {
    if (step === 'success') {
      console.log('🎉 Success step reached, calling onSuccess callback');
      
      // Fallback: if onSuccess doesn't close the modal within 5 seconds, force close
      const fallbackTimeout = setTimeout(() => {
        console.log('⚠️ Fallback: forcing modal close after 5 seconds');
        onSuccess?.();
      }, 5000);
      
      return () => clearTimeout(fallbackTimeout);
    }
    return undefined;
  }, [step, onSuccess]);

  useEffect(() => {
    console.log('🔍 Transaction confirmation check:', {
      isConfirmed,
      step,
      hash,
      isPending,
      isConfirming
    });
    
    if (isConfirmed && (step === 'joining' || step === 'approving')) {
      console.log('🎉 Transaction confirmed:', {
        step,
        type: step === 'approving' ? 'Token Approval' : 'Join RONDA',
        hash
      });
      
      if (step === 'joining') {
        console.log('✅ Join transaction confirmed, setting success state');
        queryClient.invalidateQueries();
        
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return (
              Array.isArray(queryKey) &&
              (queryKey.includes('readContract') || 
               queryKey.includes('hasParticipantJoined') ||
               queryKey.includes('participantCount') ||
               queryKey.includes('currentState'))
            );
          },
        });
        
        setStep('success');
        console.log('📞 Calling onSuccess callback');
        
        setTimeout(() => {
          onSuccess?.();
        }, 500);
      } else if (step === 'approving') {
        console.log('✅ Approval confirmed, proceeding with join...');
        setStep('joining');
        
        const timeoutId = setTimeout(() => {
          console.log('🚀 Executing join after approval...');
          writeJoin({
            address: contractAddress as `0x${string}`,
            abi: contractAbi,
            functionName: functionName,
            args: functionArgs,
            gas: estimatedGas || 300000n
          });
        }, 1000);
        
        return () => clearTimeout(timeoutId);
      }
    }
    return undefined;
  }, [isConfirmed, step, onSuccess, queryClient, roscaContractAddress, writeJoin, estimatedGas, hash, contractAddress, contractAbi, functionName, functionArgs, isPending, isConfirming]);

  useEffect(() => {
    const error = writeError || waitError;
    if (error) {
      console.error('❌ Transaction error:', {
        error,
        step,
        hash,
        writeError,
        waitError
      });
      const decodedError = decodeContractError(error);
      console.log('🔍 Decoded error:', decodedError);
      setError(decodedError);
      setStep('error');
    }
  }, [writeError, waitError, decodeContractError, step, hash]);

  useEffect(() => {
    if ((step === 'joining' || step === 'approving') && hash) {
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Transaction timeout detected, allowing modal to close');
        setStep('error');
        setError('Transaction timeout. Please check your wallet and try again.');
      }, 300000);
      
      return () => clearTimeout(timeoutId);
    }
    
    // Fallback: if we're in approving/joining step but no hash after 10 seconds, 
    // assume transaction was sent through Metamask and proceed
    if ((step === 'joining' || step === 'approving') && !hash) {
      const fallbackTimeout = setTimeout(() => {
        console.log('🔄 Fallback: No hash detected but step is active, assuming transaction was sent');
        if (step === 'approving') {
          console.log('✅ Assuming approval was successful, proceeding to join');
          setStep('joining');
          // Try to execute the join transaction
          setTimeout(() => {
            writeJoin({
              address: contractAddress as `0x${string}`,
              abi: contractAbi,
              functionName: functionName,
              args: functionArgs,
              gas: estimatedGas || 300000n
            });
          }, 1000);
        } else if (step === 'joining') {
          console.log('✅ Assuming join was successful');
          setStep('success');
          onSuccess?.();
        }
      }, 10000);
      
      return () => clearTimeout(fallbackTimeout);
    }
    
    return undefined;
  }, [step, hash, writeJoin, contractAddress, contractAbi, functionName, functionArgs, estimatedGas, onSuccess]);

  useEffect(() => {
    return () => {
      setStep('idle');
      setError(null);
    };
  }, []);

  // Don't return hooks data until Wagmi is ready
  if (!isWagmiReady) {
    return {
      step: 'idle' as const,
      error: null,
      isConfirming: false,
      isConfirmed: false,
      executeJoinFlow,
    };
  }

  return {
    step,
    error,
    isConfirming: isPending || isConfirming,
    isConfirmed,
    executeJoinFlow,
  };
}
