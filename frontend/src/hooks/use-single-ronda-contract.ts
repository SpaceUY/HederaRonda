'use client';

import { ethers } from 'ethers';
import { useState, useEffect } from 'react';

import { RONDA_ABI, NETWORK_CONFIG, RONDA_STATES } from '@/lib/contracts';

export interface SingleRondaData {
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
  creator?: string;
  creationTime?: number;
  creationDate?: Date;
  lastMilestoneTime?: number;
  totalDeposited?: string;
  totalDepositedFormatted?: number;
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

export function useSingleRondaContract(contractAddress: string): UseSingleRondaContractReturn {
  const [ronda, setRonda] = useState<SingleRondaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRondaData = async (): Promise<void> => {
    if (!contractAddress || !ethers.isAddress(contractAddress)) {
      setError('Invalid contract address');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔗 Connecting to Sepolia network for contract:', contractAddress);
      console.log('🌐 Using RPC URL:', NETWORK_CONFIG.SEPOLIA.rpcUrl);
      
      // Create provider for Sepolia
      const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.SEPOLIA.rpcUrl);
      
      // Test network connection
      const network = await provider.getNetwork();
      console.log('🌐 Connected to network:', {
        name: network.name,
        chainId: Number(network.chainId),
      });

      if (Number(network.chainId) !== NETWORK_CONFIG.SEPOLIA.chainId) {
        throw new Error(`Wrong network. Expected Sepolia (${NETWORK_CONFIG.SEPOLIA.chainId}), got ${Number(network.chainId)}`);
      }

      // Create RONDA contract instance
      const rondaContract = new ethers.Contract(contractAddress, RONDA_ABI, provider);
      
      console.log('📋 Fetching RONDA contract data...');
      
      // Fetch basic contract data
      const [
        currentState,
        maxParticipants, // participantCount is the max allowed
        milestoneCount,
        monthlyDeposit,
        entryFee,
        paymentToken
      ] = await Promise.all([
        rondaContract?.currentState?.(),
        rondaContract?.participantCount?.(), // This is max participants
        rondaContract?.milestoneCount?.(),
        rondaContract?.monthlyDeposit?.(),
        rondaContract?.entryFee?.(),
        rondaContract?.paymentToken?.()
      ]);

      // Determine if using ETH or ERC20
      const isETH = paymentToken === ethers.ZeroAddress;
      let tokenSymbol = 'USDC';
      let tokenDecimals = 6;

      if (isETH) {
        tokenSymbol = 'ETH';
        tokenDecimals = 18;
      } else {
        // Try to get token symbol and decimals
        try {
          const tokenContract = new ethers.Contract(paymentToken, [
            'function symbol() view returns (string)',
            'function decimals() view returns (uint8)'
          ], provider);
          
          const [symbol, decimals] = await Promise.all([
            tokenContract?.symbol?.(),
            tokenContract?.decimals?.()
          ]);
          
          tokenSymbol = symbol;
          tokenDecimals = Number(decimals);
        } catch (err) {
          console.warn('Could not fetch token details, using defaults');
        }
      }

      // Try to fetch additional data (these might not exist in all contracts)
      let creator, creationTime, lastMilestoneTime, totalDeposited;
      try {
        [creator, creationTime, lastMilestoneTime, totalDeposited] = await Promise.all([
          rondaContract?.owner?.().catch(() => null),
          Promise.resolve(null), // creationTime not available in new ABI
          Promise.resolve(null), // lastMilestoneTime not available in new ABI
          Promise.resolve(null)  // totalDeposited not available in new ABI
        ]);
      } catch (err) {
        console.log('ℹ️ Some optional contract methods not available');
      }

      // Get current joined participants using joinedParticipants array
      const joinedParticipants: string[] = [];
      let currentParticipantCount = 0;

      try {
        // Try to get the length of joinedParticipants array by calling indices until we get an error
        let i = 0;
        while (true) {
          try {
            const participant = await rondaContract?.joinedParticipants?.(i);
            if (participant !== ethers.ZeroAddress) {
              joinedParticipants.push(participant);
              currentParticipantCount++;
            }
            i++;
          } catch (err) {
            // No more participants
            break;
          }
        }
      } catch (err) {
        console.warn(`⚠️ Could not fetch joined participants:`, err);
      }

      // Determine which participants list to use based on state
      const stateNumber = Number(currentState);
      let participants: string[] = [];

      if (stateNumber === 0 || stateNumber === 4) { // Open or Randomizing
        // Use joinedParticipants for states where slots are not yet assigned
        participants = joinedParticipants;
      } else {
        // Use slotToParticipant for assigned participants (Running, Finalized, Aborted)
        const maxParticipantsNum = Number(maxParticipants);
        for (let i = 0; i < maxParticipantsNum; i++) {
          try {
            const participant = await rondaContract?.slotToParticipant?.(i);
            if (participant !== ethers.ZeroAddress) {
              participants.push(participant);
            }
          } catch (err) {
            console.warn(`⚠️ Could not fetch participant slot ${i}:`, err);
          }
        }
      }

      // Fetch milestones
      const milestones: Array<{
        index: number;
        isCompleted: boolean;
        totalDeposits: string;
        requiredDeposits: string;
        date?: Date;
      }> = [];
      const milestoneCountNum = Number(milestoneCount);
      
      for (let i = 0; i < milestoneCountNum; i++) {
        try {
          const milestone = await rondaContract?.milestones?.(i);
          milestones.push({
            index: i,
            isCompleted: milestone[0],
            totalDeposits: milestone[1].toString(),
            requiredDeposits: milestone[2].toString(),
             // Date calculation would need additional logic
          });
        } catch (err) {
          console.warn(`⚠️ Could not fetch milestone ${i}:`, err);
        }
      }

      const stateName = RONDA_STATES[stateNumber] || 'Unknown';
      
      // Format amounts based on token type
      const monthlyDepositFormatted = isETH 
        ? parseFloat(ethers.formatEther(monthlyDeposit))
        : Number(monthlyDeposit) / Math.pow(10, tokenDecimals);
      
      const entryFeeFormatted = isETH 
        ? parseFloat(ethers.formatEther(entryFee))
        : Number(entryFee) / Math.pow(10, tokenDecimals);
      
      const totalDepositedFormatted = totalDeposited 
        ? (isETH 
          ? parseFloat(ethers.formatEther(totalDeposited))
          : Number(totalDeposited) / Math.pow(10, tokenDecimals))
        : 0;

      // Calculate derived values
      const maxParticipantsNum = Number(maxParticipants);
      const availableSpots = maxParticipantsNum - currentParticipantCount;
      const totalContribution = monthlyDepositFormatted * maxParticipantsNum;
      const isActive = stateNumber === 0 || stateNumber === 1; // Open or Running
      
      // Calculate dates
      const creationDate = creationTime ? new Date(Number(creationTime) * 1000) : new Date();
      const nextRoundStart = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // Mock: 30 days from now
      const startDate = creationDate;
      const duration = milestoneCountNum;

      // Generate description and rules based on contract data
      const description = `RONDA Smart Contract with ${maxParticipantsNum} participants and ${monthlyDepositFormatted.toFixed(tokenDecimals === 18 ? 4 : 2)} ${tokenSymbol} monthly deposits`;
      const currency = tokenSymbol;
      const paymentSchedule = 'Monthly contributions as defined by smart contract';
      const rules = [
        `Monthly contributions of ${monthlyDepositFormatted.toFixed(tokenDecimals === 18 ? 4 : 2)} ${tokenSymbol} required`,
        `Maximum ${maxParticipantsNum} participants allowed`,
        entryFeeFormatted > 0 ? `Entry fee of ${entryFeeFormatted.toFixed(tokenDecimals === 18 ? 4 : 2)} ${tokenSymbol} required` : 'No entry fee required',
        isETH ? 'Payments made in native ETH' : `Payments made in ${tokenSymbol} tokens (approval required)`,
        'Smart contract automatically manages payments and distributions',
        'Milestone completion tracked on-chain',
        stateNumber === 0 ? 'Currently accepting new participants' : 'Participation closed'
      ].filter(Boolean);

      const rondaData: SingleRondaData = {
        address: contractAddress,
        state: stateName,
        stateNumber,
        participantCount: currentParticipantCount, // Current joined participants
        milestoneCount: milestoneCountNum,
        monthlyDeposit: monthlyDeposit.toString(),
        monthlyDepositFormatted,
        entryFee: entryFee.toString(),
        entryFeeFormatted,
        paymentToken,
        participants,
        milestones,
        maxParticipants: maxParticipantsNum, // Max allowed participants
        isActive,
        nextRoundStart,
        duration,
        creator,
        creationTime: creationTime ? Number(creationTime) : 0,
        creationDate,
        lastMilestoneTime: lastMilestoneTime ? Number(lastMilestoneTime) : 0,
        totalDeposited: totalDeposited ? (totalDeposited as bigint).toString() : '0',
        totalDepositedFormatted,
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
        tokenDecimals
      };

      console.log('✅ RONDA contract data fetched:', {
        address: rondaData.address,
        state: rondaData.state,
        participants: `${rondaData.participantCount}/${rondaData.maxParticipants}`,
        availableSpots: rondaData.availableSpots,
        monthlyDeposit: `${rondaData.monthlyDepositFormatted} ${rondaData.tokenSymbol}`,
        entryFee: `${rondaData.entryFeeFormatted} ${rondaData.tokenSymbol}`,
        milestones: rondaData.milestoneCount,
        isETH: rondaData.isETH,
        tokenSymbol: rondaData.tokenSymbol,
        tokenDecimals: rondaData.tokenDecimals
      });

      setRonda(rondaData);

    } catch (err: any) {
      console.error('❌ Error fetching RONDA contract data:', err);
      setError(err.message || 'Failed to fetch RONDA contract data');
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async (): Promise<void> => {
    await fetchRondaData();
  };

  useEffect(() => {
    fetchRondaData();
  }, [contractAddress]);

  return {
    ronda,
    isLoading,
    error,
    refetch
  };
}