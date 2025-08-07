'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAccount, useChainId } from 'wagmi';
import { useEffect, useState } from 'react';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Group } from '@/local-data';
import { JoinConfirmationModal } from './join-confirmation-modal';
import { WalletChainInfo } from '@/components/wallet/wallet-chain-info';
import { useParticipantCheck } from '@/hooks/use-participant-check';
import { useRouter } from 'next/navigation';
import { useWagmiReady } from '@/hooks/use-wagmi-ready';
import { useWalletInfo } from '@/hooks/use-wallet-info';

interface JoinRoscaButtonProps {
  group: Group;
  onSuccess?: () => void;
}

export function JoinRoscaButton({
  group,
  onSuccess,
}: JoinRoscaButtonProps) {
  const isWagmiReady = useWagmiReady();
  const { address } = useAccount();
  const chainId = useChainId();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected } = useWalletInfo();
  const router = useRouter();

  const isNetworkSupported = isWagmiReady && chainId === 296; // Hedera Testnet

  // Check if the address is already a member
  const { isMember, isCheckingMembership, rondaState } = useParticipantCheck(
    group.address,
    address || '' 
  );

  // Log membership status
  useEffect(() => {
    console.log('🔍 Membership check:', {
      address: address,
      isMember,
      isCheckingMembership,
      rondaState,
      rondaAddress: group.address
    });
  }, [address, isMember, isCheckingMembership, rondaState, group.address]);

  const handleClick = () => {
    if (isMember) {
      alert('This address is already a member of this RONDA');
      return;
    }
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    setIsModalOpen(false); // Close the modal
    onSuccess?.();
    router.refresh();
  };

  if (isCheckingMembership) {
    return (
      <Button disabled className="w-full">
        Checking membership...
      </Button>
    );
  }

  if (isMember) {
    return (
      <Button disabled className="w-full">
        Already a member
      </Button>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <Button className="w-full" onClick={() => window.ethereum?.request({ method: 'eth_requestAccounts' })}>
          Connect Wallet
        </Button>
        <p className="text-sm text-muted-foreground">
          Connect your wallet to join this RONDA
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
            Please switch to Hedera Testnet to join this RONDA
          </AlertDescription>
        </Alert>
        <WalletChainInfo />
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={!isConnected || isMember}
      >
        {isMember ? 'Already a member' : 'Join RONDA'}
      </Button>

      <JoinConfirmationModal
        group={group}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
