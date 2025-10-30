/**
 * Business Token Yield Calculator
 * 
 * Calculates projected yields for business tokens based on profit distribution
 * Similar to property rental income distribution, but uses EBITDA/Free Cash Flow
 */

import type { BusinessData } from '@/types/business';

export interface BusinessYieldProjection {
  // Cash Flow Analysis
  ebitda: number;
  estimatedCapex: number;
  estimatedTaxes: number;
  freeCashFlow: number;
  
  // Distribution Breakdown
  totalDistributable: number;      // 75% to token holders
  reserveFund: number;             // 20% reserve
  trusteeFees: number;             // 5% fees
  
  // Per-Token Returns
  assumedTokenSupply: number;
  assumedTokenPrice: number;
  distributionPerToken: number;
  annualYieldPercentage: number;
  
  // Projections (with growth)
  projectedReturns: {
    year1: number;
    year2: number;
    year3: number;
    year5: number;
  };
  
  // Assumptions
  assumptions: {
    distributionRate: number;      // 75%
    reserveRate: number;           // 20%
    feeRate: number;               // 5%
    taxRate: number;               // 25%
    capexRate: number;             // % of EBITDA
    growthRate: number;            // % YoY
  };
}

/**
 * Calculate token yields for a business
 */
export function calculateBusinessYields(
  businessData: BusinessData,
  tokenPrice?: number
): BusinessYieldProjection {
  
  // Get EBITDA (or estimate from revenue)
  const ebitda = businessData.ebitda || (businessData.annualRevenue || 0) * 0.20; // Assume 20% margin if no EBITDA
  
  // Estimate CAPEX (typically 5-15% of EBITDA for most businesses)
  const capexRate = businessData.industry?.toLowerCase().includes('saas') ? 0.05 :
                   businessData.industry?.toLowerCase().includes('manufacturing') ? 0.15 :
                   0.10; // Default 10%
  
  const estimatedCapex = ebitda * capexRate;
  
  // Estimate taxes (25% effective rate)
  const taxableIncome = ebitda - estimatedCapex;
  const estimatedTaxes = taxableIncome * 0.25;
  
  // Calculate Free Cash Flow
  const freeCashFlow = ebitda - estimatedCapex - estimatedTaxes;
  
  // Distribution policy (from trust configuration)
  const distributionRate = 0.75; // 75% distributed to token holders
  const reserveRate = 0.20;      // 20% reserve fund
  const feeRate = 0.05;          // 5% trustee fees
  
  const totalDistributable = freeCashFlow * distributionRate;
  const reserveFund = freeCashFlow * reserveRate;
  const trusteeFees = freeCashFlow * feeRate;
  
  // Token economics
  // Default: 1 token per $100 of valuation (adjustable)
  const estimatedValue = businessData.aiEstimatedValue || (businessData.annualRevenue || 0) * 5;
  const assumedTokenSupply = Math.floor(estimatedValue / 100); // 1 token per $100
  const assumedTokenPrice = tokenPrice || 100; // $100 per token default
  
  // Per-token calculations
  const distributionPerToken = assumedTokenSupply > 0 ? totalDistributable / assumedTokenSupply : 0;
  const annualYieldPercentage = assumedTokenPrice > 0 ? (distributionPerToken / assumedTokenPrice) * 100 : 0;
  
  // Growth projections
  const growthRate = (businessData.growthRate || 15) / 100; // Default 15% if not provided
  
  const projectedReturns = {
    year1: distributionPerToken,
    year2: distributionPerToken * (1 + growthRate),
    year3: distributionPerToken * Math.pow(1 + growthRate, 2),
    year5: distributionPerToken * Math.pow(1 + growthRate, 4),
  };
  
  return {
    ebitda,
    estimatedCapex,
    estimatedTaxes,
    freeCashFlow,
    totalDistributable,
    reserveFund,
    trusteeFees,
    assumedTokenSupply,
    assumedTokenPrice,
    distributionPerToken,
    annualYieldPercentage,
    projectedReturns,
    assumptions: {
      distributionRate: distributionRate * 100,
      reserveRate: reserveRate * 100,
      feeRate: feeRate * 100,
      taxRate: 25,
      capexRate: capexRate * 100,
      growthRate: (businessData.growthRate || 15),
    },
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  } else {
    return `$${amount.toFixed(2)}`;
  }
}

/**
 * Calculate ROI over time
 */
export function calculateCumulativeROI(
  tokenPrice: number,
  projectedReturns: BusinessYieldProjection['projectedReturns']
): {
  year1: number;
  year2: number;
  year3: number;
  year5: number;
} {
  
  const year1Total = projectedReturns.year1;
  const year2Total = projectedReturns.year1 + projectedReturns.year2;
  const year3Total = year2Total + projectedReturns.year3;
  const year5Total = year3Total + 
                     projectedReturns.year3 * (projectedReturns.year3 / projectedReturns.year2) + // Year 4
                     projectedReturns.year5;
  
  return {
    year1: (year1Total / tokenPrice) * 100,
    year2: (year2Total / tokenPrice) * 100,
    year3: (year3Total / tokenPrice) * 100,
    year5: (year5Total / tokenPrice) * 100,
  };
}

