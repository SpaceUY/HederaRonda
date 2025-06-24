'use client';

import { ArrowLeft, Plus, DollarSign, Users, Calendar, TrendingUp, Shield, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { CreateRondaForm } from '@/components/factory/create-ronda-form';
import { Header } from '@/components/layout/header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePenaltyCheck } from '@/hooks/use-penalty-check';
import { useVerification } from '@/hooks/use-verification';

export default function CreateRondaPage() {
  const { verificationState } = useVerification();
  const { hasPenalties, penaltyCount, isLoading: isPenaltyCheckLoading } = usePenaltyCheck();
  const [showForm, setShowForm] = useState(false);

  // Check if user can create RONDA (verified and no penalties)
  const canCreateRonda = verificationState.isReadyToJoin && !hasPenalties;

  const renderIntroSection = () => (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </Button>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Create New RONDA</h1>
          <p className="text-xl text-muted-foreground">
            Launch your own rotating savings circle with customizable parameters
          </p>
        </div>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Flexible Participation</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Set participant count from 2-50 members with customizable milestone duration
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-success/20">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center mb-2">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <CardTitle className="text-lg">Custom Amounts</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Define monthly deposits and entry fees with support for ETH and ERC20 tokens
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-warning/20">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-warning" />
            </div>
            <CardTitle className="text-lg">Interest Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Choose from Conservative, Balanced, or Aggressive interest distribution strategies
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border-info/20">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center mb-2">
              <Shield className="h-5 w-5 text-info" />
            </div>
            <CardTitle className="text-lg">Smart Contract Security</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Automated deployment with built-in security features and transparent operations
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Requirements */}
      <Card className="border-l-4 border-l-info">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-info" />
            <span>Requirements to Create a RONDA</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Verification Requirements</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {verificationState.isWorldIdVerified ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  )}
                  <span className="text-sm">World ID verification</span>
                </div>
                <div className="flex items-center space-x-2">
                  {verificationState.isWalletConnected ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  )}
                  <span className="text-sm">Wallet connection</span>
                </div>
                <div className="flex items-center space-x-2">
                  {isPenaltyCheckLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : !hasPenalties ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-sm">No penalty tokens</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-sm">Sufficient ETH for gas fees</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Technical Requirements</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>• Valid ERC20 token contract address</div>
                <div>• Minimum 2 participants, maximum 50</div>
                <div>• Duration between 2-12 months</div>
                <div>• Interest distribution must sum to zero</div>
                <div>• Factory contract deployment gas (~0.02-0.05 ETH)</div>
              </div>
            </div>
          </div>

          {/* Penalty Token Warning */}
          {hasPenalties && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have {penaltyCount} penalty token{penaltyCount !== 1 ? 's' : ''} and cannot create RONDAs. 
                Please resolve your penalties before creating a new RONDA.
              </AlertDescription>
            </Alert>
          )}

          {!verificationState.isReadyToJoin && !hasPenalties && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You must complete verification before creating a RONDA.{' '}
                <Link href="/auth" className="underline hover:no-underline">
                  Complete verification here
                </Link>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="text-center">
        {canCreateRonda ? (
          <Button 
            size="lg" 
            onClick={() => setShowForm(true)}
            className="text-lg px-8 py-6"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New RONDA
          </Button>
        ) : (
          <Button size="lg" disabled variant="outline" className="text-lg px-8 py-6">
            {isPenaltyCheckLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Checking Eligibility...
              </>
            ) : hasPenalties ? (
              <>
                <AlertTriangle className="h-5 w-5 mr-2" />
                Cannot Create - Penalty Tokens Detected
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 mr-2" />
                Complete Verification First
              </>
            )}
          </Button>
        )}
        
        {!canCreateRonda && !isPenaltyCheckLoading && (
          <p className="text-sm text-muted-foreground mt-2">
            {hasPenalties 
              ? `You have ${penaltyCount} penalty token${penaltyCount !== 1 ? 's' : ''} that must be resolved first`
              : 'Complete World ID verification and wallet connection to create RONDAs'
            }
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-16">
        <main className="container-max container-padding py-8">
          <div className="max-w-6xl mx-auto">
            {!showForm ? (
              renderIntroSection()
            ) : (
              <div className="space-y-6">
                {/* Form Header */}
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold">RONDA Configuration</h1>
                    <p className="text-muted-foreground">
                      Configure your rotating savings circle parameters
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowForm(false)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Overview
                  </Button>
                </div>

                {/* Form Component */}
                <CreateRondaForm />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}