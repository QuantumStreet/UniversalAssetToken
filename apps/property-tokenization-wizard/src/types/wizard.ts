export type PropertyDetails = {
  // TIER 1: Essential Fields
  propertyAddress: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  propertyValue: number;
  totalSquareFootage: number;
  lotSize?: number;
  lotSizeUnit?: 'acres' | 'sqft';
  bedrooms?: number;
  bathroomsFull?: number;
  bathroomsPartial?: number;
  yearBuilt?: number;
  propertyImages: File[];
  
  // TIER 2: High-Value Fields (Luxury)
  propertyType?: 'single_family' | 'multi_family' | 'estate' | 'commercial' | 'condo' | 'townhouse';
  architecturalStyle?: string;
  premiumAmenities?: string[];
  parkingSpaces?: number;
  parkingType?: string;
  hvacType?: string;
  fireplaces?: number;
  fireplaceTypes?: string[];
  yearRenovated?: number;
  overallCondition?: 'excellent' | 'good' | 'fair' | 'needs work';
  recentUpgrades?: string[];
  
  // TIER 3: Optional (Phase 2)
  schoolDistrict?: string;
  virtualTourUrl?: string;
  propertyVideo?: File;
  nearbyAmenities?: string[];
  mlsNumber?: string;
  description?: string;
  
  // Financial
  netIncome: number;
  annualRentalIncome?: number;
  annualExpenses?: number;
  
  // Required supporting documents
  titleDocument?: File;
  appraisalDocument?: File;
  insuranceDocument?: File;
  surveyDocument?: File;
  
  // Document URLs (after IPFS upload)
  titleDocumentUrl?: string;
  appraisalDocumentUrl?: string;
  insuranceDocumentUrl?: string;
  surveyDocumentUrl?: string;
  
  // AI analysis & extraction
  aiEstimatedValue?: number;
  aiConfidence?: number;
  aiComparables?: any[];
  extractedFromUrl?: string;
  extractedAt?: string;
  extractionPlatform?: string;
};

export type TrustConfiguration = {
  trustName: string;
  settlorName: string;
  trusteeName: string;
  trustDuration: number;
  annualDistributionRate: number;
  reserveFundRate: number;
  trusteeFeeRate: number;
  tokenName: string;
  tokenSymbol: string;
  tokenSupply: number;
  tokenPrice: number;
  minimumPurchase: number;
};

export type BeneficiaryRights = {
  occupancyRights: boolean;
  votingRights: boolean;
  transferRights: boolean;
  visitationThreshold?: number;
};

export type SmartContractData = {
  contractCode: string;
  contractABI?: string;
  generationMethod: 'template' | 'ai';
  blockchain: 'ethereum' | 'solana' | 'radix';
  description?: string;
};

export type DeploymentData = {
  contractAddress: string;
  transactionHash: string;
  network: string;
  deployedAt: Date;
  explorerUrl: string;
  blockchain: 'ethereum' | 'solana' | 'radix';
};

export type NFTMintingData = {
  metadataUri: string;
  mintedTokens: {
    tokenId: string;
    recipient: string;
    amount: number;
  }[];
  totalMinted: number;
  collectionAddress?: string;
  explorerUrl?: string;
};

export type DATIntegrationData = {
  treasuryAddress: string;
  treasuryType: 'new' | 'existing';
  allocatedTokens: number;
  allocationPercentage: number;
  enhancedYieldApy: number;
  transactionHash: string;
};

export type WizardData = {
  property?: PropertyDetails;
  trust?: TrustConfiguration;
  beneficiary?: BeneficiaryRights;
  contract?: SmartContractData;
  deployment?: DeploymentData;
  nfts?: NFTMintingData;
  treasury?: DATIntegrationData;
};

export type WizardStep = {
  id: string;
  title: string;
  description: string;
};

