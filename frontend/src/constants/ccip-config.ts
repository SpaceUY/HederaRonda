export interface NetworkConfig {
  name: string;
  chainId: number;
  rondaFactoryAddress: string;
  penaltyTokenAddress: string;
  mainTokenAddress: string;
  isTestnet: boolean;
}

export interface NetworkConfigs {
  [chainId: number]: NetworkConfig;
}

// Hedera Network Configuration
export const NETWORKS: NetworkConfigs = {
  // Hedera Testnet
  296: {
    name: 'Hedera Testnet',
    chainId: 296,
    rondaFactoryAddress: '0xf1dB7Ea49c20Ecf95e6ab8F57889769F4C34b0fb',
    penaltyTokenAddress: '0x8550C69142c56De276cC351000F91Eb36Ed2Be56',
    mainTokenAddress: '0x01Ac06943d2B8327a7845235Ef034741eC1Da352', // Use native HBAR
    isTestnet: true,
  },
};

export const SUPPORTED_NETWORKS = Object.values(NETWORKS).map(chain => chain.name);

// Default network (Hedera Testnet)
export const DEFAULT_NETWORK = 296;

// Helper functions
export const getNetworkConfig = (chainId: number): NetworkConfig | null => {
  return NETWORKS[chainId] || null;
};

export const isNetworkSupported = (chainId: number): boolean => {
  return chainId in NETWORKS;
};

export const getSupportedNetworks = (): NetworkConfig[] => {
  return Object.values(NETWORKS);
};

export const getTestnetNetworks = (): NetworkConfig[] => {
  return getSupportedNetworks().filter(network => network.isTestnet);
};

export const getMainnetNetworks = (): NetworkConfig[] => {
  return getSupportedNetworks().filter(network => !network.isTestnet);
};

// Get the appropriate contract address based on network
export const getContractAddress = (
  rondaContractAddress: string,
): string => {
  return rondaContractAddress;
}; 