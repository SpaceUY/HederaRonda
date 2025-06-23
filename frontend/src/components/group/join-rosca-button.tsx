'use client';

import {
  Wallet,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  DollarSign,
  Zap,
  TrendingUp,
  Key,
  ArrowRight,
  UserCheck,
  Shield,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRoscaJoin, JoinStep } from '@/hooks/use-rosca-join';
import { PenaltyStatusBadge } from '@/components/penalty/penalty-status-badge';
import { useTokenFormatter } from '@/hooks/use-token-formatter';

interface JoinRoscaButtonProps {
  contributionAmount: string; // Amount in token units (e.g., "100" for 100 USDC)
  roscaContractAddress: string;
  onSuccess?: () => void;
  disabled?: boolean;
  className?: string;
}

const SEPOLIA_CHAIN_ID = 11155111;
const BLOCK_EXPLORER_URL = 'https://sepolia.etherscan.io';

export function JoinRoscaButton({
  contributionAmount,
  roscaContractAddress,
  onSuccess,
  disabled = false,
  className,
}: JoinRoscaButtonProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [showDetails, setShowDetails] = useState(false);

  // Use token formatter for proper amount display - pass the raw contract values
  const {
    monthlyDeposit: formattedMonthlyDeposit,
    entryFee: formattedEntryFee,
    totalContribution: formattedTotalContribution,
    isLoading: isFormattingAmounts,
  } = useTokenFormatter(
    roscaContractAddress,
    contributionAmount, // This should be the raw contract value
    1 // For individual amounts
  );

  const {
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
    // Penalty check data
    hasPenalties,
    penaltyCount,
    isPenaltyCheckLoading,
    penaltyError,
  } = useRoscaJoin({
    contributionAmount,
    roscaContractAddress,
  });

  const isWrongNetwork = chainId !== SEPOLIA_CHAIN_ID;

  // Handle success callback
  React.useEffect(() => {
    if (step === 'success' && onSuccess) {
      onSuccess();
    }
  }, [step, onSuccess]);

  const getButtonText = (): string => {
    if (!isConnected) {
      return 'Connect Wallet';
    }
    if (isWrongNetwork) {
      return 'Switch to Sepolia';
    }
    if (isPenaltyCheckLoading) {
      return 'Checking Penalties...';
    }
    if (hasPenalties) {
      return `Blocked: ${penaltyCount} Penalty Token${penaltyCount !== 1 ? 's' : ''}`;
    }
    if (isAlreadyMember) {
      return 'Already Joined RONDA';
    }
    if (!hasEnoughBalance) {
      return `Insufficient Balance`;
    }

    switch (step) {
      case 'checking':
        return 'Verifying Eligibility...';
      case 'estimating':
        return 'Estimating Gas...';
      case 'approving':
        return needsApproval ? 'Approving Tokens...' : 'Approval Complete';
      case 'joining':
        return 'Joining RONDA...';
      case 'success':
        return 'Successfully Joined!';
      case 'error':
        return 'Retry Join';
      default:
        return needsApproval ? 'Approve & Join RONDA' : 'Join RONDA';
    }
  };

  const getButtonIcon = () => {
    if (isLoading || isCheckingMembership || isPenaltyCheckLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (step === 'success') {
      return <CheckCircle className="h-4 w-4" />;
    }
    if (step === 'error') {
      return <RefreshCw className="h-4 w-4" />;
    }
    if (step === 'checking') {
      return <UserCheck className="h-4 w-4" />;
    }
    if (step === 'approving') {
      return <Key className="h-4 w-4" />;
    }
    if (hasPenalties) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    if (isAlreadyMember) {
      return <CheckCircle className="h-4 w-4" />;
    }
    if (!isConnected || isWrongNetwork) {
      return <Wallet className="h-4 w-4" />;
    }
    return needsApproval ? (
      <Key className="h-4 w-4" />
    ) : (
      <DollarSign className="h-4 w-4" />
    );
  };

  const getStepDescription = (): string => {
    if (isPenaltyCheckLoading) {
      return 'Checking your wallet for penalty tokens...';
    }
    if (hasPenalties) {
      return `You have ${penaltyCount} penalty token${penaltyCount !== 1 ? 's' : ''} and cannot join RONDAs`;
    }
    
    switch (step) {
      case 'checking':
        return 'Verifying your membership status and penalty tokens...';
      case 'estimating':
        return 'Calculating optimal gas fees for the transaction...';
      case 'approving':
        return 'Approving tokens for the RONDA contract to spend...';
      case 'joining':
        return 'Submitting join transaction to the RONDA contract...';
      case 'success':
        return 'You have successfully joined the RONDA!';
      case 'error':
        return error || 'An error occurred during the join process';
      default:
        if (isAlreadyMember) {
          return 'You are already a member of this RONDA';
        }
        return needsApproval
          ? `Ready to approve tokens and join the RONDA with ${formattedTotalContribution || totalRequiredFormatted}`
          : `Ready to join the RONDA with ${formattedTotalContribution || totalRequiredFormatted}`;
    }
  };

  const handleClick = () => {
    if (step === 'error') {
      reset();
    } else if (step === 'idle' && !isAlreadyMember && !hasPenalties) {
      executeJoinFlow();
    }
  };

  const isButtonDisabled =
    disabled ||
    isLoading ||
    isCheckingMembership ||
    isPenaltyCheckLoading ||
    step === 'success' ||
    !isConnected ||
    isWrongNetwork ||
    !hasEnoughBalance ||
    isAlreadyMember ||
    hasPenalties;

  return (
    <div className="space-y-4">
      {/* Main Join Button */}
      <Button
        onClick={handleClick}
        disabled={isButtonDisabled}
        className={`w-full text-base font-semibold py-6 ${className}`}
        variant={
          step === 'error'
            ? 'outline'
            : isAlreadyMember || hasPenalties
            ? 'secondary'
            : 'default'
        }
      >
        {getButtonIcon()}
        <span className="ml-2">{getButtonText()}</span>
      </Button>

      {/* Penalty Status Display */}
      {(isPenaltyCheckLoading || hasPenalties || penaltyError) && (
        <div className="space-y-2">
          <PenaltyStatusBadge
            hasPenalties={hasPenalties}
            penaltyCount={penaltyCount}
            isLoading={isPenaltyCheckLoading}
            error={penaltyError}
            walletAddress={address}
          />
          
          {hasPenalties && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You cannot participate in rounds due to contract violations. Please resolve your penalties before joining.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {isAlreadyMember && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            You are already a member of this RONDA. You can view your
            participation status and make contributions as scheduled.
          </AlertDescription>
        </Alert>
      )}

      {!isAlreadyMember && !hasPenalties && parseFloat(entryFeeFormatted) > 0 ? (
        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-warning">
                  Entry Fee Required
                </span>
              </div>
              <Badge
                variant="outline"
                className="bg-warning/10 text-warning border-warning/20"
              >
                {isFormattingAmounts ? (
                  <div className="h-4 bg-muted animate-pulse rounded w-16" />
                ) : (
                  formattedEntryFee || `${entryFeeFormatted} tokens`
                )}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">
                  Monthly Contribution:
                </span>
                <div className="font-medium">
                  {isFormattingAmounts ? (
                    <div className="h-4 bg-muted animate-pulse rounded w-20" />
                  ) : (
                    formattedMonthlyDeposit || `${contributionAmount} tokens`
                  )}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Entry Fee:</span>
                <div className="font-medium">
                  {isFormattingAmounts ? (
                    <div className="h-4 bg-muted animate-pulse rounded w-16" />
                  ) : (
                    formattedEntryFee || `${entryFeeFormatted} tokens`
                  )}
                </div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Required:</span>
                <span className="font-semibold text-warning">
                  {isFormattingAmounts ? (
                    <div className="h-4 bg-muted animate-pulse rounded w-24" />
                  ) : (
                    formattedTotalContribution || `${totalRequiredFormatted} tokens`
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!isAlreadyMember &&
      !hasPenalties &&
      estimatedGas &&
      estimatedGasCostFormatted &&
      !isEstimatingGas ? (
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">
                  Gas Estimated
                </span>
              </div>
              <Badge
                variant="outline"
                className="bg-success/10 text-success border-success/20"
              >
                {estimatedGas.toLocaleString()} gas
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Token Amount:</span>
                <div className="font-medium">
                  {isFormattingAmounts ? (
                    <div className="h-4 bg-muted animate-pulse rounded w-20" />
                  ) : (
                    formattedTotalContribution || `${totalRequiredFormatted} tokens`
                  )}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Est. Gas Cost:</span>
                <div className="font-medium">
                  {parseFloat(estimatedGasCostFormatted).toFixed(6)} ETH
                </div>
              </div>
            </div>
            {needsApproval && (
              <div className="mt-2 pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Steps Required:</span>
                  <span className="font-semibold">1. Approve → 2. Join</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Status Information */}
      {(step !== 'idle' ||
        !hasEnoughBalance ||
        isWrongNetwork ||
        isEstimatingGas ||
        isCheckingMembership ||
        isPenaltyCheckLoading ||
        needsApproval ||
        isAlreadyMember ||
        hasPenalties) && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Step Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge
                  variant={
                    step === 'success'
                      ? 'default'
                      : step === 'error'
                      ? 'destructive'
                      : isAlreadyMember || hasPenalties
                      ? 'secondary'
                      : 'secondary'
                  }
                  className="gap-1"
                >
                  {step === 'success' && <CheckCircle className="h-3 w-3" />}
                  {step === 'error' && <AlertTriangle className="h-3 w-3" />}
                  {step === 'checking' && <UserCheck className="h-3 w-3" />}
                  {step === 'approving' && <Key className="h-3 w-3" />}
                  {(isLoading || isEstimatingGas || isCheckingMembership || isPenaltyCheckLoading) && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  {isAlreadyMember && <CheckCircle className="h-3 w-3" />}
                  {hasPenalties && <AlertTriangle className="h-3 w-3" />}
                  {hasPenalties
                    ? 'Blocked'
                    : isAlreadyMember
                    ? 'Already Member'
                    : isPenaltyCheckLoading
                    ? 'Checking'
                    : isEstimatingGas
                    ? 'Estimating'
                    : isCheckingMembership
                    ? 'Verifying'
                    : step.charAt(0).toUpperCase() + step.slice(1)}
                </Badge>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground">
                {getStepDescription()}
              </p>

              {/* Penalty Check Progress */}
              {isPenaltyCheckLoading && (
                <div className="p-3 bg-info/5 rounded-lg border border-info/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-4 w-4 text-info animate-pulse" />
                    <span className="text-sm font-medium text-info">
                      Penalty Token Verification
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Checking your wallet for penalty tokens before allowing participation...
                  </p>
                </div>
              )}

              {/* Membership Verification for ERC20 */}
              {step === 'checking' && !isPenaltyCheckLoading && (
                <div className="p-3 bg-info/5 rounded-lg border border-info/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <UserCheck className="h-4 w-4 text-info animate-pulse" />
                    <span className="text-sm font-medium text-info">
                      Membership Verification
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Checking if you are already a member of this RONDA to
                    prevent duplicate joins...
                  </p>
                </div>
              )}

              {/* Two-Step Process for ERC20 */}
              {!isAlreadyMember && !hasPenalties && needsApproval && step === 'idle' && (
                <div className="p-3 bg-info/5 rounded-lg border border-info/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <ArrowRight className="h-4 w-4 text-info" />
                    <span className="text-sm font-medium text-info">
                      Two-Step Process
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <span className="w-4 h-4 bg-info/20 rounded-full flex items-center justify-center text-info font-bold text-xs">
                        1
                      </span>
                      <span>Approve tokens for the RONDA contract</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-4 h-4 bg-info/20 rounded-full flex items-center justify-center text-info font-bold text-xs">
                        2
                      </span>
                      <span>Join the RONDA with approved tokens</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Gas Estimation Progress */}
              {isEstimatingGas && (
                <div className="p-3 bg-info/5 rounded-lg border border-info/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-info animate-pulse" />
                    <span className="text-sm font-medium text-info">
                      Calculating Gas Fees
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Analyzing current network conditions to estimate optimal gas
                    price and limit...
                  </p>
                </div>
              )}

              {/* Balance Check */}
              {!isAlreadyMember && !hasPenalties && !hasEnoughBalance && !isEstimatingGas && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Insufficient token balance. You need{' '}
                    {formattedTotalContribution || totalRequiredFormatted} plus ETH for gas fees.
                  </AlertDescription>
                </Alert>
              )}

              {/* Network Check */}
              {isWrongNetwork && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please switch to Sepolia testnet to join this RONDA.
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Display */}
              {error && step === 'error' && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Links */}
      {(approvalHash || joinHash) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Transaction Details
            </CardTitle>
            <CardDescription>
              View your transactions on Sepolia block explorer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Approval Transaction */}
            {approvalHash && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <Key className="h-3 w-3" />
                    Token Approval
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {approvalHash.slice(0, 10)}...{approvalHash.slice(-8)}
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`${BLOCK_EXPLORER_URL}/tx/${approvalHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            )}

            {/* Join Transaction */}
            {joinHash && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    Join RONDA
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {joinHash.slice(0, 10)}...{joinHash.slice(-8)}
                  </div>
                  {estimatedGas ? (
                    <div className="text-xs text-muted-foreground">
                      Gas Used: {estimatedGas.toLocaleString()} units
                    </div>
                  ) : null}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`${BLOCK_EXPLORER_URL}/tx/${joinHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Details Toggle */}
      {!isAlreadyMember && !hasPenalties && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-muted-foreground"
        >
          {showDetails ? 'Hide' : 'Show'} Technical Details
        </Button>
      )}

      {/* Technical Details */}
      {!isAlreadyMember && !hasPenalties && showDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Technical Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">
                  Penalty Status:
                </span>
                <div className="font-medium">
                  {isPenaltyCheckLoading ? '🔄 Checking...' : hasPenalties ? `❌ ${penaltyCount} Penalties` : '✅ No Penalties'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">
                  Membership Status:
                </span>
                <div className="font-medium">
                  {isAlreadyMember ? '✅ Already Member' : '❌ Not Member'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Total Required:</span>
                <div className="font-medium">
                  {formattedTotalContribution || totalRequiredFormatted}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Balance Check:</span>
                <div className="font-medium">
                  {hasEnoughBalance ? '✅ Sufficient' : '❌ Insufficient'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Payment Method:</span>
                <div className="font-medium">ERC20 Tokens</div>
              </div>
              <div>
                <span className="text-muted-foreground">Approval Needed:</span>
                <div className="font-medium">
                  {needsApproval ? '🔑 Yes' : '✅ Not Required'}
                </div>
              </div>
            </div>

            {/* Entry Fee Breakdown */}
            {parseFloat(entryFeeFormatted) > 0 ? (
              <div className="pt-3 border-t">
                <h4 className="font-medium text-sm mb-2">Cost Breakdown</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">
                      Monthly Contribution:
                    </span>
                    <div className="font-mono">
                      {formattedMonthlyDeposit || `${contributionAmount} tokens`}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entry Fee:</span>
                    <div className="font-mono">
                      {formattedEntryFee || `${entryFeeFormatted} tokens`}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Total Required:
                    </span>
                    <div className="font-mono font-semibold">
                      {formattedTotalContribution || totalRequiredFormatted}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gas Cost:</span>
                    <div className="font-mono">
                      {estimatedGasCostFormatted
                        ? `${parseFloat(estimatedGasCostFormatted).toFixed(
                            6
                          )} ETH`
                        : 'Estimating...'}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="pt-3 border-t">
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">RONDA Contract:</span>
                  <div className="font-mono break-all">
                    {roscaContractAddress}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Token:</span>
                  <div className="font-mono">ERC20 (approval required)</div>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Transaction Steps:
                  </span>
                  <div className="font-mono">
                    {needsApproval
                      ? '1. Check Penalties → 2. Approve → 3. Join'
                      : '1. Check Penalties → 2. Join'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Actions */}
      {step === 'success' && (
        <Card className="border-success/20 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="font-medium text-success">
                Successfully Joined RONDA!
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              You are now a member of this RONDA. Your tokens have been
              transferred to the contract.
            </p>
            <div className="space-y-2 text-xs text-muted-foreground mb-4">
              <div>Total tokens sent: {formattedTotalContribution || totalRequiredFormatted}</div>
              {parseFloat(entryFeeFormatted) > 0 && (
                <div>Entry fee: {formattedEntryFee || `${entryFeeFormatted} tokens`}</div>
              )}
              {estimatedGasCostFormatted ? (
                <div>
                  Gas used: {parseFloat(estimatedGasCostFormatted).toFixed(6)}{' '}
                  ETH
                </div>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh Page
              </Button>
              {joinHash && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`${BLOCK_EXPLORER_URL}/tx/${joinHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Transaction
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}