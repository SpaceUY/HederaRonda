'use client';

import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { WalletChainInfo } from '@/components/wallet/wallet-chain-info';
import { useWalletInfo } from '@/hooks/use-wallet-info';
import { formatCurrency } from '@/lib/utils';
import { Group } from '@/local-data';



interface DepositConfirmationModalProps {
  group: Group;
  milestone: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type TransactionStatus =
  | 'idle'
  | 'checking'
  | 'confirming'
  | 'processing'
  | 'success'
  | 'error';

export function DepositConfirmationModal({
  group,
  milestone,
  isOpen,
  onClose,
  onSuccess,
}: DepositConfirmationModalProps) {
  const [status, setStatus] = useState<TransactionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { chainName, chainId, address, balance } = useWalletInfo();

  if (!isOpen) {
    return null;
  }

  const handleDeposit = async () => {
    try {
      setError(null);

      // Step 1: Wallet Confirmation
      setStatus('confirming');
      console.log('🔐 Requesting wallet confirmation...');

      // Small delay to show confirming state
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 2: Transaction Processing
      setStatus('processing');

      console.log('⏳ Processing deposit transaction:', {
        groupId: group.id,
        walletAddress: address,
        chainId: chainId,
        chainName: chainName,
        milestone: milestone,
      });

      // Simulate transaction processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 3: Success
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 40)}`;
      setTxHash(mockTxHash);
      setStatus('success');

      console.log('✅ Deposit transaction successful:', {
        txHash: mockTxHash,
        groupId: group.id,
        milestone: milestone,
      });

      // Auto-close and trigger success callback after showing success state
      setTimeout(() => {
        onSuccess();
        onClose();
        resetModal();
      }, 3000);
    } catch (err: any) {
      console.error('❌ Deposit process failed:', err);
      setError(err.message || 'Failed to deposit. Please try again.');
      setStatus('error');
    }
  };

  const resetModal = () => {
    setStatus('idle');
    setError(null);
    setTxHash(null);
  };

  const handleClose = () => {
    if (status === 'processing') {
      return;
    } // Prevent closing during processing
    onClose();
    resetModal();
  };

  const getDialogTitle = () => {
    switch (status) {
      case 'success':
        return 'Successfully Deposited!';
      case 'processing':
        return 'Processing Transaction';
      case 'confirming':
        return 'Confirm Transaction';
      default:
        return 'Make Monthly Deposit';
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'success':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                Successfully Made Deposit!
              </h3>
              <p className="text-muted-foreground">
                Your monthly deposit has been processed.
              </p>
            </div>

            {txHash && (
              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Transaction Hash:
                  </p>
                  <p className="text-xs font-mono break-all">{txHash}</p>
                </div>
                <div className="p-3 bg-success/5 rounded-lg border border-success/20">
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium text-success">
                      Transaction Confirmed
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Milestone #{milestone + 1} deposit complete
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 'processing':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                Processing Transaction...
              </h3>
              <p className="text-muted-foreground">
                Please wait while your transaction is being processed.
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Monthly Deposit:
                  </span>
                  <span className="font-medium">
                    {formatCurrency(group.monthlyDepositFormatted, group.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Milestone:</span>
                  <span className="font-medium">
                    #{milestone + 1}
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

      case 'confirming':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto">
              <Wallet className="h-8 w-8 text-warning" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                Confirm Transaction
              </h3>
              <p className="text-muted-foreground">
                Please confirm the transaction in your connected wallet.
              </p>
            </div>

            <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Your Address:</span>
                  <span className="font-mono text-sm">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Monthly Deposit:
                  </span>
                  <span className="font-medium">
                    {formatCurrency(group.monthlyDepositFormatted, group.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Network:</span>
                  <span className="font-medium">{chainName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Your Balance:</span>
                  <span className="font-medium">
                    {balance
                      ? `${parseFloat(balance).toFixed(4)} HBAR`
                      : 'Loading...'}
                  </span>
                </div>
              </div>
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
                  Make Monthly Deposit
                </h3>
                <p className="text-muted-foreground">{group.description}</p>
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Monthly Deposit</span>
                  </div>
                  <div className="font-semibold text-lg">
                    {formatCurrency(group.monthlyDepositFormatted, group.currency)}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Milestone</span>
                  </div>
                  <div className="font-semibold text-lg">
                    #{milestone + 1}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Your Position</span>
                  </div>
                  <div className="font-semibold text-lg">
                    #{group.participantCount} of {group.maxParticipants}
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
            </div>

            {/* Wallet & Network Information */}
            <WalletChainInfo compact={true} />

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
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

        {status === 'idle' && (
          <p className="text-sm text-muted-foreground mb-4">
            Review the details and confirm your monthly deposit
          </p>
        )}

        {/* Content */}
        <div className="space-y-4">{renderContent()}</div>

        {/* Footer Actions */}
        {status === 'idle' && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleDeposit}
              className="w-full sm:w-auto gap-2"
              disabled={chainId !== 296} // Hedera Testnet
            >
              <DollarSign className="h-4 w-4" />
              Make Deposit
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleDeposit} className="w-full sm:w-auto gap-2">
              <DollarSign className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 