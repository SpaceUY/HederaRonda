import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { avalancheFuji, sepolia } from 'wagmi/chains';

const config = getDefaultConfig({
  appName: 'RONDA Web3',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [avalancheFuji, sepolia],
  transports: {
    [avalancheFuji.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true, // Disable server-side rendering to match Web3Provider dynamic import
});

export { config };