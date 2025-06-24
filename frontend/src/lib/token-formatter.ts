import { ethers } from 'ethers';

import { NETWORK_CONFIG } from './contracts';

// Token information cache
interface TokenInfo {
  symbol: string;
  decimals: number;
  address: string;
}

interface PaymentTokenCache {
  [contractAddress: string]: TokenInfo;
}

interface EntryFeeCache {
  [contractAddress: string]: {
    amount: string;
    formatted: string;
  };
}

// Global caches to avoid repeated contract calls
const paymentTokenCache: PaymentTokenCache = {};
const entryFeeCache: EntryFeeCache = {};

// Standard ERC20 ABI for token info
const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
] as const;

// RONDA contract ABI for payment token and entry fee
const RONDA_TOKEN_ABI = [
  'function paymentToken() view returns (address)',
  'function entryFee() view returns (uint256)',
] as const;

export class TokenFormatter {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.SEPOLIA.rpcUrl);
  }

  /**
   * Get token information directly from an ERC20 token address
   */
  async getTokenInfoFromAddress(tokenAddress: string): Promise<TokenInfo> {
    // Check cache first using token address as key
    if (paymentTokenCache[tokenAddress]) {
      console.log('📋 Using cached token info for address:', tokenAddress);
      return paymentTokenCache[tokenAddress] || {
        symbol: 'MTK',
        decimals: 6,
        address: '0x0000000000000000000000000000000000000000',
      };
    }

    try {
      console.log('🔍 Fetching token info for address:', tokenAddress);

      // Check if it's ETH (zero address)
      if (tokenAddress === ethers.ZeroAddress) {
        const tokenInfo: TokenInfo = {
          symbol: 'ETH',
          decimals: 18,
          address: ethers.ZeroAddress,
        };
        
        // Cache the result
        paymentTokenCache[tokenAddress] = tokenInfo;
        console.log('✅ ETH token info cached');
        
        return tokenInfo;
      }

      // Get token symbol and decimals from ERC20 contract
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        this.provider
      );

      const [symbol, decimals] = await Promise.all([
        tokenContract?.symbol?.(),
        tokenContract?.decimals?.(),
      ]);

      const tokenInfo: TokenInfo = {
        symbol,
        decimals: Number(decimals),
        address: tokenAddress,
      };

      // Cache the result
      paymentTokenCache[tokenAddress] = tokenInfo;
      
      console.log('✅ Token info cached:', {
        address: tokenAddress,
        symbol,
        decimals: Number(decimals),
      });

      return tokenInfo;
    } catch (error: any) {
      console.error('❌ Error fetching token info from address:', error);
      
      // Fallback to MTK defaults
      const fallbackInfo: TokenInfo = {
        symbol: 'MTK',
        decimals: 6,
        address: tokenAddress,
      };
      
      paymentTokenCache[tokenAddress] = fallbackInfo;
      return fallbackInfo;
    }
  }

  /**
   * Get payment token information from a RONDA contract
   */
  async getPaymentTokenInfo(contractAddress: string): Promise<TokenInfo> {
    // Check cache first
    if (paymentTokenCache[contractAddress]) {
      console.log('📋 Using cached payment token info for:', contractAddress);
      return paymentTokenCache[contractAddress] || {
        symbol: 'MTK',
        decimals: 6,
        address: '0x0000000000000000000000000000000000000000',
      };
    }

    try {
      console.log('🔍 Fetching payment token info for contract:', contractAddress);

      // Get payment token address from RONDA contract
      const rondaContract = new ethers.Contract(
        contractAddress,
        RONDA_TOKEN_ABI,
        this.provider
      );

      const paymentTokenAddress = await rondaContract?.paymentToken?.();
      console.log('💰 Payment token address:', paymentTokenAddress);

      // Use the direct token info method
      const tokenInfo = await this.getTokenInfoFromAddress(paymentTokenAddress);

      // Cache the result using the RONDA contract address as key
      paymentTokenCache[contractAddress] = tokenInfo;
      
      console.log('✅ Payment token info cached for RONDA:', {
        contract: contractAddress,
        tokenInfo,
      });

      return tokenInfo;
    } catch (error: any) {
      console.error('❌ Error fetching payment token info:', error);
      
      // Fallback to MTK defaults
      const fallbackInfo: TokenInfo = {
        symbol: 'MTK',
        decimals: 6,
        address: '0x0000000000000000000000000000000000000000',
      };
      
      paymentTokenCache[contractAddress] = fallbackInfo;
      return fallbackInfo;
    }
  }

  /**
   * Format a raw token amount with proper decimals and symbol
   * Adjusted to show only the first significant digit for cleaner display
   */
  formatAmount(rawAmount: string | bigint, decimals: number, symbol: string): string {
    try {
      const amount = typeof rawAmount === 'string' ? BigInt(rawAmount) : rawAmount;
      const divisor = BigInt(10 ** decimals);
      const formatted = Number(amount) / Number(divisor);

      // Format based on token type and amount size
      if (symbol === 'ETH') {
        if (formatted < 0.0001) {
          // For very small amounts, show in milliETH with minimal decimals
          const milliEth = formatted * 1000;
          return `${this.formatToSignificantDigits(milliEth, 1)} mETH`;
        }
        // For ETH, show minimal decimals but preserve precision
        return `${this.formatToSignificantDigits(formatted, 3)} ${symbol}`;
      } else {
        // For MTK and other tokens
        if (formatted < 0.01) {
          // For very small amounts, show more precision
          return `${this.formatToSignificantDigits(formatted, 4)} ${symbol}`;
        }
        // For normal amounts, show 2 decimal places
        return `${this.formatToSignificantDigits(formatted, 2)} ${symbol}`;
      }
    } catch (error) {
      console.error('❌ Error formatting amount:', error);
      return `0 ${symbol}`;
    }
  }

  /**
   * Format number to show only significant digits without trailing zeros
   */
  private formatToSignificantDigits(num: number, maxDecimals: number): string {
    if (num === 0) {return '0';}
    
    // Use toFixed to get the desired decimal places, then remove trailing zeros
    const fixed = num.toFixed(maxDecimals);
    const trimmed = fixed.replace(/\.?0+$/, '');
    
    // Ensure we don't return an empty string
    return trimmed || '0';
  }

  /**
   * Format monthly deposit amount for a RONDA contract
   */
  async formatMonthlyDeposit(contractAddress: string, rawAmount: string | bigint): Promise<string> {
    try {
      const tokenInfo = await this.getPaymentTokenInfo(contractAddress);
      return this.formatAmount(rawAmount, tokenInfo.decimals, tokenInfo.symbol);
    } catch (error) {
      console.error('❌ Error formatting monthly deposit:', error);
      return '0 MTK';
    }
  }

  /**
   * Format entry fee (always in native chain token - ETH)
   */
  async formatEntryFee(contractAddress: string): Promise<string> {
    // Check cache first
    if (entryFeeCache[contractAddress]) {
      console.log('📋 Using cached entry fee for:', contractAddress);
      return entryFeeCache[contractAddress]?.formatted || '0.001 MTK';
    }

    try {
      console.log('🔍 Fetching entry fee for contract:', contractAddress);

      const rondaContract = new ethers.Contract(
        contractAddress,
        RONDA_TOKEN_ABI,
        this.provider
      );

      // Try to get entry fee from contract
      let entryFeeAmount: bigint;
      try {
        entryFeeAmount = await rondaContract?.entryFee?.();
      } catch (error) {
        console.warn('⚠️ entryFee() method not available, using mock value');
        // Use mock value: 0.001 ETH
        entryFeeAmount = ethers.parseEther('0.001');
      }

      // Entry fees are always in ETH (18 decimals) - format with minimal decimals
      const formatted = this.formatAmount(entryFeeAmount, 18, 'ETH');

      // Cache the result
      entryFeeCache[contractAddress] = {
        amount: entryFeeAmount.toString(),
        formatted,
      };

      console.log('✅ Entry fee cached:', {
        contract: contractAddress,
        amount: entryFeeAmount.toString(),
        formatted,
      });

      return formatted;
    } catch (error: any) {
      console.error('❌ Error fetching entry fee:', error);
      
      // Fallback to mock value
      const mockFormatted = '0.001 ETH';
      entryFeeCache[contractAddress] = {
        amount: ethers.parseEther('0.001').toString(),
        formatted: mockFormatted,
      };
      
      return mockFormatted;
    }
  }

  /**
   * Get raw numeric value for calculations (preserves existing logic)
   */
  async getNumericAmount(contractAddress: string, rawAmount: string | bigint): Promise<number> {
    try {
      const tokenInfo = await this.getPaymentTokenInfo(contractAddress);
      const amount = typeof rawAmount === 'string' ? BigInt(rawAmount) : rawAmount;
      const divisor = BigInt(10 ** tokenInfo.decimals);
      return Number(amount) / Number(divisor);
    } catch (error) {
      console.error('❌ Error getting numeric amount:', error);
      return 0;
    }
  }

  /**
   * Format total contribution (monthly deposit × participants)
   */
  async formatTotalContribution(
    contractAddress: string, 
    monthlyDeposit: string | bigint, 
    participantCount: number
  ): Promise<string> {
    try {
      const tokenInfo = await this.getPaymentTokenInfo(contractAddress);
      const monthlyAmount = await this.getNumericAmount(contractAddress, monthlyDeposit);
      const totalAmount = monthlyAmount * participantCount;
      
      // Convert back to proper format
      const totalAmountBigInt = BigInt(Math.floor(totalAmount * (10 ** tokenInfo.decimals)));
      return this.formatAmount(totalAmountBigInt, tokenInfo.decimals, tokenInfo.symbol);
    } catch (error) {
      console.error('❌ Error formatting total contribution:', error);
      return '0 MTK';
    }
  }

  /**
   * Clear cache for a specific contract (useful for refreshing data)
   */
  clearCache(contractAddress?: string): void {
    if (contractAddress) {
      delete paymentTokenCache[contractAddress];
      delete entryFeeCache[contractAddress];
      console.log('🗑️ Cleared cache for contract:', contractAddress);
    } else {
      Object.keys(paymentTokenCache).forEach(key => delete paymentTokenCache[key]);
      Object.keys(entryFeeCache).forEach(key => delete entryFeeCache[key]);
      console.log('🗑️ Cleared all token formatter cache');
    }
  }

  /**
   * Batch format multiple amounts for the same contract
   */
  async batchFormat(contractAddress: string, amounts: Array<{
    rawAmount: string | bigint;
    type: 'monthly' | 'entry' | 'total';
    participantCount?: number;
  }>): Promise<string[]> {
    try {
      // Get token info once for all amounts
      const tokenInfo = await this.getPaymentTokenInfo(contractAddress);
      
      const results = await Promise.all(amounts.map(async ({ rawAmount, type, participantCount }) => {
        switch (type) {
          case 'monthly':
            return this.formatAmount(rawAmount, tokenInfo.decimals, tokenInfo.symbol);
          case 'entry':
            return await this.formatEntryFee(contractAddress);
          case 'total':
            if (participantCount) {
              return await this.formatTotalContribution(contractAddress, rawAmount, participantCount);
            }
            return this.formatAmount(rawAmount, tokenInfo.decimals, tokenInfo.symbol);
          default:
            return this.formatAmount(rawAmount, tokenInfo.decimals, tokenInfo.symbol);
        }
      }));

      return results;
    } catch (error) {
      console.error('❌ Error in batch format:', error);
      return amounts.map(() => '0 MTK');
    }
  }
}

// Export singleton instance
export const tokenFormatter = new TokenFormatter();

// Export utility functions for direct use
export async function formatMonthlyDeposit(contractAddress: string, rawAmount: string | bigint): Promise<string> {
  return tokenFormatter.formatMonthlyDeposit(contractAddress, rawAmount);
}

export async function formatEntryFee(contractAddress: string): Promise<string> {
  return tokenFormatter.formatEntryFee(contractAddress);
}

export async function formatTotalContribution(
  contractAddress: string, 
  monthlyDeposit: string | bigint, 
  participantCount: number
): Promise<string> {
  return tokenFormatter.formatTotalContribution(contractAddress, monthlyDeposit, participantCount);
}

export function formatTokenAmount(rawAmount: string | bigint, decimals: number, symbol: string): string {
  return tokenFormatter.formatAmount(rawAmount, decimals, symbol);
}