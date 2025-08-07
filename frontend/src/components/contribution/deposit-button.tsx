'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DepositConfirmationModal } from './deposit-confirmation-modal';
import { Group } from '@/local-data';
import { WalletChainInfo } from '@/components/wallet/wallet-chain-info';
import { useChainId } from 'wagmi';
import { useState } from 'react';
import { useWagmiReady } from '@/hooks/use-wagmi-ready';
import { useWalletInfo } from '@/hooks/use-wallet-info';

interface DepositButtonProps {
  group: Group;
  milestone: number;
  onSuccess?: () => void;
}

export function DepositButton({
  group,
  milestone,
  onSuccess,
}: DepositButtonProps) {
  const isWagmiReady = useWagmiReady();
  const chainId = useChainId();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected } = useWalletInfo();
  
  const effectiveChainId = isWagmiReady ? chainId : undefined;

  const isNetworkSupported = effectiveChainId === 296; // Hedera Testnet

  const handleClick = () => {
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    onSuccess?.();
  };

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <Button className="w-full" onClick={() => window.ethereum?.request({ method: 'eth_requestAccounts' })}>
          Connect Wallet
        </Button>
        <p className="text-sm text-muted-foreground">
          Connect your wallet to make a deposit
        </p>
      </div>
    );
  }

  if (!isNetworkSupported) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please switch to Hedera Testnet to make a deposit
          </AlertDescription>
        </Alert>
        <WalletChainInfo />
      </div>
    );
  }

  return (
    <>
      <Button onClick={handleClick} className="w-full">
        Make Deposit
      </Button>

      <DepositConfirmationModal
        group={group}
        milestone={milestone}
        isOpen={isModalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </>
  );
}
