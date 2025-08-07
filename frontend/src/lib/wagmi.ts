import { avalancheFuji, sepolia } from 'wagmi/chains';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';

const hederaTestnet = {
  id: 296,
  name: 'Hedera Testnet',
  network: 'hedera-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HBAR',
    symbol: 'HBAR',
  },
  rpcUrls: {
    default: { 
      http: [
        'https://testnet.hashio.io/api',
        'https://testnet.hedera.com' // Fallback
      ] 
    },
    public: { 
      http: [
        'https://testnet.hashio.io/api',
        'https://testnet.hedera.com' // Fallback
      ] 
    },
  },
  blockExplorers: {
    default: { name: 'HashScan', url: 'https://hashscan.io/testnet' },
  },
  testnet: true,
} as const;


const config = getDefaultConfig({
  appName: 'RONDA Web3',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [hederaTestnet, avalancheFuji, sepolia], 
  transports: {
    [hederaTestnet.id]: http('https://testnet.hashio.io/api', {
      retryCount: 3,
      retryDelay: 1000,
    }), 
    [avalancheFuji.id]: http(
      process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL || 
      'https://avalanche-fuji-c-chain-rpc.publicnode.com'
    ),
    [sepolia.id]: http(
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 
      'https://ethereum-sepolia-rpc.publicnode.com'
    ),
  },
  ssr: false, 
});

export { config };
