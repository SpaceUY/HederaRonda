export interface NetworkConfig {
  name: string;
  chainId: number;
  rondaFactoryAddress: string;
  penaltyTokenAddress: string;
  mainTokenAddress: string;
  rondaSenderAddress?: string;
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
    rondaFactoryAddress: '0xe11aE439bCa99F988C325e2cc9811a2219106EB7',
    penaltyTokenAddress: '0x5f0A722306F1A5016ffa53bae98BB84439bB8219',
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