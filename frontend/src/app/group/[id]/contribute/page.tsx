'use client';

import { notFound } from 'next/navigation';
import { ContributionFlow } from '@/components/contribution/contribution-flow';
import { useSingleRondaContract } from '@/hooks/use-single-ronda-contract';

interface ContributePageProps {
  params: {
    id: string;
  };
}

export default function ContributePage({ params }: ContributePageProps) {
  const { ronda, isLoading, error } = useSingleRondaContract(params.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Loading RONDA Contract</h3>
            <p className="text-muted-foreground">Fetching contract data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !ronda) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <ContributionFlow group={ronda} />
    </div>
  );
}