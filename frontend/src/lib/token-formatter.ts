import { ethers } from 'ethers';

import { NETWORK_CONFIG } from './contracts';

// Token information cache
interface TokenInfo {
  symbol: string;
  decimals: number;
  address: string;
  _loggedCache?: boolean;
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
const tokenInfoCache: { [address: string]: TokenInfo } = {};

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
    // Check cache first 
    if (tokenInfoCache[tokenAddress]) {
      // Only log cache hits occasionally to reduce spam
      const shouldLog = Math.random() < 0.1; // Log ~10% of cache hits
      if (shouldLog) {
        console.log('✅ Token info cached:', {
          address: tokenAddress,
          symbol: tokenInfoCache[tokenAddress].symbol,
          decimals: tokenInfoCache[tokenAddress].decimals
        });
      }
      return tokenInfoCache[tokenAddress];
    }

    try {
      console.log('🔍 Fetching token info for address:', tokenAddress);

      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        this.provider
      );

      // Fetch token details
      const [symbol, decimals] = await Promise.all([
        tokenContract?.symbol?.(),
        tokenContract?.decimals?.(),
      ]);

      const tokenInfo: TokenInfo = {
        symbol: symbol || 'UNKNOWN',
        decimals: Number(decimals) || 18, // Ensure decimals is always a regular number
        address: tokenAddress,
      };

      // Cache the result
      tokenInfoCache[tokenAddress] = tokenInfo;
      
      console.log('✅ Token info cached:', {
        address: tokenAddress,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals
      });

      return tokenInfo;
    } catch (error: any) {
      console.error('❌ Error fetching token info:', error);
      
      // Fallback to MTK token defaults  
      const fallbackInfo: TokenInfo = {
        symbol: 'MTK',
        decimals: 18,
        address: tokenAddress,
      };
      
      tokenInfoCache[tokenAddress] = fallbackInfo;
      return fallbackInfo;
    }
  }

  /**
   * Fetch payment token info for a RONDA contract
   * Uses caching to avoid redundant network calls
   */
  async getPaymentTokenInfo(contractAddress: string): Promise<TokenInfo> {
    // Check cache first
    if (paymentTokenCache[contractAddress]) {
      // Only log on first cache hit to reduce spam
      if (!paymentTokenCache[contractAddress]._loggedCache) {
        console.log('📋 Using cached payment token info for:', contractAddress);
        paymentTokenCache[contractAddress]._loggedCache = true;
      }
      return paymentTokenCache[contractAddress];
    }

    try {
      const rondaContract = new ethers.Contract(
        contractAddress,
        RONDA_TOKEN_ABI,
        this.provider
      );

      const paymentTokenAddress = await rondaContract?.paymentToken?.();
      
      // Use the direct token info method
      const tokenInfo = await this.getTokenInfoFromAddress(paymentTokenAddress);

      // Cache the result using the RONDA contract address as key
      paymentTokenCache[contractAddress] = { ...tokenInfo, _loggedCache: false };
      
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
        _loggedCache: false
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
      const decimalNum = Number(decimals);
      const divisor = BigInt(10) ** BigInt(decimalNum);
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
      const decimalNum = Number(tokenInfo.decimals);
      return this.formatAmount(rawAmount, decimalNum, tokenInfo.symbol);
    } catch (error) {
      console.error('❌ Error formatting monthly deposit:', error);
      return '0 MTK';
    }
  }

  /**
   * Format entry fee using payment token information
   */
  async formatEntryFee(contractAddress: string): Promise<string> {
    // Check cache first
    if (entryFeeCache[contractAddress]) {
      console.log('📋 Using cached entry fee for:', contractAddress);
      return entryFeeCache[contractAddress]?.formatted || '0.001 MTK';
    }

    try {
      console.log('🔍 Fetching entry fee for contract:', contractAddress);

      // Get payment token info for proper formatting
      const tokenInfo = await this.getPaymentTokenInfo(contractAddress);

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
        // Use mock value based on token decimals
        const decimalNum = Number(tokenInfo.decimals);
        const mockAmount = BigInt(10) ** BigInt(decimalNum - 3); // 0.001 in token units
        entryFeeAmount = mockAmount;
      }

      // Format using payment token info
      const decimalNum = Number(tokenInfo.decimals);
      const formatted = this.formatAmount(entryFeeAmount, decimalNum, tokenInfo.symbol);

      // Cache the result
      entryFeeCache[contractAddress] = {
        amount: entryFeeAmount.toString(),
        formatted,
      };

      console.log('✅ Entry fee cached:', {
        contract: contractAddress,
        amount: entryFeeAmount.toString(),
        formatted,
        token: tokenInfo.symbol,
        decimals: decimalNum,
      });

      return formatted;
    } catch (error: any) {
      console.error('❌ Error fetching entry fee:', error);
      
      // Fallback to mock value with default token info
      const mockFormatted = '0.001 MTK';
      entryFeeCache[contractAddress] = {
        amount: '1000000000000000', // 0.001 in 18 decimals
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
      const decimalNum = Number(tokenInfo.decimals);
      const divisor = BigInt(10) ** BigInt(decimalNum);
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
      
      // Convert back to proper format - ensure decimals is a regular number
      const decimalNum = Number(tokenInfo.decimals);
      const multiplier = Math.pow(10, decimalNum);
      const totalAmountBigInt = BigInt(Math.floor(totalAmount * multiplier));
      
      return this.formatAmount(totalAmountBigInt, decimalNum, tokenInfo.symbol);
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
      const decimalNum = Number(tokenInfo.decimals);
      
      const results = await Promise.all(amounts.map(async ({ rawAmount, type, participantCount }) => {
        switch (type) {
          case 'monthly':
            return this.formatAmount(rawAmount, decimalNum, tokenInfo.symbol);
          case 'entry':
            return await this.formatEntryFee(contractAddress);
          case 'total':
            if (participantCount) {
              return await this.formatTotalContribution(contractAddress, rawAmount, participantCount);
            }
            return this.formatAmount(rawAmount, decimalNum, tokenInfo.symbol);
          default:
            return this.formatAmount(rawAmount, decimalNum, tokenInfo.symbol);
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