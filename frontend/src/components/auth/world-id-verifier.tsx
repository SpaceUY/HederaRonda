'use client';

import {
  IDKitWidget,
  VerificationLevel,
  ISuccessResult,
} from '@worldcoin/idkit';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface WorldIdVerifierProps {
  onSuccess: (proof: ISuccessResult) => void;
  onError?: (error: Error) => void;
  isVerified?: boolean;
}

export function WorldIdVerifier({
  onSuccess,
  onError,
  isVerified = false,
}: WorldIdVerifierProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appId = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID;
  const action = process.env.NEXT_PUBLIC_WORLDCOIN_ACTION || 'verify-human';
  console.log(appId, action);

  console.log('🔧 World ID Configuration:', {
    appId: appId ? `${appId.slice(0, 8)}...` : 'Not configured',
    action: action,
    isConfigured: !!appId,
  });

  const handleProof = (result: ISuccessResult) => {
    console.log('🎉 World ID verification completed successfully!');
    console.log('📊 Verification Result:', {
      merkle_root: result.merkle_root,
      nullifier_hash: result.nullifier_hash,
      proof: result.proof ? `${result.proof.slice(0, 20)}...` : 'No proof',
      verification_level: result.verification_level,
      timestamp: new Date().toISOString(),
    });

    setIsLoading(false);
    setError(null);
    onSuccess(result);
  };

  const handleVerificationError = (error: Error) => {
    console.error('❌ World ID verification failed:', {
      message: error.message,
      name: error.name,
      timestamp: new Date().toISOString(),
    });

    setIsLoading(false);
    setError(error.message);
    onError?.(error);
  };

  if (isVerified) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <span>World ID Verified</span>
          </CardTitle>
          <CardDescription>
            Your identity has been successfully verified with World ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-success/10 rounded-lg border border-success/20">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-success">
                Verification Complete
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              You can now join RONDAs and participate in the community.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!appId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <span>World ID Configuration Missing</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              World ID App ID is not configured. Please set
              NEXT_PUBLIC_WORLDCOIN_APP_ID in your environment variables.
            </AlertDescription>
          </Alert>

          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              For development, you can get a World ID App ID from{' '}
              <a
                href="https://developer.worldcoin.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                developer.worldcoin.org
              </a>
            </p>
          </div>

          {/* Demo button for development */}
          <Button
            onClick={() => {
              console.log('🧪 Using demo verification for development');
              // Mock verification for demo purposes
              const mockProof: ISuccessResult = {
                merkle_root: 'demo_merkle_root_' + Date.now(),
                nullifier_hash: 'demo_nullifier_hash_' + Date.now(),
                proof: 'demo_proof_' + Date.now(),
                verification_level: VerificationLevel.Device,
              };
              console.log('🎭 Demo proof generated:', mockProof);
              handleProof(mockProof);
            }}
            className="w-full mt-4"
            variant="outline"
          >
            <Shield className="h-4 w-4 mr-2" />
            Use Demo Verification (Development Only)
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>World ID Verification</span>
        </CardTitle>
        <CardDescription>
          Verify your identity with World ID to join RONDAs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
          <h4 className="font-medium text-sm mb-2">Why World ID?</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Prevents duplicate accounts and fraud</li>
            <li>• Protects your privacy with zero-knowledge proofs</li>
            <li>• One-time verification process</li>
            <li>• Required for all RONDA members</li>
          </ul>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <IDKitWidget
          app_id={appId}
          action={action}
          onSuccess={handleProof}
          handleVerify={handleProof}
          verification_level={VerificationLevel.Device}
        >
          {({ open }: { open: () => void }) => (
            <Button
              onClick={() => {
                console.log('🚀 Starting World ID verification process');
                setIsLoading(true);
                setError(null);
                open();
              }}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              <Shield className="h-4 w-4 mr-2" />
              {isLoading ? 'Verifying...' : 'Verify with World ID'}
            </Button>
          )}
        </IDKitWidget>

        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            World ID uses privacy-preserving technology to verify you're a
            unique human without storing personal information.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
