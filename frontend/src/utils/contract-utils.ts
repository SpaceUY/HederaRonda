import { RONDA_SENDER_ABI } from '@/constants/abis/ronda-sender-abi';
import { needsCrossChainCommunication } from '@/constants/ccip-config';
import { RONDA_ABI } from '@/lib/contracts';

export interface ContractConfig {
  address: string;
  abi: any;
  functionName: string;
  args: any[];
}

export function getContractJoinConfig(
  userChainId: number,
  targetChainId: number,
  targetContractAddress: string,
  contractAddress: string,
  paymentToken: string,
  amount: bigint
): ContractConfig {
  const isCrossChain = needsCrossChainCommunication(userChainId, targetChainId);
  
  if (isCrossChain) {
    // Use RondaSender for cross-chain communication
    return {
      address: contractAddress,
      abi: RONDA_SENDER_ABI,
      functionName: 'joinRonda',
      args: [targetContractAddress as `0x${string}`, paymentToken as `0x${string}`, amount]
    };
  } else {
    // Use direct Ronda contract for same-chain communication
    return {
      address: targetContractAddress,
      abi: RONDA_ABI,
      functionName: 'joinRonda',
      args: []
    };
  }
}

export function getContractDepositConfig(
  userChainId: number,
  targetChainId: number,
  targetContractAddress: string,
  contractAddress: string,
  milestone: number,
  paymentToken: string,
  amount: bigint
): ContractConfig {
  const isCrossChain = needsCrossChainCommunication(userChainId, targetChainId);
  
  if (isCrossChain) {
    // Use RondaSender for cross-chain communication
    return {
      address: contractAddress,
      abi: RONDA_SENDER_ABI,
      functionName: 'deposit',
      args: [targetContractAddress as `0x${string}`, BigInt(milestone), paymentToken as `0x${string}`, amount]
    };
  } else {
    // Use direct Ronda contract for same-chain communication
    return {
      address: targetContractAddress,
      abi: RONDA_ABI,
      functionName: 'deposit',
      args: [BigInt(milestone)]
    };
  }
} 