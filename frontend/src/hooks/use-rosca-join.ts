'use client';

import { useState, useCallback, useEffect } from 'react';
import { parseEther, formatEther, erc20Abi } from 'viem';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance, usePublicClient, useReadContract } from 'wagmi';

import { RONDA_ABI } from '@/lib/contracts';

export type JoinStep = 'idle' | 'checking' | 'estimating' | 'approving' | 'joining' | 'success' | 'error';

interface UseRoscaJoinReturn {
  step: JoinStep;
  error: string | null;
  isLoading: boolean;
  executeJoinFlow: () => Promise<void>;
  approvalHash: string | null;
  joinHash: string | null;
  reset: () => void;
  // Token approval data
  hasEnoughBalance: boolean;
  currentAllowance: bigint;
  needsApproval: boolean;
  // Gas estimation data
  estimatedGas: bigint | null;
  estimatedGasCost: bigint | null;
  estimatedGasCostFormatted: string | null;
  isEstimatingGas: boolean;
  // Additional gas details
  gasPrice: bigint | null;
  gasPriceGwei: string | null;
  totalCostWithGas: bigint | null;
  // Entry fee data
  entryFee: bigint;
  entryFeeFormatted: string;
  totalRequiredAmount: bigint;
  totalRequiredFormatted: string;
  // Membership verification
  isAlreadyMember: boolean;
  isCheckingMembership: boolean;
}

interface UseRoscaJoinParams {
  contributionAmount: string; // Amount in token units (e.g., "100" for 100 USDC)
  roscaContractAddress: string;
}

export function useRoscaJoin({ 
  contributionAmount, 
  roscaContractAddress 
}: UseRoscaJoinParams): UseRoscaJoinReturn {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [step, setStep] = useState<JoinStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [approvalHash, setApprovalHash] = useState<string | null>(null);
  const [joinHash, setJoinHash] = useState<string | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<bigint | null>(null);
  const [estimatedGasCost, setEstimatedGasCost] = useState<bigint | null>(null);
  const [gasPrice, setGasPrice] = useState<bigint | null>(null);
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);
  const [isCheckingMembership, setIsCheckingMembership] = useState(false);

  // Read contract data
  const { data: paymentToken } = useReadContract({
    address: roscaContractAddress as `0x${string}`,
    abi: RONDA_ABI,
    functionName: 'paymentToken',
    query: { enabled: !!roscaContractAddress }
  });

  const { data: entryFeeData } = useReadContract({
    address: roscaContractAddress as `0x${string}`,
    abi: RONDA_ABI,
    functionName: 'entryFee',
    query: { enabled: !!roscaContractAddress }
  });

  const { data: monthlyDepositData } = useReadContract({
    address: roscaContractAddress as `0x${string}`,
    abi: RONDA_ABI,
    functionName: 'monthlyDeposit',
    query: { enabled: !!roscaContractAddress }
  });

  // Check if user is already a member
  const { data: membershipData, isLoading: membershipLoading } = useReadContract({
    address: roscaContractAddress as `0x${string}`,
    abi: RONDA_ABI,
    functionName: 'hasParticipantJoined',
    args: [address!],
    query: { enabled: !!address && !!roscaContractAddress }
  });

  const isAlreadyMember = membershipData || false;

  // Determine if using ETH or ERC20
  const isETH = paymentToken === '0x0000000000000000000000000000000000000000';
  const entryFee = entryFeeData || 0n;
  const monthlyDeposit = monthlyDepositData || 0n;

  // Parse contribution amount based on token type
  const amountInWei = isETH 
    ? parseEther(contributionAmount || '0')
    : BigInt((parseFloat(contributionAmount || '0') * 1e6).toString()); // Assume 6 decimals for USDC

  // Total required amount (entry fee + monthly deposit)
  const totalRequiredAmount = entryFee + monthlyDeposit;

  // Check balance (ETH or ERC20)
  const { data: ethBalanceData } = useBalance({
    address: address,
    query: { enabled: !!address && isETH }
  });

  const { data: tokenBalanceData } = useReadContract({
    address: paymentToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address && !isETH && !!paymentToken }
  });

  const balance = isETH ? (ethBalanceData?.value || 0n) : (tokenBalanceData || 0n);

  // Check allowance for ERC20
  const { data: allowanceData } = useReadContract({
    address: paymentToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address!, roscaContractAddress as `0x${string}`],
    query: { enabled: !!address && !isETH && !!paymentToken }
  });

  const currentAllowance = allowanceData || 0n;
  const needsApproval = !isETH && currentAllowance < totalRequiredAmount;

  // Calculate total cost including gas
  const totalCostWithGas = isETH 
    ? totalRequiredAmount + (estimatedGasCost || parseEther('0.01'))
    : (estimatedGasCost || parseEther('0.01')); // For ERC20, only gas cost in ETH

  const hasEnoughBalance = isETH 
    ? balance >= totalCostWithGas
    : balance >= totalRequiredAmount;

  // Format values
  const entryFeeFormatted = isETH ? formatEther(entryFee) : (Number(entryFee) / 1e6).toString();
  const totalRequiredFormatted = isETH ? formatEther(totalRequiredAmount) : (Number(totalRequiredAmount) / 1e6).toString();
  const estimatedGasCostFormatted = estimatedGasCost ? formatEther(estimatedGasCost) : null;
  const gasPriceGwei = gasPrice ? formatEther(gasPrice * 1000000000n) : null;

  // Write contract hooks
  const { 
    writeContract: writeApproval, 
    data: approvalTxHash,
    isPending: isApprovalPending,
    error: approvalError,
    reset: resetApproval
  } = useWriteContract();

  const { 
    writeContract: writeJoin, 
    data: joinTxHash,
    isPending: isJoinPending,
    error: joinError,
    reset: resetJoin
  } = useWriteContract();

  // Transaction receipt hooks
  const { 
    isLoading: isApprovalConfirming,
    isSuccess: isApprovalConfirmed,
    error: approvalReceiptError
  } = useWaitForTransactionReceipt({
    hash: approvalTxHash,
  });

  const { 
    isLoading: isJoinConfirming,
    isSuccess: isJoinConfirmed,
    error: joinReceiptError
  } = useWaitForTransactionReceipt({
    hash: joinTxHash,
  });

  const isLoading = isApprovalPending || isApprovalConfirming || isJoinPending || isJoinConfirming || isEstimatingGas || isCheckingMembership || membershipLoading;

  // Helper function to decode contract errors
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
        cause: cause
      });
      
      // Map common contract errors to user-friendly messages
      if (errorName.includes('AlreadyJoined') || errorMessage.includes('already joined') || errorData.includes('already joined')) {
        return 'You have already joined this RONDA';
      }
      
      if (errorName.includes('RondaNotOpen') || errorMessage.includes('not open') || errorData.includes('not open')) {
        return 'This RONDA is not currently accepting new participants';
      }
      
      if (errorName.includes('RondaFull') || errorMessage.includes('full') || errorData.includes('full')) {
        return 'This RONDA has reached its maximum number of participants';
      }
      
      if (errorName.includes('InsufficientContribution') || errorMessage.includes('insufficient') || errorData.includes('insufficient')) {
        return 'The contribution amount is insufficient for this RONDA';
      }
      
      if (errorName.includes('InvalidContribution') || errorMessage.includes('invalid') || errorData.includes('invalid')) {
        return 'The contribution amount is not valid for this RONDA';
      }
      
      if (errorName.includes('RondaEnded') || errorMessage.includes('ended') || errorData.includes('ended')) {
        return 'This RONDA has already ended';
      }

      if (errorName.includes('ERC20InsufficientAllowance') || errorMessage.includes('insufficient allowance')) {
        return 'Insufficient token allowance. Please approve tokens first.';
      }

      if (errorName.includes('ERC20InsufficientBalance') || errorMessage.includes('insufficient balance')) {
        return 'Insufficient token balance for this transaction';
      }
      
      // Return the most descriptive error message available
      if (errorData) {return errorData;}
      if (errorMessage) {return errorMessage;}
      if (errorName) {return `Contract error: ${errorName}`;}
      
    } catch (decodeError) {
      console.log('⚠️ Could not decode contract error:', decodeError);
    }
    
    // Fallback to analyzing the raw error message
    const errorMessage = err.message || err.toString();
    
    if (errorMessage.includes('insufficient funds')) {
      return isETH ? 'Insufficient ETH for transaction and gas fees' : 'Insufficient ETH for gas fees';
    }
    
    if (errorMessage.includes('user rejected')) {
      return 'Transaction was rejected by user';
    }
    
    if (errorMessage.includes('execution reverted')) {
      const revertMatch = errorMessage.match(/reverted with reason string '([^']+)'/);
      if (revertMatch) {
        return `Transaction failed: ${revertMatch[1]}`;
      }
      return 'Transaction failed - please check the RONDA requirements and try again';
    }
    
    return 'Transaction failed - please try again';
  }, [isETH]);

  // Enhanced gas estimation function
  const estimateGas = useCallback(async () => {
    if (!address || !publicClient || !contributionAmount || !roscaContractAddress) {
      return;
    }

    try {
      setIsEstimatingGas(true);
      console.log('⛽ Starting gas estimation for joinRonda...');

      // Get current gas price
      const currentGasPrice = await publicClient.getGasPrice();
      setGasPrice(currentGasPrice);
      
      console.log('📊 Current gas price:', {
        gasPrice: currentGasPrice.toString(),
        gasPriceGwei: formatEther(currentGasPrice * 1000000000n) + ' Gwei'
      });

      // Estimate gas for joinRonda
      console.log('🔍 Estimating gas for joinRonda contract call...');
      console.log('📝 Contract details:', {
        address: roscaContractAddress,
        function: 'joinRonda',
        value: isETH ? totalRequiredAmount.toString() + ' wei' : '0 wei',
        caller: address,
        paymentToken: isETH ? 'ETH' : paymentToken,
        totalRequired: totalRequiredFormatted
      });

      const gasEstimate = await publicClient.estimateContractGas({
        address: roscaContractAddress as `0x${string}`,
        abi: RONDA_ABI,
        functionName: 'joinRonda',
        account: address,
        value: isETH ? totalRequiredAmount : 0n, // Send ETH only if using ETH
      });

      console.log('✅ Gas estimation from contract:', {
        gasEstimate: gasEstimate.toString(),
        gasEstimateFormatted: `${gasEstimate.toLocaleString()} gas units`
      });

      // Add safety buffer (20% extra)
      const gasWithBuffer = (gasEstimate * 120n) / 100n;
      const totalGasCost = gasWithBuffer * currentGasPrice;

      console.log('💸 Total gas cost calculation:', {
        gasUnits: gasWithBuffer.toString(),
        gasPrice: currentGasPrice.toString(),
        totalCostWei: totalGasCost.toString(),
        totalCostETH: formatEther(totalGasCost)
      });

      setEstimatedGas(gasWithBuffer);
      setEstimatedGasCost(totalGasCost);

    } catch (err: any) {
      console.error('❌ Gas estimation failed:', err);
      
      const decodedError = decodeContractError(err);
      console.log('🔍 Decoded error message:', decodedError);
      
      setError(decodedError);
      
      // Use fallback gas estimation for network errors only
      const shouldUseFallback = !decodedError.includes('already joined') && 
                               !decodedError.includes('not currently accepting') && 
                               !decodedError.includes('maximum number') &&
                               !decodedError.includes('insufficient') &&
                               !decodedError.includes('ended') &&
                               decodedError.includes('try again');
      
      if (shouldUseFallback) {
        console.log('🔄 Using fallback gas estimation...');
        
        let fallbackGasPrice: bigint;
        try {
          fallbackGasPrice = await publicClient.getGasPrice();
          setGasPrice(fallbackGasPrice);
        } catch {
          fallbackGasPrice = parseEther('0.000000020'); // 20 Gwei fallback
        }
        
        const fallbackGas = 300000n; // 300k gas units for ERC20 operations
        const fallbackCost = fallbackGas * fallbackGasPrice;
        
        setEstimatedGas(fallbackGas);
        setEstimatedGasCost(fallbackCost);
      }
    } finally {
      setIsEstimatingGas(false);
    }
  }, [address, publicClient, contributionAmount, roscaContractAddress, totalRequiredAmount, isETH, paymentToken, totalRequiredFormatted, decodeContractError]);

  // Check membership when parameters change
  useEffect(() => {
    if (address && roscaContractAddress && step === 'idle') {
      setIsCheckingMembership(true);
      // The membership check is handled by the useReadContract hook
      // We just need to wait for it to complete
      setTimeout(() => setIsCheckingMembership(false), 1000);
    }
  }, [address, roscaContractAddress, step]);

  // Estimate gas when parameters change and user is not already a member
  useEffect(() => {
    if (address && contributionAmount && roscaContractAddress && step === 'idle' && !isAlreadyMember && !membershipLoading) {
      estimateGas();
    }
  }, [address, contributionAmount, roscaContractAddress, step, isAlreadyMember, membershipLoading, estimateGas]);

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setApprovalHash(null);
    setJoinHash(null);
    setEstimatedGas(null);
    setEstimatedGasCost(null);
    setGasPrice(null);
    resetApproval();
    resetJoin();
  }, [resetApproval, resetJoin]);

  const executeJoinFlow = useCallback(async () => {
    if (!address) {
      setError('Wallet not connected');
      setStep('error');
      return;
    }

    if (!contributionAmount || !roscaContractAddress) {
      setError('Missing required parameters');
      setStep('error');
      return;
    }

    // Check if user is already a member first
    if (isAlreadyMember) {
      setError('You have already joined this RONDA');
      setStep('error');
      return;
    }

    if (!hasEnoughBalance) {
      const tokenSymbol = isETH ? 'ETH' : 'USDC';
      setError(`Insufficient ${tokenSymbol} balance. Need ${totalRequiredFormatted} ${tokenSymbol} total.`);
      setStep('error');
      return;
    }

    try {
      setError(null);
      
      // Step 0: Final membership check
      setStep('checking');
      console.log('🔍 Performing final membership verification...');
      
      // Small delay to show checking state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (isAlreadyMember) {
        setError('You have already joined this RONDA');
        setStep('error');
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
        
        console.log('🔐 Approving ERC20 tokens:', {
          token: paymentToken,
          spender: roscaContractAddress,
          amount: totalRequiredAmount.toString(),
          tokenSymbol: 'USDC'
        });

        writeApproval({
          address: paymentToken as `0x${string}`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [roscaContractAddress as `0x${string}`, totalRequiredAmount],
        });

        return; // Wait for approval to complete
      }
      
      // Step 2: Join RONDA
      setStep('joining');
      
      console.log('🚀 Executing joinRonda transaction:', {
        contributionAmount,
        totalRequiredAmount: totalRequiredAmount.toString(),
        roscaContractAddress,
        userAddress: address,
        isETH,
        paymentToken,
        entryFee: entryFeeFormatted,
        estimatedGas: estimatedGas?.toString()
      });

      const gasConfig = estimatedGas ? { gas: estimatedGas } : {};
      
      writeJoin({
        address: roscaContractAddress as `0x${string}`,
        abi: RONDA_ABI,
        functionName: 'joinRonda',
        value: isETH ? totalRequiredAmount : 0n, // Send ETH only if using ETH
        ...gasConfig
      });

    } catch (err: any) {
      console.error('❌ Error in join flow:', err);
      const decodedError = decodeContractError(err);
      setError(decodedError);
      setStep('error');
    }
  }, [
    address, 
    contributionAmount, 
    roscaContractAddress, 
    isAlreadyMember,
    hasEnoughBalance, 
    totalRequiredAmount,
    totalRequiredFormatted,
    isETH,
    needsApproval,
    estimatedGas,
    paymentToken,
    entryFeeFormatted,
    estimateGas,
    writeApproval,
    writeJoin,
    decodeContractError
  ]);

  // Handle approval transaction submission
  useEffect(() => {
    if (approvalTxHash) {
      setApprovalHash(approvalTxHash);
      console.log('📋 Approval transaction submitted:', approvalTxHash);
    }
  }, [approvalTxHash]);

  // Handle approval success - proceed to join
  useEffect(() => {
    if (isApprovalConfirmed && step === 'approving') {
      console.log('✅ Token approval confirmed, proceeding to join...');
      
      // Proceed to join step
      setStep('joining');
      
      const gasConfig = estimatedGas ? { gas: estimatedGas } : {};
      
      writeJoin({
        address: roscaContractAddress as `0x${string}`,
        abi: RONDA_ABI,
        functionName: 'joinRonda',
        value: isETH ? totalRequiredAmount : 0n,
        ...gasConfig
      });
    }
  }, [isApprovalConfirmed, step, estimatedGas, roscaContractAddress, totalRequiredAmount, isETH, writeJoin]);

  // Handle join transaction submission
  useEffect(() => {
    if (joinTxHash) {
      setJoinHash(joinTxHash);
      console.log('📋 Join transaction submitted:', joinTxHash);
    }
  }, [joinTxHash]);

  // Handle join success
  useEffect(() => {
    if (isJoinConfirmed && step === 'joining') {
      console.log('🎉 Successfully joined RONDA!');
      setStep('success');
    }
  }, [isJoinConfirmed, step]);

  // Handle errors with enhanced decoding
  useEffect(() => {
    const currentError = approvalError || joinError || approvalReceiptError || joinReceiptError;
    if (currentError && step !== 'error') {
      console.error('❌ Transaction error:', currentError);
      
      const decodedError = decodeContractError(currentError);
      console.log('🔍 Final decoded error:', decodedError);
      
      setError(decodedError);
      setStep('error');
    }
  }, [approvalError, joinError, approvalReceiptError, joinReceiptError, step, decodeContractError]);

  return {
    step,
    error,
    isLoading,
    executeJoinFlow,
    approvalHash,
    joinHash,
    reset,
    hasEnoughBalance,
    currentAllowance,
    needsApproval,
    estimatedGas,
    estimatedGasCost,
    estimatedGasCostFormatted,
    isEstimatingGas,
    gasPrice,
    gasPriceGwei,
    totalCostWithGas,
    entryFee,
    entryFeeFormatted,
    totalRequiredAmount,
    totalRequiredFormatted,
    isAlreadyMember,
    isCheckingMembership
  };
}