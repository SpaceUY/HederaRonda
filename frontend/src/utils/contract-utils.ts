import { RONDA_SENDER_ABI } from '@/constants/abis/ronda-sender-abi';
import { RONDA_ABI } from '@/lib/contracts';

interface ContractJoinConfig {
  address: string;
  abi: typeof RONDA_ABI;
  functionName: string;
  args: unknown[];
}

interface ContractConfig {
  address: string;
  abi: unknown;
  functionName: string;
  args: unknown[];
}

function needsCrossChainCommunication(userChainId: number, targetChainId: number): boolean {
  return userChainId !== targetChainId;
}

export function getContractJoinConfig(
  _userChainId: number,
  _targetChainId: number,
  roscaContractAddress: string,
  _spenderAddress: string,
  _paymentToken: string,
  _totalRequiredAmount: bigint
): ContractJoinConfig {
  return {
    address: roscaContractAddress,
    abi: RONDA_ABI,
    functionName: 'joinRonda',
    args: []
  };
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
    return {
      address: contractAddress,
      abi: RONDA_SENDER_ABI,
      functionName: 'deposit',
      args: [targetContractAddress as `0x${string}`, BigInt(milestone), paymentToken as `0x${string}`, amount]
    };
  } else {
    return {
      address: targetContractAddress,
      abi: RONDA_ABI,
      functionName: 'deposit',
      args: [BigInt(milestone)]
    };
  }
} 