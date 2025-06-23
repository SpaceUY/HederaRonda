'use client';

import { AlertTriangle, Shield, RefreshCw, ExternalLink } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePenaltyCheck } from '@/hooks/use-penalty-check';
import { PENALTY_CONTRACT } from '@/lib/penalty-contract';

import { PenaltyStatusCard } from './penalty-status-badge';

interface PenaltyCheckerProps {
  walletAddress?: string;
  autoCheck?: boolean;
  showManualCheck?: boolean;
}

export function PenaltyChecker({
  walletAddress,
  autoCheck = true,
  showManualCheck = true,
}: PenaltyCheckerProps) {
  const { hasPenalties, penaltyCount, isLoading, error, checkPenalties } = usePenaltyCheck();
  const [manualAddress, setManualAddress] = useState('');

  const handleManualCheck = () => {
    if (manualAddress.trim()) {
      checkPenalties(manualAddress.trim());
    }
  };

  const handleRetry = () => {
    checkPenalties(walletAddress);
  };

  return (
    <div className="space-y-4">
      {/* Manual Address Check */}
      {showManualCheck && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Penalty Token Checker</span>
            </CardTitle>
            <CardDescription>
              Check any wallet address for penalty tokens before joining RONDAs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter wallet address (0x...)"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                className="font-mono text-sm"
              />
              <Button 
                onClick={handleManualCheck}
                disabled={!manualAddress.trim() || isLoading}
              >
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Check'}
              </Button>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium mb-1">Contract Information</div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>Address: {PENALTY_CONTRACT.address}</div>
                <div>Network: Ethereum Sepolia Testnet</div>
                <div>Method: balanceOf(address) → uint256</div>
              </div>
              <Button variant="ghost" size="sm" asChild className="mt-2 h-auto p-0">
                <a
                  href={`https://sepolia.etherscan.io/address/${PENALTY_CONTRACT.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-xs"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>View on Etherscan</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Display */}
      {(walletAddress || manualAddress) && (
        <PenaltyStatusCard
          hasPenalties={hasPenalties}
          penaltyCount={penaltyCount}
          isLoading={isLoading}
          error={error}
          walletAddress={walletAddress || manualAddress}
          onRetry={handleRetry}
        />
      )}

      {/* Information Card */}
      <Card className="border-l-4 border-l-info">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-info" />
            <span className="text-sm font-medium text-info">How Penalty Tokens Work</span>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>• Penalty tokens are issued for contract violations or missed payments</p>
            <p>• Users with penalty tokens cannot join new RONDAs</p>
            <p>• Penalties must be resolved before participating</p>
            <p>• The system checks your wallet balance automatically</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}