'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

interface WagmiContextType {
  isReady: boolean;
}

const WagmiContext = createContext<WagmiContextType>({ isReady: false });

export function useWagmiContext() {
  return useContext(WagmiContext);
}

interface WagmiProviderProps {
  children: ReactNode;
}

export function WagmiContextProvider({ children }: WagmiProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Set ready after a delay to ensure WagmiProvider is mounted
    const timer = setTimeout(() => {
      console.log('✅ WagmiContext: Setting ready state');
      setIsReady(true);
    }, 300); 

    return () => clearTimeout(timer);
  }, []);

  return (
    <WagmiContext.Provider value={{ isReady }}>
      {children}
    </WagmiContext.Provider>
  );
} 