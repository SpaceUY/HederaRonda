'use client';

import {
  CONTRACT_ADDRESSES,
  NETWORK_CONFIG,
  RONDA_ABI,
  RONDA_STATES,
} from '@/lib/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';

import { RONDA_FACTORY_ABI } from '@/constants/abis/ronda-factory-abi';
import { ethers } from 'ethers';

export interface RondaContractData {
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
  paymentTokenSymbol: string; // Add token symbol
  participants: string[];
  milestones: any[];
  maxParticipants: number; // Total allowed participants from participantCount
  isActive: boolean;
  nextRoundStart: Date;
  duration: number;
  availableSpots: number;
}

interface UseRondaContractsReturn {
  rondas: RondaContractData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Cache provider instance
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

// Define contract types
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

// Cache for token details
const tokenDetailsCache = new Map<string, { symbol: string; decimals: number }>();

export function useRondaContracts(): UseRondaContractsReturn {
  const [rondas, setRondas] = useState<RondaContractData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use refs to store contract instances
  const factoryContractRef = useRef<ethers.Contract | null>(null);
  const rondaContractsRef = useRef<Map<string, RondaContract>>(new Map());
  const tokenContractsRef = useRef<Map<string, TokenContract>>(new Map());

  // Debounce the fetch
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchRondaData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const provider = await retryWithBackoff(getProvider);

      // Initialize factory contract if needed
      if (!factoryContractRef.current) {
        factoryContractRef.current = new ethers.Contract(
          CONTRACT_ADDRESSES.PROXY_FACTORY,
          RONDA_FACTORY_ABI,
          provider
        );
      }

      const factoryContract = factoryContractRef.current;
      if (!factoryContract) {
        throw new Error('Failed to initialize factory contract');
      }

      // Get all RONDA instances through proxy
      const [rondaCount, rondaInstances] = await Promise.all([
        retryWithBackoff(() => (factoryContract as any).getRondaCount()),
        retryWithBackoff(() => (factoryContract as any).getRondaInstances()),
      ]) as [bigint, string[]];

      if (Number(rondaCount) === 0) {
        setRondas([]);
        return;
      }

      // Fetch data for each RONDA instance
      const rondaDataPromises = rondaInstances.map(async (address: string) => {
        try {
          // Get or create RONDA contract instance
          let rondaContract = rondaContractsRef.current.get(address);
          if (!rondaContract) {
            rondaContract = new ethers.Contract(
              address,
              RONDA_ABI,
              provider
            ) as RondaContract;
            rondaContractsRef.current.set(address, rondaContract);
          }

          // Batch fetch basic contract data
          const [
            currentState,
            maxParticipants,
            milestoneCount,
            monthlyDeposit,
            entryFee,
            paymentToken,
            joinedParticipantsPromise,
          ] = await Promise.all([
            retryWithBackoff(() => rondaContract!.currentState()),
            retryWithBackoff(() => rondaContract!.participantCount()),
            retryWithBackoff(() => rondaContract!.milestoneCount()),
            retryWithBackoff(() => rondaContract!.monthlyDeposit()),
            retryWithBackoff(() => rondaContract!.entryFee()),
            retryWithBackoff(() => rondaContract!.paymentToken()),
            retryWithBackoff(async () => {
              const participants: string[] = [];
              let i = 0;
              while (true) {
                try {
                  const participant = await rondaContract!.joinedParticipants(i);
                  if (!participant || participant === ethers.ZeroAddress) {
                    break;
                  }
                  participants.push(participant);
                  i++;
                } catch {
                  break;
                }
              }
              return participants;
            }),
          ]);

          const isETH = paymentToken === ethers.ZeroAddress;
          let tokenSymbol = isETH ? 'ETH' : 'USDC';
          let tokenDecimals = isETH ? 18 : 6;

          // Check cache first for token details
          if (!isETH) {
            const cachedDetails = tokenDetailsCache.get(paymentToken);
            if (cachedDetails) {
              tokenSymbol = cachedDetails.symbol;
              tokenDecimals = cachedDetails.decimals;
            } else {
              // Only fetch token details if not in cache
              try {
                let tokenContract = tokenContractsRef.current.get(paymentToken);
                if (!tokenContract) {
                  tokenContract = new ethers.Contract(
                    paymentToken,
                    [
                      'function symbol() view returns (string)',
                      'function decimals() view returns (uint8)',
                    ],
                    provider
                  ) as TokenContract;
                  tokenContractsRef.current.set(paymentToken, tokenContract);
                }

                const [symbol, decimals] = await Promise.all([
                  retryWithBackoff(async () => {
                    const sym = await tokenContract!.symbol();
                    return sym || 'USDC';
                  }),
                  retryWithBackoff(async () => {
                    const dec = await tokenContract!.decimals();
                    return Number(dec) || 6;
                  }),
                ]);

                tokenSymbol = symbol;
                tokenDecimals = decimals;

                // Cache the token details
                tokenDetailsCache.set(paymentToken, { symbol, decimals });
              } catch (err) {
                console.warn('Could not fetch token details, using defaults');
              }
            }
          }

          const stateNumber = Number(currentState);
          const currentParticipantCount = joinedParticipantsPromise.length;
          const maxParticipantsNum = Number(maxParticipants);

          // Only fetch milestone data if needed
          const milestones = await retryWithBackoff(async () => {
            const result = [];
            const milestoneCountNum = Number(milestoneCount);
            for (let i = 0; i < milestoneCountNum; i++) {
              try {
                const milestone = await rondaContract!.milestones(i);
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

          const stateName = RONDA_STATES[stateNumber] || 'Unknown';

          // Format amounts based on token type
          const monthlyDepositFormatted = isETH
            ? parseFloat(ethers.formatEther(monthlyDeposit))
            : Number(monthlyDeposit) / Math.pow(10, tokenDecimals);

          const entryFeeFormatted = isETH
            ? parseFloat(ethers.formatEther(entryFee))
            : Number(entryFee) / Math.pow(10, tokenDecimals);

          // Calculate derived values
          const availableSpots = maxParticipantsNum - currentParticipantCount;
          const isActive = stateNumber === 0 || stateNumber === 1; // Open or Running
          const nextRoundStart = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Mock: 30 days from now

          return {
            address,
            state: stateName,
            stateNumber,
            participantCount: currentParticipantCount,
            milestoneCount: milestones.length,
            monthlyDeposit: monthlyDeposit.toString(),
            monthlyDepositFormatted,
            entryFee: entryFee.toString(),
            entryFeeFormatted,
            paymentToken,
            paymentTokenSymbol: tokenSymbol,
            participants: joinedParticipantsPromise,
            milestones,
            maxParticipants: maxParticipantsNum,
            isActive,
            nextRoundStart,
            duration: milestones.length,
            availableSpots,
          };
        } catch (err: any) {
          console.error(`Error fetching RONDA ${address} data:`, err);
          return null;
        }
      });

      const rondaDataResults = await Promise.all(rondaDataPromises);
      const validRondas = rondaDataResults.filter(
        (ronda): ronda is RondaContractData => ronda !== null
      );

      setRondas(validRondas);
    } catch (err: any) {
      console.error('Error fetching RONDA contract data:', err);
      setError(err.message || 'Failed to fetch RONDA contract data');
      
      // Clear refs on error to force re-initialization
      factoryContractRef.current = null;
      rondaContractsRef.current.clear();
      tokenContractsRef.current.clear();
      providerInstance = null;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    // Clear cache on manual refetch
    factoryContractRef.current = null;
    rondaContractsRef.current.clear();
    tokenContractsRef.current.clear();
    tokenDetailsCache.clear();
    await fetchRondaData();
  }, [fetchRondaData]);

  return {
    rondas,
    isLoading,
    error,
    refetch,
  };
}
