import { avalancheFuji } from 'wagmi/chains';
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
        'https://testnet.hashio.io/api/v1',
        'https://testnet.hashio.io/api/v1/transactions'
      ] 
    },
    public: { 
      http: [
        'https://testnet.hashio.io/api',
        'https://testnet.hashio.io/api/v1',
        'https://testnet.hashio.io/api/v1/transactions'
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
  chains: [hederaTestnet, avalancheFuji], 
  transports: {
    [hederaTestnet.id]: http('https://testnet.hashio.io/api', {
      retryCount: 5,
      retryDelay: 2000,
      timeout: 10000,
    }), 
    [avalancheFuji.id]: http(
      process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL || 
      'https://avalanche-fuji-c-chain-rpc.publicnode.com'
    ),
  },
  ssr: false, 
});

export { config };
