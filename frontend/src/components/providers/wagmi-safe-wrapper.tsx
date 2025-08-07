'use client';

import { ReactNode, useEffect, useState } from 'react';

interface WagmiSafeWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function WagmiSafeWrapper({ children, fallback }: WagmiSafeWrapperProps) {
  const [isClient, setIsClient] = useState(false);
  const [hasWagmiError, setHasWagmiError] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // If not on client, show fallback or nothing
  if (!isClient) {
    return fallback ? <>{fallback}</> : null;
  }

  // If there was a Wagmi error, show fallback
  if (hasWagmiError) {
    return fallback ? <>{fallback}</> : <div>Wagmi not available</div>;
  }

  // Try to render children, catch Wagmi errors
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('Wagmi error caught:', error);
    setHasWagmiError(true);
    return fallback ? <>{fallback}</> : <div>Wagmi not available</div>;
  }
} 