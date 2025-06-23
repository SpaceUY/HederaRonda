'use client';

import { CheckCircle, AlertCircle, Shield, Wallet, Info } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useVerification } from '@/hooks/use-verification';

interface VerificationStatusProps {
  worldIdVerified: boolean;
  walletConnected: boolean;
  walletAddress?: string | null;
  onJoinReady?: () => void;
  showJoinButton?: boolean;
}

export function VerificationStatus({ 
  worldIdVerified, 
  walletConnected, 
  walletAddress,
  onJoinReady,
  showJoinButton = true
}: VerificationStatusProps) {
  const { getSessionInfo } = useVerification();
  const isReadyToJoin = worldIdVerified && walletConnected;
  const sessionInfo = getSessionInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification Status</CardTitle>
        <CardDescription>
          Complete both verifications to join RONDAs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* World ID Status */}
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <div>
              <div className="font-medium">World ID Verification</div>
              <div className="text-sm text-muted-foreground">
                {worldIdVerified ? 'Identity verified' : 'Verification required'}
              </div>
              {sessionInfo.hasActiveSession && (
                <div className="text-xs text-muted-foreground">
                  Session: {sessionInfo.sessionId?.slice(-8)}
                </div>
              )}
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={
              worldIdVerified 
                ? 'bg-success/10 text-success border-success/20'
                : 'bg-muted text-muted-foreground border-border'
            }
          >
            {worldIdVerified ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                Pending
              </>
            )}
          </Badge>
        </div>

        {/* Wallet Status */}
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center space-x-3">
            <Wallet className={`h-6 w-6 ${walletConnected ? 'text-success' : 'text-muted-foreground'}`} />
            <div>
              <div className="font-medium">Wallet Connection</div>
              <div className="text-sm text-muted-foreground">
                {walletConnected 
                  ? walletAddress 
                    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                    : 'Wallet connected'
                  : 'Connection required'
                }
              </div>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={
              walletConnected 
                ? 'bg-success/10 text-success border-success/20'
                : 'bg-muted text-muted-foreground border-border'
            }
          >
            {walletConnected ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                Pending
              </>
            )}
          </Badge>
        </div>

        {/* Session Information */}
        {sessionInfo.hasActiveSession && (
          <div className="p-3 bg-info/5 rounded-lg border border-info/20">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="h-4 w-4 text-info" />
              <span className="font-medium text-info text-sm">Active Session</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Session ID: {sessionInfo.sessionId}</div>
              {sessionInfo.verificationTimestamp && (
                <div>
                  Verified: {new Date(sessionInfo.verificationTimestamp).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ready State */}
        {isReadyToJoin && showJoinButton && (
          <div className="pt-4 border-t">
            <div className="p-4 bg-success/5 rounded-lg border border-success/20 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="font-medium text-success">Ready to Join!</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Both verifications complete. You can now join RONDAs.
              </p>
            </div>
            {onJoinReady && (
              <Button onClick={onJoinReady} className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Ready to Join Groups
              </Button>
            )}
          </div>
        )}

        {!isReadyToJoin && (
          <div className="pt-4 border-t">
            <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                <span className="font-medium text-warning">Verification Incomplete</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Complete both World ID verification and wallet connection to join RONDAs.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}