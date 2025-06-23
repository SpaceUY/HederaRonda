'use client';

import { ethers } from 'ethers';
import { useState, useEffect } from 'react';

import { RONDA_ABI, FACTORY_ABI, CONTRACT_ADDRESSES, NETWORK_CONFIG, RONDA_STATES } from '@/lib/contracts';

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

export function useRondaContracts(): UseRondaContractsReturn {
  const [rondas, setRondas] = useState<RondaContractData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRondaData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔗 Connecting to Sepolia network via proxy...');
      console.log('🌐 Using RPC URL:', NETWORK_CONFIG.SEPOLIA.rpcUrl);
      console.log('🔄 Using Proxy Factory Address:', CONTRACT_ADDRESSES.PROXY_FACTORY);
      
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

      // Create proxy factory contract instance
      const proxyFactoryContract = new ethers.Contract(CONTRACT_ADDRESSES.PROXY_FACTORY, FACTORY_ABI, provider);
      
      console.log('📋 Fetching RONDA instances from proxy factory...');
      
      // Get all RONDA instances through proxy
      const rondaCount = await proxyFactoryContract.getRondaCount();
      console.log(`📊 Found ${rondaCount} RONDA instances via proxy`);

      if (Number(rondaCount) === 0) {
        console.log('ℹ️ No RONDA instances found via proxy');
        setRondas([]);
        return;
      }

      const rondaInstances = await proxyFactoryContract.getRondaInstances();
      console.log('🏭 RONDA instances via proxy:', rondaInstances);

      // Fetch data for each RONDA instance
      const rondaDataPromises = rondaInstances.map(async (address: string, index: number) => {
        try {
          console.log(`🔍 Fetching data for RONDA ${index + 1}: ${address}`);
          
          const rondaContract = new ethers.Contract(address, RONDA_ABI, provider);
          
          // Fetch basic contract data
          const [
            currentState,
            maxParticipants, // participantCount is the max allowed
            milestoneCount,
            monthlyDeposit,
            entryFee,
            paymentToken
          ] = await Promise.all([
            rondaContract.currentState(),
            rondaContract.participantCount(), // This is max participants
            rondaContract.milestoneCount(),
            rondaContract.monthlyDeposit(),
            rondaContract.entryFee(),
            rondaContract.paymentToken()
          ]);

          // Get current joined participants using joinedParticipants array
          const joinedParticipants: string[] = [];
          let currentParticipantCount = 0;

          try {
            // Try to get the length of joinedParticipants array by calling indices until we get an error
            let i = 0;
            while (true) {
              try {
                const participant = await rondaContract.joinedParticipants(i);
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

          // If the round is active (not Open or Randomizing), use slotToParticipant for assigned slots
          const stateNumber = Number(currentState);
          let participants: string[] = [];

          if (stateNumber === 1 || stateNumber === 2) { // Running or Finalized
            // Use slotToParticipant for assigned participants
            const maxParticipantsNum = Number(maxParticipants);
            for (let i = 0; i < maxParticipantsNum; i++) {
              try {
                const participant = await rondaContract.slotToParticipant(i);
                if (participant !== ethers.ZeroAddress) {
                  participants.push(participant);
                }
              } catch (err) {
                console.warn(`⚠️ Could not fetch participant slot ${i}:`, err);
              }
            }
          } else {
            // Use joinedParticipants for Open or Randomizing states
            participants = joinedParticipants;
          }

          // Fetch milestones
          const milestones: any[] = [];
          const milestoneCountNum = Number(milestoneCount);
          
          for (let i = 0; i < milestoneCountNum; i++) {
            try {
              const milestone = await rondaContract.milestones(i);
              milestones.push({
                index: i,
                isCompleted: milestone[0],
                totalDeposits: milestone[1].toString(),
                requiredDeposits: milestone[2].toString()
              });
            } catch (err) {
              console.warn(`⚠️ Could not fetch milestone ${i}:`, err);
            }
          }

          const stateName = RONDA_STATES[stateNumber] || 'Unknown';
          
          // Format amounts from wei to ether
          const monthlyDepositFormatted = parseFloat(ethers.formatEther(monthlyDeposit));
          const entryFeeFormatted = parseFloat(ethers.formatEther(entryFee));

          // Calculate derived values
          const maxParticipantsNum = Number(maxParticipants);
          const availableSpots = maxParticipantsNum - currentParticipantCount;
          const isActive = stateNumber === 0 || stateNumber === 1; // Open or Running
          const nextRoundStart = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // Mock: 30 days from now
          const duration = milestoneCountNum; // Duration equals milestone count

          const rondaData: RondaContractData = {
            address,
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
            availableSpots
          };

          console.log(`✅ RONDA ${index + 1} data via proxy:`, {
            address: rondaData.address,
            state: rondaData.state,
            participants: `${rondaData.participantCount}/${rondaData.maxParticipants}`,
            availableSpots: rondaData.availableSpots,
            monthlyDeposit: `${rondaData.monthlyDepositFormatted} ETH`,
            entryFee: `${rondaData.entryFeeFormatted} ETH`,
          });

          return rondaData;
        } catch (err: any) {
          console.error(`❌ Error fetching RONDA ${index + 1} data:`, err);
          return null;
        }
      });

      const rondaDataResults = await Promise.all(rondaDataPromises);
      const validRondas = rondaDataResults.filter((ronda): ronda is RondaContractData => ronda !== null);
      
      console.log(`✅ Successfully fetched ${validRondas.length} RONDA instances via proxy`);
      setRondas(validRondas);

    } catch (err: any) {
      console.error('❌ Error fetching RONDA contract data via proxy:', err);
      setError(err.message || 'Failed to fetch RONDA data via proxy');
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = async (): Promise<void> => {
    await fetchRondaData();
  };

  useEffect(() => {
    fetchRondaData();
  }, []);

  return {
    rondas,
    isLoading,
    error,
    refetch
  };
}