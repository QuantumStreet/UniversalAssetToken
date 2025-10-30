/**
 * UAT (Universal Asset Token) JSON Generator
 * 
 * Converts wizard data into UAT-compliant JSON metadata
 * Based on UAT v1.0 specification
 */

import { PropertyDetails, TrustConfiguration, BeneficiaryRights } from '@/types/wizard';

export interface UATMetadata {
  standard: string;
  schema_version: string;
  token_type: string;
  asset_class: string;
  name: string;
  symbol: string;
  description: string;
  total_supply: number;
  decimals: number;
  divisible: boolean;
  issuer: {
    name: string;
    legal_entity: string;
    jurisdiction: string;
    registration_number?: string;
    contact: {
      email: string;
      website?: string;
      phone?: string;
    };
  };
  created_at: string;
  updated_at: string;
  blockchain: {
    chain: string;
    network: string;
    contract_address?: string;
    token_program?: string;
    mint_authority?: string;
  };
  media: {
    image?: string;
    thumbnail?: string;
    video?: string;
    additional_images?: string[];
  };
  modules: {
    asset_details: boolean;
    trust_structure: boolean;
    yield_distribution: boolean;
    legal_documents: boolean;
    compliance: boolean;
    governance: boolean;
    insurance: boolean;
    valuation: boolean;
  };
  asset_details: any;
  trust_structure: any;
  yield_distribution: any;
  legal_documents: any;
  compliance: any;
  insurance?: any;
  valuation?: any;
  governance?: any;
}

/**
 * Generate UAT-compliant JSON from wizard data
 */
export function generateUATMetadata(
  propertyData: PropertyDetails,
  trustData: TrustConfiguration & BeneficiaryRights,
  blockchain: { name: string; network: string }
): UATMetadata {
  const timestamp = new Date().toISOString();

  // Determine which modules are available based on data
  const modules = {
    asset_details: true, // Always true for real estate
    trust_structure: true, // Always true (Wyoming Trust)
    yield_distribution: !!(propertyData?.annualRentalIncome || propertyData?.netIncome),
    legal_documents: !!(propertyData?.titleDocumentUrl || propertyData?.appraisalDocumentUrl),
    compliance: true, // Always include basic compliance
    governance: !!(trustData?.votingRights), // Include if voting enabled
    insurance: !!propertyData?.insuranceDocumentUrl,
    valuation: !!propertyData?.propertyValue,
  };

  const uat: UATMetadata = {
    standard: "UAT-1.0",
    schema_version: "1.0.0",
    token_type: "fractional",
    asset_class: "real_estate",
    name: trustData?.tokenName || `${propertyData?.propertyAddress || 'Property'} Token`,
    symbol: trustData?.tokenSymbol || "PTT",
    description: generateDescription(propertyData, trustData),
    total_supply: trustData?.tokenSupply || propertyData?.totalSquareFootage || 10000,
    decimals: 0,
    divisible: false,
    issuer: {
      name: trustData?.trustName || "Property Trust",
      legal_entity: "Wyoming Statutory Trust",
      jurisdiction: "Wyoming, USA",
      contact: {
        email: "trust@assetrail.com",
        website: "https://assetrail.com",
      }
    },
    created_at: timestamp,
    updated_at: timestamp,
    blockchain: {
      chain: blockchain.name.toLowerCase(),
      network: blockchain.network.toLowerCase(),
    },
    media: {
      image: propertyData?.propertyImages?.[0] || undefined,
      additional_images: propertyData?.propertyImages?.slice(1) || [],
    },
    modules,

    // Module: Asset Details
    asset_details: {
      module_version: "1.0",
      asset_type: propertyData?.propertyType || "residential_property",
      physical_address: {
        street: propertyData?.propertyAddress || "",
        city: propertyData?.city || "",
        state: propertyData?.state || "",
        zip: propertyData?.zipCode || "",
        country: "United States",
        county: propertyData?.county || undefined,
      },
      property_characteristics: {
        square_footage: propertyData?.totalSquareFootage || 0,
        lot_size: propertyData?.lotSize || 0,
        lot_size_unit: propertyData?.lotSizeUnit || "sqft",
        bedrooms: propertyData?.bedrooms || 0,
        bathrooms: (propertyData?.bathroomsFull || 0) + (propertyData?.bathroomsPartial || 0) * 0.5,
        bathrooms_full: propertyData?.bathroomsFull || 0,
        bathrooms_partial: propertyData?.bathroomsPartial || 0,
        year_built: propertyData?.yearBuilt || null,
        year_renovated: propertyData?.yearRenovated || null,
        parking_spaces: propertyData?.parkingSpaces || 0,
        parking_type: propertyData?.parkingType || null,
        property_type: propertyData?.propertyType || "single_family",
        architectural_style: propertyData?.architecturalStyle || null,
        hvac_type: propertyData?.hvacType || null,
        fireplaces: propertyData?.fireplaces || 0,
        fireplace_types: propertyData?.fireplaceTypes || [],
        premium_amenities: propertyData?.premiumAmenities || [],
      },
      valuation: modules.valuation ? {
        appraised_value: propertyData?.propertyValue || 0,
        appraisal_date: propertyData?.extractedAt ? new Date(propertyData.extractedAt).toISOString().split('T')[0] : undefined,
        ai_estimated_value: propertyData?.aiEstimate || propertyData?.propertyValue,
        ai_confidence: propertyData?.aiConfidence || null,
      } : undefined,
      condition: {
        overall_rating: propertyData?.overallCondition || "good",
        recent_upgrades: propertyData?.recentUpgrades || [],
      },
      listing_info: {
        mls_number: propertyData?.mlsNumber || null,
        school_district: propertyData?.schoolDistrict || null,
        description: propertyData?.description || null,
        virtual_tour_url: propertyData?.virtualTourUrl || null,
        extracted_from_url: propertyData?.extractedFromUrl || null,
        extraction_platform: propertyData?.extractionPlatform || null,
      }
    },

    // Module: Trust Structure
    trust_structure: {
      module_version: "1.0",
      trust_name: trustData?.trustName || "Property Trust",
      trust_type: "Wyoming Statutory Trust",
      formation_date: timestamp.split('T')[0],
      jurisdiction: "Wyoming, USA",
      duration_years: trustData?.trustDuration || 1000,
      settlor: {
        name: trustData?.settlorName || "Unknown Settlor",
        role: "Settlor",
      },
      trustee: {
        name: trustData?.trusteeName || "Unknown Trustee",
        role: "Trustee",
      },
      beneficiaries: {
        type: "token_holders",
        rights: {
          occupancy: trustData?.occupancyRights || false,
          voting: trustData?.votingRights || false,
          transfer: trustData?.transferRights || true,
        }
      },
      token_economics: {
        total_supply: trustData?.tokenSupply || propertyData?.totalSquareFootage || 10000,
        token_price_usd: trustData?.tokenPrice || 100,
        minimum_purchase: trustData?.minimumPurchase || 1,
        tokenization_ratio: "1 token = 1 square foot",
      }
    },

    // Module: Yield Distribution
    yield_distribution: modules.yield_distribution ? {
      module_version: "1.0",
      income_sources: [
        {
          source_type: "rental_income",
          annual_amount_usd: propertyData?.annualRentalIncome || 0,
          frequency: "monthly",
        }
      ],
      expenses: [
        {
          category: "operating_expenses",
          annual_amount_usd: propertyData?.annualExpenses || 0,
          frequency: "annual",
        }
      ],
      net_income: {
        annual_usd: propertyData?.netIncome || 
          ((propertyData?.annualRentalIncome || 0) - (propertyData?.annualExpenses || 0)),
      },
      distribution_policy: {
        distribution_rate: (trustData?.annualDistributionRate || 75) / 100,
        reserve_rate: (trustData?.reserveFundRate || 20) / 100,
        fee_rate: (trustData?.trusteeFeeRate || 5) / 100,
        frequency: "quarterly",
      },
      yield_metrics: calculateYieldMetrics(propertyData, trustData),
    } : undefined,

    // Module: Legal Documents
    legal_documents: modules.legal_documents ? {
      module_version: "1.0",
      trust_agreement: {
        name: "Wyoming Statutory Trust Agreement",
        ipfs_hash: null, // Will be uploaded separately
        document_type: "trust_agreement",
        upload_date: null,
      },
      title_deed: propertyData?.titleDocumentUrl ? {
        name: "Property Title Deed",
        ipfs_hash: propertyData.titleDocumentUrl,
        document_type: "title_deed",
        upload_date: timestamp,
      } : undefined,
      appraisal: propertyData?.appraisalDocumentUrl ? {
        name: "Professional Appraisal",
        ipfs_hash: propertyData.appraisalDocumentUrl,
        document_type: "appraisal",
        upload_date: timestamp,
      } : undefined,
      insurance_policy: propertyData?.insuranceDocumentUrl ? {
        name: "Property Insurance Policy",
        ipfs_hash: propertyData.insuranceDocumentUrl,
        document_type: "insurance",
        upload_date: timestamp,
      } : undefined,
      survey: propertyData?.surveyDocumentUrl ? {
        name: "Property Survey",
        ipfs_hash: propertyData.surveyDocumentUrl,
        document_type: "survey",
        upload_date: timestamp,
      } : undefined,
    } : undefined,

    // Module: Compliance
    compliance: {
      module_version: "1.0",
      regulatory_framework: "SEC Regulation D",
      exemption: "Rule 506(c)",
      securities_registration: {
        jurisdiction: "United States",
        filing_type: "Form D",
        filing_status: "pending",
      },
      investor_requirements: {
        accredited_only: true,
        kyc_required: true,
        aml_required: true,
        kyc_provider: "To be configured",
      },
      transfer_restrictions: {
        lock_up_period_days: 365,
        restricted_jurisdictions: [],
        whitelist_required: false,
      },
      tax_information: {
        tax_classification: "Pass-through entity",
        k1_forms: true,
        reporting_frequency: "annual",
      }
    },

    // Module: Insurance (if available)
    insurance: modules.insurance && propertyData?.insuranceDocumentUrl ? {
      module_version: "1.0",
      property_insurance: {
        provider: "Insurance Provider (from documents)",
        policy_number: "Pending extraction",
        coverage_amount_usd: propertyData?.propertyValue || 0,
        deductible_usd: null,
        expiration_date: null,
      }
    } : undefined,

    // Module: Valuation (if available)
    valuation: modules.valuation ? {
      module_version: "1.0",
      professional_appraisal: propertyData?.propertyValue ? {
        value_usd: propertyData.propertyValue,
        appraisal_date: propertyData?.extractedAt ? new Date(propertyData.extractedAt).toISOString().split('T')[0] : timestamp.split('T')[0],
        appraiser: {
          name: "Professional Appraiser",
          license: null,
        },
        methodology: "Sales comparison approach",
      } : undefined,
      ai_valuation: propertyData?.aiEstimate ? {
        value_usd: propertyData.aiEstimate,
        confidence_score: (propertyData?.aiConfidence || 0) / 100,
        model_version: "Census data model v1.0",
        valuation_date: timestamp.split('T')[0],
      } : undefined,
      market_comparables: [],
    } : undefined,

    // Module: Governance (if voting enabled)
    governance: modules.governance ? {
      module_version: "1.0",
      voting_mechanism: "token_weighted",
      proposal_types: ["property_sale", "major_renovations", "refinancing"],
      quorum_percentage: 51,
      approval_threshold_percentage: 67,
    } : undefined,
  };

  // Remove undefined modules
  if (!uat.insurance) delete uat.insurance;
  if (!uat.valuation) delete uat.valuation;
  if (!uat.governance) delete uat.governance;
  if (!uat.yield_distribution) delete uat.yield_distribution;

  return uat;
}

/**
 * Generate human-readable description
 */
function generateDescription(
  propertyData: PropertyDetails,
  trustData: TrustConfiguration
): string {
  const address = propertyData?.propertyAddress || "Property";
  const sqft = propertyData?.totalSquareFootage || 0;
  const bedrooms = propertyData?.bedrooms || 0;
  const bathrooms = (propertyData?.bathroomsFull || 0) + (propertyData?.bathroomsPartial || 0) * 0.5;
  
  let description = `Fractional ownership of ${propertyData?.propertyType || 'residential'} property`;
  
  if (propertyData?.propertyAddress) {
    description += ` at ${address}`;
  }
  
  if (bedrooms && bathrooms) {
    description += `. ${bedrooms} bed, ${bathrooms} bath`;
  }
  
  if (sqft) {
    description += `, ${sqft.toLocaleString()} sq ft`;
  }
  
  description += `. Each token represents 1 square foot of fractional ownership in this property.`;
  
  if (propertyData?.annualRentalIncome) {
    const yieldRate = ((propertyData?.netIncome || propertyData?.annualRentalIncome) / (propertyData?.propertyValue || 1)) * 100;
    description += ` Projected annual yield: ${yieldRate.toFixed(2)}%.`;
  }
  
  return description;
}

/**
 * Calculate yield metrics for the property
 */
function calculateYieldMetrics(
  propertyData: PropertyDetails,
  trustData: TrustConfiguration
) {
  const netIncome = propertyData?.netIncome || 
    ((propertyData?.annualRentalIncome || 0) - (propertyData?.annualExpenses || 0));
  
  const tokenSupply = trustData?.tokenSupply || propertyData?.totalSquareFootage || 10000;
  const tokenPrice = trustData?.tokenPrice || (propertyData?.propertyValue || 0) / tokenSupply;
  const distributionRate = (trustData?.annualDistributionRate || 75) / 100;
  
  const distributionPool = netIncome * distributionRate;
  const yieldPerToken = distributionPool / tokenSupply;
  const annualReturn = tokenPrice > 0 ? (yieldPerToken / tokenPrice) * 100 : 0;
  
  return {
    yield_per_token_usd: Number(yieldPerToken.toFixed(2)),
    annual_return_percentage: Number(annualReturn.toFixed(2)),
    distribution_frequency: "quarterly",
    next_distribution_date: null,
    projections: {
      year_1: {
        estimated_yield_per_token: Number(yieldPerToken.toFixed(2)),
        estimated_return_percentage: Number(annualReturn.toFixed(2)),
      },
      year_5: {
        estimated_yield_per_token: Number((yieldPerToken * 1.15).toFixed(2)), // 3% annual growth
        estimated_return_percentage: Number((annualReturn * 1.15).toFixed(2)),
      },
      year_10: {
        estimated_yield_per_token: Number((yieldPerToken * 1.34).toFixed(2)), // 3% annual growth
        estimated_return_percentage: Number((annualReturn * 1.34).toFixed(2)),
      }
    }
  };
}

/**
 * Validate UAT metadata against schema
 */
export function validateUATMetadata(uat: UATMetadata): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required core fields
  if (!uat.name) errors.push("Token name is required");
  if (!uat.symbol) errors.push("Token symbol is required");
  if (!uat.total_supply || uat.total_supply <= 0) errors.push("Total supply must be greater than 0");
  if (!uat.issuer?.name) errors.push("Issuer name is required");

  // Required modules for real estate
  if (!uat.modules.asset_details) errors.push("Asset details module is required for real estate");
  if (!uat.modules.trust_structure) errors.push("Trust structure module is required");

  // Asset details validation
  if (uat.asset_details) {
    if (!uat.asset_details.physical_address?.street) errors.push("Property address is required");
    if (!uat.asset_details.property_characteristics?.square_footage) errors.push("Square footage is required");
  }

  // Trust structure validation
  if (uat.trust_structure) {
    if (!uat.trust_structure.trust_name) errors.push("Trust name is required");
    if (!uat.trust_structure.settlor?.name) errors.push("Settlor name is required");
    if (!uat.trust_structure.trustee?.name) errors.push("Trustee name is required");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

