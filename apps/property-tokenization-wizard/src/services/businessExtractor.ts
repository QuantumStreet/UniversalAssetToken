/**
 * Business Data Extractor
 * 
 * Extracts structured business data from:
 * - Company websites (via Firecrawl + GPT-4)
 * - Public company APIs (Financial Modeling Prep, SEC EDGAR)
 * - LinkedIn (employee data)
 */

import type { BusinessData } from '@/types/business';

interface BusinessExtractionResult {
  data: BusinessData;
  confidence: Record<string, number>;
  warnings: string[];
  source: {
    url?: string;
    method: 'website' | 'ticker' | 'manual';
    extractedAt: string;
  };
}

/**
 * Extract business data from company website URL
 */
export async function extractBusinessFromWebsite(
  url: string
): Promise<BusinessExtractionResult> {
  try {
    console.log('🔥 Extracting business data from website:', url);
    
    // Step 1: Scrape with Firecrawl (same as property scraping)
    const firecrawlKey = process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY || 'fc-bfeed1545a9a463cb142ec582922a0f5';
    
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown'],
        onlyMainContent: false,
        waitFor: 5000,
        timeout: 30000,
      }),
    });

    if (!scrapeResponse.ok) {
      throw new Error(`Firecrawl error: ${scrapeResponse.status}`);
    }

    const scrapeResult = await scrapeResponse.json();
    const content = scrapeResult.data?.markdown || '';
    
    console.log('✅ Website scraped, content length:', content.length);
    
    // Step 2: Extract with GPT-4
    const extracted = await extractBusinessWithGPT4(content, url);
    
    return {
      data: extracted.data,
      confidence: extracted.confidence,
      warnings: extracted.warnings,
      source: {
        url,
        method: 'website',
        extractedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Business extraction failed:', error);
    throw new Error(`Failed to extract business data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract business data from public company ticker
 */
export async function extractBusinessFromTicker(
  ticker: string
): Promise<BusinessExtractionResult> {
  try {
    console.log('📈 Fetching public company data for:', ticker);
    
    const fmpKey = process.env.NEXT_PUBLIC_FMP_API_KEY;
    
    if (!fmpKey) {
      throw new Error('Financial Modeling Prep API key not configured. Please add NEXT_PUBLIC_FMP_API_KEY to .env.local');
    }
    
    const FMP_BASE = 'https://financialmodelingprep.com/api/v3';
    
    // Fetch company profile, income statement, and ratios
    const [profileRes, incomeRes, ratiosRes] = await Promise.all([
      fetch(`${FMP_BASE}/profile/${ticker}?apikey=${fmpKey}`),
      fetch(`${FMP_BASE}/income-statement/${ticker}?limit=5&apikey=${fmpKey}`),
      fetch(`${FMP_BASE}/ratios/${ticker}?limit=1&apikey=${fmpKey}`),
    ]);
    
    if (!profileRes.ok) {
      const errorText = await profileRes.text();
      console.error('FMP API Error:', profileRes.status, errorText);
      throw new Error(`Failed to fetch company data for ${ticker}. Status: ${profileRes.status}. Please check the ticker symbol or API key.`);
    }
    
    if (!incomeRes.ok || !ratiosRes.ok) {
      console.warn('Some financial data unavailable, using available data');
    }
    
    const [profile, income, ratios] = await Promise.all([
      profileRes.json(),
      incomeRes.json(),
      ratiosRes.json(),
    ]);
    
    if (!profile[0]) {
      throw new Error(`No data found for ticker: ${ticker}`);
    }
    
    const companyProfile = profile[0];
    const latestIncome = income[0];
    const latestRatios = ratios[0];
    
    // Calculate growth rate from last 2 years
    const growthRate = income.length >= 2
      ? ((income[0].revenue - income[1].revenue) / income[1].revenue) * 100
      : undefined;
    
    const businessData: BusinessData = {
      companyName: companyProfile.companyName,
      industry: companyProfile.industry || 'Unknown',
      sector: companyProfile.sector,
      foundedYear: undefined,
      headquarters: `${companyProfile.city}, ${companyProfile.state}, ${companyProfile.country}`,
      website: companyProfile.website,
      
      employeeCount: companyProfile.fullTimeEmployees,
      employeeRange: categorizeEmployeeCount(companyProfile.fullTimeEmployees),
      
      annualRevenue: latestIncome.revenue,
      ebitda: latestIncome.ebitda,
      netIncome: latestIncome.netIncome,
      operatingCashFlow: latestIncome.operatingIncome, // Approximation
      growthRate: growthRate,
      profitMargin: latestRatios?.netProfitMargin ? latestRatios.netProfitMargin * 100 : undefined,
      
      marketCap: companyProfile.mktCap,
      stockTicker: ticker.toUpperCase(),
      isPublic: true,
      
      description: companyProfile.description,
    };
    
    console.log('✅ Public company data extracted:', businessData.companyName);
    
    return {
      data: businessData,
      confidence: {
        companyName: 1.0,
        industry: 1.0,
        revenue: 1.0,
        ebitda: 1.0,
        employeeCount: 0.95,
        growthRate: growthRate ? 0.9 : 0.5,
      },
      warnings: [],
      source: {
        method: 'ticker',
        extractedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Ticker extraction failed:', error);
    throw new Error(`Failed to fetch company data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract business data using GPT-4
 */
async function extractBusinessWithGPT4(
  content: string,
  url: string
): Promise<{ data: BusinessData; confidence: Record<string, number>; warnings: string[] }> {
  
  const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!openaiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const truncatedContent = content.slice(0, 100000);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a business analyst extracting company data for investment analysis.

Extract ALL available information from this company website.

Return JSON with this EXACT schema:
{
  "companyName": "string",
  "industry": "string (e.g., SaaS, E-commerce, Manufacturing, FinTech)",
  "sector": "string (e.g., Technology, Healthcare, Finance)",
  "foundedYear": number,
  "headquarters": "string (City, State/Country)",
  "website": "string",
  "employeeCount": number (if exact count stated),
  "employeeRange": "string (if range: 1-10, 10-50, 50-200, 200-500, 500-1000, 1000+)",
  "officeCount": number,
  "primaryProducts": ["array of main products/services"],
  "targetMarket": "string (SMB, Enterprise, Consumer, etc.)",
  "annualRevenue": number (USD, if disclosed - look for 'ARR', '$XM revenue', 'processing $X annually'),
  "revenueRange": "string (if range: <$1M, $1M-$5M, $5M-$10M, $10M-$50M, $50M+)",
  "fundingRaised": number (total funding if disclosed),
  "growthRate": number (YoY % if mentioned - look for '200% growth', 'doubled revenue', etc.),
  "profitMargin": number (% if mentioned),
  "clientCount": number (total customers if mentioned),
  "recurringRevenue": number (ARR/MRR if SaaS),
  "competitors": ["array of competitors mentioned"],
  "keyDifferentiators": ["unique value propositions"],
  "founders": ["founder names"],
  "keyExecutives": ["C-level with names and titles"],
  "awards": ["industry awards"],
  "certifications": ["ISO, SOC 2, etc."],
  "partnerships": ["strategic partners"],
  "description": "string (2-3 sentence company description)",
  "confidence": {
    "fieldName": 0.0-1.0 (confidence for each field)
  }
}

CRITICAL RULES:
1. Extract ONLY explicitly stated information
2. For employee count: Look for "team of 50", "100+ employees", LinkedIn mentions
3. For revenue: Look for "$10M ARR", "processing $50M", "$5M annual revenue"
4. For growth: Look for "200% YoY", "tripled revenue", "doubled last year"
5. Do NOT make up data - use null if not found
6. Set confidence scores: 1.0 = explicit statement, 0.8 = strong inference, 0.5 = educated guess, 0.3 = very uncertain
7. Be conservative with revenue estimates`
        },
        {
          role: 'user',
          content: `Extract business data from this company website:\n\nURL: ${url}\n\nCONTENT:\n${truncatedContent}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const result = await response.json();
  const parsed = JSON.parse(result.choices[0]?.message?.content || '{}');
  
  // Validate and clean data
  const businessData: BusinessData = {
    companyName: parsed.companyName || 'Unknown Company',
    industry: parsed.industry,
    sector: parsed.sector,
    foundedYear: parsed.foundedYear,
    headquarters: parsed.headquarters,
    website: parsed.website || url,
    
    employeeCount: parsed.employeeCount,
    employeeRange: parsed.employeeRange,
    officeCount: parsed.officeCount,
    
    primaryProducts: parsed.primaryProducts,
    targetMarket: parsed.targetMarket,
    
    annualRevenue: parsed.annualRevenue,
    revenueRange: parsed.revenueRange,
    fundingRaised: parsed.fundingRaised,
    growthRate: parsed.growthRate,
    profitMargin: parsed.profitMargin,
    
    clientCount: parsed.clientCount,
    recurringRevenue: parsed.recurringRevenue,
    
    competitors: parsed.competitors,
    keyDifferentiators: parsed.keyDifferentiators,
    founders: parsed.founders,
    keyExecutives: parsed.keyExecutives,
    awards: parsed.awards,
    certifications: parsed.certifications,
    partnerships: parsed.partnerships,
    
    description: parsed.description,
  };
  
  const warnings = generateBusinessWarnings(businessData, parsed.confidence || {});
  
  return {
    data: businessData,
    confidence: parsed.confidence || {},
    warnings,
  };
}

/**
 * Generate warnings for low-confidence or missing fields
 */
function generateBusinessWarnings(
  data: BusinessData,
  confidence: Record<string, number>
): string[] {
  const warnings: string[] = [];
  
  // Check for low confidence
  Object.entries(confidence).forEach(([field, conf]) => {
    if (conf < 0.7 && (data as any)[field] !== undefined) {
      warnings.push(`Low confidence for "${field}" (${Math.round(conf * 100)}%). Please verify.`);
    }
  });
  
  // Check for missing critical fields
  if (!data.annualRevenue && !data.revenueRange) {
    warnings.push('Revenue data not found. Manual entry required for valuation.');
  }
  
  if (!data.employeeCount && !data.employeeRange) {
    warnings.push('Employee count not found. Consider checking LinkedIn.');
  }
  
  if (!data.growthRate) {
    warnings.push('Growth rate not disclosed. Conservative estimate will be used.');
  }
  
  return warnings;
}

/**
 * Categorize employee count into ranges
 */
function categorizeEmployeeCount(count: number | undefined): string | undefined {
  if (!count) return undefined;
  
  if (count < 10) return '1-10';
  if (count < 50) return '10-50';
  if (count < 200) return '50-200';
  if (count < 500) return '200-500';
  if (count < 1000) return '500-1000';
  return '1000+';
}

/**
 * Validate URL
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

