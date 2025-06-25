import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { avalancheFuji, sepolia } from 'wagmi/chains';

const config = getDefaultConfig({
  appName: 'RONDA Web3',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [avalancheFuji, sepolia],
  transports: {
    [avalancheFuji.id]: http(
      process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL || 
      'https://avalanche-fuji-c-chain-rpc.publicnode.com'
    ),
    [sepolia.id]: http(
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 
      'https://ethereum-sepolia-rpc.publicnode.com'
    ),
  },
  ssr: true, // Disable server-side rendering to match Web3Provider dynamic import
});

export { config };