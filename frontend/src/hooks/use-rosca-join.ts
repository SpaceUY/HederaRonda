'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { parseEther, formatEther, erc20Abi } from 'viem';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
  usePublicClient,
  useReadContract,
  useChainId,
} from 'wagmi';

import { useCCIP } from './use-ccip';

import { usePenaltyCheck } from '@/hooks/use-penalty-check';
import { NETWORK_CONFIG, RONDA_ABI } from '@/lib/contracts';
import { getContractJoinConfig } from '@/utils/contract-utils';

export type JoinStep =
  | 'idle'
  | 'checking'
  | 'estimating'
  | 'approving'
  | 'joining'
  | 'success'
  | 'error';

interface UseRoscaJoinParams {
  contributionAmount: string; // Amount in token units (e.g., "100" for 100 USDC)
  roscaContractAddress: string;
}

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
  // Cross-chain data
  isCrossChain: boolean;
  userChainId: number;
  targetChainId: number;
  contractAddress: string;
  ccipSupported: boolean;
  // CCIP data
  ccipFee: bigint | null;
  isEstimatingCCIPFee: boolean;
  // Penalty check data
  hasPenalties: boolean;
  penaltyCount: number;
  isPenaltyCheckLoading: boolean;
  penaltyError: string | null;
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
  const userChainId = useChainId();
  const [step, setStep] = useState<JoinStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [approvalHash, setApprovalHash] = useState<string | null>(null);
  const [joinHash, setJoinHash] = useState<string | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<bigint | null>(null);
  const [estimatedGasCost, setEstimatedGasCost] = useState<bigint | null>(null);
  const [gasPrice, setGasPrice] = useState<bigint | null>(null);
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);
  const [isCheckingMembership, setIsCheckingMembership] = useState(false);

  // Penalty check hook
  const {
    hasPenalties,
    penaltyCount,
    isLoading: isPenaltyCheckLoading,
    error: penaltyError,
  } = usePenaltyCheck();

  // Read contract data - always read from target Ronda contract
  const { data: mainChainPaymentToken } = useReadContract({
    address: roscaContractAddress as `0x${string}`,
    abi: RONDA_ABI,
    functionName: 'paymentToken',
    chainId: 11155111, // Sepolia
    query: { enabled: !!roscaContractAddress }
  });

  const { data: entryFeeData } = useReadContract({
    address: roscaContractAddress as `0x${string}`,
    abi: RONDA_ABI,
    functionName: 'entryFee',
    chainId: 11155111, // Sepolia
    query: { enabled: !!roscaContractAddress }
  });

  // Check if user is already a member - always check on target contract
  const { data: membershipData, isLoading: membershipLoading } = useReadContract({
    address: roscaContractAddress as `0x${string}`,
    abi: RONDA_ABI,
    functionName: 'hasParticipantJoined',
    args: [address!],
    chainId: 11155111, // Sepolia
    query: { enabled: !!address && !!roscaContractAddress }
  });

  const isAlreadyMember = membershipData || false;

  // Determine if using ETH or ERC20
  const entryFee = entryFeeData || 0n;

  const targetChainId = NETWORK_CONFIG.SEPOLIA.chainId; // Sepolia
  const { 
    isCrossChain, 
    ccipSupported, 
    ccipFee, 
    isEstimatingCCIPFee, 
    contractAddress, 
    networkConfig 
  } = useCCIP({
    targetChainId,
    targetContractAddress: roscaContractAddress,
    amount: entryFee,
  });

  // Memoize derived values to prevent unnecessary recalculations
  const totalRequiredAmount = useMemo(() => {
    return entryFee + (ccipFee || 0n);
  }, [entryFee, ccipFee]);

  const paymentToken = useMemo(() => {
    return isCrossChain ? networkConfig?.mainTokenAddress : mainChainPaymentToken;
  }, [isCrossChain, networkConfig?.mainTokenAddress, mainChainPaymentToken]);

  // Get contract configuration using utility function - memoized
  const contractJoinConfig = useMemo(() => {
    return getContractJoinConfig(
      userChainId,
      targetChainId,
      roscaContractAddress,
      contractAddress,
      paymentToken || '0x0000000000000000000000000000000000000000',
      isCrossChain ? entryFee : totalRequiredAmount
    );
  }, [userChainId, targetChainId, roscaContractAddress, contractAddress, paymentToken, isCrossChain, entryFee, totalRequiredAmount]);

  const { data: tokenBalanceData } = useReadContract({
    address: paymentToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address && !!paymentToken }
  });

  // Get native token balance (ETH) for gas and CCIP fees
  const { data: nativeBalanceData } = useBalance({
    address: address!,
    query: { enabled: !!address }
  });

  // Only log balance data when it actually changes
  const prevTokenBalance = useRef<bigint | undefined>();
  const prevNativeBalance = useRef<bigint | undefined>();
  
  useEffect(() => {
    if (tokenBalanceData !== prevTokenBalance.current || nativeBalanceData?.value !== prevNativeBalance.current) {
      console.log('💰 Balance update:', {
        tokenBalance: tokenBalanceData?.toString(),
        nativeBalance: nativeBalanceData?.formatted
      });
      prevTokenBalance.current = tokenBalanceData;
      prevNativeBalance.current = nativeBalanceData?.value;
    }
  }, [tokenBalanceData, nativeBalanceData?.value, nativeBalanceData?.formatted]);

  const tokenBalance = tokenBalanceData || 0n;
  const nativeBalance = nativeBalanceData?.value || 0n;

  // Check allowance for ERC20 - memoized
  const spenderAddress = useMemo(() => {
    return isCrossChain ? contractAddress : roscaContractAddress;
  }, [isCrossChain, contractAddress, roscaContractAddress]);

  // Check allowance for ERC20
  const { data: allowanceData } = useReadContract({
    address: paymentToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address!, spenderAddress as `0x${string}`],
    query: { enabled: !!address && !!paymentToken }
  });

  // Memoize allowance and approval calculations
  const { currentAllowance, approvalAmount, needsApproval } = useMemo(() => {
    if (
      allowanceData === undefined ||
      entryFee === null ||
      totalRequiredAmount === null ||
      isCrossChain === null
    ) {
      return {
        currentAllowance: 0n,
        approvalAmount: 0n,
        needsApproval: false
      };
    }

    const allowance = allowanceData;
    // For cross-chain: need to approve entryFee amount, CCIP fee goes as ETH value
    // For same-chain: need to approve total amount (entryFee only, no CCIP fee)
    const approval = isCrossChain ? entryFee : totalRequiredAmount;
    const needs = allowance < approval;
    
    return {
      currentAllowance: allowance,
      approvalAmount: approval,
      needsApproval: needs
    };
  }, [allowanceData, isCrossChain, entryFee, totalRequiredAmount]);

  // Only log balance analysis once per significant change to reduce spam - memoized
  const balanceAnalysisRef = useRef<string>('');
  const balanceAnalysisData = useMemo(() => {
    return {
      isCrossChain,
      tokenBalance: tokenBalance.toString(),
      nativeBalance: nativeBalance.toString(),
      entryFee: entryFee.toString(),
      ccipFee: ccipFee?.toString() || '0',
      estimatedGasCost: estimatedGasCost?.toString() || '0',
      approvalAmount: approvalAmount.toString(),
      currentAllowance: currentAllowance.toString(),
      needsApproval,
      spenderAddress: spenderAddress,
      paymentToken
    };
  }, [isCrossChain, tokenBalance, nativeBalance, entryFee, ccipFee, estimatedGasCost, approvalAmount, currentAllowance, needsApproval, spenderAddress, paymentToken]);
  
  // Log balance analysis only when it changes
  useEffect(() => {
    const balanceAnalysisKey = JSON.stringify(balanceAnalysisData);
    if (balanceAnalysisRef.current !== balanceAnalysisKey) {
      console.log('Balance analysis:', balanceAnalysisData);
      balanceAnalysisRef.current = balanceAnalysisKey;
    }
  }, [balanceAnalysisData]);
  
  // Memoize balance requirements calculations
  const { hasEnoughTokenBalance, hasEnoughNativeBalance, totalCostWithGas, hasEnoughBalance } = useMemo(() => {
    if (
      estimatedGasCost === null ||
      entryFee === null ||
      tokenBalance === null ||
      nativeBalance === null
    ) {
      return { hasEnoughTokenBalance: false, hasEnoughNativeBalance: false, totalCostWithGas: 0n, hasEnoughBalance: false };
    }

    let tokenBalanceOK: boolean;
    let nativeBalanceOK: boolean;
    let totalCost: bigint;

    if (isCrossChain) {
      // Cross-chain: need ERC20 tokens for entry fee, native tokens for CCIP + gas
      tokenBalanceOK = tokenBalance >= entryFee;
      const nativeRequired = (ccipFee || 0n) + (estimatedGasCost || parseEther('0.01'));
      nativeBalanceOK = nativeBalance >= nativeRequired;
      totalCost = nativeRequired; // Only native token cost
    } else {
      // Same-chain: everything is in the same token (either ERC20 or native)
      // ERC20 token transaction (no ETH value sent, only gas)
      tokenBalanceOK = tokenBalance >= entryFee;
      nativeBalanceOK = nativeBalance >= (estimatedGasCost || parseEther('0.01'));
      totalCost = estimatedGasCost || parseEther('0.01'); // Only gas cost in ETH
    }

    return {
      hasEnoughTokenBalance: tokenBalanceOK,
      hasEnoughNativeBalance: nativeBalanceOK,
      totalCostWithGas: totalCost,
      hasEnoughBalance: tokenBalanceOK && nativeBalanceOK
    };
  }, [isCrossChain, tokenBalance, entryFee, ccipFee, estimatedGasCost, nativeBalance]);

  // Memoize formatted values
  const { entryFeeFormatted, totalRequiredFormatted, estimatedGasCostFormatted, gasPriceGwei } = useMemo(() => {
    return {
      entryFeeFormatted: formatEther(entryFee),
      totalRequiredFormatted: formatEther(totalRequiredAmount),
      estimatedGasCostFormatted: estimatedGasCost ? formatEther(estimatedGasCost) : null,
      gasPriceGwei: gasPrice ? formatEther(gasPrice * 1000000000n) : null
    };
  }, [entryFee, totalRequiredAmount, estimatedGasCost, gasPrice]);

  // Write contract hooks
  const {
    writeContract: writeApproval,
    data: approvalTxHash,
    isPending: isApprovalPending,
    error: approvalError,
    reset: resetApproval,
  } = useWriteContract();

  const {
    writeContract: writeJoin,
    data: joinTxHash,
    isPending: isJoinPending,
    error: joinError,
    reset: resetJoin,
  } = useWriteContract();

  // Transaction receipt hooks
  const {
    isLoading: isApprovalConfirming,
    isSuccess: isApprovalConfirmed,
    error: approvalReceiptError,
  } = useWaitForTransactionReceipt({
    hash: approvalTxHash,
  });

  const {
    isLoading: isJoinConfirming,
    isSuccess: isJoinConfirmed,
    error: joinReceiptError,
  } = useWaitForTransactionReceipt({
    hash: joinTxHash,
  });

  const isLoading = isApprovalPending || isApprovalConfirming || isJoinPending || isJoinConfirming || isEstimatingGas || isEstimatingCCIPFee || isCheckingMembership || membershipLoading;

  // Helper function to decode contract errors
  const decodeContractError = useCallback(
    (err: any): string => {
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
          errorData.includes('already joined')
        ) {
          return 'You have already joined this RONDA';
        }

        if (
          errorName.includes('RondaNotOpen') ||
          errorMessage.includes('not open') ||
          errorData.includes('not open')
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
        return 'Insufficient ETH for transaction and gas fees';
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
    },
    []
  );

  // Enhanced gas estimation function - memoized with proper dependencies
  const estimateGas = useCallback(async () => {
    if (
      !address ||
      !publicClient ||
      !contributionAmount ||
      !roscaContractAddress
    ) {
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
        gasPriceGwei: formatEther(currentGasPrice * 1000000000n) + ' Gwei',
      });

      // If approval is needed, skip detailed gas estimation to avoid "insufficient allowance" error
      if (needsApproval || !hasEnoughBalance || !hasEnoughTokenBalance || !hasEnoughNativeBalance) {
        console.log('🔄 Approval needed - using fallback gas estimation...');
        
        // Use reasonable fallback estimates based on operation type
        const fallbackGas = isCrossChain ? 500000n : 300000n; // Cross-chain needs more gas
        const fallbackCost = fallbackGas * currentGasPrice;
        
        console.log('💸 Fallback gas cost calculation:', {
          gasUnits: fallbackGas.toString(),
          gasPrice: currentGasPrice.toString(),
          totalCostWei: fallbackCost.toString(),
          totalCostETH: formatEther(fallbackCost),
          reason: 'Approval needed - detailed estimation skipped'
        });

        setEstimatedGas(fallbackGas);
        setEstimatedGasCost(fallbackCost);
        return;
      }

      // Estimate gas for joinRonda (only when no approval needed)
      console.log('🔍 Estimating gas for joinRonda contract call...');
      console.log('📝 Contract details:', {
        address: contractJoinConfig.address,
        function: contractJoinConfig.functionName,
        value: isCrossChain ? (ccipFee || 0n).toString() + ' wei (CCIP fee)' : '0 wei (ERC20 transaction)',
        caller: address,
        args: contractJoinConfig.args,
        paymentToken: paymentToken,
        totalRequired: totalRequiredFormatted,
        isCrossChain,
        ccipFeeWei: ccipFee?.toString() || '0',
        ccipFeeFormatted: ccipFee ? formatEther(ccipFee) + ' AVAX' : 'Not calculated',
        userNativeBalance: nativeBalance.toString(),
        userNativeBalanceFormatted: formatEther(nativeBalance) + ' AVAX',
        sufficientForCCIP: isCrossChain ? (nativeBalance >= (ccipFee || 0n)) : 'N/A',
        balanceAfterCCIP: isCrossChain && ccipFee ? formatEther(nativeBalance - ccipFee) + ' AVAX' : 'N/A'
      });

      // Check if we have CCIP fee calculated for cross-chain
      if (isCrossChain && !ccipFee) {
        console.log('⚠️ CCIP fee not calculated yet, using fallback gas estimation...');
        const fallbackGas = 500000n;
        const fallbackCost = fallbackGas * currentGasPrice;
        setEstimatedGas(fallbackGas);
        setEstimatedGasCost(fallbackCost);
        return;
      }

      // For cross-chain, validate that we have sufficient native balance for the CCIP fee
      if (isCrossChain && ccipFee) {
        const requiredNative = ccipFee + parseEther('0.005'); // CCIP fee + small buffer for gas
        if (nativeBalance < requiredNative) {
          console.log('💰 Insufficient native balance for CCIP fee:', {
            required: formatEther(requiredNative),
            available: formatEther(nativeBalance),
            ccipFee: formatEther(ccipFee)
          });
          setError(`Insufficient native balance for cross-chain transaction. Need ${formatEther(requiredNative)} AVAX, but only have ${formatEther(nativeBalance)} AVAX.`);
          setStep('error');
          return;
        }
      }

      const gasEstimate = await publicClient.estimateContractGas({
        address: contractJoinConfig.address as `0x${string}`,
        abi: contractJoinConfig.abi,
        functionName: contractJoinConfig.functionName,
        args: contractJoinConfig.args,
        account: address,
        value: isCrossChain ? (ccipFee || 0n) : 0n, // CCIP fee for cross-chain, 0 for same-chain ERC20
      });

      console.log('✅ Gas estimation from contract:', {
        gasEstimate: gasEstimate.toString(),
        gasEstimateFormatted: `${gasEstimate.toLocaleString()} gas units`,
      });

      // Add safety buffer (20% extra)
      const gasWithBuffer = (gasEstimate * 120n) / 100n;
      const totalGasCost = gasWithBuffer * currentGasPrice;

      console.log('💸 Total gas cost calculation:', {
        gasUnits: gasWithBuffer.toString(),
        gasPrice: currentGasPrice.toString(),
        totalCostWei: totalGasCost.toString(),
        totalCostETH: formatEther(totalGasCost),
      });

      setEstimatedGas(gasWithBuffer);
      setEstimatedGasCost(totalGasCost);
    } catch (err: any) {
      console.error('❌ Gas estimation failed:', err);

      const decodedError = decodeContractError(err);
      console.log('🔍 Decoded error message:', decodedError);

      // Handle specific RondaSender balance error (CCIP fee insufficient)
      if (decodedError.includes('Insufficient balance') && isCrossChain) {
        const requiredAmount = ccipFee ? formatEther(ccipFee + parseEther('0.005')) : '~0.02';
        // setError(`Insufficient native balance for cross-chain transaction. Need approximately ${requiredAmount} AVAX for CCIP fees.`);
        // setStep('error');
        return;
      }

      // Don't set error state for allowance issues during gas estimation
      if (decodedError.includes('insufficient allowance')) {
        console.log('💡 Allowance error during gas estimation - using fallback...');
        
        let fallbackGasPrice: bigint;
        try {
          fallbackGasPrice = await publicClient.getGasPrice();
          setGasPrice(fallbackGasPrice);
        } catch {
          fallbackGasPrice = parseEther('0.000000020'); // 20 Gwei fallback
        }

        const fallbackGas = isCrossChain ? 500000n : 300000n;
        const fallbackCost = fallbackGas * fallbackGasPrice;

        setEstimatedGas(fallbackGas);
        setEstimatedGasCost(fallbackCost);
        return;
      }

      setError(decodedError);

      // Use fallback gas estimation for network errors only
      const shouldUseFallback =
        !decodedError.includes('already joined') &&
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

        const fallbackGas = isCrossChain ? 500000n : 300000n;
        const fallbackCost = fallbackGas * fallbackGasPrice;

        setEstimatedGas(fallbackGas);
        setEstimatedGasCost(fallbackCost);
      }
    } finally {
      setIsEstimatingGas(false);
    }
  }, [
    address,
    publicClient,
    contributionAmount,
    roscaContractAddress,
    needsApproval,
    isCrossChain,
    contractJoinConfig,
    paymentToken,
    totalRequiredFormatted,
    ccipFee,
    nativeBalance,
    decodeContractError,
    hasEnoughBalance,
    hasEnoughTokenBalance,
    hasEnoughNativeBalance
  ]);

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
    if (
      address &&
      contributionAmount &&
      roscaContractAddress &&
      step === 'idle' &&
      !isAlreadyMember &&
      !membershipLoading &&
      !hasPenalties &&
      allowanceData !== undefined && // Wait for allowance data to load
      contractJoinConfig.address && // Ensure contract config is ready
      (!isCrossChain || ccipFee !== null) // Wait for CCIP fee estimation if cross-chain
    ) {
      estimateGas();
    }
  }, [
    address,
    contributionAmount,
    roscaContractAddress,
    step,
    isAlreadyMember,
    membershipLoading,
    hasPenalties,
    allowanceData,
    contractJoinConfig.address,
    isCrossChain,
    ccipFee,
    estimateGas
  ]);

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

    // Check for penalty tokens first
    if (hasPenalties) {
      setError(
        `You cannot participate in rounds due to contract violations. You have ${penaltyCount} penalty token${
          penaltyCount !== 1 ? 's' : ''
        }. Please resolve your penalties before joining.`
      );
      setStep('error');
      return;
    }

    // Check if user is already a member
    if (isAlreadyMember) {
      setError('You have already joined this RONDA');
      setStep('error');
      return;
    }

    if (!hasEnoughBalance) {
      if (isCrossChain) {
        if (!hasEnoughTokenBalance) {
          setError(`Insufficient ${paymentToken === networkConfig?.mainTokenAddress ? 'token' : 'ERC20'} balance. Need ${entryFeeFormatted} tokens for entry fee.`);
        } else {
          setError(`Insufficient ETH balance. Need ${formatEther((ccipFee || 0n) + (estimatedGasCost || parseEther('0.01')))} ETH for CCIP fee and gas.`);
        }
      } else {
        setError(`Insufficient balance. Need ${totalRequiredFormatted} total.`);
      }
      setStep('error');
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
        return;
      }

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
          spender: spenderAddress,
          amount: approvalAmount.toString(),
          amountFormatted: formatEther(approvalAmount),
          tokenSymbol: isCrossChain ? 'Token' : 'USDC',
        });

        writeApproval({
          address: paymentToken as `0x${string}`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [spenderAddress as `0x${string}`, approvalAmount],
        });

        return; 
      }

      // Step 2: Join RONDA
      setStep('joining');

      console.log('🚀 Executing joinRonda transaction:', {
        contributionAmount,
        totalRequiredAmount: totalRequiredAmount.toString(),
        roscaContractAddress,
        userAddress: address,
        paymentToken,
        entryFee: entryFeeFormatted,
        estimatedGas: estimatedGas?.toString(),
        isCrossChain,
        contractAddress: contractJoinConfig.address,
        contractAbi: isCrossChain ? 'RondaSender' : 'Ronda',
        transactionValue: isCrossChain ? ccipFee?.toString() || '0' : '0'
      });

      const gasConfig = estimatedGas ? { gas: estimatedGas } : {};

      console.log('joinConfig', contractJoinConfig);
      
      writeJoin({
        address: contractJoinConfig.address as `0x${string}`,
        abi: contractJoinConfig.abi,
        functionName: contractJoinConfig.functionName,
        args: contractJoinConfig.args,
        value: isCrossChain ? (ccipFee || 0n) : 0n, // CCIP fee for cross-chain, 0 for same-chain ERC20
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
    hasPenalties,
    penaltyCount,
    isAlreadyMember,
    hasEnoughBalance,
    hasEnoughTokenBalance,
    isCrossChain,
    paymentToken,
    networkConfig?.mainTokenAddress,
    entryFeeFormatted,
    totalRequiredFormatted,
    ccipFee,
    estimatedGasCost,
    estimatedGas,
    estimateGas,
    needsApproval,
    spenderAddress,
    approvalAmount,
    writeApproval,
    totalRequiredAmount,
    contractJoinConfig,
    writeJoin,
    decodeContractError
  ]);

  // Handle approval success - proceed to join
  useEffect(() => {
    if (isApprovalConfirmed && step === 'approving') {
      console.log('✅ Token approval confirmed, proceeding to join...');

      // Re-estimate gas now that approval is done
      const reEstimateGasAfterApproval = async () => {
        try {
          console.log('🔄 Re-estimating gas after approval...');
          
          if (!publicClient || !address) {return;}
          
          const gasEstimate = await publicClient.estimateContractGas({
            address: contractJoinConfig.address as `0x${string}`,
            abi: contractJoinConfig.abi,
            functionName: contractJoinConfig.functionName,
            args: contractJoinConfig.args,
            account: address,
            value: 0n,
          });

          const gasWithBuffer = (gasEstimate * 120n) / 100n;
          const currentGasPrice = await publicClient.getGasPrice();
          const totalGasCost = gasWithBuffer * currentGasPrice;

          console.log('✅ Post-approval gas estimation:', {
            gasEstimate: gasEstimate.toString(),
            gasWithBuffer: gasWithBuffer.toString(),
            totalCostETH: formatEther(totalGasCost),
          });

          setEstimatedGas(gasWithBuffer);
          setEstimatedGasCost(totalGasCost);
        } catch (err) {
          console.log('⚠️ Could not re-estimate gas after approval, using existing estimate');
        }
      };

      reEstimateGasAfterApproval();

      // Proceed to join step
      setStep('joining');

      const gasConfig = estimatedGas ? { gas: estimatedGas } : {};

      writeJoin({
        address: contractJoinConfig.address as `0x${string}`,
        abi: contractJoinConfig.abi,
        functionName: contractJoinConfig.functionName,
        args: contractJoinConfig.args,
        value: isCrossChain ? ccipFee! : 0n,
        ...gasConfig
      });
    }
  }, [isApprovalConfirmed, step, estimatedGas, contractJoinConfig, writeJoin, totalRequiredAmount, isCrossChain, ccipFee, publicClient, address]);

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
    isCheckingMembership,
    isCrossChain,
    userChainId,
    targetChainId,
    contractAddress,
    ccipSupported,
    ccipFee,
    isEstimatingCCIPFee,  
    // Penalty check data
    hasPenalties,
    penaltyCount,
    isPenaltyCheckLoading,
    penaltyError: penaltyError ?? null,
  };
}
