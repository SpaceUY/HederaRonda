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

// Mock data is no longer needed since we're using contract data
export const mockGroups: Group[] = [];

// Helper function to get a group by ID
export function getGroupById(id: string): Group | undefined {
  return mockGroups.find(group => group.id === id);
}

// Helper function to get all group IDs for static generation
export function getAllGroupIds(): string[] {
  return mockGroups.map(group => group.id);
}