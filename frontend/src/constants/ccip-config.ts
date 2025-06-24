export interface CCIPNetworkConfig {
  name: string;
  chainId: number;
  chainSelector: string;
  rondaSenderAddress: string;
  routerAddress: string;
  linkTokenAddress: string;
  mainTokenAddress: string;
  isTestnet: boolean;
}

export interface CCIPConfig {
  [chainId: number]: CCIPNetworkConfig;
}


// CCIP Network Configuration
export const CCIP_NETWORKS: CCIPConfig = {
  // Sepolia Testnet (Ethereum)
  11155111: {
    name: 'Sepolia',
    chainId: 11155111,
    chainSelector: "16015286601757825753", // Sepolia chain selector
    rondaSenderAddress: '0x0000000000000000000000000000000000000000', // TODO: Deploy RondaSender on Sepolia
    routerAddress: '0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59', // Sepolia CCIP Router
    linkTokenAddress: '0x779877A7B0D9E8603169DdbD7836e478b4624789', // Sepolia LINK
    mainTokenAddress: '0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05', // Sepolia Token
    isTestnet: true,
  },
  // Avalanche Fuji Testnet
  43113: {
    name: 'Avalanche Fuji',
    chainId: 43113,
    chainSelector: "14767482510784806043", // Avalanche Fuji chain selector
    rondaSenderAddress: '0x41360E44AB68a6A2A73766b7e37227d35B2B30f5', // TODO: Deploy RondaSender on Avalanche Fuji
    routerAddress: '0xF694E193200268f9a4868e4Aa017A0118C9a8177', // Avalanche Fuji CCIP Router
    linkTokenAddress: '0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846', // Avalanche Fuji LINK
    mainTokenAddress: '0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4', // Avalanche Fuji Token
    isTestnet: true,
  },
};

export const SUPPORTED_NETWORKS = Object.values(CCIP_NETWORKS).map(chain => chain.name);

// Default network (Sepolia for now)
export const DEFAULT_NETWORK = 11155111;

// Helper functions
export const getCCIPNetworkConfig = (chainId: number): CCIPNetworkConfig | null => {
  return CCIP_NETWORKS[chainId] || null;
};

export const isCCIPSupported = (chainId: number): boolean => {
  return chainId in CCIP_NETWORKS;
};

export const getSupportedNetworks = (): CCIPNetworkConfig[] => {
  return Object.values(CCIP_NETWORKS);
};

export const getTestnetNetworks = (): CCIPNetworkConfig[] => {
  return getSupportedNetworks().filter(network => network.isTestnet);
};

export const getMainnetNetworks = (): CCIPNetworkConfig[] => {
  return getSupportedNetworks().filter(network => !network.isTestnet);
};

// Check if cross-chain communication is needed
export const needsCrossChainCommunication = (
  userChainId: number,
  targetChainId: number
): boolean => {
  return userChainId !== targetChainId;
};

// Get the appropriate contract address based on network
export const getContractAddress = (
  userChainId: number,
  targetChainId: number,
  rondaContractAddress: string,
  rondaSenderAddress?: string
): string => {
  if (needsCrossChainCommunication(userChainId, targetChainId)) {
    // Use RondaSender for cross-chain communication
    const networkConfig = getCCIPNetworkConfig(userChainId);
    return networkConfig?.rondaSenderAddress || rondaSenderAddress || '';
  }
  // Use direct Ronda contract for same-chain communication
  return rondaContractAddress;
}; 