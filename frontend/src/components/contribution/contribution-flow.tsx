'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Calendar, CheckCircle, ChevronRight, DollarSign, Home, Loader2, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DepositButton } from './deposit-button';
import { Header } from '@/components/layout/header';
import Link from 'next/link';
import { useRondaDeposit } from '@/hooks/use-ronda-deposit';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ContributionFlowProps {
  group: any; // RONDA contract data
}

export function ContributionFlow({ group }: ContributionFlowProps) {
  const [selectedMilestone, setSelectedMilestone] = useState(0);
  const router = useRouter();
  
  const { isMember, isCheckingMembership } = useRondaDeposit({
    roscaContractAddress: group.address
  });

  const handleDepositSuccess = () => {
    // Redirect to the RONDA details page after successful deposit
    setTimeout(() => {
      router.push(`/group/${group.address}`);
    }, 2000); // Wait 2 seconds to show success message
  };

  const renderPageHeader = () => (
    <div className="pt-16 bg-muted/30 border-b border-border">
      <div className="container-max container-padding py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <Button variant="ghost" size="sm" asChild className="h-auto p-0 hover:bg-transparent">
            <Link href="/" className="flex items-center space-x-1 hover:text-foreground">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
          </Button>
          <ChevronRight className="h-4 w-4" />
          <Button variant="ghost" size="sm" asChild className="h-auto p-0 hover:bg-transparent">
            <Link href="/dashboard" className="hover:text-foreground">
              RONDAs
            </Link>
          </Button>
          <ChevronRight className="h-4 w-4" />
          <Button variant="ghost" size="sm" asChild className="h-auto p-0 hover:bg-transparent">
            <Link href={`/group/${group.address}`} className="hover:text-foreground">
              RONDA #{group.address.slice(-6)}
            </Link>
          </Button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Contribute</span>
        </nav>

        {/* Page Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Monthly Contribution</h1>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              RONDA Member
            </Badge>
            <span className="text-sm text-muted-foreground">
              for RONDA {group.address.slice(0, 10)}...{group.address.slice(-8)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Check if user is a member before showing contribution options
  if (isCheckingMembership) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        {renderPageHeader()}
        <main className="container-max container-padding py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Verifying Membership</h3>
                <p className="text-muted-foreground">
                  Checking your membership status in this RONDA...
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        {renderPageHeader()}
        <main className="container-max container-padding py-8">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You are not a member of this RONDA. Only members can make monthly contributions.
              </AlertDescription>
            </Alert>
            
            <div className="p-8 text-center bg-muted/30 rounded-lg border border-dashed">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Membership Required</h3>
              <p className="text-muted-foreground mb-4">
                You must be a member of this RONDA to make monthly contributions.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground mb-6">
                <p>• Join the RONDA first to become a member</p>
                <p>• Complete identity verification with World ID</p>
                <p>• Connect your wallet and approve the initial deposit</p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button asChild variant="outline">
                  <Link href={`/group/${group.address}`}>
                    View RONDA Details
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/dashboard">
                    Browse Other RONDAs
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {renderPageHeader()}
      <main className="container-max container-padding py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Amount Display */}
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold">
                {group.monthlyDepositFormatted?.toFixed(4)} {group.tokenSymbol || 'HBAR'}
              </CardTitle>
              <CardDescription>Monthly contribution amount</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">RONDA Contract:</span>
                <span className="font-mono text-sm">
                  {group.address.slice(0, 10)}...{group.address.slice(-8)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payment Token:</span>
                <span className="font-medium">
                  {group.isETH ? 'Native ETH' : `${group.tokenSymbol || 'ERC20'} Token`}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your Position:</span>
                <span className="font-medium">Member #{group.participantCount || 1}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Milestones:</span>
                <span className="font-medium">{group.milestoneCount || group.duration} months</span>
              </div>
            </CardContent>
          </Card>

          {/* Milestone Selection */}
          {group.milestones && group.milestones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Select Milestone</span>
                </CardTitle>
                <CardDescription>
                  Choose which milestone to make your contribution for
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {group.milestones.slice(0, 6).map((milestone: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedMilestone(index)}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        selectedMilestone === index
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            milestone.isCompleted 
                              ? 'bg-success/20 text-success' 
                              : selectedMilestone === index
                              ? 'bg-primary/20 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {milestone.isCompleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <span className="text-xs font-medium">{index + 1}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">Milestone {index + 1}</div>
                            <div className="text-sm text-muted-foreground">
                              Month {index + 1} contribution
                            </div>
                          </div>
                        </div>
                        <Badge variant={milestone.isCompleted ? "default" : selectedMilestone === index ? "default" : "outline"}>
                          {milestone.isCompleted ? '✅ Complete' : selectedMilestone === index ? '👈 Selected' : '⏳ Pending'}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
                
                {group.milestones.length > 6 && (
                  <div className="text-center text-sm text-muted-foreground">
                    ... and {group.milestones.length - 6} more milestones
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Deposit Action */}
          <Card>
            <CardHeader>
              <CardTitle>Make Your Contribution</CardTitle>
              <CardDescription>
                Submit your monthly deposit for milestone {selectedMilestone + 1}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DepositButton
                group={group}
                milestone={selectedMilestone}
                onSuccess={handleDepositSuccess}
              />
            </CardContent>
          </Card>

          {/* RONDA Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>RONDA Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">State:</span>
                  <div className="font-medium">{group.state}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Members:</span>
                  <div className="font-medium">{group.participantCount}/{group.maxParticipants}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Monthly Amount:</span>
                  <div className="font-medium">
                    {group.monthlyDepositFormatted?.toFixed(4)} {group.tokenSymbol || 'ETH'}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Payout:</span>
                  <div className="font-medium text-success">
                    {group.totalContribution?.toFixed(4)} {group.tokenSymbol || 'ETH'}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-info/5 rounded-lg border border-info/20">
                <h4 className="font-medium mb-2 text-info">Important Notes</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Make sure to contribute before the deadline each month</li>
                  <li>• Your tokens will be held securely in the smart contract</li>
                  <li>• You'll receive your payout when it's your turn</li>
                  <li>• All transactions are recorded on the blockchain</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}