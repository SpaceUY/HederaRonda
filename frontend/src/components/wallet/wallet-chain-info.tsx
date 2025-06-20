'use client';

import { Wallet, Network, Coins, AlertTriangle, CheckCircle, Copy } from 'lucide-react';
import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWalletInfo } from '@/hooks/use-wallet-info';
import { formatCurrency } from '@/lib/utils';

interface WalletChainInfoProps {
  showBalance?: boolean;
  showCopyAddress?: boolean;
  compact?: boolean;
}

export function WalletChainInfo({ 
  showBalance = true, 
  showCopyAddress = true,
  compact = false 
}: WalletChainInfoProps) {
  const { address, chainId, chainName, isConnected, balance, isLoading, connector } = useWalletInfo();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  const isTestnet = chainId && [11155111, 421614, 80001, 97, 43113, 4002, 420, 421613].includes(chainId);
  const isMainnet = chainId && [1, 137, 56, 43114, 250, 10, 42161].includes(chainId);

  if (!isConnected) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No wallet connected. Please connect your wallet to view network information.
        </AlertDescription>
      </Alert>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-4 p-3 bg-muted/30 rounded-lg border">
        <div className="flex items-center space-x-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Network className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{chainName}</span>
        </div>
        {showBalance && balance && (
          <div className="flex items-center space-x-2">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{parseFloat(balance).toFixed(4)} ETH</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wallet className="h-5 w-5" />
          <span>Wallet & Network Information</span>
        </CardTitle>
        <CardDescription>
          Current wallet connection and blockchain network details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Information */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Connected Wallet</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Wallet Type:</span>
              <span className="font-medium">{connector || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Address:</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                {showCopyAddress && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAddress}
                    className="h-6 w-6 p-0"
                  >
                    {copied ? (
                      <CheckCircle className="h-3 w-3 text-success" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Network Information */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Network Details</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Network:</span>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{chainName}</span>
                <Badge 
                  variant="outline" 
                  className={
                    isMainnet 
                      ? 'bg-success/10 text-success border-success/20'
                      : isTestnet
                      ? 'bg-warning/10 text-warning border-warning/20'
                      : 'bg-muted text-muted-foreground border-border'
                  }
                >
                  {isMainnet ? 'Mainnet' : isTestnet ? 'Testnet' : 'Unknown'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Chain ID:</span>
              <span className="font-medium">{chainId}</span>
            </div>
          </div>
        </div>

        {/* Balance Information */}
        {showBalance && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Balance</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Native Token:</span>
                <span className="font-medium">
                  {isLoading ? (
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  ) : balance ? (
                    `${parseFloat(balance).toFixed(6)} ETH`
                  ) : (
                    'Unable to load'
                  )}
                </span>
              </div>
              {balance && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">USD Value:</span>
                  <span className="font-medium text-muted-foreground">
                    {formatCurrency(parseFloat(balance) * 2500)} {/* Mock ETH price */}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Network Status */}
        {isTestnet && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You're connected to a testnet. Transactions will use test tokens with no real value.
            </AlertDescription>
          </Alert>
        )}

        {!isMainnet && !isTestnet && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unknown or unsupported network. Please switch to a supported network.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}