'use client';

import { NETWORK_CONFIG, RONDA_ABI, RONDA_STATES } from '@/lib/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ethers } from 'ethers';

let providerInstance: ethers.JsonRpcProvider | null = null;

const getProvider = async () => {
  if (!providerInstance) {
    providerInstance = new ethers.JsonRpcProvider(NETWORK_CONFIG.HEDERA.rpcUrl);
    // Test connection
    const network = await providerInstance.getNetwork();
    if (Number(network.chainId) !== NETWORK_CONFIG.HEDERA.chainId) {
      providerInstance = null;
      throw new Error(`Wrong network. Expected Hedera Testnet (${NETWORK_CONFIG.HEDERA.chainId}), got ${Number(network.chainId)}`);
    }
  }
  return providerInstance;
};

type RondaContract = ethers.Contract & {
  currentState: () => Promise<number>;
  participantCount: () => Promise<number>;
  milestoneCount: () => Promise<number>;
  monthlyDeposit: () => Promise<bigint>;
  entryFee: () => Promise<bigint>;
  paymentToken: () => Promise<string>;
  joinedParticipants: (index: number) => Promise<string>;
  milestones: (index: number) => Promise<[boolean, bigint, bigint]>;
};

type TokenContract = ethers.Contract & {
  symbol: () => Promise<string>;
  decimals: () => Promise<number>;
};

// Retry helper with exponential backoff
const retryWithBackoff = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === maxRetries - 1) {
        throw error;
      }
      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      console.log(`Retrying after ${delay}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries reached');
};

export interface SingleRondaData {
  id: string;
  address: string;
  state: string;
  stateNumber: number;
  participantCount: number; // Current joined participants
  milestoneCount: number;
  monthlyDeposit: string;
  monthlyDepositFormatted: number;
  entryFee: string;
  entryFeeFormatted: number;
  paymentToken: string;
  participants: string[];
  milestones: Array<{
    index: number;
    isCompleted: boolean;
    totalDeposits: string;
    requiredDeposits: string;
    date?: Date;
  }>;
  maxParticipants: number; // Total allowed participants
  isActive: boolean;
  nextRoundStart: Date;
  duration: number;
  // Additional details
  creator?: string | undefined;
  creationTime?: number | undefined;
  creationDate?: Date | undefined;
  lastMilestoneTime?: number | undefined;
  totalDeposited?: string | undefined;
  totalDepositedFormatted?: number | undefined;
  availableSpots: number;
  totalContribution: number;
  // Derived properties for UI compatibility
  description: string;
  currency: string;
  startDate: Date;
  paymentSchedule: string;
  rules: string[];
  // Token information
  isETH: boolean;
  tokenSymbol: string;
  tokenDecimals: number;
}

interface UseSingleRondaContractReturn {
  ronda: SingleRondaData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Simple cache to prevent excessive API calls
const contractCache = new Map<string, { data: SingleRondaData; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export function useSingleRondaContract(
  contractAddress: string
): UseSingleRondaContractReturn {
  const [ronda, setRonda] = useState<SingleRondaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to store contract instances
  const contractRef = useRef<RondaContract | null>(null);
  const tokenContractRef = useRef<TokenContract | null>(null);

  // Debounce the fetch
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchRondaData = useCallback(async (): Promise<void> => {
    if (!contractAddress || !ethers.isAddress(contractAddress)) {
      setError('Invalid contract address');
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cached = contractCache.get(contractAddress);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setRonda(cached.data);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const provider = await retryWithBackoff(getProvider);

      // Initialize contract if needed
      if (!contractRef.current) {
        contractRef.current = new ethers.Contract(
          contractAddress,
          RONDA_ABI,
          provider
        ) as RondaContract;
      }

      const rondaContract = contractRef.current;
      if (!rondaContract) {
        throw new Error('Failed to initialize contract');
      }

      // Batch fetch basic contract data
      const [
        currentState,
        maxParticipants,
        milestoneCount,
        monthlyDeposit,
        entryFee,
        paymentToken,
        participantCount,
      ] = await Promise.all([
        retryWithBackoff(() => rondaContract.currentState()),
        retryWithBackoff(() => rondaContract.participantCount()),
        retryWithBackoff(() => rondaContract.milestoneCount()),
        retryWithBackoff(() => rondaContract.monthlyDeposit()),
        retryWithBackoff(() => rondaContract.entryFee()),
        retryWithBackoff(() => rondaContract.paymentToken()),
        retryWithBackoff(() => rondaContract.participantCount()),
      ]);

      // Only fetch participants if there are any (avoid unnecessary calls)
      let joinedParticipantsPromise: string[] = [];
      if (Number(participantCount) > 0) {
        joinedParticipantsPromise = await retryWithBackoff(async () => {
          const participants: string[] = [];
          const maxToCheck = Math.min(Number(participantCount), 20); // Limit to prevent infinite loops
          
          for (let i = 0; i < maxToCheck; i++) {
            try {
              const participant = await rondaContract.joinedParticipants(i);
              if (!participant || participant === ethers.ZeroAddress) {
                break;
              }
              participants.push(participant);
            } catch {
              break;
            }
          }
          return participants;
        });
      }

      const isETH = paymentToken === ethers.ZeroAddress;
      let tokenSymbol = isETH ? 'ETH' : 'USDC';
      let tokenDecimals = isETH ? 18 : 6;

      // Only fetch token details if not ETH and we haven't cached them
      if (!isETH && (!tokenContractRef.current || tokenSymbol === 'USDC')) {
        try {
          tokenContractRef.current = new ethers.Contract(
            paymentToken,
            [
              'function symbol() view returns (string)',
              'function decimals() view returns (uint8)',
            ],
            provider
          ) as TokenContract;

          const tokenContract = tokenContractRef.current;
          if (tokenContract) {
            const [symbol, decimals] = await Promise.all([
              retryWithBackoff(async () => {
                const sym = await tokenContract.symbol();
                return sym || 'USDC';
              }),
              retryWithBackoff(async () => {
                const dec = await tokenContract.decimals();
                return Number(dec) || 6;
              }),
            ]);

            tokenSymbol = symbol;
            tokenDecimals = decimals;
          }
        } catch (err) {
          console.warn('Could not fetch token details, using defaults');
        }
      }

      const stateNumber = Number(currentState);
      const currentParticipantCount = joinedParticipantsPromise.length;
      const maxParticipantsNum = Number(maxParticipants);

      // Only fetch milestone data if there are milestones (avoid unnecessary calls)
      let milestones: Array<{
        index: number;
        isCompleted: boolean;
        totalDeposits: string;
        requiredDeposits: string;
      }> = [];
      if (Number(milestoneCount) > 0) {
        milestones = await retryWithBackoff(async () => {
          const result = [];
          const milestoneCountNum = Math.min(Number(milestoneCount), 12); // Limit to prevent excessive calls
          
          for (let i = 0; i < milestoneCountNum; i++) {
            try {
              const milestone = await rondaContract.milestones(i);
              if (!milestone) {
                break;
              }
              result.push({
                index: i,
                isCompleted: milestone[0],
                totalDeposits: milestone[1].toString(),
                requiredDeposits: milestone[2].toString(),
              });
            } catch (err) {
              console.warn(`Could not fetch milestone ${i}:`, err);
              break;
            }
          }
          return result;
        });
      }

      // Determine which participants list to use based on state
      const stateName = RONDA_STATES[stateNumber] || 'Unknown';

      // Format amounts based on token type
      const monthlyDepositFormatted = isETH
        ? parseFloat(ethers.formatEther(monthlyDeposit))
        : Number(monthlyDeposit) / Math.pow(10, tokenDecimals);

      const entryFeeFormatted = isETH
        ? parseFloat(ethers.formatEther(entryFee))
        : Number(entryFee) / Math.pow(10, tokenDecimals);

      const totalDepositedFormatted = 0; // totalDeposited not available in new ABI

      // Calculate derived values
      const availableSpots = maxParticipantsNum - currentParticipantCount;
      const totalContribution = monthlyDepositFormatted * maxParticipantsNum;
      const isActive = stateNumber === 0 || stateNumber === 1; // Open or Running

      // Calculate dates
      const creationDate = new Date(); // Default to now since creationTime is not available
      const nextRoundStart = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Mock: 30 days from now
      const startDate = creationDate;
      const duration = milestones.length;

      // Generate description and rules based on contract data
      const description = `RONDA Smart Contract with ${maxParticipantsNum} participants and ${monthlyDepositFormatted.toFixed(
        tokenDecimals === 18 ? 4 : 2
      )} ${tokenSymbol} monthly deposits`;
      const currency = tokenSymbol;
      const paymentSchedule =
        'Monthly contributions as defined by smart contract';
      const rules = [
        `Monthly contributions of ${monthlyDepositFormatted.toFixed(
          tokenDecimals === 18 ? 4 : 2
        )} ${tokenSymbol} required`,
        `Maximum ${maxParticipantsNum} participants allowed`,
        entryFeeFormatted > 0
          ? `Entry fee of ${entryFeeFormatted.toFixed(
              tokenDecimals === 18 ? 4 : 2
            )} ${tokenSymbol} required`
          : 'No entry fee required',
        isETH
          ? 'Payments made in native ETH'
          : `Payments made in ${tokenSymbol} tokens (approval required)`,
        'Smart contract automatically manages payments and distributions',
        'Milestone completion tracked on-chain',
        stateNumber === 0
          ? 'Currently accepting new participants'
          : 'Participation closed',
      ].filter(Boolean);

      const rondaData: SingleRondaData = {
        id: contractAddress, // Use contract address as ID
        address: contractAddress,
        state: stateName,
        stateNumber,
        participantCount: currentParticipantCount, // Current joined participants
        milestoneCount: milestones.length,
        monthlyDeposit: monthlyDeposit.toString(),
        monthlyDepositFormatted,
        entryFee: entryFee.toString(),
        entryFeeFormatted,
        paymentToken,
        participants: joinedParticipantsPromise, // Use joinedParticipants for states where slots are not yet assigned
        milestones,
        maxParticipants: maxParticipantsNum, // Max allowed participants
        isActive,
        nextRoundStart,
        duration,
        creator: undefined, // creator not available in new ABI
        creationTime: undefined, // creationTime not available in new ABI
        creationDate: undefined, // creationDate not available in new ABI
        lastMilestoneTime: undefined, // lastMilestoneTime not available in new ABI
        totalDeposited: undefined, // totalDeposited not available in new ABI
        totalDepositedFormatted: undefined, // totalDepositedFormatted not available in new ABI
        availableSpots,
        totalContribution,
        // UI compatibility properties
        description,
        currency,
        startDate,
        paymentSchedule,
        rules,
        // Token information
        isETH,
        tokenSymbol,
        tokenDecimals,
      };

      // Cache the result
      contractCache.set(contractAddress, {
        data: rondaData,
        timestamp: Date.now()
      });
      
      setRonda(rondaData);
    } catch (err: any) {
      console.error('Error fetching RONDA contract data:', err);
      setError(err.message || 'Failed to fetch RONDA contract data');
      
      // Clear refs on error to force re-initialization
      contractRef.current = null;
      tokenContractRef.current = null;
      providerInstance = null;
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress]);

  const debouncedFetch = useCallback(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    fetchTimeoutRef.current = setTimeout(fetchRondaData, 1000);
  }, [fetchRondaData]);

  useEffect(() => {
    debouncedFetch();
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [debouncedFetch]);

  const refetch = useCallback(async (): Promise<void> => {
    contractCache.delete(contractAddress);
    contractRef.current = null;
    tokenContractRef.current = null;
    providerInstance = null;
    await fetchRondaData();
  }, [fetchRondaData, contractAddress]);

  return {
    ronda,
    isLoading,
    error,
    refetch,
  };
}
