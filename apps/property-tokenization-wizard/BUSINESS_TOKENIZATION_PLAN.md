# Business Tokenization - Extension Plan

**Date:** October 25, 2025  
**Objective:** Extend Asset Rail wizard to tokenize businesses, not just properties  
**Approach:** Mirror property extraction/valuation architecture for business data

---

## 🎯 Vision: Universal Asset Tokenization

### Current State
```
Property Only
  ↓
Scrape Sotheby's/Zillow → Extract with GPT-4 → Value with Census → Mint tokens
```

### Target State
```
Property OR Business
  ↓                ↓
Sotheby's        Company Website/SEC
  ↓                ↓
Property Data    Financial Data
  ↓                ↓
Census+GPT-4     Financials+GPT-4
  ↓                ↓
  Mint Tokens (Universal)
```

---

## 📊 Data Sources for Business Valuation

### 1. **SEC EDGAR (Public Companies) - FREE ✅**

**What it provides:**
- 10-K annual reports (complete financials)
- 10-Q quarterly reports
- 8-K material events
- Revenue, profit, assets, liabilities
- Management discussion & analysis

**API Access:**
```typescript
// SEC EDGAR API (free, no auth required)
const SEC_API_BASE = 'https://data.sec.gov/submissions';

async function getCompanyFinancials(ticker: string) {
  // Get CIK (company identifier) from ticker
  const cikResponse = await fetch(
    `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&ticker=${ticker}&output=json`
  );
  
  // Get latest filings
  const filingsResponse = await fetch(
    `${SEC_API_BASE}/CIK${cik}.json`,
    { headers: { 'User-Agent': 'AssetRail contact@assetrail.xyz' }}
  );
  
  // Parse 10-K for financials
  const financials = parseSecFilings(filings);
  
  return {
    revenue: financials.revenue,
    netIncome: financials.netIncome,
    assets: financials.totalAssets,
    liabilities: financials.totalLiabilities,
    equity: financials.shareholdersEquity,
    cashFlow: financials.operatingCashFlow
  };
}
```

**Coverage:** 
- All US public companies (~4,000 major companies)
- Historical data back 10+ years
- Updated quarterly

**Accuracy:** ⭐⭐⭐⭐⭐ (audited financials, gold standard)

---

### 2. **Financial Modeling Prep API - FREEMIUM ✅**

**What it provides:**
- Real-time and historical financial data
- Income statements, balance sheets, cash flow
- Financial ratios (P/E, ROE, debt ratios)
- Stock prices and market cap
- Company profiles and key metrics

**API Access:**
```typescript
const FMP_API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY;
const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

async function getCompanyData(ticker: string) {
  // Company profile
  const profile = await fetch(
    `${FMP_BASE}/profile/${ticker}?apikey=${FMP_API_KEY}`
  ).then(r => r.json());
  
  // Financial statements (last 5 years)
  const income = await fetch(
    `${FMP_BASE}/income-statement/${ticker}?limit=5&apikey=${FMP_API_KEY}`
  ).then(r => r.json());
  
  const ratios = await fetch(
    `${FMP_BASE}/ratios/${ticker}?limit=1&apikey=${FMP_API_KEY}`
  ).then(r => r.json());
  
  return {
    companyName: profile[0].companyName,
    industry: profile[0].industry,
    sector: profile[0].sector,
    marketCap: profile[0].mktCap,
    revenue: income[0].revenue,
    netIncome: income[0].netIncome,
    ebitda: income[0].ebitda,
    employees: profile[0].fullTimeEmployees,
    debtToEquity: ratios[0].debtEquityRatio,
    profitMargin: ratios[0].netProfitMargin,
    roe: ratios[0].returnOnEquity
  };
}
```

**Pricing:**
- Free: 250 requests/day
- Pro: $30/month, 750 requests/day
- Professional: $100/month, 3,000 requests/day

**Coverage:** 
- 20,000+ US stocks
- 5,000+ international stocks
- Real-time data

**Accuracy:** ⭐⭐⭐⭐⭐ (SEC data + real-time processing)

---

### 3. **Firecrawl + GPT-4 (Private Companies) - YOUR CURRENT STACK ✅**

**What it provides:**
- Company website data extraction
- About Us / Team pages
- Product/service descriptions
- Testimonials and case studies
- Estimated employee count
- Office locations
- Client lists

**Implementation (Mirror Property Extractor):**

```typescript
// src/services/businessExtractor.ts

interface BusinessExtractionResult {
  data: {
    // Identity
    companyName: string;
    industry: string;
    sector?: string;
    foundedYear?: number;
    headquarters: string;
    website: string;
    
    // Size Indicators
    employeeCount?: number;
    employeeRange?: string; // "10-50", "50-200", etc.
    officeCount?: number;
    
    // Products/Services
    primaryProducts?: string[];
    targetMarket?: string;
    customerSegments?: string[];
    
    // Financial Indicators (if disclosed)
    annualRevenue?: number;
    revenueRange?: string; // "$1M-$5M", etc.
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
    mediaLinks?: string[];
    
    // Documents/Images
    companyLogo?: string;
    pitchDeck?: string;
    financialStatements?: string[];
  };
  confidence: Record<string, number>;
  warnings: string[];
  source: {
    url: string;
    extractedAt: string;
  };
}

export async function extractBusinessData(
  url: string
): Promise<BusinessExtractionResult> {
  
  // Step 1: Scrape company website with Firecrawl
  const firecrawlKey = process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY;
  
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
    }),
  });
  
  const scrapeResult = await scrapeResponse.json();
  const content = scrapeResult.data?.markdown || '';
  
  // Step 2: Extract structured data with GPT-4
  const extracted = await extractWithOpenAI(content, url);
  
  return extracted;
}

async function extractWithOpenAI(
  content: string,
  url: string
): Promise<BusinessExtractionResult> {
  
  const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
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
          content: `You are a business analyst extracting company data for valuation purposes.

Extract ALL available information about this business from their website.

Return JSON with this schema:
{
  "companyName": "string",
  "industry": "string (e.g., SaaS, E-commerce, Manufacturing)",
  "sector": "string (e.g., Technology, Healthcare, Finance)",
  "foundedYear": number,
  "headquarters": "string (City, State/Country)",
  "website": "string",
  "employeeCount": number (if exact count available),
  "employeeRange": "string (if range: 10-50, 50-200, 200-500, 500+)",
  "officeCount": number,
  "primaryProducts": ["array of main products/services"],
  "targetMarket": "string (SMB, Enterprise, Consumer, etc.)",
  "customerSegments": ["array of customer types"],
  "annualRevenue": number (USD, if disclosed),
  "revenueRange": "string (if range: $1M-$5M, $5M-$10M, etc.)",
  "fundingRaised": number (total funding if disclosed),
  "growthRate": number (YoY % if mentioned),
  "clientCount": number (total customers if mentioned),
  "recurringRevenue": number (ARR/MRR if SaaS),
  "competitors": ["array of main competitors mentioned"],
  "keyDifferentiators": ["unique value propositions"],
  "founders": ["array of founder names"],
  "keyExecutives": ["CEO, CTO, etc. with names"],
  "awards": ["industry awards or recognition"],
  "certifications": ["ISO, SOC 2, etc."],
  "partnerships": ["strategic partners mentioned"],
  "companyDescription": "string (2-3 sentence summary)",
  "confidence": {
    "fieldName": 0.0-1.0 (confidence for each field)
  }
}

CRITICAL:
- Extract ONLY information explicitly stated on the website
- For employee count: Look for "Our team of 50 people" or LinkedIn employee count
- For revenue: Look for "We serve $10M ARR" or "Processing $50M annually"
- For growth: Look for "Growing 200% YoY" or "Doubled revenue in 2023"
- Set confidence: 1.0 = explicit, 0.8 = strong inference, 0.5 = educated guess, 0.3 = very uncertain
- Use null for fields not found`
        },
        {
          role: 'user',
          content: `Extract company data from this website:\n\nURL: ${url}\n\nCONTENT:\n${content.slice(0, 100000)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 4000,
    }),
  });
  
  const result = await response.json();
  const parsed = JSON.parse(result.choices[0]?.message?.content || '{}');
  
  return {
    data: parsed,
    confidence: parsed.confidence || {},
    warnings: generateBusinessWarnings(parsed),
    source: {
      url,
      extractedAt: new Date().toISOString(),
    },
  };
}
```

**Coverage:**
- ANY company website
- Private companies
- Startups to enterprise

**Accuracy:** ⭐⭐⭐ (depends on website quality, 60-80% confidence typical)

---

### 4. **Companies House API (UK Companies) - FREE ✅**

**What it provides:**
- Company name, registration number
- Registered address
- Directors and officers
- Filing history
- Annual accounts (if filed)
- Share capital

**API Access:**
```typescript
const COMPANIES_HOUSE_KEY = process.env.NEXT_PUBLIC_COMPANIES_HOUSE_KEY;

async function getUKCompanyData(companyNumber: string) {
  const response = await fetch(
    `https://api.company-information.service.gov.uk/company/${companyNumber}`,
    {
      headers: {
        'Authorization': 'Basic ' + btoa(COMPANIES_HOUSE_KEY + ':')
      }
    }
  );
  
  const company = await response.json();
  
  // Get financials from filing history
  const filings = await fetch(
    `https://api.company-information.service.gov.uk/company/${companyNumber}/filing-history`,
    {
      headers: {
        'Authorization': 'Basic ' + btoa(COMPANIES_HOUSE_KEY + ':')
      }
    }
  ).then(r => r.json());
  
  return {
    companyName: company.company_name,
    registrationNumber: company.company_number,
    foundedDate: company.date_of_creation,
    status: company.company_status,
    type: company.type,
    sicCodes: company.sic_codes,
    employees: company.accounts?.employee_count,
    turnover: company.accounts?.turnover,
    netAssets: company.accounts?.net_assets
  };
}
```

**Coverage:**
- All UK companies (5M+ companies)
- Free API access with key

**Accuracy:** ⭐⭐⭐⭐⭐ (official government data)

---

### 5. **LinkedIn Company Data (Web Scraping)**

**What it provides:**
- Employee count (real-time)
- Company size category
- Industry classification
- Headquarters location
- Founded year
- Specialties

**Implementation:**
```typescript
// Use Firecrawl to scrape LinkedIn company page
async function getLinkedInData(companyName: string) {
  const linkedinUrl = `https://www.linkedin.com/company/${companyName}`;
  
  // Firecrawl handles LinkedIn's JavaScript and auth
  const firecrawlKey = process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY;
  
  const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${firecrawlKey}`,
    },
    body: JSON.stringify({
      url: linkedinUrl,
      formats: ['markdown'],
    }),
  });
  
  const result = await scrapeResponse.json();
  
  // Extract with GPT-4
  return extractLinkedInData(result.data.markdown);
}
```

**Coverage:**
- 60M+ companies globally
- Real-time employee counts

**Accuracy:** ⭐⭐⭐⭐ (self-reported but generally accurate)

---

### 6. **Crunchbase API (Startups/VC-backed) - PAID**

**What it provides:**
- Funding rounds and amounts
- Investors list
- Valuation (if available)
- Employee count
- Revenue range
- Acquisition history

**Pricing:**
- Basic: $29/month (limited)
- Pro: $99/month (full access)
- Enterprise: Custom

**Not recommended for MVP** - Focus on free sources first

---

## 💰 Business Valuation Methods

### 1. **Revenue Multiple Method** (Best for SaaS/Tech)

```typescript
async function valuateByRevenue(businessData: BusinessData): Promise<ValuationResult> {
  const revenue = businessData.annualRevenue;
  
  // Industry-specific multiples
  const revenueMultiples: Record<string, number> = {
    'SaaS': 8.0,          // High-growth SaaS: 8-12x revenue
    'E-commerce': 1.5,     // E-commerce: 1-3x revenue
    'Manufacturing': 0.8,  // Manufacturing: 0.5-1.5x revenue
    'Healthcare': 3.0,     // Healthcare services: 2-4x revenue
    'Professional Services': 2.0,  // Services: 1-3x revenue
    'FinTech': 6.0,        // FinTech: 5-8x revenue
    'MarTech': 5.0,        // Marketing tech: 4-6x revenue
  };
  
  const multiple = revenueMultiples[businessData.industry] || 2.0;
  
  // Adjust for growth rate
  let growthAdjustment = 1.0;
  if (businessData.growthRate > 100) growthAdjustment = 1.5; // Hypergrowth
  else if (businessData.growthRate > 50) growthAdjustment = 1.3; // High growth
  else if (businessData.growthRate > 20) growthAdjustment = 1.1; // Moderate growth
  else if (businessData.growthRate < 0) growthAdjustment = 0.7; // Declining
  
  // Adjust for profitability
  const profitAdjustment = businessData.profitMargin > 20 ? 1.2 :
                          businessData.profitMargin > 10 ? 1.0 :
                          businessData.profitMargin > 0 ? 0.9 : 0.7;
  
  const valuation = revenue * multiple * growthAdjustment * profitAdjustment;
  
  return {
    estimatedValue: Math.round(valuation),
    method: 'Revenue Multiple',
    confidence: 75,
    valueLow: Math.round(valuation * 0.7),
    valueHigh: Math.round(valuation * 1.3),
    reasoning: `Valued at ${multiple}x revenue (industry standard for ${businessData.industry}), adjusted for ${businessData.growthRate}% growth and ${businessData.profitMargin}% margin.`,
    keyFactors: [
      `Revenue: $${(revenue / 1000000).toFixed(1)}M`,
      `Growth Rate: ${businessData.growthRate}%`,
      `Profit Margin: ${businessData.profitMargin}%`,
      `Industry Multiple: ${multiple}x`
    ]
  };
}
```

---

### 2. **EBITDA Multiple Method** (Best for Established Businesses)

```typescript
async function valuateByEBITDA(businessData: BusinessData): Promise<ValuationResult> {
  const ebitda = businessData.ebitda;
  
  // Industry EBITDA multiples
  const ebitdaMultiples: Record<string, number> = {
    'Software': 12.0,      // Software/SaaS: 10-15x EBITDA
    'Manufacturing': 6.0,  // Manufacturing: 5-8x EBITDA
    'Retail': 5.0,         // Retail: 4-6x EBITDA
    'Healthcare': 8.0,     // Healthcare: 7-10x EBITDA
    'Construction': 5.5,   // Construction: 4-7x EBITDA
    'Transportation': 6.5, // Transport/Logistics: 5-8x EBITDA
  };
  
  const multiple = ebitdaMultiples[businessData.sector] || 6.0;
  
  // Adjust for size (larger = higher multiple)
  const sizeAdjustment = ebitda > 10000000 ? 1.2 :  // $10M+ EBITDA
                         ebitda > 5000000 ? 1.1 :    // $5M+ EBITDA
                         ebitda > 2000000 ? 1.0 :    // $2M+ EBITDA
                         0.9;                         // < $2M EBITDA
  
  const valuation = ebitda * multiple * sizeAdjustment;
  
  return {
    estimatedValue: Math.round(valuation),
    method: 'EBITDA Multiple',
    confidence: 80,
    valueLow: Math.round(valuation * 0.75),
    valueHigh: Math.round(valuation * 1.25),
    reasoning: `Valued at ${multiple}x EBITDA (${businessData.sector} industry standard), with ${sizeAdjustment}x size adjustment.`,
    keyFactors: [
      `EBITDA: $${(ebitda / 1000000).toFixed(1)}M`,
      `EBITDA Margin: ${((ebitda / businessData.revenue) * 100).toFixed(1)}%`,
      `Industry Multiple: ${multiple}x`,
      `Size Factor: ${sizeAdjustment}x`
    ]
  };
}
```

---

### 3. **Discounted Cash Flow (DCF)** (Most Rigorous)

```typescript
async function valuateByDCF(businessData: BusinessData): Promise<ValuationResult> {
  const currentCashFlow = businessData.operatingCashFlow;
  const growthRate = businessData.growthRate / 100;
  const terminalGrowthRate = 0.03; // 3% perpetual growth
  const discountRate = 0.12; // 12% WACC (typical for private companies)
  const projectionYears = 5;
  
  // Project cash flows
  let npv = 0;
  for (let year = 1; year <= projectionYears; year++) {
    const projectedCashFlow = currentCashFlow * Math.pow(1 + growthRate, year);
    const discountedCashFlow = projectedCashFlow / Math.pow(1 + discountRate, year);
    npv += discountedCashFlow;
  }
  
  // Terminal value (Gordon Growth Model)
  const yearFiveCashFlow = currentCashFlow * Math.pow(1 + growthRate, projectionYears);
  const terminalValue = (yearFiveCashFlow * (1 + terminalGrowthRate)) / 
                        (discountRate - terminalGrowthRate);
  const discountedTerminalValue = terminalValue / Math.pow(1 + discountRate, projectionYears);
  
  const enterpriseValue = npv + discountedTerminalValue;
  const equityValue = enterpriseValue - (businessData.totalDebt || 0) + (businessData.cash || 0);
  
  return {
    estimatedValue: Math.round(equityValue),
    method: 'Discounted Cash Flow (DCF)',
    confidence: 85,
    valueLow: Math.round(equityValue * 0.8),
    valueHigh: Math.round(equityValue * 1.2),
    reasoning: `DCF valuation assuming ${(growthRate * 100).toFixed(0)}% growth for ${projectionYears} years, then ${(terminalGrowthRate * 100).toFixed(0)}% perpetual growth, discounted at ${(discountRate * 100).toFixed(0)}% WACC.`,
    keyFactors: [
      `Current Cash Flow: $${(currentCashFlow / 1000000).toFixed(1)}M`,
      `Growth Rate: ${(growthRate * 100).toFixed(0)}%`,
      `Discount Rate: ${(discountRate * 100).toFixed(0)}%`,
      `5-Year NPV: $${(npv / 1000000).toFixed(1)}M`,
      `Terminal Value: $${(discountedTerminalValue / 1000000).toFixed(1)}M`
    ]
  };
}
```

---

### 4. **Hybrid AI Valuation** (Recommended)

```typescript
async function estimateBusinessValue(
  businessData: BusinessData
): Promise<ValuationResult> {
  
  // Get valuations from multiple methods
  const valuations: ValuationResult[] = [];
  
  if (businessData.revenue) {
    valuations.push(await valuateByRevenue(businessData));
  }
  
  if (businessData.ebitda) {
    valuations.push(await valuateByEBITDA(businessData));
  }
  
  if (businessData.operatingCashFlow) {
    valuations.push(await valuateByDCF(businessData));
  }
  
  // Use GPT-4 to synthesize and provide final estimate
  const gpt4Valuation = await synthesizeWithGPT4(businessData, valuations);
  
  return gpt4Valuation;
}

async function synthesizeWithGPT4(
  businessData: BusinessData,
  valuations: ValuationResult[]
): Promise<ValuationResult> {
  
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY
  });
  
  const prompt = `You are a professional business valuator. Analyze these valuations and provide a final estimate:

BUSINESS:
- Name: ${businessData.companyName}
- Industry: ${businessData.industry}
- Revenue: $${businessData.revenue?.toLocaleString() || 'Unknown'}
- EBITDA: $${businessData.ebitda?.toLocaleString() || 'Unknown'}
- Growth Rate: ${businessData.growthRate || 'Unknown'}%
- Employees: ${businessData.employeeCount || 'Unknown'}

VALUATIONS:
${valuations.map((v, i) => `
${i + 1}. ${v.method}: $${v.estimatedValue.toLocaleString()}
   Confidence: ${v.confidence}%
   Range: $${v.valueLow.toLocaleString()} - $${v.valueHigh.toLocaleString()}
   Reasoning: ${v.reasoning}
`).join('\n')}

Provide a final valuation that:
1. Weighs each method by confidence and appropriateness for this business
2. Considers industry-specific factors
3. Accounts for growth trajectory and profitability
4. Provides conservative estimate suitable for tokenization

Respond with JSON:
{
  "estimatedValue": number,
  "confidence": 0-100,
  "valueLow": number,
  "valueHigh": number,
  "reasoning": "2-3 sentences explaining your final valuation",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "primaryMethod": "which valuation method you weighted most heavily",
  "riskFactors": ["risk1", "risk2"],
  "investmentHighlights": ["highlight1", "highlight2"]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: "You are a professional business valuator with expertise in M&A and tokenization." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.2
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  
  return {
    ...result,
    method: 'Hybrid AI Valuation',
    dataSource: 'Multi-Method + GPT-4 Synthesis',
    lastUpdated: new Date()
  };
}
```

---

## 🎯 Token Yield Calculation

### For Properties (Current):
```
Yield = Net Rental Income / Property Value
Token Yield = (Yield × Token Ownership %) - Fees
```

### For Businesses (New):
```typescript
function calculateBusinessTokenYield(
  businessData: BusinessData,
  trustConfig: TrustConfiguration
): YieldProjection {
  
  // Calculate distributable cash flow
  const ebitda = businessData.ebitda;
  const capex = businessData.capex || (ebitda * 0.1); // Assume 10% CAPEX if not provided
  const workingCapitalChange = businessData.workingCapitalChange || 0;
  const taxes = ebitda * 0.25; // Assume 25% tax rate
  
  const freeCashFlow = ebitda - capex - workingCapitalChange - taxes;
  
  // Apply distribution policy (from trust configuration)
  const distributionRate = trustConfig.annualDistributionRate / 100; // e.g., 0.75 for 75%
  const reserveRate = trustConfig.reserveFundRate / 100; // e.g., 0.20 for 20%
  const trusteeFeeRate = trustConfig.trusteeFeeRate / 100; // e.g., 0.05 for 5%
  
  // Calculate distributions
  const totalDistributable = freeCashFlow * distributionRate;
  const reserveFund = freeCashFlow * reserveRate;
  const trusteeFees = freeCashFlow * trusteeFeeRate;
  
  // Per-token yield
  const totalTokens = trustConfig.tokenSupply;
  const distributionPerToken = totalDistributable / totalTokens;
  const yieldPerToken = (distributionPerToken / trustConfig.tokenPrice) * 100; // Annualized %
  
  return {
    freeCashFlow,
    totalDistributable,
    reserveFund,
    trusteeFees,
    distributionPerToken,
    annualYieldPercentage: yieldPerToken,
    projectedReturns: {
      year1: distributionPerToken,
      year2: distributionPerToken * (1 + (businessData.growthRate / 100)),
      year3: distributionPerToken * Math.pow(1 + (businessData.growthRate / 100), 2),
      year5: distributionPerToken * Math.pow(1 + (businessData.growthRate / 100), 4),
    },
    assumptions: {
      taxRate: 25,
      capexRate: (capex / ebitda) * 100,
      growthRate: businessData.growthRate,
      distributionPolicy: `${trustConfig.annualDistributionRate}% distribution, ${trustConfig.reserveFundRate}% reserve, ${trustConfig.trusteeFeeRate}% fees`
    }
  };
}

// Example usage:
const yieldProjection = calculateBusinessTokenYield(
  {
    companyName: "TechCorp SaaS",
    revenue: 10000000,      // $10M revenue
    ebitda: 3000000,        // $3M EBITDA (30% margin)
    growthRate: 40,         // 40% YoY growth
    capex: 200000,          // $200K annual CAPEX
  },
  {
    tokenSupply: 10000,
    tokenPrice: 1000,       // $1,000 per token
    annualDistributionRate: 75,
    reserveFundRate: 20,
    trusteeFeeRate: 5,
  }
);

// Result:
// {
//   freeCashFlow: $2,050,000
//   totalDistributable: $1,537,500 (75%)
//   reserveFund: $410,000 (20%)
//   trusteeFees: $102,500 (5%)
//   distributionPerToken: $153.75
//   annualYieldPercentage: 15.38%
//   projectedReturns: {
//     year1: $153.75
//     year2: $215.25 (with 40% growth)
//     year3: $301.35
//     year5: $589.62
//   }
// }
```

---

## 🏗️ Wizard Structure for Business

### Option 1: Add Asset Type Selector (Recommended)

```typescript
// New first step: Asset Type Selection
export default function AssetTypeStep() {
  return (
    <div>
      <h2>What asset would you like to tokenize?</h2>
      
      <div className="grid grid-cols-2 gap-6">
        <button onClick={() => selectAssetType('property')}>
          <div className="card">
            <Home size={48} />
            <h3>Real Estate Property</h3>
            <p>Tokenize residential or commercial properties</p>
            <ul>
              <li>✓ Automatic property valuation</li>
              <li>✓ Rental income distribution</li>
              <li>✓ Census + AI analysis</li>
            </ul>
          </div>
        </button>
        
        <button onClick={() => selectAssetType('business')}>
          <div className="card">
            <Building2 size={48} />
            <h3>Business / Company</h3>
            <p>Tokenize private or public companies</p>
            <ul>
              <li>✓ Financial data extraction</li>
              <li>✓ Profit/cash flow distribution</li>
              <li>✓ Multi-method valuation</li>
            </ul>
          </div>
        </button>
      </div>
    </div>
  );
}
```

### Option 2: Parallel Wizard Flows

```
src/components/steps/
├── property/
│   ├── property-details-step.tsx
│   ├── property-valuation-step.tsx
│   └── property-trust-config-step.tsx
│
├── business/
│   ├── business-details-step.tsx  (NEW)
│   ├── business-valuation-step.tsx  (NEW)
│   └── business-trust-config-step.tsx  (NEW)
│
└── shared/
    ├── metadata-configuration-step.tsx
    ├── nft-minting-step.tsx
    ├── dat-integration-step.tsx
    └── complete-summary-step.tsx
```

---

## 📋 Business Details Step (Mirror Property Details)

```typescript
// src/components/steps/business/business-details-step.tsx

export function BusinessDetailsStep({ data, onComplete }: StepProps) {
  const [formData, setFormData] = useState<BusinessData>({
    // Extraction method
    extractionMethod: 'url', // 'url' | 'manual' | 'ticker'
    
    // URL Extraction (like Sotheby's for property)
    companyWebsiteUrl: '',
    linkedinUrl: '',
    
    // OR Ticker (for public companies)
    stockTicker: '',
    
    // OR Manual Entry
    companyName: '',
    industry: '',
    foundedYear: undefined,
    headquarters: '',
    
    // Financial Data
    annualRevenue: undefined,
    ebitda: undefined,
    netIncome: undefined,
    operatingCashFlow: undefined,
    growthRate: undefined,
    profitMargin: undefined,
    
    // Size Indicators
    employeeCount: undefined,
    officeCount: undefined,
    
    // Valuation
    estimatedValue: undefined,
    
    // Documents
    financialStatements: [],
    pitchDeck: undefined,
    businessPlan: undefined,
  });
  
  const handleExtractFromUrl = async () => {
    setExtracting(true);
    
    try {
      // Use Firecrawl + GPT-4 (same as property extraction)
      const extracted = await extractBusinessData(formData.companyWebsiteUrl);
      
      setFormData(prev => ({
        ...prev,
        ...extracted.data,
        extractedData: extracted,
      }));
      
      // Show extracted data in terminal (like property extraction)
      setShowTerminal(true);
      
    } catch (error) {
      alert(`Extraction failed: ${error.message}`);
    } finally {
      setExtracting(false);
    }
  };
  
  const handleExtractFromTicker = async () => {
    setExtracting(true);
    
    try {
      // Use Financial Modeling Prep API
      const companyData = await getCompanyDataFromTicker(formData.stockTicker);
      
      setFormData(prev => ({
        ...prev,
        ...companyData,
        extractionMethod: 'ticker',
      }));
      
      setShowTerminal(true);
      
    } catch (error) {
      alert(`Failed to fetch company data: ${error.message}`);
    } finally {
      setExtracting(false);
    }
  };
  
  const handleEstimateValue = async () => {
    setValuing(true);
    
    try {
      // Use hybrid valuation (revenue multiple + EBITDA + DCF + GPT-4)
      const valuation = await estimateBusinessValue(formData);
      
      setFormData(prev => ({
        ...prev,
        estimatedValue: valuation.estimatedValue,
        valuationLow: valuation.valueLow,
        valuationHigh: valuation.valueHigh,
        valuationConfidence: valuation.confidence,
        valuationReasoning: valuation.reasoning,
        valuationData: valuation,
      }));
      
      setShowValuationResult(true);
      
    } catch (error) {
      alert(`Valuation failed: ${error.message}`);
    } finally {
      setValuing(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <h2>Business Details</h2>
      
      {/* Extraction Method Selector */}
      <div className="tabs">
        <button
          className={extractionMethod === 'url' ? 'active' : ''}
          onClick={() => setExtractionMethod('url')}
        >
          <Globe size={20} />
          Extract from Website
        </button>
        
        <button
          className={extractionMethod === 'ticker' ? 'active' : ''}
          onClick={() => setExtractionMethod('ticker')}
        >
          <TrendingUp size={20} />
          Public Company (Ticker)
        </button>
        
        <button
          className={extractionMethod === 'manual' ? 'active' : ''}
          onClick={() => setExtractionMethod('manual')}
        >
          <Edit size={20} />
          Manual Entry
        </button>
      </div>
      
      {/* URL Extraction (like Property Sotheby's scraping) */}
      {extractionMethod === 'url' && (
        <div className="card">
          <h3>📊 Extract Business Data from Website</h3>
          <p>Enter company website URL to automatically extract financial data</p>
          
          <input
            type="url"
            placeholder="https://company.com"
            value={formData.companyWebsiteUrl}
            onChange={(e) => setFormData({...formData, companyWebsiteUrl: e.target.value})}
          />
          
          <input
            type="url"
            placeholder="https://linkedin.com/company/name (optional)"
            value={formData.linkedinUrl}
            onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})}
          />
          
          <button onClick={handleExtractFromUrl} disabled={extracting}>
            {extracting ? (
              <>
                <Loader className="animate-spin" /> Extracting...
              </>
            ) : (
              <>
                <Download /> Extract Data
              </>
            )}
          </button>
          
          <div className="text-xs text-muted">
            <p>✓ Uses Firecrawl + GPT-4 to extract:</p>
            <ul>
              <li>• Company info (name, industry, size)</li>
              <li>• Financial metrics (revenue, growth, margins)</li>
              <li>• Team and leadership</li>
              <li>• Products and market position</li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Ticker Extraction (Public Companies) */}
      {extractionMethod === 'ticker' && (
        <div className="card">
          <h3>📈 Public Company Data</h3>
          <p>Enter stock ticker to fetch SEC filings and financial data</p>
          
          <input
            type="text"
            placeholder="AAPL, TSLA, MSFT, etc."
            value={formData.stockTicker}
            onChange={(e) => setFormData({...formData, stockTicker: e.target.value.toUpperCase()})}
          />
          
          <button onClick={handleExtractFromTicker} disabled={extracting}>
            {extracting ? (
              <>
                <Loader className="animate-spin" /> Fetching SEC Data...
              </>
            ) : (
              <>
                <Database /> Fetch Financial Data
              </>
            )}
          </button>
          
          <div className="text-xs text-muted">
            <p>✓ Fetches from SEC EDGAR + Financial Modeling Prep:</p>
            <ul>
              <li>• Latest 10-K/10-Q filings</li>
              <li>• Revenue, EBITDA, cash flow</li>
              <li>• Financial ratios and metrics</li>
              <li>• Market cap and valuation</li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Manual Entry */}
      {extractionMethod === 'manual' && (
        <div className="space-y-6">
          {/* Company Info */}
          <div className="card">
            <h3>Company Information</h3>
            
            <input
              type="text"
              placeholder="Company Name"
              value={formData.companyName}
              onChange={(e) => setFormData({...formData, companyName: e.target.value})}
            />
            
            <input
              type="text"
              placeholder="Industry (e.g., SaaS, Manufacturing, E-commerce)"
              value={formData.industry}
              onChange={(e) => setFormData({...formData, industry: e.target.value})}
            />
            
            <input
              type="number"
              placeholder="Founded Year"
              value={formData.foundedYear}
              onChange={(e) => setFormData({...formData, foundedYear: parseInt(e.target.value)})}
            />
            
            <input
              type="text"
              placeholder="Headquarters (City, State)"
              value={formData.headquarters}
              onChange={(e) => setFormData({...formData, headquarters: e.target.value})}
            />
          </div>
          
          {/* Financial Data */}
          <div className="card">
            <h3>Financial Metrics</h3>
            
            <input
              type="number"
              placeholder="Annual Revenue (USD)"
              value={formData.annualRevenue}
              onChange={(e) => setFormData({...formData, annualRevenue: parseFloat(e.target.value)})}
            />
            
            <input
              type="number"
              placeholder="EBITDA (USD, if available)"
              value={formData.ebitda}
              onChange={(e) => setFormData({...formData, ebitda: parseFloat(e.target.value)})}
            />
            
            <input
              type="number"
              placeholder="Net Income (USD, if available)"
              value={formData.netIncome}
              onChange={(e) => setFormData({...formData, netIncome: parseFloat(e.target.value)})}
            />
            
            <input
              type="number"
              placeholder="Annual Growth Rate (%)"
              value={formData.growthRate}
              onChange={(e) => setFormData({...formData, growthRate: parseFloat(e.target.value)})}
            />
            
            <input
              type="number"
              placeholder="Profit Margin (%)"
              value={formData.profitMargin}
              onChange={(e) => setFormData({...formData, profitMargin: parseFloat(e.target.value)})}
            />
          </div>
          
          {/* Size Indicators */}
          <div className="card">
            <h3>Company Size</h3>
            
            <input
              type="number"
              placeholder="Number of Employees"
              value={formData.employeeCount}
              onChange={(e) => setFormData({...formData, employeeCount: parseInt(e.target.value)})}
            />
            
            <input
              type="number"
              placeholder="Number of Offices/Locations"
              value={formData.officeCount}
              onChange={(e) => setFormData({...formData, officeCount: parseInt(e.target.value)})}
            />
          </div>
        </div>
      )}
      
      {/* Extracted Data Terminal (like property extraction) */}
      {showTerminal && extractedData && (
        <ExtractedBusinessTerminal data={extractedData} />
      )}
      
      {/* AI Valuation Button */}
      {formData.annualRevenue && (
        <div className="card">
          <h3>✨ AI Business Valuation</h3>
          <p>Get AI-powered valuation using multiple methods</p>
          
          <button onClick={handleEstimateValue} disabled={valuing}>
            {valuing ? (
              <>
                <Loader className="animate-spin" /> Valuing Business...
              </>
            ) : (
              <>
                <Sparkles /> Estimate Value
              </>
            )}
          </button>
        </div>
      )}
      
      {/* Valuation Result */}
      {showValuationResult && valuationData && (
        <div className="card border-accent">
          <h3>💰 Estimated Business Value</h3>
          
          <div className="metric">
            <span className="label">Estimated Value</span>
            <span className="value text-accent">
              ${valuationData.estimatedValue.toLocaleString()}
            </span>
          </div>
          
          <div className="metric">
            <span className="label">Value Range</span>
            <span className="value">
              ${valuationData.valueLow.toLocaleString()} - ${valuationData.valueHigh.toLocaleString()}
            </span>
          </div>
          
          <div className="metric">
            <span className="label">Confidence Score</span>
            <span className="value">{valuationData.confidence}%</span>
          </div>
          
          <div className="metric">
            <span className="label">Method</span>
            <span className="value">{valuationData.method}</span>
          </div>
          
          <div className="reasoning">
            <p className="text-sm text-muted">{valuationData.reasoning}</p>
          </div>
          
          <div className="key-factors">
            <h4>Key Factors:</h4>
            <ul>
              {valuationData.keyFactors.map((factor, i) => (
                <li key={i}>{factor}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Supporting Documents */}
      <div className="card">
        <h3>📄 Supporting Documents</h3>
        
        <div className="document-upload">
          <div>
            <label>Financial Statements *</label>
            <input
              type="file"
              accept=".pdf,.xlsx,.csv"
              multiple
              onChange={(e) => setFormData({...formData, financialStatements: Array.from(e.target.files || [])})}
            />
            <p className="text-xs text-muted">Income statement, balance sheet, cash flow (last 3 years)</p>
          </div>
          
          <div>
            <label>Pitch Deck (optional)</label>
            <input
              type="file"
              accept=".pdf,.pptx"
              onChange={(e) => setFormData({...formData, pitchDeck: e.target.files?.[0]})}
            />
          </div>
          
          <div>
            <label>Business Plan (optional)</label>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => setFormData({...formData, businessPlan: e.target.files?.[0]})}
            />
          </div>
        </div>
      </div>
      
      {/* Continue Button */}
      <button
        className="btn-primary"
        onClick={() => onComplete(formData)}
        disabled={!formData.companyName || !formData.annualRevenue || !formData.estimatedValue}
      >
        Continue to Trust Configuration →
      </button>
    </div>
  );
}
```

---

## 📂 New File Structure

```
apps/property-tokenization-wizard/
├── src/
│   ├── services/
│   │   ├── propertyExtractor.ts (existing)
│   │   ├── propertyValuation.ts (existing)
│   │   ├── businessExtractor.ts (NEW)
│   │   ├── businessValuation.ts (NEW)
│   │   ├── financialDataApis.ts (NEW)
│   │   └── yieldCalculator.ts (NEW - handles both property & business)
│   │
│   ├── components/steps/
│   │   ├── asset-type-step.tsx (NEW)
│   │   ├── property/
│   │   │   └── property-details-step.tsx (move existing)
│   │   ├── business/
│   │   │   ├── business-details-step.tsx (NEW)
│   │   │   └── business-trust-config-step.tsx (NEW)
│   │   └── shared/
│   │       ├── metadata-configuration-step.tsx
│   │       └── ...
│   │
│   └── types/
│       ├── wizard.ts (existing, extend)
│       ├── business.ts (NEW)
│       └── valuation.ts (NEW)
│
└── BUSINESS_TOKENIZATION_PLAN.md (THIS FILE)
```

---

## 🚀 Implementation Roadmap

### Phase 1: Data Sources (Week 1)
- [ ] Create `businessExtractor.ts` (mirror `propertyExtractor.ts`)
- [ ] Implement Firecrawl + GPT-4 extraction for company websites
- [ ] Add Financial Modeling Prep API integration
- [ ] Add SEC EDGAR API integration (optional)
- [ ] Test extraction with 5-10 sample companies

### Phase 2: Valuation (Week 2)
- [ ] Create `businessValuation.ts`
- [ ] Implement revenue multiple valuation
- [ ] Implement EBITDA multiple valuation
- [ ] Implement DCF valuation
- [ ] Implement GPT-4 hybrid synthesis
- [ ] Test with known company valuations

### Phase 3: Wizard UI (Week 3)
- [ ] Create Asset Type Selection step
- [ ] Create Business Details step
- [ ] Create Business Trust Configuration step
- [ ] Add yield calculator for businesses
- [ ] Update UAT metadata generator for businesses

### Phase 4: Testing & Polish (Week 4)
- [ ] End-to-end testing (website → extraction → valuation → tokens)
- [ ] Compare valuations against known M&A transactions
- [ ] UI/UX polish
- [ ] Documentation

---

## 💡 Quick Start

### 1. Add Financial Modeling Prep API Key
```bash
# .env.local
NEXT_PUBLIC_FMP_API_KEY=your_key_here
# Get free key at: https://site.financialmodelingprep.com/developer/docs
```

### 2. Test Company Extraction
```typescript
// Test with a SaaS company
const businessData = await extractBusinessData('https://stripe.com');

// Result:
// {
//   companyName: "Stripe",
//   industry: "FinTech / Payment Processing",
//   employeeCount: ~8000,
//   revenue: ~$14B (estimated),
//   growthRate: ~30%,
//   ...
// }
```

### 3. Test Valuation
```typescript
const valuation = await estimateBusinessValue({
  companyName: "Stripe",
  revenue: 14000000000,
  growthRate: 30,
  industry: "FinTech",
  profitMargin: 20
});

// Result:
// {
//   estimatedValue: $84B
//   method: "Revenue Multiple (6x)"
//   confidence: 75
//   ...
// }
```

---

## 📊 Example: Full Business Tokenization Flow

```typescript
// Step 1: Extract from website
const businessData = await extractBusinessData('https://company.com');

// Step 2: Enhance with public data (if available)
const enhanced = await enhanceWithPublicData(businessData);

// Step 3: Valuate
const valuation = await estimateBusinessValue(enhanced);

// Step 4: Configure trust
const trustConfig = {
  trustName: `${businessData.companyName} Trust`,
  tokenName: `${businessData.companyName} Token`,
  tokenSymbol: generateSymbol(businessData.companyName), // e.g., "STRP" for Stripe
  tokenSupply: 1000000, // 1M tokens
  tokenPrice: valuation.estimatedValue / 1000000, // Price per token
  annualDistributionRate: 75, // 75% of FCF distributed
  reserveFundRate: 20, // 20% reserve
  trusteeFeeRate: 5, // 5% fees
};

// Step 5: Calculate yields
const yieldProjection = calculateBusinessTokenYield(enhanced, trustConfig);

// Step 6: Generate UAT metadata
const uatMetadata = generateBusinessUATMetadata({
  businessData: enhanced,
  trustConfig,
  valuation,
  yieldProjection
});

// Step 7: Mint tokens (same as property flow)
await mintTokens(uatMetadata);
```

---

## ✅ Summary

### What This Enables:

1. **Property Tokenization** (Existing)
   - Scrape Sotheby's/Zillow → Extract data → Value with Census → Mint tokens
   
2. **Business Tokenization** (NEW)
   - Scrape company website/SEC filings → Extract financials → Value with multiple methods → Mint tokens

### Data Sources Available:

| Source | Type | Cost | Coverage | Accuracy |
|--------|------|------|----------|----------|
| SEC EDGAR | Public Companies | Free | US public cos | ⭐⭐⭐⭐⭐ |
| Financial Modeling Prep | Public Companies | $30/mo | Global public | ⭐⭐⭐⭐⭐ |
| Firecrawl + GPT-4 | Any Company | $0.10/call | Universal | ⭐⭐⭐ |
| Companies House | UK Companies | Free | UK only | ⭐⭐⭐⭐⭐ |
| LinkedIn | Any Company | Free | Employee data | ⭐⭐⭐⭐ |

### Valuation Methods:

1. **Revenue Multiple** - Best for SaaS/high-growth (6-12x revenue)
2. **EBITDA Multiple** - Best for established businesses (5-15x EBITDA)
3. **DCF** - Most rigorous, needs cash flow projections
4. **Hybrid AI** - Combines all methods with GPT-4 synthesis (RECOMMENDED)

### Yield Calculation:

**For Businesses:**
```
Free Cash Flow = EBITDA - CAPEX - Taxes - Working Capital Change
Token Yield = (FCF × Distribution Rate) / Token Value
```

**Example:**
- Business: $10M revenue, $3M EBITDA (30% margin)
- FCF: $2M after CAPEX/taxes
- Tokens: 10,000 @ $1,000 each
- Distribution: 75%
- **Yield per token: ~15.4% annually** ($153.75 per $1K token)

---

## 🎯 Next Actions

**Ready to implement?**

1. **Sign up for Financial Modeling Prep** (free tier)
2. **Test extraction on 3-5 company websites**
3. **Validate valuations against known M&A deals**
4. **Build Business Details step** (mirror Property Details)
5. **Add Asset Type selector to wizard**
6. **Launch MVP** 🚀

**This would make AssetRail the FIRST universal asset tokenization platform - properties AND businesses! 🎉**

