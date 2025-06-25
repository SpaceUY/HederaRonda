import { ethers } from 'ethers';

import { NETWORK_CONFIG } from './contracts';

// Penalty Token Contract Configuration
export const PENALTY_CONTRACT = {
  address: '0xac9be968f4845c14f52e3874ccb6515f8ad45e68',
  abi: [
    'function balanceOf(address owner) view returns (uint256)',
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function totalSupply() view returns (uint256)',
  ],
  network: 'sepolia',
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

    // Create provider for Sepolia
    const provider = new ethers.JsonRpcProvider(
      NETWORK_CONFIG.SEPOLIA.rpcUrl
    );

    // Test network connection
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== NETWORK_CONFIG.SEPOLIA.chainId) {
      throw new Error(
        `Wrong network. Expected Sepolia (${
          NETWORK_CONFIG.SEPOLIA.chainId
        }), got ${Number(network.chainId)}`
      );
    }

    // Create penalty contract instance
    const penaltyContract = new ethers.Contract(
      PENALTY_CONTRACT.address,
      PENALTY_CONTRACT.abi,
      provider
    );

    console.log('📋 Calling balanceOf for penalty tokens...');

    // Check penalty token balance
    const balance = await penaltyContract?.balanceOf?.(walletAddress);
    const penaltyCount = Number(balance);

    const result = {
      address: walletAddress,
      penaltyCount,
      hasPenalties: penaltyCount > 0,
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
      NETWORK_CONFIG.SEPOLIA.rpcUrl
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