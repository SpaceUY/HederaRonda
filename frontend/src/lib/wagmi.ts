import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrumSepolia, sepolia } from 'wagmi/chains';
import { http } from 'wagmi';

const config = getDefaultConfig({
  appName: 'RONDA Web3',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [arbitrumSepolia, sepolia],
  transports: {
    [arbitrumSepolia.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true, // Enable server-side rendering support
});

export { config };