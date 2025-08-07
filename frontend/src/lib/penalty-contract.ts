import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from './contracts';

import { ethers } from 'ethers';

// Penalty Token Contract Configuration (RondaSBT - ERC721 Soulbound Token)
export const PENALTY_CONTRACT = {
  address: CONTRACT_ADDRESSES.PENALTY_TOKEN,
  abi: [
    'function hasPenalty(address owner) view returns (bool)',
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function totalSupply() view returns (uint256)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  ],
  network: 'hedera-testnet',
} as const;

// Track if we've logged a clean penalty check to reduce spam
let hasLoggedCleanCheck = false;

export interface PenaltyCheckResult {
  hasPenalties: boolean;
  penaltyCount: number;
  error?: string;
  isLoading: boolean;
}

/**
 * Check if a wallet address has penalty tokens
 */
export async function checkPenaltyTokens(
  walletAddress: string
): Promise<PenaltyCheckResult> {
  try {
    console.log('🔍 Checking penalty tokens for address:', walletAddress);

    // Validate address format
    if (!ethers.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address format');
    }

    // Create provider for Hedera Testnet
    const provider = new ethers.JsonRpcProvider(
      NETWORK_CONFIG.HEDERA.rpcUrl
    );

    // Test network connection
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== NETWORK_CONFIG.HEDERA.chainId) {
      throw new Error(
        `Wrong network. Expected Hedera Testnet (${
          NETWORK_CONFIG.HEDERA.chainId
        }), got ${Number(network.chainId)}`
      );
    }

    // Create penalty contract instance
    const penaltyContract = new ethers.Contract(
      PENALTY_CONTRACT.address,
      PENALTY_CONTRACT.abi,
      provider
    );

    console.log('📋 Calling hasPenalty for penalty tokens...');

    // Check if address has penalty tokens (RondaSBT is a soulbound token)
    const hasPenalty = await penaltyContract?.hasPenalty?.(walletAddress);
    const penaltyCount = hasPenalty ? 1 : 0; // RondaSBT can only have 0 or 1 penalty token

    const result = {
      address: walletAddress,
      penaltyCount,
      hasPenalties: hasPenalty || false,
      isLoading: false,
    };

    // Only log if there are penalties or on first check
    if (result.hasPenalties || !hasLoggedCleanCheck) {
      console.log('✅ Penalty token check result:', result);
      if (!result.hasPenalties) {
        hasLoggedCleanCheck = true;
      }
    }

    return result;
  } catch (error: any) {
    console.error('❌ Error checking penalty tokens:', error);

    return {
      hasPenalties: false,
      penaltyCount: 0,
      error: error.message || 'Failed to check penalty tokens',
      isLoading: false,
    };
  }
}

/**
 * Get penalty contract information
 */
export async function getPenaltyContractInfo(): Promise<{
  name?: string;
  symbol?: string;
  totalSupply?: number;
  error?: string;
}> {
  try {
    const provider = new ethers.JsonRpcProvider(
      NETWORK_CONFIG.HEDERA.rpcUrl
    );

    const penaltyContract = new ethers.Contract(
      PENALTY_CONTRACT.address,
      PENALTY_CONTRACT.abi,
      provider
    );

    const [name, symbol, totalSupply] = await Promise.all([
      penaltyContract?.name?.().catch(() => 'Unknown'),
      penaltyContract?.symbol?.().catch(() => 'PENALTY'),
      penaltyContract?.totalSupply?.().catch(() => 0n),
    ]);

    return {
      name,
      symbol,
      totalSupply: Number(totalSupply),
    };
  } catch (error: any) {
    console.error('❌ Error getting penalty contract info:', error);
    return {
      error: error.message || 'Failed to get contract information',
    };
  }
}