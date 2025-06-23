'use client';

import { CheckCircle, Shield, Wallet, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { WorldIdVerifier } from '@/components/auth/world-id-verifier';
import { PenaltyChecker } from '@/components/penalty/penalty-checker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VerificationStatus } from '@/components/wallet/verification-status';
import { WalletConnector } from '@/components/wallet/wallet-connector';
import { useVerification } from '@/hooks/use-verification';

export default function AuthPage() {
  const [currentStep, setCurrentStep] = useState<'intro' | 'worldid' | 'wallet' | 'penalty' | 'complete'>('intro');
  const {
    verificationState,
    handleWorldIdSuccess,
    handleWalletConnect,
    handleWalletDisconnect,
  } = useVerification();

  useEffect(() => {
    if (verificationState.isWorldIdVerified && verificationState.isWalletConnected) {
      setCurrentStep('penalty');
    } else if (verificationState.isWorldIdVerified && !verificationState.isWalletConnected) {
      setCurrentStep('wallet');
    }
  }, [verificationState]);

  const renderIntroStep = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Get Verified to Join RONDAs</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          To ensure security and prevent fraud, we require verification before you can join any RONDA.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>World ID Verification</CardTitle>
            <CardDescription>
              Prove you're a unique human using World ID's privacy-preserving identity verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Prevents duplicate accounts</li>
              <li>• Protects your privacy</li>
              <li>• One-time verification</li>
              <li>• Required for all members</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
              <Wallet className="h-6 w-6 text-success" />
            </div>
            <CardTitle>Wallet Connection</CardTitle>
            <CardDescription>
              Connect your crypto wallet to make contributions and receive payouts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Secure payment processing</li>
              <li>• Direct payout delivery</li>
              <li>• Multiple wallet support</li>
              <li>• Switch wallets anytime</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-warning" />
            </div>
            <CardTitle>Penalty Check</CardTitle>
            <CardDescription>
              Verify your wallet is clear of penalty tokens before joining rounds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Automatic penalty detection</li>
              <li>• Contract violation tracking</li>
              <li>• Participation eligibility</li>
              <li>• Real-time verification</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button size="lg" onClick={() => setCurrentStep('worldid')}>
          Start Verification Process
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderWorldIdStep = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Verify with World ID</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Complete your World ID verification to prove you're a unique human.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <WorldIdVerifier 
          onSuccess={handleWorldIdSuccess}
          isVerified={verificationState.isWorldIdVerified}
        />
      </div>
    </div>
  );

  const renderWalletStep = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
          <Wallet className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Connect your crypto wallet to make contributions and receive payouts.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <WalletConnector 
          onWalletConnect={handleWalletConnect}
          onWalletDisconnect={handleWalletDisconnect}
        />
      </div>
    </div>
  );

  const renderPenaltyStep = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto">
          <Shield className="h-8 w-8 text-warning" />
        </div>
        <h2 className="text-2xl font-bold">Penalty Token Check</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Verifying your wallet is clear of penalty tokens and eligible to participate.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <PenaltyChecker 
          walletAddress={verificationState.walletAddress || undefined}
          autoCheck={true}
          showManualCheck={false}
        />
      </div>

      <div className="text-center">
        <Button size="lg" onClick={() => setCurrentStep('complete')}>
          Continue to Dashboard
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold">Verification Complete!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          You're all set to join RONDAs and start building your financial future.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <VerificationStatus 
          worldIdVerified={verificationState.isWorldIdVerified}
          walletConnected={verificationState.isWalletConnected}
          walletAddress={verificationState.walletAddress}
        />
      </div>

      <div className="text-center space-y-4">
        <Button size="lg" asChild>
          <Link href="/dashboard">
            <ArrowRight className="h-4 w-4 mr-2" />
            Explore RONDAs
          </Link>
        </Button>
        
        <p className="text-sm text-muted-foreground">
          You can now join any available RONDA and start contributing.
        </p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentStep) {
      case 'worldid':
        return renderWorldIdStep();
      case 'wallet':
        return renderWalletStep();
      case 'penalty':
        return renderPenaltyStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderIntroStep();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container-max container-padding py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-12">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className={`flex items-center space-x-2 ${
                verificationState.isWorldIdVerified ? 'text-success' : 
                currentStep === 'worldid' ? 'text-primary' : 'text-muted-foreground'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  verificationState.isWorldIdVerified ? 'bg-success border-success text-success-foreground' :
                  currentStep === 'worldid' ? 'bg-primary border-primary text-primary-foreground' :
                  'border-muted-foreground'
                }`}>
                  {verificationState.isWorldIdVerified ? <CheckCircle className="h-4 w-4" /> : '1'}
                </div>
                <span className="text-sm font-medium">World ID</span>
              </div>
              
              <div className="w-8 h-px bg-border" />
              
              <div className={`flex items-center space-x-2 ${
                verificationState.isWalletConnected ? 'text-success' : 
                currentStep === 'wallet' ? 'text-primary' : 'text-muted-foreground'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  verificationState.isWalletConnected ? 'bg-success border-success text-success-foreground' :
                  currentStep === 'wallet' ? 'bg-primary border-primary text-primary-foreground' :
                  'border-muted-foreground'
                }`}>
                  {verificationState.isWalletConnected ? <CheckCircle className="h-4 w-4" /> : '2'}
                </div>
                <span className="text-sm font-medium">Wallet</span>
              </div>

              <div className="w-8 h-px bg-border" />
              
              <div className={`flex items-center space-x-2 ${
                currentStep === 'complete' ? 'text-success' : 
                currentStep === 'penalty' ? 'text-primary' : 'text-muted-foreground'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentStep === 'complete' ? 'bg-success border-success text-success-foreground' :
                  currentStep === 'penalty' ? 'bg-primary border-primary text-primary-foreground' :
                  'border-muted-foreground'
                }`}>
                  {currentStep === 'complete' ? <CheckCircle className="h-4 w-4" /> : '3'}
                </div>
                <span className="text-sm font-medium">Penalty Check</span>
              </div>
            </div>
          </div>

          {renderContent()}
        </div>
      </main>
    </div>
  );
}