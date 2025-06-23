'use client';

import { useState, useCallback, useEffect } from 'react';
import { parseEther, formatEther, erc20Abi } from 'viem';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
  usePublicClient,
  useReadContract,
} from 'wagmi';

import { RONDA_ABI } from '@/lib/contracts';

export type DepositStep =
  | 'idle'
  | 'checking'
  | 'estimating'
  | 'approving'
  | 'depositing'
  | 'success'
  | 'error';

interface UseRondaDepositReturn {
  step: DepositStep;
  error: string | null;
  isLoading: boolean;
  executeDepositFlow: (milestoneIndex: number) => Promise<void>;
  approvalHash: string | null;
  depositHash: string | null;
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
  // Deposit data
  monthlyDepositAmount: bigint;
  monthlyDepositFormatted: string;
  // Membership and milestone verification
  isMember: boolean;
  isCheckingMembership: boolean;
  currentMilestone: number | null;
  hasAlreadyDeposited: boolean;
  milestoneInfo: {
    isComplete: boolean;
    totalDeposits: bigint;
    requiredDeposits: bigint;
  } | null;
  // RONDA state verification
  rondaState: number | null;
  isRondaRunning: boolean;
  canMakeDeposits: boolean;
}

interface UseRondaDepositParams {
  roscaContractAddress: string;
}

export function useRondaDeposit({
  roscaContractAddress,
}: UseRondaDepositParams): UseRondaDepositReturn {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [step, setStep] = useState<DepositStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [approvalHash, setApprovalHash] = useState<string | null>(null);
  const [depositHash, setDepositHash] = useState<string | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<bigint | null>(null);
  const [estimatedGasCost, setEstimatedGasCost] = useState<bigint | null>(null);
  const [gasPrice, setGasPrice] = useState<bigint | null>(null);
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);
  const [isCheckingMembership, setIsCheckingMembership] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<number | null>(null);
  const [hasAlreadyDeposited, setHasAlreadyDeposited] = useState(false);

  // Read contract data
  const { data: paymentToken } = useReadContract({
    address: roscaContractAddress as `0x${string}`,
    abi: RONDA_ABI,
    functionName: 'paymentToken',
    query: { enabled: !!roscaContractAddress },
  });

  const { data: monthlyDepositData } = useReadContract({
    address: roscaContractAddress as `0x${string}`,
    abi: RONDA_ABI,
    functionName: 'monthlyDeposit',
    query: { enabled: !!roscaContractAddress },
  });

  const { data: milestoneCountData } = useReadContract({
    address: roscaContractAddress as `0x${string}`,
    abi: RONDA_ABI,
    functionName: 'milestoneCount',
    query: { enabled: !!roscaContractAddress },
  });

  // Read RONDA state
  const { data: rondaStateData } = useReadContract({
    address: roscaContractAddress as `0x${string}`,
    abi: RONDA_ABI,
    functionName: 'currentState',
    query: { enabled: !!roscaContractAddress },
  });

  // Check if user is a member
  const { data: membershipData, isLoading: membershipLoading } =
    useReadContract({
      address: roscaContractAddress as `0x${string}`,
      abi: RONDA_ABI,
      functionName: 'hasParticipantJoined',
      args: [address!],
      query: { enabled: !!address && !!roscaContractAddress },
    });

  const isMember = membershipData || false;
  const rondaState = rondaStateData ? Number(rondaStateData) : null;

  // RONDA States: 0=Open, 1=Running, 2=Finalized, 3=Aborted, 4=Randomizing
  const isRondaRunning = rondaState === 1; // Only allow deposits when RONDA is in "Running" state
  const canMakeDeposits = isMember && isRondaRunning;

  // Get milestone info for current milestone
  const { data: milestoneInfo } = useReadContract({
    address: roscaContractAddress as `0x${string}`,
    abi: RONDA_ABI,
    functionName: 'milestones',
    args: [BigInt(currentMilestone || 0)],
    query: { enabled: !!roscaContractAddress && currentMilestone !== null },
  });

  // Determine if using ETH or ERC20
  const isETH = paymentToken === '0x0000000000000000000000000000000000000000';
  const monthlyDepositAmount = monthlyDepositData || 0n;

  // Check balance (ETH or ERC20)
  const { data: ethBalanceData } = useBalance({
    address: address,
    query: { enabled: !!address && isETH },
  });

  const { data: tokenBalanceData } = useReadContract({
    address: paymentToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address && !isETH && !!paymentToken },
  });

  const balance = isETH ? ethBalanceData?.value || 0n : tokenBalanceData || 0n;

  // Check allowance for ERC20
  const { data: allowanceData } = useReadContract({
    address: paymentToken as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address!, roscaContractAddress as `0x${string}`],
    query: { enabled: !!address && !isETH && !!paymentToken },
  });

  const currentAllowance = allowanceData || 0n;
  const needsApproval = !isETH && currentAllowance < monthlyDepositAmount;

  // Calculate total cost including gas
  const totalCostWithGas = isETH
    ? monthlyDepositAmount + (estimatedGasCost || parseEther('0.01'))
    : estimatedGasCost || parseEther('0.01'); // For ERC20, only gas cost in ETH

  const hasEnoughBalance = isETH
    ? balance >= totalCostWithGas
    : balance >= monthlyDepositAmount;

  // Format values
  const monthlyDepositFormatted = isETH
    ? formatEther(monthlyDepositAmount)
    : (Number(monthlyDepositAmount) / 1e6).toString();
  const estimatedGasCostFormatted = estimatedGasCost
    ? formatEther(estimatedGasCost)
    : null;
  const gasPriceGwei = gasPrice ? formatEther(gasPrice * 1000000000n) : null;

  // Write contract hooks
  const {
    writeContract: writeApproval,
    data: approvalTxHash,
    isPending: isApprovalPending,
    error: approvalError,
    reset: resetApproval,
  } = useWriteContract();

  const {
    writeContract: writeDeposit,
    data: depositTxHash,
    isPending: isDepositPending,
    error: depositError,
    reset: resetDeposit,
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
    isLoading: isDepositConfirming,
    isSuccess: isDepositConfirmed,
    error: depositReceiptError,
  } = useWaitForTransactionReceipt({
    hash: depositTxHash,
  });

  const isLoading =
    isApprovalPending ||
    isApprovalConfirming ||
    isDepositPending ||
    isDepositConfirming ||
    isEstimatingGas ||
    isCheckingMembership ||
    membershipLoading;

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
          errorName.includes('NotParticipant') ||
          errorMessage.includes('not a participant') ||
          errorData.includes('not a participant')
        ) {
          return 'You are not a participant in this RONDA';
        }

        if (
          errorName.includes('AlreadyDeposited') ||
          errorMessage.includes('already deposited') ||
          errorData.includes('already deposited')
        ) {
          return 'You have already made your deposit for this milestone';
        }

        if (
          errorName.includes('MilestoneNotActive') ||
          errorMessage.includes('milestone not active') ||
          errorData.includes('milestone not active')
        ) {
          return 'This milestone is not currently active for deposits';
        }

        if (
          errorName.includes('InvalidMilestone') ||
          errorMessage.includes('invalid milestone') ||
          errorData.includes('invalid milestone')
        ) {
          return 'Invalid milestone index';
        }

        if (
          errorName.includes('RondaNotRunning') ||
          errorMessage.includes('not running') ||
          errorData.includes('not running')
        ) {
          return 'This RONDA is not currently in the running state';
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
        return isETH
          ? 'Insufficient ETH for transaction and gas fees'
          : 'Insufficient ETH for gas fees';
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
        return 'Transaction failed - please check the deposit requirements and try again';
      }

      return 'Transaction failed - please try again';
    },
    [isETH]
  );

  // Function to determine current milestone
  const determineCurrentMilestone = useCallback(async () => {
    if (!roscaContractAddress || !milestoneCountData) {
      return;
    }

    try {
      console.log('🔍 Determining current milestone...');

      // For now, we'll use a simple approach - find the first incomplete milestone
      // In a real implementation, this would be based on time or contract state
      const milestoneCount = Number(milestoneCountData);

      for (let i = 0; i < milestoneCount; i++) {
        // This would need to be implemented based on your contract's logic
        // For now, we'll assume milestone 0 is current if the RONDA is running
        setCurrentMilestone(0);
        break;
      }
    } catch (err) {
      console.error('❌ Error determining current milestone:', err);
    }
  }, [roscaContractAddress, milestoneCountData]);

  // Enhanced gas estimation function
  const estimateGas = useCallback(
    async (milestoneIndex: number) => {
      if (!address || !publicClient || !roscaContractAddress) {
        return;
      }

      try {
        setIsEstimatingGas(true);
        console.log('⛽ Starting gas estimation for deposit...');

        // Get current gas price
        const currentGasPrice = await publicClient.getGasPrice();
        setGasPrice(currentGasPrice);

        console.log('📊 Current gas price:', {
          gasPrice: currentGasPrice.toString(),
          gasPriceGwei: formatEther(currentGasPrice * 1000000000n) + ' Gwei',
        });

        // Estimate gas for deposit
        console.log('🔍 Estimating gas for deposit contract call...');
        console.log('📝 Contract details:', {
          address: roscaContractAddress,
          function: 'deposit',
          milestone: milestoneIndex,
          value: isETH ? monthlyDepositAmount.toString() + ' wei' : '0 wei',
          caller: address,
          paymentToken: isETH ? 'ETH' : paymentToken,
          depositAmount: monthlyDepositFormatted,
        });

        const gasEstimate = await publicClient.estimateContractGas({
          address: roscaContractAddress as `0x${string}`,
          abi: RONDA_ABI,
          functionName: 'deposit',
          args: [BigInt(milestoneIndex)],
          account: address,
          value: (isETH ? monthlyDepositAmount : 0n) as unknown as undefined,
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

        setError(decodedError);

        // Use fallback gas estimation for network errors only
        const shouldUseFallback =
          !decodedError.includes('not a participant') &&
          !decodedError.includes('already deposited') &&
          !decodedError.includes('not currently active') &&
          !decodedError.includes('insufficient') &&
          !decodedError.includes('not running') &&
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

          const fallbackGas = 200000n; // 200k gas units for deposit operations
          const fallbackCost = fallbackGas * fallbackGasPrice;

          setEstimatedGas(fallbackGas);
          setEstimatedGasCost(fallbackCost);
        }
      } finally {
        setIsEstimatingGas(false);
      }
    },
    [
      address,
      publicClient,
      roscaContractAddress,
      monthlyDepositAmount,
      isETH,
      paymentToken,
      monthlyDepositFormatted,
      decodeContractError,
    ]
  );

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setApprovalHash(null);
    setDepositHash(null);
    setEstimatedGas(null);
    setEstimatedGasCost(null);
    setGasPrice(null);
    setCurrentMilestone(null);
    setHasAlreadyDeposited(false);
    resetApproval();
    resetDeposit();
  }, [resetApproval, resetDeposit]);

  const executeDepositFlow = useCallback(
    async (milestoneIndex: number) => {
      if (!address) {
        setError('Wallet not connected');
        setStep('error');
        return;
      }

      if (!roscaContractAddress) {
        setError('Missing RONDA contract address');
        setStep('error');
        return;
      }

      // Check if user is a member first
      if (!isMember) {
        setError('You are not a member of this RONDA');
        setStep('error');
        return;
      }

      // Check if RONDA is in running state
      if (!isRondaRunning) {
        const stateNames = [
          'Open',
          'Running',
          'Finalized',
          'Aborted',
          'Randomizing',
        ];
        const currentStateName =
          rondaState !== null ? stateNames[rondaState] || 'Unknown' : 'Unknown';
        setError(
          `RONDA is not accepting deposits. Current state: ${currentStateName}. Deposits are only allowed when RONDA is Running.`
        );
        setStep('error');
        return;
      }

      if (!hasEnoughBalance) {
        const tokenSymbol = isETH ? 'ETH' : 'USDC';
        setError(
          `Insufficient ${tokenSymbol} balance. Need ${monthlyDepositFormatted} ${tokenSymbol} for deposit.`
        );
        setStep('error');
        return;
      }

      try {
        setError(null);

        // Step 0: Final membership and deposit status check
        setStep('checking');
        console.log(
          '🔍 Performing final membership and deposit verification...'
        );

        // Small delay to show checking state
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (!isMember) {
          setError('You are not a member of this RONDA');
          setStep('error');
          return;
        }

        if (!isRondaRunning) {
          setError('RONDA is not currently accepting deposits');
          setStep('error');
          return;
        }

        // Re-estimate gas before transaction if needed
        if (!estimatedGas) {
          setStep('estimating');
          await estimateGas(milestoneIndex);
        }

        // Step 1: Approve tokens if needed (ERC20 only)
        if (needsApproval) {
          setStep('approving');

          console.log('🔐 Approving ERC20 tokens:', {
            token: paymentToken,
            spender: roscaContractAddress,
            amount: monthlyDepositAmount.toString(),
            tokenSymbol: 'USDC',
          });

          writeApproval({
            address: paymentToken as `0x${string}`,
            abi: erc20Abi,
            functionName: 'approve',
            args: [roscaContractAddress as `0x${string}`, monthlyDepositAmount],
          });

          return; // Wait for approval to complete
        }

        // Step 2: Make deposit
        setStep('depositing');

        console.log('🚀 Executing deposit transaction:', {
          milestoneIndex,
          depositAmount: monthlyDepositAmount.toString(),
          roscaContractAddress,
          userAddress: address,
          isETH,
          paymentToken,
          estimatedGas: estimatedGas?.toString(),
        });

        const gasConfig = estimatedGas ? { gas: estimatedGas } : {};

        writeDeposit({
          address: roscaContractAddress as `0x${string}`,
          abi: RONDA_ABI,
          functionName: 'deposit',
          args: [BigInt(milestoneIndex)],
          value: (isETH ? monthlyDepositAmount : 0n) as unknown as undefined, // Send ETH only if using ETH
          ...gasConfig,
        });
      } catch (err: any) {
        console.error('❌ Error in deposit flow:', err);
        const decodedError = decodeContractError(err);
        setError(decodedError);
        setStep('error');
      }
    },
    [
      address,
      roscaContractAddress,
      isMember,
      isRondaRunning,
      rondaState,
      hasEnoughBalance,
      monthlyDepositAmount,
      monthlyDepositFormatted,
      isETH,
      needsApproval,
      estimatedGas,
      paymentToken,
      estimateGas,
      writeApproval,
      writeDeposit,
      decodeContractError,
    ]
  );

  // Check membership and determine current milestone when parameters change
  useEffect(() => {
    if (address && roscaContractAddress && step === 'idle') {
      setIsCheckingMembership(true);
      determineCurrentMilestone();
      // The membership check is handled by the useReadContract hook
      // We just need to wait for it to complete
      setTimeout(() => setIsCheckingMembership(false), 1000);
    }
  }, [address, roscaContractAddress, step, determineCurrentMilestone]);

  // Handle approval transaction submission
  useEffect(() => {
    if (approvalTxHash) {
      setApprovalHash(approvalTxHash);
      console.log('📋 Approval transaction submitted:', approvalTxHash);
    }
  }, [approvalTxHash]);

  // Handle approval success - proceed to deposit
  useEffect(() => {
    if (
      isApprovalConfirmed &&
      step === 'approving' &&
      currentMilestone !== null
    ) {
      console.log('✅ Token approval confirmed, proceeding to deposit...');

      // Proceed to deposit step
      setStep('depositing');

      const gasConfig = estimatedGas ? { gas: estimatedGas } : {};

      writeDeposit({
        address: roscaContractAddress as `0x${string}`,
        abi: RONDA_ABI,
        functionName: 'deposit',
        args: [BigInt(currentMilestone)],
        value: (isETH ? monthlyDepositAmount : 0n) as unknown as undefined,
        ...gasConfig,
      });
    }
  }, [
    isApprovalConfirmed,
    step,
    currentMilestone,
    estimatedGas,
    roscaContractAddress,
    monthlyDepositAmount,
    isETH,
    writeDeposit,
  ]);

  // Handle deposit transaction submission
  useEffect(() => {
    if (depositTxHash) {
      setDepositHash(depositTxHash);
      console.log('📋 Deposit transaction submitted:', depositTxHash);
    }
  }, [depositTxHash]);

  // Handle deposit success
  useEffect(() => {
    if (isDepositConfirmed && step === 'depositing') {
      console.log('🎉 Successfully made deposit!');
      setStep('success');
    }
  }, [isDepositConfirmed, step]);

  // Handle errors with enhanced decoding
  useEffect(() => {
    const currentError =
      approvalError ||
      depositError ||
      approvalReceiptError ||
      depositReceiptError;
    if (currentError && step !== 'error') {
      console.error('❌ Transaction error:', currentError);

      const decodedError = decodeContractError(currentError);
      console.log('🔍 Final decoded error:', decodedError);

      setError(decodedError);
      setStep('error');
    }
  }, [
    approvalError,
    depositError,
    approvalReceiptError,
    depositReceiptError,
    step,
    decodeContractError,
  ]);

  return {
    step,
    error,
    isLoading,
    executeDepositFlow,
    approvalHash,
    depositHash,
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
    monthlyDepositAmount,
    monthlyDepositFormatted,
    isMember,
    isCheckingMembership,
    currentMilestone,
    hasAlreadyDeposited,
    milestoneInfo: milestoneInfo
      ? {
          isComplete: milestoneInfo[0],
          totalDeposits: milestoneInfo[1],
          requiredDeposits: milestoneInfo[2],
        }
      : null,
    rondaState,
    isRondaRunning,
    canMakeDeposits,
  };
}
