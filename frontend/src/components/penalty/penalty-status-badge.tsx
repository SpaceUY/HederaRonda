'use client';

import { AlertTriangle, Shield, Loader2, ExternalLink } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PENALTY_CONTRACT } from '@/lib/penalty-contract';

interface PenaltyStatusBadgeProps {
  hasPenalties: boolean;
  penaltyCount: number;
  isLoading: boolean;
  error?: string;
  walletAddress?: string;
  showDetails?: boolean;
  onRetry?: () => void;
}

export function PenaltyStatusBadge({
  hasPenalties,
  penaltyCount,
  isLoading,
  error,
  walletAddress,
  showDetails = false,
  onRetry,
}: PenaltyStatusBadgeProps) {
  if (isLoading) {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking penalties...
      </Badge>
    );
  }

  if (error) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        Check failed
      </Badge>
    );
  }

  if (hasPenalties) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        {penaltyCount} Penalty{penaltyCount !== 1 ? ' Tokens' : ' Token'}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1">
      <Shield className="h-3 w-3" />
      No Penalties
    </Badge>
  );
}

export function PenaltyStatusCard({
  hasPenalties,
  penaltyCount,
  isLoading,
  error,
  walletAddress,
  onRetry,
}: PenaltyStatusBadgeProps) {
  if (isLoading) {
    return (
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm font-medium">Checking penalty status...</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Verifying wallet against penalty token contract
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-l-4 border-l-destructive">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span>Penalty Check Failed</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex gap-2">
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                Retry Check
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://sepolia.etherscan.io/address/${PENALTY_CONTRACT.address}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Contract
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasPenalties) {
    return (
      <Card className="border-l-4 border-l-destructive bg-destructive/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span>Participation Restricted</span>
          </CardTitle>
          <CardDescription>
            You have {penaltyCount} penalty token{penaltyCount !== 1 ? 's' : ''} in your wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm font-medium text-destructive mb-1">
              Cannot Join RONDAs
            </p>
            <p className="text-xs text-muted-foreground">
              You cannot participate in rounds due to contract violations. Please resolve your penalties before joining.
            </p>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Penalty Tokens:</span>
              <span className="font-medium text-destructive">{penaltyCount}</span>
            </div>
            {walletAddress && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wallet:</span>
                <span className="font-mono text-xs">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contract:</span>
              <span className="font-mono text-xs">
                {PENALTY_CONTRACT.address.slice(0, 6)}...{PENALTY_CONTRACT.address.slice(-4)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://sepolia.etherscan.io/token/${PENALTY_CONTRACT.address}?a=${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View on Etherscan
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-success bg-success/5">
      <CardContent className="p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="h-4 w-4 text-success" />
          <span className="text-sm font-medium text-success">No Penalties Found</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Your wallet is clear to participate in RONDAs
        </p>
        {walletAddress && (
          <div className="mt-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Checked Wallet:</span>
              <span className="font-mono">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}