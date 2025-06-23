'use client';

import { Shield, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { VerificationStatus } from '@/components/wallet/verification-status';
import { useRondaDeposit } from '@/hooks/use-ronda-deposit';
import { useVerification } from '@/hooks/use-verification';

import { JoinConfirmationModal } from './join-confirmation-modal';
import { JoinRoscaButton } from './join-rosca-button';

interface JoinButtonProps {
  group: any;
  isDisabled: boolean;
}

export function JoinButton({ group, isDisabled }: JoinButtonProps) {
  const { verificationState } = useVerification();
  const [showModal, setShowModal] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  // Check if user is already a member of this RONDA and if they can make deposits
  const { isMember, canMakeDeposits, isRondaRunning, rondaState } = useRondaDeposit({
    roscaContractAddress: group.address
  });

  const handleJoinClick = () => {
    if (verificationState.isReadyToJoin) {
      setShowModal(true);
    }
  };

  const handleJoinSuccess = () => {
    setHasJoined(true);
  };

  // Calculate the contribution amount based on token type
  const getContributionAmount = () => {
    // Pass the raw contract value (string) to the join component
    return group.monthlyDeposit || "100000000"; // Raw contract value
  };

  // Get RONDA state name for display - using the same mapping as the working status functions
  const getStateName = (state: number | null) => {
    if (state === null) { return 'Open'; }
    
    const stateNames = ['Open', 'Running', 'Finalized', 'Aborted', 'Randomizing'];
    return stateNames[state] || 'Open';
  };

  // If user is already a member, show contribute button (only if RONDA is running)
  if (hasJoined || isMember) {
    return (
      <div className="space-y-3">
        <Button disabled className="w-full" size="lg">
          <Shield className="h-4 w-4 mr-2" />
          {isMember ? 'Already a Member!' : 'Successfully Joined!'}
        </Button>
        
        {/* Show contribute button only if RONDA is running */}
        {canMakeDeposits ? (
          <Button asChild className="w-full" variant="default">
            <Link href={`/group/${group.address || group.id}/contribute`}>
              <DollarSign className="h-4 w-4 mr-2" />
              Make Monthly Contribution
            </Link>
          </Button>
        ) : (
          <div className="space-y-2">
            <Button disabled className="w-full" variant="outline">
              <DollarSign className="h-4 w-4 mr-2" />
              Contributions Not Available
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              {isRondaRunning ? (
                'RONDA is running but deposits are not currently available'
              ) : (
                `RONDA is ${getStateName(rondaState)} - contributions only available when Running`
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isDisabled) {
    return (
      <Button disabled className="w-full">
        Circle Full
      </Button>
    );
  }

  return (
    <div className="space-y-6">
      {/* Verification Status */}
      <VerificationStatus
        worldIdVerified={verificationState.isWorldIdVerified}
        walletConnected={verificationState.isWalletConnected}
        walletAddress={verificationState.walletAddress}
        showJoinButton={false}
      />

      {/* Join Button - Use new ROSCA join component */}
      {verificationState.isReadyToJoin ? (
        <JoinRoscaButton
          contributionAmount={getContributionAmount()}
          roscaContractAddress={group.address}
          onSuccess={handleJoinSuccess}
        />
      ) : (
        <Button asChild className="w-full" size="lg" variant="outline">
          <Link href="/auth">
            <Shield className="h-4 w-4 mr-2" />
            Complete Verification to Join
          </Link>
        </Button>
      )}

      <JoinConfirmationModal
        group={group}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleJoinSuccess}
      />
    </div>
  );
}