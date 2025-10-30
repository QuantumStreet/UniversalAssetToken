/**
 * Business Tokenization Types
 */

export type BusinessData = {
  // Identity
  companyName: string;
  industry?: string;
  sector?: string;
  foundedYear?: number;
  headquarters?: string;
  website?: string;
  
  // Size Indicators
  employeeCount?: number;
  employeeRange?: string; // "10-50", "50-200", etc.
  officeCount?: number;
  
  // Products/Services
  primaryProducts?: string[];
  targetMarket?: string;
  customerSegments?: string[];
  
  // Financial Data
  annualRevenue?: number;
  revenueRange?: string; // "$1M-$5M", etc.
  ebitda?: number;
  netIncome?: number;
  operatingCashFlow?: number;
  fundingRaised?: number;
  profitMargin?: number;
  growthRate?: number;
  
  // Valuation Proxies
  clientCount?: number;
  recurringRevenue?: number; // ARR/MRR
  averageContractValue?: number;
  churnRate?: number;
  
  // Market Position
  marketShare?: number;
  competitors?: string[];
  keyDifferentiators?: string[];
  
  // Team
  founders?: string[];
  keyExecutives?: string[];
  advisors?: string[];
  
  // Traction
  awards?: string[];
  certifications?: string[];
  partnerships?: string[];
  
  // Public Company Data
  stockTicker?: string;
  marketCap?: number;
  isPublic?: boolean;
  
  // Documents (uploaded)
  financialStatements?: File[];
  pitchDeck?: File;
  businessPlan?: File;
  
  // Extracted/Calculated
  description?: string;
  extractedFromUrl?: string;
  extractedAt?: string;
  aiEstimatedValue?: number;
  aiConfidence?: number;
  valuationData?: BusinessValuationResult;
};

export type BusinessValuationResult = {
  estimatedValue: number;
  method: string;
  confidence: number; // 0-100
  valueLow: number;
  valueHigh: number;
  reasoning: string;
  keyFactors: string[];
  dataSource: string;
  riskFactors?: string[];
  investmentHighlights?: string[];
};

export type BusinessYieldProjection = {
  freeCashFlow: number;
  totalDistributable: number;
  reserveFund: number;
  trusteeFees: number;
  distributionPerToken: number;
  annualYieldPercentage: number;
  projectedReturns: {
    year1: number;
    year2: number;
    year3: number;
    year5: number;
  };
  assumptions: {
    taxRate: number;
    capexRate: number;
    growthRate: number;
    distributionPolicy: string;
  };
};

