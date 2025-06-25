'use client';

import {
  DollarSign,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Clock,
  Zap,
  Key,
  ArrowRight,
  UserCheck,
  Calendar,
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
import {
  isCCIPSupported,
  getCCIPNetworkConfig,
  SUPPORTED_NETWORKS,
} from '@/constants/ccip-config';
import { useRondaDeposit } from '@/hooks/use-ronda-deposit';

interface DepositButtonProps {
  roscaContractAddress: string;
  milestoneIndex?: number;
  onSuccess?: () => void;
  disabled?: boolean;
  className?: string;
}

// Use the default network from CCIP config instead of hardcoded value
const BLOCK_EXPLORER_URL = 'https://sepolia.etherscan.io';

export function DepositButton({
  roscaContractAddress,
  milestoneIndex = 0,
  onSuccess,
  disabled = false,
  className,
}: DepositButtonProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [showDetails, setShowDetails] = useState(false);

  const {
    step,
    error,
    isLoading,
    executeDepositFlow,
    approvalHash,
    depositHash,
    reset,
    hasEnoughBalance,
    needsApproval,
    estimatedGas,
    estimatedGasCostFormatted,
    isEstimatingGas,
    monthlyDepositFormatted,
    isMember,
    isCheckingMembership,
    currentMilestone,
    hasAlreadyDeposited,
    milestoneInfo,
    rondaState,
    isRondaRunning,
    canMakeDeposits,
  } = useRondaDeposit({
    roscaContractAddress,
  });

  // Check if current network is supported using CCIP config
  const isNetworkSupported = chainId ? isCCIPSupported(chainId) : false;
  const currentNetworkConfig = chainId ? getCCIPNetworkConfig(chainId) : null;
  const isWrongNetwork = !isNetworkSupported;

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
    if (!isMember) {
      return 'Not a Member';
    }
    if (!isRondaRunning) {
      return 'RONDA Not Running';
    }
    if (hasAlreadyDeposited) {
      return 'Already Deposited';
    }
    if (!hasEnoughBalance) {
      return `Insufficient Balance`;
    }

    switch (step) {
      case 'checking':
        return 'Verifying Membership...';
      case 'estimating':
        return 'Estimating Gas...';
      case 'approving':
        return needsApproval ? 'Approving Tokens...' : 'Approval Complete';
      case 'depositing':
        return 'Making Deposit...';
      case 'success':
        return 'Deposit Complete!';
      case 'error':
        return 'Retry Deposit';
      default:
        return needsApproval ? 'Approve & Deposit' : 'Make Monthly Deposit';
    }
  };

  const getButtonIcon = () => {
    if (isLoading || isCheckingMembership) {
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
    if (!isMember) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    if (!isRondaRunning) {
      return <Clock className="h-4 w-4" />;
    }
    if (!isConnected || isWrongNetwork) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    return needsApproval ? (
      <Key className="h-4 w-4" />
    ) : (
      <DollarSign className="h-4 w-4" />
    );
  };

  const getStepDescription = (): string => {
    switch (step) {
      case 'checking':
        return 'Verifying your membership and deposit status...';
      case 'estimating':
        return 'Calculating optimal gas fees for the deposit...';
      case 'approving':
        return 'Approving tokens for the RONDA contract to spend...';
      case 'depositing':
        return 'Submitting deposit transaction to the RONDA contract...';
      case 'success':
        return 'Your monthly deposit has been successfully processed!';
      case 'error':
        return error || 'An error occurred during the deposit process';
      default:
        if (!isMember) {
          return 'You must be a member of this RONDA to make deposits';
        }
        if (!isRondaRunning) {
          const stateNames = [
            'Open',
            'Running',
            'Finalized',
            'Aborted',
            'Randomizing',
          ];
          const currentStateName =
            rondaState !== null
              ? stateNames[rondaState] || 'Unknown'
              : 'Unknown';
          return `RONDA is ${currentStateName} - deposits only allowed when Running`;
        }
        if (hasAlreadyDeposited) {
          return 'You have already made your deposit for this milestone';
        }
        return needsApproval
          ? `Ready to approve tokens and make deposit of ${monthlyDepositFormatted} tokens`
          : `Ready to make monthly deposit of ${monthlyDepositFormatted} tokens`;
    }
  };

  const handleClick = () => {
    if (step === 'error') {
      reset();
    } else if (step === 'idle' && canMakeDeposits && !hasAlreadyDeposited) {
      executeDepositFlow(currentMilestone || milestoneIndex);
    }
  };

  const isButtonDisabled =
    disabled ||
    isLoading ||
    isCheckingMembership ||
    step === 'success' ||
    !isConnected ||
    isWrongNetwork ||
    !hasEnoughBalance ||
    !canMakeDeposits ||
    hasAlreadyDeposited;

  return (
    <div className="space-y-4">
      <Button
        onClick={handleClick}
        disabled={isButtonDisabled}
        className={`w-full py-6 text-base font-semibold ${className}`}
        variant={
          step === 'error'
            ? 'outline'
            : !isMember
              ? 'secondary'
              : !isRondaRunning
                ? 'secondary'
                : hasAlreadyDeposited
                  ? 'secondary'
                  : 'default'
        }
      >
        {getButtonIcon()}
        <span className="ml-2">{getButtonText()}</span>
      </Button>

      {!isMember && isConnected && !isWrongNetwork && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You are not a member of this RONDA. Only members can make monthly
            deposits.
          </AlertDescription>
        </Alert>
      )}

      {isMember && !isRondaRunning && (
        <Alert variant="destructive">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            This RONDA is not currently accepting deposits. Current state:{' '}
            {rondaState !== null
              ? ['Open', 'Running', 'Finalized', 'Aborted', 'Randomizing'][
                  rondaState
                ] || 'Unknown'
              : 'Unknown'}
            . Deposits are only allowed when the RONDA is in "Running" state.
          </AlertDescription>
        </Alert>
      )}

      {hasAlreadyDeposited && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            You have already made your deposit for this milestone. Check back
            next month for the next deposit.
          </AlertDescription>
        </Alert>
      )}

      {canMakeDeposits && !hasAlreadyDeposited && milestoneInfo && (
        <Card className="border-l-4 border-l-info">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-info" />
                <span className="text-sm font-medium text-info">
                  Milestone {currentMilestone || milestoneIndex}
                </span>
              </div>
              <Badge
                variant="outline"
                className="border-info/20 bg-info/10 text-info"
              >
                {milestoneInfo.isComplete ? 'Complete' : 'Active'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Required Deposit:</span>
                <div className="font-medium">
                  {monthlyDepositFormatted} tokens
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Total Collected:</span>
                <div className="font-medium">
                  {Number(milestoneInfo.totalDeposits) / 1e6} /{' '}
                  {Number(milestoneInfo.requiredDeposits) / 1e6} tokens
                </div>
              </div>
            </div>
            <div className="mt-2">
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-info transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      (Number(milestoneInfo.totalDeposits) /
                        Number(milestoneInfo.requiredDeposits)) *
                        100
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {Math.round(
                  (Number(milestoneInfo.totalDeposits) /
                    Number(milestoneInfo.requiredDeposits)) *
                    100
                )}
                % collected
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {canMakeDeposits &&
      !hasAlreadyDeposited &&
      estimatedGas &&
      estimatedGasCostFormatted &&
      !isEstimatingGas ? (
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">
                  Gas Estimated
                </span>
              </div>
              <Badge
                variant="outline"
                className="border-success/20 bg-success/10 text-success"
              >
                {estimatedGas.toLocaleString()} gas
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Deposit Amount:</span>
                <div className="font-medium">
                  {monthlyDepositFormatted} tokens
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
              <div className="mt-2 border-t pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Steps Required:</span>
                  <span className="font-semibold">1. Approve → 2. Deposit</span>
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
        needsApproval ||
        !isMember ||
        !isRondaRunning ||
        hasAlreadyDeposited) && (
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
                        : !isMember
                          ? 'secondary'
                          : !isRondaRunning
                            ? 'secondary'
                            : hasAlreadyDeposited
                              ? 'secondary'
                              : 'secondary'
                  }
                  className="gap-1"
                >
                  {step === 'success' && <CheckCircle className="h-3 w-3" />}
                  {step === 'error' && <AlertTriangle className="h-3 w-3" />}
                  {step === 'checking' && <UserCheck className="h-3 w-3" />}
                  {step === 'approving' && <Key className="h-3 w-3" />}
                  {(isLoading || isEstimatingGas || isCheckingMembership) && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  {!isMember && <AlertTriangle className="h-3 w-3" />}
                  {!isRondaRunning && <Clock className="h-3 w-3" />}
                  {hasAlreadyDeposited && <CheckCircle className="h-3 w-3" />}
                  {!isMember
                    ? 'Not Member'
                    : !isRondaRunning
                      ? 'Not Running'
                      : hasAlreadyDeposited
                        ? 'Deposited'
                        : isEstimatingGas
                          ? 'Estimating'
                          : isCheckingMembership
                            ? 'Checking'
                            : step.charAt(0).toUpperCase() + step.slice(1)}
                </Badge>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground">
                {getStepDescription()}
              </p>

              {/* Membership Verification */}
              {step === 'checking' && (
                <div className="rounded-lg border border-info/20 bg-info/5 p-3">
                  <div className="mb-2 flex items-center space-x-2">
                    <UserCheck className="h-4 w-4 animate-pulse text-info" />
                    <span className="text-sm font-medium text-info">
                      Membership & Deposit Verification
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Checking your membership status and whether you've already
                    made this month's deposit...
                  </p>
                </div>
              )}

              {/* Two-Step Process for ERC20 */}
              {canMakeDeposits &&
                !hasAlreadyDeposited &&
                needsApproval &&
                step === 'idle' && (
                  <div className="rounded-lg border border-info/20 bg-info/5 p-3">
                    <div className="mb-2 flex items-center space-x-2">
                      <ArrowRight className="h-4 w-4 text-info" />
                      <span className="text-sm font-medium text-info">
                        Two-Step Process
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-info/20 text-xs font-bold text-info">
                          1
                        </span>
                        <span>Approve tokens for the RONDA contract</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-info/20 text-xs font-bold text-info">
                          2
                        </span>
                        <span>Make monthly deposit to the milestone</span>
                      </div>
                    </div>
                  </div>
                )}

              {/* Gas Estimation Progress */}
              {isEstimatingGas && (
                <div className="rounded-lg border border-info/20 bg-info/5 p-3">
                  <div className="mb-2 flex items-center space-x-2">
                    <Zap className="h-4 w-4 animate-pulse text-info" />
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
              {canMakeDeposits &&
                !hasAlreadyDeposited &&
                !hasEnoughBalance &&
                !isEstimatingGas && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Insufficient token balance. You need{' '}
                      {monthlyDepositFormatted} tokens plus ETH for gas fees.
                    </AlertDescription>
                  </Alert>
                )}

              {/* Network Check */}
              {isWrongNetwork && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please switch to a supported network:{' '}
                    {SUPPORTED_NETWORKS.join(', ')} to make deposits.
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
      {(approvalHash || depositHash) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ExternalLink className="h-4 w-4" />
              Transaction Details
            </CardTitle>
            <CardDescription>
              View your transactions on {currentNetworkConfig?.name || 'block'}{' '}
              explorer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Approval Transaction */}
            {approvalHash && (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Key className="h-3 w-3" />
                    Token Approval
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
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

            {/* Deposit Transaction */}
            {depositHash && (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <DollarSign className="h-3 w-3" />
                    Monthly Deposit
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {depositHash.slice(0, 10)}...{depositHash.slice(-8)}
                  </div>
                  {estimatedGas ? (
                    <div className="text-xs text-muted-foreground">
                      Gas Used: {estimatedGas.toLocaleString()} units
                    </div>
                  ) : null}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`${BLOCK_EXPLORER_URL}/tx/${depositHash}`}
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
      {canMakeDeposits && (
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
      {canMakeDeposits && showDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Technical Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">
                  Membership Status:
                </span>
                <div className="font-medium">
                  {isMember ? '✅ Verified Member' : '❌ Not Member'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">RONDA State:</span>
                <div className="font-medium">
                  {rondaState !== null
                    ? [
                        'Open',
                        'Running',
                        'Finalized',
                        'Aborted',
                        'Randomizing',
                      ][rondaState] || 'Unknown'
                    : 'Unknown'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Deposit Amount:</span>
                <div className="font-medium">
                  {monthlyDepositFormatted} tokens
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
              <div>
                <span className="text-muted-foreground">Milestone:</span>
                <div className="font-medium">
                  #{currentMilestone || milestoneIndex}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Can Deposit:</span>
                <div className="font-medium">
                  {canMakeDeposits ? '✅ Yes' : '❌ No'}
                </div>
              </div>
            </div>

            {estimatedGas && estimatedGasCostFormatted ? (
              <div className="border-t pt-3">
                <h4 className="mb-2 text-sm font-medium">Gas Estimation</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Gas Limit:</span>
                    <div className="font-mono">
                      {estimatedGas.toLocaleString()} units
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Est. Gas Cost:
                    </span>
                    <div className="font-mono">
                      {parseFloat(estimatedGasCostFormatted).toFixed(6)} ETH
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gas Buffer:</span>
                    <div className="font-mono">+20% safety margin</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Network:</span>
                    <div className="font-mono">
                      {isNetworkSupported ? '✅ Sepolia' : '❌ Wrong Network'}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="border-t pt-3">
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">RONDA Contract:</span>
                  <div className="break-all font-mono">
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
                      ? '1. Check → 2. Approve → 3. Deposit'
                      : '1. Check → 2. Deposit'}
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
            <div className="mb-3 flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="font-medium text-success">
                Deposit Successful!
              </span>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Your monthly deposit has been processed and recorded in the RONDA
              contract.
            </p>
            <div className="mb-4 space-y-2 text-xs text-muted-foreground">
              <div>Deposit amount: {monthlyDepositFormatted} tokens</div>
              <div>Milestone: #{currentMilestone || milestoneIndex}</div>
              {estimatedGasCostFormatted && (
                <div>
                  Gas used: {parseFloat(estimatedGasCostFormatted).toFixed(6)}{' '}
                  ETH
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Refresh Page
              </Button>
              {depositHash && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`${BLOCK_EXPLORER_URL}/tx/${depositHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
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
