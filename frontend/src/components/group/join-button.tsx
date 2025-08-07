'use client';

import { DollarSign, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { JoinRoscaButton } from './join-rosca-button';
import Link from 'next/link';
import { SingleRondaData } from '@/hooks/use-single-ronda-contract';
import { VerificationStatus } from '@/components/wallet/verification-status';
import { useRondaDeposit } from '@/hooks/use-ronda-deposit';
import { useState } from 'react';
import { useVerification } from '@/hooks/use-verification';

interface JoinButtonProps {
  group: SingleRondaData;
  isDisabled: boolean;
  onRefetch?: () => void;
}

export function JoinButton({ group, isDisabled, onRefetch }: JoinButtonProps) {
  const { verificationState } = useVerification();
  const [hasJoined, setHasJoined] = useState(false);

  // Check if user is already a member of this RONDA and if they can make deposits
  const { isMember, canMakeDeposits, isRondaRunning, rondaState, isCheckingMembership } = useRondaDeposit({
    roscaContractAddress: group.address,
    contractData: {
      paymentToken: group.paymentToken,
      monthlyDeposit: BigInt(group.monthlyDeposit),
      milestoneCount: group.milestoneCount,
      currentState: group.stateNumber,
    }
  });

  const handleJoinSuccess = () => {
    setHasJoined(true);
    onRefetch?.();
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
            <Link href={`/group/${group.address}/contribute`}>
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
                `RONDA is ${group.state} - contributions only available when Running`
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

      {/* Join Button */}
      {verificationState.isReadyToJoin ? (
        <JoinRoscaButton
          group={group}
          isMember={isMember}
          isCheckingMembership={isCheckingMembership}
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
    </div>
  );
}