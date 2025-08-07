import { useReadContract } from 'wagmi';

import { RONDA_ABI } from '@/constants/abis/ronda-abi';

export function useParticipantCheck(
  roscaContractAddress: string,
  participantAddress: string
) {
  // Check if address is a member
  const { data: isMember, isLoading: isCheckingMembership } = useReadContract({
    address: roscaContractAddress as `0x${string}`,
    abi: RONDA_ABI,
    functionName: 'hasParticipantJoined',
    args: [participantAddress as `0x${string}`],
  });

  // Get participant's slot if RONDA is running
  const { data: rondaState } = useReadContract({
    address: roscaContractAddress as `0x${string}`,
    abi: RONDA_ABI,
    functionName: 'currentState',
  });

  // Get all joined participants
  const { data: participantCount } = useReadContract({
    address: roscaContractAddress as `0x${string}`,
    abi: RONDA_ABI,
    functionName: 'participantCount',
  });

  return {
    isMember: isMember || false,
    isCheckingMembership,
    rondaState: rondaState ? Number(rondaState) : null,
    participantCount: participantCount ? Number(participantCount) : 0,
  };
} 