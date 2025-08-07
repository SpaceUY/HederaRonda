'use client';

import { useEffect, useState } from 'react';

export function useWagmiReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500); 

    return () => clearTimeout(timer);
  }, []);

  return isReady;
} 