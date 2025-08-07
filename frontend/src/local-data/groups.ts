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

// Mock data for development and testing
export const mockGroups: Group[] = [
  {
    id: '1',
    address: '0x1234567890123456789012345678901234567890',
    description: 'Community Savings Circle',
    participantCount: 3,
    maxParticipants: 5,
    monthlyDepositFormatted: 100,
    tokenSymbol: 'HBAR',
    state: 'Open',
    duration: 5,
    startDate: new Date('2024-01-01'),
    creationDate: new Date('2024-01-01'),
    availableSpots: 2,
    isETH: false,
    entryFeeFormatted: 10,
    totalContribution: 300,
    milestoneCount: 5,
    milestones: [
      { index: 0, isCompleted: true, date: new Date('2024-01-01') },
      { index: 1, isCompleted: true, date: new Date('2024-02-01') },
      { index: 2, isCompleted: false },
      { index: 3, isCompleted: false },
      { index: 4, isCompleted: false },
    ],
    participants: ['0x1111111111111111111111111111111111111111', '0x2222222222222222222222222222222222222222', '0x3333333333333333333333333333333333333333'],
    creator: '0x1111111111111111111111111111111111111111',
    monthlyDeposit: '100000000000000000000',
    entryFee: '10000000000000000000',
    paymentToken: '0x01Ac06943d2B8327a7845235Ef034741eC1Da352',
    isActive: true,
    currency: 'HBAR',
    tokenDecimals: 18,
  },
  {
    id: '2',
    address: '0x2345678901234567890123456789012345678901',
    description: 'Emergency Fund RONDA',
    participantCount: 4,
    maxParticipants: 6,
    monthlyDepositFormatted: 50,
    tokenSymbol: 'HBAR',
    state: 'Running',
    duration: 6,
    startDate: new Date('2024-01-15'),
    creationDate: new Date('2024-01-15'),
    availableSpots: 2,
    isETH: false,
    entryFeeFormatted: 5,
    totalContribution: 200,
    milestoneCount: 6,
    milestones: [
      { index: 0, isCompleted: true, date: new Date('2024-01-15') },
      { index: 1, isCompleted: true, date: new Date('2024-02-15') },
      { index: 2, isCompleted: false },
      { index: 3, isCompleted: false },
      { index: 4, isCompleted: false },
      { index: 5, isCompleted: false },
    ],
    participants: ['0x4444444444444444444444444444444444444444', '0x5555555555555555555555555555555555555555', '0x6666666666666666666666666666666666666666', '0x7777777777777777777777777777777777777777'],
    creator: '0x4444444444444444444444444444444444444444',
    monthlyDeposit: '50000000000000000000',
    entryFee: '5000000000000000000',
    paymentToken: '0x01Ac06943d2B8327a7845235Ef034741eC1Da352',
    isActive: true,
    currency: 'HBAR',
    tokenDecimals: 18,
  },
];