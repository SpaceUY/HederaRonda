'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  Users,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { SingleRondaData } from '@/hooks/use-single-ronda-contract';
import { WalletChainInfo } from '@/components/wallet/wallet-chain-info';
import { formatCurrency } from '@/lib/utils';
import { getNetworkConfig } from '@/constants/ccip-config';
import { useRoscaJoin } from '@/hooks/use-rosca-join';
import { useWalletInfo } from '@/hooks/use-wallet-info';

interface JoinConfirmationModalProps {
  group: SingleRondaData;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function JoinConfirmationModal({
  group,
  isOpen,
  onClose,
  onSuccess,
}: JoinConfirmationModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isStuck, setIsStuck] = useState(false);
  const { chainName, chainId } = useWalletInfo();
  
  const networkConfig = getNetworkConfig(296); // Hedera Testnet

  const {
    step: joinStep,
    error: joinError,
    isConfirming,
    executeJoinFlow,
  } = useRoscaJoin({
    roscaContractAddress: group.address,
    paymentToken: group.paymentToken || '',
    entryFeeFormatted: group.entryFeeFormatted,
    userChainId: chainId || undefined,
    targetChainId: 296, // Hedera Testnet
    rondaSenderAddress: networkConfig?.rondaSenderAddress,
    onSuccess: () => {
      console.log('🎉 Modal onSuccess callback triggered');
      setTimeout(() => {
        console.log('🔒 Closing modal after 2 second delay');
        onClose();
        onSuccess?.();
      }, 2000);
    },
  });

  useEffect(() => {
    if (isOpen && (joinStep === 'joining' || joinStep === 'approving')) {
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Modal appears to be stuck, enabling manual close');
        setIsStuck(true);
      }, 30000); 
      
      return () => clearTimeout(timeoutId);
    } else {
      setIsStuck(false);
      return undefined;
    }
  }, [isOpen, joinStep]);

  if (!isOpen) {
    return null;
  }

  const totalContribution = group.monthlyDepositFormatted * group.maxParticipants;
  const estimatedPosition = group.participantCount + 1;
  const estimatedPayoutMonth = Math.ceil(estimatedPosition / 2);

  const handleJoin = async () => {
    try {
      setError(null);
      await executeJoinFlow();
    } catch (err: unknown) {
      console.error('❌ Join process failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to join. Please try again.';
      setError(errorMessage);
    }
  };

  const resetModal = () => {
    setError(null);
    setIsStuck(false);
  };

  const handleClose = () => {
    if ((joinStep === 'joining' || joinStep === 'approving' || isConfirming) && joinStep !== 'error' && !isStuck) {
      return;
    }
    onClose();
    resetModal();
  };

  const getDialogTitle = () => {
    switch (joinStep) {
      case 'success':
        return 'Successfully Joined!';
      case 'joining':
        return 'Processing Transaction';
      case 'approving':
        return 'Approving Tokens';
      case 'checking':
        return 'Checking Requirements';
      case 'estimating':
        return 'Estimating Gas';
      default:
        return 'Join RONDA';
    }
  };

  const renderContent = () => {
    switch (joinStep) {
      case 'success':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                Successfully Joined RONDA!
              </h3>
              <p className="text-muted-foreground">
                You are now a member of this RONDA group.
              </p>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-success/5 rounded-lg border border-success/20">
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-success">
                    Transaction Confirmed
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your position: #{estimatedPosition} of {group.maxParticipants}
                </p>
              </div>
            </div>
          </div>
        );

      case 'joining':
      case 'approving':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                {joinStep === 'approving' ? 'Approving Tokens...' : 'Processing Transaction...'}
              </h3>
              <p className="text-muted-foreground">
                {joinStep === 'approving'
                  ? 'Please approve the token allowance in your wallet.'
                  : 'Please wait while your transaction is being processed.'}
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Entry Fee:
                  </span>
                  <span className="font-medium">
                    {formatCurrency(group.entryFeeFormatted, group.tokenSymbol)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Your Position:</span>
                  <span className="font-medium">
                    #{estimatedPosition} of {group.maxParticipants}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Network:</span>
                  <span className="font-medium">{chainName}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Do not close this window while the transaction is processing.
                </p>
              </div>
            </div>
          </div>
        );

      case 'checking':
      case 'estimating':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 text-warning animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                {joinStep === 'checking' ? 'Checking Requirements...' : 'Estimating Gas...'}
              </h3>
              <p className="text-muted-foreground">
                {joinStep === 'checking'
                  ? 'Please wait while we verify your eligibility.'
                  : 'Calculating transaction costs...'}
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            {/* Group Summary */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  Join RONDA #{group.id}
                </h3>
                <p className="text-muted-foreground">{group.description}</p>
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Entry Fee</span>
                  </div>
                  <div className="font-semibold text-lg">
                    {formatCurrency(group.entryFeeFormatted, group.tokenSymbol)}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Your Position</span>
                  </div>
                  <div className="font-semibold text-lg">
                    #{estimatedPosition} of {group.maxParticipants}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Estimated Payout</span>
                  </div>
                  <div className="font-semibold text-lg">
                    Month {estimatedPayoutMonth}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Duration</span>
                  </div>
                  <div className="font-semibold text-lg">
                    {group.duration} months
                  </div>
                </div>
              </div>

              {/* Payout Information */}
              <div className="p-4 bg-success/5 rounded-lg border border-success/20">
                <h4 className="font-medium mb-2 text-success">Your Payout</h4>
                <p className="text-sm mb-2">
                  You'll receive{' '}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(totalContribution, group.tokenSymbol)}
                  </span>{' '}
                  when it's your turn (estimated month {estimatedPayoutMonth}).
                </p>
                <p className="text-xs text-muted-foreground">
                  Total commitment:{' '}
                  {formatCurrency(
                    group.monthlyDepositFormatted * group.duration,
                    group.tokenSymbol
                  )}{' '}
                  over {group.duration} months
                </p>
              </div>
            </div>

            {/* Wallet & Network Information */}
            <WalletChainInfo compact={true} />

            {(error || joinError) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error || joinError}</AlertDescription>
              </Alert>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-lg font-semibold">
          {getDialogTitle()}
        </DialogTitle>

        {joinStep === 'idle' && (
          <p className="text-sm text-muted-foreground mb-4">
            Review the details and confirm your membership
          </p>
        )}

        {/* Content */}
        <div className="space-y-4">{renderContent()}</div>

        {/* Footer Actions */}
        {joinStep === 'idle' && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleJoin}
              className="w-full sm:w-auto gap-2"
              disabled={chainId !== 296 || isConfirming} // Hedera Testnet
            >
              <DollarSign className="h-4 w-4" />
              Join RONDA
            </Button>
          </div>
        )}

        {joinStep === 'error' && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button onClick={handleJoin} className="w-full sm:w-auto gap-2">
              <DollarSign className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}

        {/* Manual close button for stuck states */}
        {(joinStep === 'joining' || joinStep === 'approving') && isStuck && (
          <div className="flex flex-col space-y-4 pt-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Transaction appears to be stuck. You can close this modal and check your wallet for transaction status.
              </AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Button 
                variant="destructive" 
                size="lg"
                onClick={handleClose}
              >
                Close Modal
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
