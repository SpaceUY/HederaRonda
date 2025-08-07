'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  Award,
  Clock,
  DollarSign,
  Eye,
  Network,
  RefreshCw,
  Users,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { RondaContractData } from '@/hooks/use-ronda-contracts';
import { tokenFormatter } from '@/lib/token-formatter';

interface ContractGroupsGridProps {
  rondas: RondaContractData[];
  isLoading: boolean;
  error: string | null;
  onRefetch: () => void;
}

interface FormattedAmounts {
  [contractAddress: string]: {
    monthlyDeposit: string;
    entryFee: string;
    totalContribution: string;
    joinCost: string;
  };
}

export function ContractGroupsGrid({
  rondas,
  isLoading,
  error,
  onRefetch,
}: ContractGroupsGridProps) {
  const [formattedAmounts, setFormattedAmounts] = useState<FormattedAmounts>(
    {}
  );
  const [isFormattingAmounts, setIsFormattingAmounts] = useState(false);

  // Format amounts for all RONDAs
  useEffect(() => {
    const formatAllAmounts = async () => {
      if (rondas.length === 0) {
        return;
      }

      setIsFormattingAmounts(true);
      const newFormattedAmounts: FormattedAmounts = {};

      try {
        await Promise.all(
          rondas.map(async (ronda) => {
            try {
              const [monthlyDeposit, entryFee, totalContribution] =
                await Promise.all([
                  tokenFormatter.formatMonthlyDeposit(
                    ronda.address,
                    ronda.monthlyDeposit
                  ),
                  tokenFormatter.formatEntryFee(ronda.address),
                  tokenFormatter.formatTotalContribution(
                    ronda.address,
                    ronda.monthlyDeposit,
                    ronda.maxParticipants
                  ),
                ]);

              const entryFeeNumeric = ronda.entryFeeFormatted;
              const totalJoinCost = entryFeeNumeric;

              // Get token info for join cost formatting
              const tokenInfo = await tokenFormatter.getPaymentTokenInfo(
                ronda.address
              );
              const joinCostBigInt = BigInt(
                Math.floor(totalJoinCost * 10 ** tokenInfo.decimals)
              );
              const joinCost = tokenFormatter.formatAmount(
                joinCostBigInt,
                tokenInfo.decimals,
                tokenInfo.symbol
              );

              newFormattedAmounts[ronda.address] = {
                monthlyDeposit,
                entryFee,
                totalContribution,
                joinCost: entryFeeNumeric > 0 ? joinCost : monthlyDeposit,
              };
            } catch (error) {
              console.error(
                `❌ Error formatting amounts for ${ronda.address}:`,
                error
              );
              // Fallback formatting with token symbol from Ronda data
              newFormattedAmounts[ronda.address] = {
                monthlyDeposit: `${ronda.monthlyDepositFormatted.toFixed(4)} ${ronda.paymentTokenSymbol}`,
                entryFee: `${ronda.entryFeeFormatted.toFixed(4)} ${ronda.paymentTokenSymbol}`,
                totalContribution: `${(ronda.monthlyDepositFormatted * ronda.maxParticipants).toFixed(4)} ${ronda.paymentTokenSymbol}`,
                joinCost: `${(ronda.monthlyDepositFormatted + ronda.entryFeeFormatted).toFixed(4)} ${ronda.paymentTokenSymbol}`,
              };
            }
          })
        );

        setFormattedAmounts(newFormattedAmounts);
      } catch (error) {
        console.error('❌ Error formatting amounts:', error);
      } finally {
        setIsFormattingAmounts(false);
      }
    };

    formatAllAmounts();
  }, [rondas]);

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

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load RONDA contracts via proxy: {error}</span>
            <Button variant="outline" size="sm" onClick={onRefetch}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>

        <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
          <Network className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">
            Proxy Connection Failed
          </h3>
          <p className="mb-4 text-muted-foreground">
            Unable to connect to the RONDA factory contract on Hedera testnet.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Check your internet connection</p>
            <p>• Verify Hedera network is accessible</p>
            <p>• Proxy address: 0xA2AC48Cf8113677F9D708fF91dfBB6464E386368</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Loading RONDA Contracts</h3>
              <p className="text-muted-foreground">
                Fetching data from Hedera testnet...
              </p>
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="space-y-4">
                <div className="space-y-2">
                  <div className="h-6 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-6 w-2/3 rounded bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-muted" />
                    <div className="h-6 w-2/3 rounded bg-muted" />
                  </div>
                </div>
                <div className="h-10 w-full rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (rondas.length === 0) {
    return (
      <div className="space-y-6">
        <Alert>
          <Network className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>No RONDA contracts found on Hedera testnet</span>
            <Button variant="outline" size="sm" onClick={onRefetch}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </AlertDescription>
        </Alert>

        <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
          <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No RONDAs Available</h3>
          <p className="mb-4 text-muted-foreground">
            No RONDA contracts are currently available on Hedera testnet
            testnet.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Proxy Contract: 0xA2AC48Cf8113677F9D708fF91dfBB6464E386368</p>
            <p>• Network: Hedera Testnet (Chain ID: 296)</p>
            <p>• Check back later for new RONDAs</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Loading indicator for amount formatting */}
      {isFormattingAmounts && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Formatting token amounts from smart contracts...
          </AlertDescription>
        </Alert>
      )}

      {/* RONDA Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rondas.map((ronda, index) => {
          const availableSpots = ronda.maxParticipants - ronda.participantCount;
          const completionPercentage =
            (ronda.participantCount / ronda.maxParticipants) * 100;
          const formatted = formattedAmounts[ronda.address];

          return (
            <Card
              key={ronda.address}
              className="group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <CardHeader className="flex-shrink-0 space-y-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Status Badge */}
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(ronda.state)} text-sm font-medium`}
                    >
                      {getStatusText(ronda.state)}
                    </Badge>

                    {/* RONDA Title */}
                    <div>
                      <h3 className="text-xl font-bold transition-colors group-hover:text-primary">
                        RONDA #{index + 1}
                      </h3>
                      <div className="mt-1 font-mono text-sm text-muted-foreground">
                        {ronda.address.slice(0, 8)}...{ronda.address.slice(-6)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col space-y-6 pt-0">
                {/* Key Metrics Grid */}
                <div className="grid flex-shrink-0 grid-cols-2 gap-4">
                  {/* Participants */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Participants</span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-lg font-bold">
                        {ronda.participantCount} of {ronda.maxParticipants}
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(completionPercentage)}% filled
                      </div>
                    </div>
                  </div>

                  {/* Monthly Amount */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>Monthly</span>
                    </div>
                    <div className="text-lg font-bold">
                      {formatted?.monthlyDeposit ||
                        `${ronda.monthlyDepositFormatted.toFixed(4)} ${ronda.paymentTokenSymbol}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      per member
                    </div>
                  </div>
                </div>

                {/* Duration and Available Spots */}
                <div className="grid flex-shrink-0 grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Duration</span>
                    </div>
                    <div className="font-semibold">
                      {ronda.milestoneCount} months
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Available</span>
                    </div>
                    <div className="font-semibold text-warning">
                      {availableSpots} spots
                    </div>
                  </div>
                </div>

                {/* Basic Information - Only show for Open RONDAs */}
                {ronda.state === 'Open' && (
                  <div className="flex-shrink-0 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-success/5 p-4">
                    <div className="mb-2 flex items-center space-x-2">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">RONDA Details</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Monthly Deposit:
                        </span>
                        <span className="font-semibold">
                          {formatted?.monthlyDeposit ||
                            `${ronda.monthlyDepositFormatted.toFixed(4)} ${ronda.paymentTokenSymbol}`}
                        </span>
                      </div>
                      {availableSpots > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Available Spots:
                          </span>
                          <span className="font-semibold text-warning">
                            {availableSpots} remaining
                          </span>
                        </div>
                      )}
                      {ronda.entryFeeFormatted > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Entry Fee:
                          </span>
                          <span className="font-semibold">
                            {formatted?.entryFee ||
                              `${ronda.entryFeeFormatted.toFixed(3)} ${ronda.paymentTokenSymbol}`}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Total Payout:
                        </span>
                        <span className="font-semibold text-success">
                          {formatted?.totalContribution ||
                            `${(ronda.monthlyDepositFormatted * ronda.maxParticipants).toFixed(4)} ${ronda.paymentTokenSymbol}`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress for Active RONDAs */}
                {ronda.state === 'Running' && (
                  <div className="flex-shrink-0 rounded-lg border border-warning/20 bg-warning/5 p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Month Progress
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Active payments
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-warning transition-all duration-300"
                          style={{ width: '75%' }} // Mock progress
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Next payout in ~15 days
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button - pushed to bottom */}
                <div className="mt-auto pt-4">
                  {ronda.state === 'Open' ? (
                    <Button
                      className="w-full py-6 text-base font-semibold transition-colors group-hover:bg-primary/90"
                      asChild
                    >
                      <Link href={`/group/${ronda.address}`}>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Join for{' '}
                        {formatted?.joinCost ||
                          `${ronda.entryFeeFormatted.toFixed(4)} ${ronda.paymentTokenSymbol}`}
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full transition-colors group-hover:bg-accent"
                      disabled={ronda.state === 'Aborted'}
                      asChild
                    >
                      <Link href={`/group/${ronda.address}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Proxy Information Footer */}
      <div className="mt-8 rounded-lg border border-info/20 bg-info/5 p-4">
        <div className="mb-2 flex items-center space-x-2">
          <Network className="h-4 w-4 text-info" />
          <span className="text-sm font-medium text-info">
            Connected via Proxy
          </span>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div>Proxy Contract: 0xA2AC48Cf8113677F9D708fF91dfBB6464E386368</div>
          <div>
            Network: Hedera Testnet • Live data from RONDA smart contracts
          </div>
          <div>
            Token amounts dynamically formatted from payment token contracts
          </div>
        </div>
      </div>
    </div>
  );
}
