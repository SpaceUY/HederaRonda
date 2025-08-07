export interface Group {
  id: string;
  address: string;
  description: string;
  participantCount: number;
  maxParticipants: number;
  monthlyDepositFormatted: number;
  tokenSymbol: string;
  state: 'Open' | 'Running' | 'Finalized' | 'Aborted' | 'Randomizing';
  duration: number;
  startDate: Date;
  creationDate: Date;
  availableSpots: number;
  isETH: boolean;
  entryFeeFormatted: number;
  totalContribution: number;
  milestoneCount: number;
  milestones: Array<{
    index: number;
    isCompleted: boolean;
    date?: Date;
  }>;
  participants: string[];
  creator?: string;
  // Additional contract data
  monthlyDeposit?: string;
  entryFee?: string;
  paymentToken?: string;
  isActive?: boolean;
  nextRoundStart?: Date;
  creationTime?: number;
  lastMilestoneTime?: number;
  totalDeposited?: string;
  totalDepositedFormatted?: number;
  currency?: string;
  paymentSchedule?: string;
  rules?: string[];
  tokenDecimals?: number;
}