import { useEffect, useState } from 'react';

import { RONDA_ABI } from '@/constants/abis/ronda-abi';
import { useReadContract } from 'wagmi';

export function useParticipantCheck(
  roscaContractAddress: string,
  participantAddress: string
) {
  const [isManualCheck, setIsManualCheck] = useState(false);
  const [hasRateLimitError, setHasRateLimitError] = useState(false);

  // Check if address is a member
  const { data: isMember, isLoading: isCheckingMembership, refetch: refetchMembership, error: membershipError } = useReadContract({
    address: roscaContractAddress as `0x${string}`,
    abi: RONDA_ABI,
    functionName: 'hasParticipantJoined',
    args: [participantAddress as `0x${string}`],
    query: {
      enabled: !hasRateLimitError && !isManualCheck, // Disable automatic calls if rate limited
      retry: 0, // No automatic retries
    },
  });

  // Get participant's slot if RONDA is running
  const { data: rondaState, refetch: refetchState, error: stateError } = useReadContract({
    address: roscaContractAddress as `0x${string}`,
    abi: RONDA_ABI,
    functionName: 'currentState',
    query: {
      enabled: !hasRateLimitError && !isManualCheck, // Disable automatic calls if rate limited
      retry: 0, // No automatic retries
    },
  });

  // Get all joined participants
  const { data: participantCount, refetch: refetchCount, error: countError } = useReadContract({
    address: roscaContractAddress as `0x${string}`,
    abi: RONDA_ABI,
    functionName: 'participantCount',
    query: {
      enabled: !hasRateLimitError && !isManualCheck, // Disable automatic calls if rate limited
      retry: 0, // No automatic retries
    },
  });

  // Check for rate limiting errors
  const currentRateLimitError = membershipError?.message?.includes('429') || 
                               stateError?.message?.includes('429') || 
                               countError?.message?.includes('429');

  // Update rate limit error state
  useEffect(() => {
    if (currentRateLimitError) {
      setHasRateLimitError(true);
    }
  }, [currentRateLimitError]);

  // Function to manually trigger membership check
  const triggerManualCheck = async () => {
    setIsManualCheck(true);
    setHasRateLimitError(false);
    
    try {
      await Promise.all([
        refetchMembership(),
        refetchState(),
        refetchCount(),
      ]);
    } catch (error) {
      console.error('❌ Error refetching participant data:', error);
    } finally {
      setIsManualCheck(false);
    }
  };

  // Function to refetch all data (legacy support)
  const refetchAll = async () => {
    return triggerManualCheck();
  };

  return {
    isMember: isMember || false,
    isCheckingMembership: isManualCheck || isCheckingMembership,
    rondaState: rondaState ? Number(rondaState) : null,
    participantCount: participantCount ? Number(participantCount) : 0,
    refetchAll,
    triggerManualCheck,
    hasError: hasRateLimitError,
    needsManualCheck: hasRateLimitError,
  };
} 