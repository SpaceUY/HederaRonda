'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, RefreshCw, Wallet } from 'lucide-react';
import { useAccount, useDisconnect } from 'wagmi';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWagmiReady } from '@/hooks/use-wagmi-ready';

interface WalletConnectorProps {
  onWalletConnect?: (address: string) => void;
  onWalletDisconnect?: () => void;
}

export function WalletConnector({ onWalletConnect, onWalletDisconnect }: WalletConnectorProps) {
  const isWagmiReady = useWagmiReady();
  
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  const effectiveAddress = isWagmiReady ? address : undefined;
  const effectiveIsConnected = isWagmiReady ? isConnected : false;
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && effectiveIsConnected && effectiveAddress) {
      onWalletConnect?.(effectiveAddress);
    } else if (mounted && !effectiveIsConnected) {
      onWalletDisconnect?.();
    }
  }, [mounted, effectiveIsConnected, effectiveAddress, onWalletConnect, onWalletDisconnect]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>Connect Wallet</span>
          </CardTitle>
          <CardDescription>Loading wallet connection...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-10 bg-muted animate-pulse rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (effectiveIsConnected && effectiveAddress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>Wallet Connected</span>
          </CardTitle>
          <CardDescription>Your crypto wallet is connected and ready</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
            <div>
              <div className="font-medium text-success">Connected</div>
              <div className="text-sm text-muted-foreground font-mono">
                {effectiveAddress?.slice(0, 6)}...{effectiveAddress?.slice(-4)}
              </div>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              Active
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => disconnect()}
              className="flex-1"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
            
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button
                  variant="outline"
                  onClick={openConnectModal}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Switch Wallet
                </Button>
              )}
            </ConnectButton.Custom>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wallet className="h-5 w-5" />
          <span>Connect Wallet</span>
        </CardTitle>
        <CardDescription>
          Connect your crypto wallet to join RONDAs and make contributions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConnectButton.Custom>
          {({ openConnectModal, connectModalOpen }) => (
            <Button 
              onClick={openConnectModal} 
              disabled={connectModalOpen}
              className="w-full"
              size="lg"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          )}
        </ConnectButton.Custom>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Supports MetaMask, WalletConnect, Coinbase Wallet, and other popular wallets.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}