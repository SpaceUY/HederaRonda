'use client';

import {
  Users,
  Calendar,
  DollarSign,
  Clock,
  Shield,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Network,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { notFound } from 'next/navigation';

import { JoinButton } from '@/components/group/join-button';
import { Header } from '@/components/layout/header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSingleRondaContract } from '@/hooks/use-single-ronda-contract';
import { useTokenFormatter } from '@/hooks/use-token-formatter';
import { useVerification } from '@/hooks/use-verification';
import { formatDate } from '@/lib/utils';

interface GroupDetailPageProps {
  params: {
    id: string;
  };
}

export default function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { ronda, isLoading, error, refetch } = useSingleRondaContract(
    params.id
  );
  const { verificationState } = useVerification();

  // Use token formatter for dynamic amount formatting - pass the raw contract values
  const {
    monthlyDeposit: formattedMonthlyDeposit,
    entryFee: formattedEntryFee,
    totalContribution: formattedTotalContribution,
    isLoading: isFormattingAmounts,
  } = useTokenFormatter(
    params.id,
    ronda?.monthlyDeposit, // Raw contract value (string)
    ronda?.maxParticipants
  );

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16">
          <main className="container-max container-padding py-8">
            <div className="mx-auto max-w-2xl">
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Failed to load RONDA contract: {error}</span>
                  <Button variant="outline" size="sm" onClick={refetch}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>

              <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
                <Network className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">
                  Contract Not Found
                </h3>
                <p className="mb-4 text-muted-foreground">
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
            <div className="mx-auto max-w-4xl">
              <div className="flex items-center justify-center p-8">
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      Loading RONDA Contract
                    </h3>
                    <p className="text-muted-foreground">
                      Fetching data from Sepolia testnet...
                    </p>
                    <p className="mt-2 font-mono text-sm text-muted-foreground">
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Header */}
      <div className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-success/5 pt-16">
        <div className="container-max container-padding py-12">
          <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>RONDA Smart Contract</span>
              <span>•</span>
              <span className="font-mono">
                {ronda.address.slice(0, 10)}...{ronda.address.slice(-8)}
              </span>
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
              <h1 className="text-4xl font-bold">RONDA Savings Circle</h1>
              <p className="max-w-3xl text-xl text-muted-foreground">
                Join {ronda.maxParticipants} members saving{' '}
                {isFormattingAmounts ? (
                  <span className="inline-block h-6 w-32 animate-pulse rounded bg-muted" />
                ) : (
                  formattedMonthlyDeposit ||
                  `${ronda.monthlyDepositFormatted.toFixed(4)} ${ronda.tokenSymbol}`
                )}{' '}
                with secure smart contract automation
              </p>
            </div>

            {/* Status and Key Metrics */}
            <div className="flex flex-wrap items-center gap-4">
              <Badge
                variant="outline"
                className={`${getStatusColor(ronda.state)} px-4 py-2 text-base`}
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
                      {ronda.availableSpots} spot
                      {ronda.availableSpots !== 1 ? 's' : ''} remaining
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container-max container-padding py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
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
                  <h4 className="font-medium">
                    Participation Progress ({ronda.participantCount}/
                    {ronda.maxParticipants})
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {Array.from(
                      { length: ronda.maxParticipants },
                      (_, index) => {
                        const isOccupied = index < ronda.participantCount;
                        const isYourSpot =
                          index === ronda.participantCount &&
                          ronda.state === 'Open';

                        return (
                          <div
                            key={index}
                            className="flex flex-col items-center space-y-2"
                          >
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-xs font-medium ${
                                isYourSpot
                                  ? 'animate-pulse border-warning bg-warning/10 text-warning'
                                  : isOccupied
                                    ? 'border-success bg-success/10 text-success'
                                    : 'border-muted bg-muted text-muted-foreground'
                              }`}
                            >
                              {isYourSpot ? 'YOU' : index + 1}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {isYourSpot
                                ? 'Your spot'
                                : isOccupied
                                  ? 'Filled'
                                  : 'Open'}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Key Details */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>Monthly</span>
                    </div>
                    <div className="text-lg font-semibold">
                      {isFormattingAmounts ? (
                        <div className="h-6 w-20 animate-pulse rounded bg-muted" />
                      ) : (
                        formattedMonthlyDeposit ||
                        `${ronda.monthlyDepositFormatted.toFixed(4)} ${ronda.tokenSymbol}`
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Duration</span>
                    </div>
                    <div className="text-lg font-semibold">
                      {ronda.milestoneCount} months
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Started</span>
                    </div>
                    <div className="text-lg font-semibold">
                      {formatDate(ronda.creationDate || ronda.startDate, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Available</span>
                    </div>
                    <div className="text-lg font-semibold text-warning">
                      {ronda.availableSpots} spots
                    </div>
                  </div>
                </div>

                {/* Total Payout Information */}
                <div className="rounded-lg border border-success/20 bg-success/5 p-4">
                  <h4 className="mb-2 font-medium text-success">
                    Total Payout
                  </h4>
                  <p className="mb-2 text-sm">
                    Each member will receive{' '}
                    <span className="font-semibold text-foreground">
                      {isFormattingAmounts ? (
                        <span className="inline-block h-4 w-24 animate-pulse rounded bg-muted" />
                      ) : (
                        formattedTotalContribution ||
                        `${ronda.totalContribution.toFixed(4)} ${ronda.tokenSymbol}`
                      )}
                    </span>{' '}
                    when it's their turn to receive the payout.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This is the total of all monthly contributions from{' '}
                    {ronda.maxParticipants} members
                  </p>
                </div>
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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="font-medium">Smart Contract Features</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                        <span>Automated monthly payments</span>
                      </li>
                      <li className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                        <span>Transparent milestone tracking</span>
                      </li>
                      <li className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                        <span>Immutable payout schedule</span>
                      </li>
                      <li className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                        <span>No intermediary fees</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Reputation System</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                        <span>World ID verification required</span>
                      </li>
                      <li className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                        <span>On-chain payment history</span>
                      </li>
                      <li className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                        <span>Penalty protection system</span>
                      </li>
                      <li className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                        <span>Community governance</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/30 p-4">
                  <h4 className="mb-2 font-medium">Contract Information</h4>
                  <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                    <div>
                      <span className="text-muted-foreground">
                        Contract Address:
                      </span>
                      <div className="mt-1 font-mono text-xs">
                        {ronda.address}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Payment Token:
                      </span>
                      <div className="mt-1 font-medium">
                        {ronda.isETH
                          ? 'Native ETH'
                          : `${ronda.tokenSymbol} Token`}
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
                    <span>
                      Payment Milestones (
                      {ronda.milestones.filter((m) => m.isCompleted).length}/
                      {ronda.milestones.length})
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Track monthly payment progress and payouts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ronda.milestones.slice(0, 6).map((milestone) => (
                      <div
                        key={milestone.index}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                              milestone.isCompleted
                                ? 'bg-success/20 text-success'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {milestone.isCompleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <span className="text-xs font-medium">
                                {milestone.index + 1}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              Month {milestone.index + 1}
                            </div>
                            {milestone.date && (
                              <div className="text-sm text-muted-foreground">
                                {formatDate(milestone.date)}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={
                            milestone.isCompleted ? 'default' : 'outline'
                          }
                        >
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
                    {ronda.participants
                      .slice(0, 5)
                      .map((participant, index) => (
                        <div
                          key={participant}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                              <span className="text-xs font-medium">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <span className="font-mono text-sm">
                                {participant.slice(0, 10)}...
                                {participant.slice(-8)}
                              </span>
                              <div className="text-xs text-muted-foreground">
                                Position #{index + 1}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="outline"
                              className="border-success/20 bg-success/10 text-success"
                            >
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
                    : 'This RONDA is full'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <JoinButton
                  group={ronda}
                  isDisabled={
                    ronda.availableSpots === 0 || ronda.state !== 'Open'
                  }
                />

                {/* Only show Next Steps if user is not verified */}
                {!verificationState.isReadyToJoin && (
                  <div className="rounded-lg border border-info/20 bg-info/5 p-3">
                    <div className="space-y-1 text-sm">
                      <div className="font-medium text-info">Next Steps:</div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div>1. Verify identity with World ID</div>
                        <div>2. Connect your crypto wallet</div>
                        <div>3. Check for penalty tokens</div>
                        <div>4. Approve and join the RONDA</div>
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
                    {ronda.isETH ? 'Native ETH' : `${ronda.tokenSymbol} Token`}
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
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Deposit</span>
                  <span className="font-medium">
                    {isFormattingAmounts ? (
                      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                    ) : (
                      formattedMonthlyDeposit ||
                      `${ronda.monthlyDepositFormatted.toFixed(4)} ${ronda.tokenSymbol}`
                    )}
                  </span>
                </div>
                {ronda.entryFeeFormatted > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Entry Fee</span>
                    <span className="font-medium">
                      {isFormattingAmounts ? (
                        <div className="h-4 w-12 animate-pulse rounded bg-muted" />
                      ) : (
                        formattedEntryFee ||
                        `${ronda.entryFeeFormatted.toFixed(4)} ${ronda.tokenSymbol}`
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Payout</span>
                  <span className="font-medium text-success">
                    {isFormattingAmounts ? (
                      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    ) : (
                      formattedTotalContribution ||
                      `${ronda.totalContribution.toFixed(4)} ${ronda.tokenSymbol}`
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
