/**
 * Interest Distribution Presets for RONDA Creation
 * 
 * Each preset defines how interest is distributed across milestones.
 * The sum of all values must equal 0 for mathematical balance.
 */

export interface InterestPreset {
  name: string;
  description: string;
  calculate: (milestoneCount: number) => number[];
}

export const INTEREST_PRESETS: Record<string, InterestPreset> = {
  Conservative: {
    name: 'Conservative Growth',
    description: 'Low risk, steady returns with minimal early penalties',
    calculate: (milestoneCount: number): number[] => {
      const distribution: number[] = [];
      
      // Conservative: Small negative values early, small positive values later
      const earlyPenalty = -1;
      const laterBonus = Math.ceil((milestoneCount * Math.abs(earlyPenalty)) / (milestoneCount - Math.floor(milestoneCount / 2)));
      
      for (let i = 0; i < milestoneCount; i++) {
        if (i < Math.floor(milestoneCount / 2)) {
          distribution.push(earlyPenalty);
        } else {
          distribution.push(laterBonus);
        }
      }
      
      // Ensure sum equals 0
      const sum = distribution.reduce((acc, val) => acc + val, 0);
      if (sum !== 0) {
        distribution[distribution.length - 1] -= sum;
      }
      
      return distribution;
    },
  },

  Balanced: {
    name: 'Balanced Portfolio',
    description: 'Moderate risk and returns with balanced distribution',
    calculate: (milestoneCount: number): number[] => {
      const distribution: number[] = [];
      
      // Balanced: Moderate negative early, moderate positive later
      const earlyPenalty = -2;
      const midPenalty = -1;
      const laterBonus = Math.ceil((milestoneCount * 1.5) / (milestoneCount - Math.floor(milestoneCount * 0.6)));
      
      for (let i = 0; i < milestoneCount; i++) {
        if (i < Math.floor(milestoneCount * 0.3)) {
          distribution.push(earlyPenalty);
        } else if (i < Math.floor(milestoneCount * 0.6)) {
          distribution.push(midPenalty);
        } else {
          distribution.push(laterBonus);
        }
      }
      
      // Ensure sum equals 0
      const sum = distribution.reduce((acc, val) => acc + val, 0);
      if (sum !== 0) {
        distribution[distribution.length - 1] -= sum;
      }
      
      return distribution;
    },
  },

  Aggressive: {
    name: 'High Growth',
    description: 'Higher risk, potential higher returns with significant early penalties',
    calculate: (milestoneCount: number): number[] => {
      const distribution: number[] = [];
      
      // Aggressive: Large negative early, large positive later
      const earlyPenalty = -3;
      const midPenalty = -2;
      const laterBonus = Math.ceil((milestoneCount * 2.5) / (milestoneCount - Math.floor(milestoneCount * 0.7)));
      
      for (let i = 0; i < milestoneCount; i++) {
        if (i < Math.floor(milestoneCount * 0.4)) {
          distribution.push(earlyPenalty);
        } else if (i < Math.floor(milestoneCount * 0.7)) {
          distribution.push(midPenalty);
        } else {
          distribution.push(laterBonus);
        }
      }
      
      // Ensure sum equals 0
      const sum = distribution.reduce((acc, val) => acc + val, 0);
      if (sum !== 0) {
        distribution[distribution.length - 1] -= sum;
      }
      
      return distribution;
    },
  },
};

/**
 * Validate that an interest distribution array sums to zero
 */
export function validateInterestDistribution(distribution: number[]): boolean {
  const sum = distribution.reduce((acc, val) => acc + val, 0);
  return sum === 0;
}

/**
 * Get a preview of how the interest distribution affects payouts
 */
export function getDistributionPreview(
  distribution: number[],
  baseAmount: number
): Array<{ milestone: number; adjustment: number; finalAmount: number }> {
  return distribution.map((adjustment, index) => ({
    milestone: index + 1,
    adjustment,
    finalAmount: baseAmount + adjustment,
  }));
}

/**
 * Calculate the total impact of an interest distribution
 */
export function calculateDistributionImpact(distribution: number[]): {
  totalPenalty: number;
  totalBonus: number;
  netImpact: number;
  riskLevel: 'Low' | 'Medium' | 'High';
} {
  const penalties = distribution.filter(val => val < 0);
  const bonuses = distribution.filter(val => val > 0);
  
  const totalPenalty = Math.abs(penalties.reduce((sum, val) => sum + val, 0));
  const totalBonus = bonuses.reduce((sum, val) => sum + val, 0);
  const netImpact = totalBonus - totalPenalty; // Should be 0
  
  // Determine risk level based on penalty magnitude
  const maxPenalty = Math.abs(Math.min(...distribution));
  let riskLevel: 'Low' | 'Medium' | 'High';
  
  if (maxPenalty <= 1) {
    riskLevel = 'Low';
  } else if (maxPenalty <= 2) {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'High';
  }
  
  return {
    totalPenalty,
    totalBonus,
    netImpact,
    riskLevel,
  };
}