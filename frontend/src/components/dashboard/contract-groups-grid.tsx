'use client';

import { Calendar, Users, DollarSign, Clock, Eye, RefreshCw, AlertTriangle, Network, TrendingUp, Award } from 'lucide-react';
import Link from 'next/link';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { RondaContractData } from '@/hooks/use-ronda-contracts';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ContractGroupsGridProps {
  rondas: RondaContractData[];
  isLoading: boolean;
  error: string | null;
  onRefetch: () => void;
}

export function ContractGroupsGrid({ rondas, isLoading, error, onRefetch }: ContractGroupsGridProps) {
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

  const getStatusIcon = (state: string) => {
    switch (state.toLowerCase()) {
      case 'open':
        return '🟢';
      case 'running':
        return '🟡';
      case 'finalized':
        return '✅';
      case 'aborted':
        return '❌';
      case 'randomizing':
        return '🔄';
      default:
        return '⚪';
    }
  };

  const formatMonthlyAmount = (ronda: RondaContractData) => {
    const amount = ronda.monthlyDepositFormatted;
    const token = ronda.paymentToken === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'USDC';
    
    if (amount < 0.001) {
      return `${(amount * 1000).toFixed(2)} mETH`;
    }
    return `${amount.toFixed(3)} ${token}`;
  };

  const getJoinCost = (ronda: RondaContractData) => {
    const entryFee = ronda.entryFeeFormatted;
    const monthly = ronda.monthlyDepositFormatted;
    const token = ronda.paymentToken === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'USDC';
    
    if (entryFee > 0) {
      return `${(entryFee + monthly).toFixed(3)} ${token}`;
    }
    return `${monthly.toFixed(3)} ${token}`;
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load RONDA contracts via proxy: {error}</span>
            <Button variant="outline" size="sm" onClick={onRefetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
        
        <div className="p-8 text-center bg-muted/30 rounded-lg border border-dashed">
          <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Proxy Connection Failed</h3>
          <p className="text-muted-foreground mb-4">
            Unable to connect to the RONDA proxy contract on Sepolia testnet.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Check your internet connection</p>
            <p>• Verify Sepolia network is accessible</p>
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
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <RefreshCw className="h-6 w-6 text-primary animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Loading RONDA Contracts</h3>
              <p className="text-muted-foreground">Fetching data via proxy from Sepolia testnet...</p>
            </div>
          </div>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="space-y-4">
                <div className="space-y-2">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-6 bg-muted rounded w-2/3" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-6 bg-muted rounded w-2/3" />
                  </div>
                </div>
                <div className="h-10 bg-muted rounded w-full" />
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
            <span>No RONDA contracts found via proxy on Sepolia testnet</span>
            <Button variant="outline" size="sm" onClick={onRefetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </AlertDescription>
        </Alert>
        
        <div className="p-8 text-center bg-muted/30 rounded-lg border border-dashed">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No RONDAs Available</h3>
          <p className="text-muted-foreground mb-4">
            No RONDA contracts are currently available via the proxy on Sepolia testnet.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Proxy Contract: 0xA2AC48Cf8113677F9D708fF91dfBB6464E386368</p>
            <p>• Network: Sepolia Testnet (Chain ID: 11155111)</p>
            <p>• Check back later for new RONDAs</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* RONDA Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rondas.map((ronda, index) => {
          const availableSpots = ronda.maxParticipants - ronda.participantCount;
          const completionPercentage = (ronda.participantCount / ronda.maxParticipants) * 100;
          
          return (
            <Card key={ronda.address} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col overflow-hidden">
              <CardHeader className="space-y-4 flex-shrink-0 pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    {/* Status Badge */}
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(ronda.state)} text-sm font-medium`}
                    >
                      {getStatusText(ronda.state)}
                    </Badge>
                    
                    {/* RONDA Title */}
                    <div>
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                        RONDA #{index + 1}
                      </h3>
                      <div className="text-sm text-muted-foreground font-mono mt-1">
                        {ronda.address.slice(0, 8)}...{ronda.address.slice(-6)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6 flex-1 flex flex-col pt-0">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 flex-shrink-0">
                  {/* Participants */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Participants</span>
                    </div>
                    <div className="space-y-2">
                      <div className="font-bold text-lg">
                        {ronda.participantCount} of {ronda.maxParticipants}
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all duration-300"
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
                    <div className="font-bold text-lg">
                      {formatMonthlyAmount(ronda)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      per member
                    </div>
                  </div>
                </div>

                {/* Duration and Available Spots */}
                <div className="grid grid-cols-2 gap-4 flex-shrink-0">
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

                {/* Basic Information */}
                <div className="p-4 bg-gradient-to-r from-primary/5 to-success/5 rounded-lg border border-primary/20 flex-shrink-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">RONDA Details</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Deposit:</span>
                      <span className="font-semibold">
                        {formatMonthlyAmount(ronda)}
                      </span>
                    </div>
                    {availableSpots > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Available Spots:</span>
                        <span className="font-semibold text-warning">
                          {availableSpots} remaining
                        </span>
                      </div>
                    )}
                    {ronda.entryFeeFormatted > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Entry Fee:</span>
                        <span className="font-semibold">
                          {ronda.entryFeeFormatted.toFixed(3)} ETH
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress for Active RONDAs */}
                {ronda.state === 'Running' && (
                  <div className="p-4 bg-warning/5 rounded-lg border border-warning/20 flex-shrink-0">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">Month Progress</span>
                        <span className="text-sm text-muted-foreground">
                          Active payments
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-warning rounded-full h-2 transition-all duration-300"
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
                      className="w-full group-hover:bg-primary/90 transition-colors text-base font-semibold py-6"
                      asChild
                    >
                      <Link href={`/group/${ronda.address}`}>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Join for {getJoinCost(ronda)}
                      </Link>
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      className="w-full group-hover:bg-accent transition-colors"
                      disabled={ronda.state === 'Aborted'}
                      asChild
                    >
                      <Link href={`/group/${ronda.address}`}>
                        <Eye className="h-4 w-4 mr-2" />
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
      <div className="mt-8 p-4 bg-info/5 rounded-lg border border-info/20">
        <div className="flex items-center space-x-2 mb-2">
          <Network className="h-4 w-4 text-info" />
          <span className="font-medium text-info text-sm">Connected via Proxy</span>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Proxy Contract: 0xA2AC48Cf8113677F9D708fF91dfBB6464E386368</div>
          <div>Network: Sepolia Testnet • Live data from RONDA smart contracts</div>
        </div>
      </div>
    </div>
  );
}