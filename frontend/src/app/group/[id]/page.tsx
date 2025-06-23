'use client';

import { Users, Calendar, DollarSign, Clock, Shield, CheckCircle, AlertTriangle, RefreshCw, Network, ExternalLink, Zap } from 'lucide-react';
import { notFound } from 'next/navigation';

import { JoinButton } from '@/components/group/join-button';
import { Header } from '@/components/layout/header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSingleRondaContract } from '@/hooks/use-single-ronda-contract';
import { useVerification } from '@/hooks/use-verification';
import { formatCurrency, formatDate } from '@/lib/utils';

interface GroupDetailPageProps {
  params: {
    id: string;
  };
}

export default function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { ronda, isLoading, error, refetch } = useSingleRondaContract(params.id);
  const { verificationState } = useVerification();

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16">
          <main className="container-max container-padding py-8">
            <div className="max-w-2xl mx-auto">
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Failed to load RONDA contract: {error}</span>
                  <Button variant="outline" size="sm" onClick={refetch}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
              
              <div className="p-8 text-center bg-muted/30 rounded-lg border border-dashed">
                <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Contract Not Found</h3>
                <p className="text-muted-foreground mb-4">
                  The RONDA contract at address {params.id} could not be loaded.
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Verify the contract address is correct</p>
                  <p>• Check that the contract is deployed on Sepolia</p>
                  <p>• Ensure your network connection is stable</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16">
          <main className="container-max container-padding py-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <RefreshCw className="h-6 w-6 text-primary animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Loading RONDA Contract</h3>
                    <p className="text-muted-foreground">Fetching data from Sepolia testnet...</p>
                    <p className="text-sm text-muted-foreground font-mono mt-2">
                      {params.id.slice(0, 10)}...{params.id.slice(-8)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!ronda) {
    notFound();
  }

  const getStatusColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'open':
        return 'bg-success/10 text-success border-success/20';
      case 'running':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'finalized':
        return 'bg-info/10 text-info border-info/20';
      case 'aborted':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'randomizing':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusText = (state: string) => {
    switch (state.toLowerCase()) {
      case 'open':
        return '🟢 Open for Registration';
      case 'running':
        return '🟡 Active - Monthly Payments';
      case 'finalized':
        return '✅ Successfully Completed';
      case 'aborted':
        return '❌ Cancelled';
      case 'randomizing':
        return '🔄 Assigning Positions...';
      default:
        return state;
    }
  };

  const formatMonthlyAmount = () => {
    const amount = ronda.monthlyDepositFormatted;
    const token = ronda.paymentToken === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'USDC';
    
    if (amount < 0.001) {
      return `${(amount * 1000).toFixed(2)} mETH monthly`;
    }
    return `${amount.toFixed(3)} ${token} monthly`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Header */}
      <div className="pt-16 bg-gradient-to-br from-primary/5 via-background to-success/5 border-b border-border">
        <div className="container-max container-padding py-12">
          <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>RONDA Smart Contract</span>
              <span>•</span>
              <span className="font-mono">{ronda.address.slice(0, 10)}...{ronda.address.slice(-8)}</span>
              <Button variant="ghost" size="sm" asChild className="ml-2">
                <a 
                  href={`https://sepolia.etherscan.io/address/${ronda.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Etherscan</span>
                </a>
              </Button>
            </div>

            {/* Main Title */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold">
                RONDA Savings Circle
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl">
                Join {ronda.maxParticipants} members saving {formatMonthlyAmount()} with secure smart contract automation
              </p>
            </div>

            {/* Status and Key Metrics */}
            <div className="flex flex-wrap items-center gap-4">
              <Badge 
                variant="outline" 
                className={`${getStatusColor(ronda.state)} text-base px-4 py-2`}
              >
                {getStatusText(ronda.state)}
              </Badge>
              
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {ronda.participantCount} of {ronda.maxParticipants} joined
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {ronda.milestoneCount} months duration
                  </span>
                </div>
                
                {ronda.availableSpots > 0 && (
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-warning" />
                    <span className="font-medium text-warning">
                      {ronda.availableSpots} spot{ronda.availableSpots !== 1 ? 's' : ''} remaining
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container-max container-padding py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>How This RONDA Works</span>
                </CardTitle>
                <CardDescription>
                  Simple, transparent, and automated savings circle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Visualization */}
                <div className="space-y-4">
                  <h4 className="font-medium">Participation Progress ({ronda.participantCount}/{ronda.maxParticipants})</h4>
                  <div className="flex flex-wrap gap-3">
                    {Array.from({ length: ronda.maxParticipants }, (_, index) => {
                      const isOccupied = index < ronda.participantCount;
                      const isYourSpot = index === ronda.participantCount && ronda.state === 'Open';
                      
                      return (
                        <div key={index} className="flex flex-col items-center space-y-2">
                          <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                            isYourSpot
                              ? 'border-warning bg-warning/10 text-warning animate-pulse'
                              : isOccupied 
                              ? 'border-success bg-success/10 text-success' 
                              : 'border-muted bg-muted text-muted-foreground'
                          }`}>
                            {isYourSpot ? 'YOU' : index + 1}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {isYourSpot ? 'Your spot' : isOccupied ? 'Filled' : 'Open'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Key Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>Monthly</span>
                    </div>
                    <div className="font-semibold text-lg">
                      {ronda.monthlyDepositFormatted.toFixed(4)} ETH
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Duration</span>
                    </div>
                    <div className="font-semibold text-lg">
                      {ronda.milestoneCount} months
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Started</span>
                    </div>
                    <div className="font-semibold text-lg">
                      {formatDate(ronda.creationDate || ronda.startDate, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Available</span>
                    </div>
                    <div className="font-semibold text-lg text-warning">
                      {ronda.availableSpots} spots
                    </div>
                  </div>
                </div>

                {/* Entry Fee */}
                {ronda.entryFeeFormatted > 0 && (
                  <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
                    <h4 className="font-medium mb-2 text-warning">Entry Fee Required</h4>
                    <p className="text-sm mb-2">
                      This RONDA requires a one-time entry fee of{' '}
                      <span className="font-semibold text-foreground">
                        {ronda.entryFeeFormatted.toFixed(4)} ETH
                      </span>{' '}
                      to join, plus your first monthly contribution.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total to join: {(ronda.entryFeeFormatted + ronda.monthlyDepositFormatted).toFixed(4)} ETH
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Smart Contract Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security & Transparency</span>
                </CardTitle>
                <CardDescription>
                  Powered by audited smart contracts on Ethereum
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Smart Contract Features</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span>Automated monthly payments</span>
                      </li>
                      <li className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span>Transparent milestone tracking</span>
                      </li>
                      <li className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span>Immutable payout schedule</span>
                      </li>
                      <li className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span>No intermediary fees</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Reputation System</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span>World ID verification required</span>
                      </li>
                      <li className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span>On-chain payment history</span>
                      </li>
                      <li className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span>Penalty protection system</span>
                      </li>
                      <li className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span>Community governance</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium mb-2">Contract Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Contract Address:</span>
                      <div className="font-mono text-xs mt-1">{ronda.address}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Payment Token:</span>
                      <div className="font-medium mt-1">
                        {ronda.paymentToken === '0x0000000000000000000000000000000000000000' 
                          ? 'Native ETH' 
                          : `Token: ${ronda.paymentToken.slice(0, 10)}...`
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Milestones Progress */}
            {ronda.milestones.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Payment Milestones ({ronda.milestones.filter(m => m.isCompleted).length}/{ronda.milestones.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Track monthly payment progress and payouts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ronda.milestones.slice(0, 6).map((milestone) => (
                      <div key={milestone.index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            milestone.isCompleted 
                              ? 'bg-success/20 text-success' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {milestone.isCompleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <span className="text-xs font-medium">{milestone.index + 1}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">Month {milestone.index + 1}</div>
                            {milestone.date && (
                              <div className="text-sm text-muted-foreground">
                                {formatDate(milestone.date)}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant={milestone.isCompleted ? "default" : "outline"}>
                          {milestone.isCompleted ? '✅ Paid' : '⏳ Pending'}
                        </Badge>
                      </div>
                    ))}
                    {ronda.milestones.length > 6 && (
                      <div className="text-center text-sm text-muted-foreground">
                        ... and {ronda.milestones.length - 6} more milestones
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Participants - Moved from sidebar */}
            {ronda.participants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Current Members ({ronda.participants.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Verified participants in this RONDA
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {ronda.participants.slice(0, 5).map((participant, index) => (
                      <div key={participant} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">{index + 1}</span>
                          </div>
                          <div>
                            <span className="font-mono text-sm">
                              {participant.slice(0, 10)}...{participant.slice(-8)}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              Position #{index + 1}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                            Verified
                          </Badge>
                          <Button variant="ghost" size="sm" asChild>
                            <a 
                              href={`https://sepolia.etherscan.io/address/${participant}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                    {ronda.participants.length > 5 && (
                      <div className="text-center text-sm text-muted-foreground">
                        ... and {ronda.participants.length - 5} more members
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join Action */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Join This RONDA</CardTitle>
                <CardDescription>
                  {ronda.availableSpots > 0 
                    ? `${ronda.availableSpots} spot${ronda.availableSpots !== 1 ? 's' : ''} remaining`
                    : 'This RONDA is full'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <JoinButton 
                  group={ronda}
                  isDisabled={ronda.availableSpots === 0 || ronda.state !== 'Open'}
                />

                {/* Only show Next Steps if user is not verified */}
                {!verificationState.isReadyToJoin && (
                  <div className="p-3 bg-info/5 rounded-lg border border-info/20">
                    <div className="text-sm space-y-1">
                      <div className="font-medium text-info">Next Steps:</div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>1. Verify identity with World ID</div>
                        <div>2. Connect your crypto wallet</div>
                        <div>3. Approve and join the RONDA</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contract Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contract Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">State</span>
                  <span className="font-medium">{ronda.state}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Network</span>
                  <span className="font-medium">Sepolia Testnet</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Token</span>
                  <span className="font-medium">
                    {ronda.paymentToken === '0x0000000000000000000000000000000000000000' 
                      ? 'ETH' 
                      : `${ronda.paymentToken.slice(0, 6)}...${ronda.paymentToken.slice(-4)}`
                    }
                  </span>
                </div>
                {ronda.creator && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Creator</span>
                    <span className="font-mono text-sm">
                      {ronda.creator.slice(0, 6)}...{ronda.creator.slice(-4)}
                    </span>
                  </div>
                )}
                {ronda.totalDepositedFormatted !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Deposited</span>
                    <span className="font-medium">{ronda.totalDepositedFormatted.toFixed(4)} ETH</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}