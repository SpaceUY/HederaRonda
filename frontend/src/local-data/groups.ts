export interface Group {
  id: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  monthlyContribution: number;
  currency: string;
  nextRoundStart: Date;
  status: 'recruiting' | 'active' | 'completed';
  duration: number;
  startDate: Date;
  paymentSchedule: string;
  rules: string[];
}

export const mockGroups: Group[] = [
  {
    id: '1',
    description: 'Monthly savings group for tech workers looking to build emergency funds',
    memberCount: 8,
    maxMembers: 10,
    monthlyContribution: 500,
    currency: 'USD',
    nextRoundStart: new Date('2025-02-01'),
    status: 'recruiting',
    duration: 12,
    startDate: new Date('2025-01-15'),
    paymentSchedule: 'Monthly on the 1st',
    rules: [
      'Monthly contributions must be made by the 1st of each month',
      'Members receive their lump sum in predetermined order',
      'No early withdrawals allowed',
      'Missed payments result in penalties'
    ]
  },
  {
    id: '2',
    description: 'Supporting local entrepreneurs with rotating credit access',
    memberCount: 12,
    maxMembers: 12,
    monthlyContribution: 1000,
    currency: 'USD',
    nextRoundStart: new Date('2025-01-15'),
    status: 'active',
    duration: 12,
    startDate: new Date('2025-01-01'),
    paymentSchedule: 'Monthly on the 15th',
    rules: [
      'Business verification required for all members',
      'Monthly contributions must be made by the 15th of each month',
      'Business-focused spending priorities',
      'Quarterly business review meetings required'
    ]
  },
  {
    id: '3',
    description: 'Affordable savings circle for students planning for graduation expenses',
    memberCount: 6,
    maxMembers: 15,
    monthlyContribution: 100,
    currency: 'USD',
    nextRoundStart: new Date('2025-02-15'),
    status: 'recruiting',
    duration: 10,
    startDate: new Date('2025-02-01'),
    paymentSchedule: 'Monthly on the 1st',
    rules: [
      'Student verification required',
      'Lower contribution amounts for affordability',
      'Flexible payment dates during exam periods',
      'Educational expense priority'
    ]
  },
  {
    id: '4',
    description: 'Building financial security for families with children',
    memberCount: 10,
    maxMembers: 10,
    monthlyContribution: 300,
    currency: 'USD',
    nextRoundStart: new Date('2025-01-20'),
    status: 'active',
    duration: 12,
    startDate: new Date('2025-01-01'),
    paymentSchedule: 'Monthly on the 20th',
    rules: [
      'Family verification required',
      'Emergency fund focus for household needs',
      'Monthly contributions must be made by the 20th',
      'Community support for family emergencies'
    ]
  },
  {
    id: '5',
    description: 'Digital-first savings group for cryptocurrency investors',
    memberCount: 4,
    maxMembers: 8,
    monthlyContribution: 750,
    currency: 'USD',
    nextRoundStart: new Date('2025-02-10'),
    status: 'recruiting',
    duration: 8,
    startDate: new Date('2025-01-25'),
    paymentSchedule: 'Monthly on the 10th',
    rules: [
      'Cryptocurrency knowledge verification required',
      'Digital wallet integration mandatory',
      'Monthly contributions must be made by the 10th',
      'Investment-focused spending priorities'
    ]
  },
];

// Helper function to get a group by ID
export function getGroupById(id: string): Group | undefined {
  return mockGroups.find(group => group.id === id);
}

// Helper function to get all group IDs for static generation
export function getAllGroupIds(): string[] {
  return mockGroups.map(group => group.id);
}