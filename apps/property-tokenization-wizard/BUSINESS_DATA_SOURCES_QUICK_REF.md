# Business Data Sources - Quick Reference

**Last Updated:** October 25, 2025

---

## 🎯 Best Data Sources for Business Tokenization

### 1. **Financial Modeling Prep API** ⭐ RECOMMENDED
**Best for:** Public companies (US & International)

```typescript
// Setup
const FMP_API = 'https://financialmodelingprep.com/api/v3';
const API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY;

// Get everything in 3 API calls
const profile = await fetch(`${FMP_API}/profile/${ticker}?apikey=${API_KEY}`);
const income = await fetch(`${FMP_API}/income-statement/${ticker}?limit=5&apikey=${API_KEY}`);
const ratios = await fetch(`${FMP_API}/ratios/${ticker}?limit=1&apikey=${API_KEY}`);

// You get:
// - Revenue, EBITDA, Net Income
// - Growth rates
// - Profit margins
// - Market cap
// - Employee count
// - Debt ratios
// - P/E ratio
```

**Pricing:**
- Free: 250 requests/day ✅
- Pro: $30/month (750 requests/day)

**Accuracy:** ⭐⭐⭐⭐⭐ (SEC filings + real-time)

**Sign up:** https://site.financialmodelingprep.com/developer/docs

---

### 2. **Firecrawl + GPT-4** ⭐ YOUR CURRENT STACK
**Best for:** Private companies, startups, any company website

```typescript
// Same approach as Sotheby's scraping!
const businessData = await extractBusinessData('https://company.com');

// GPT-4 extracts:
// - Company name, industry
// - Employee count (from "Our team of 50...")
// - Revenue hints ("Processing $10M annually")
// - Growth claims ("Doubled revenue in 2023")
// - Product descriptions
// - Customer testimonials
// - Team/leadership info
```

**Pricing:**
- Firecrawl: You already have key
- GPT-4: ~$0.10 per extraction

**Accuracy:** ⭐⭐⭐ (60-80%, depends on website)

**Already integrated:** Yes! Just adapt `propertyExtractor.ts`

---

### 3. **SEC EDGAR API** ⭐ FREE & ACCURATE
**Best for:** US public companies (official financials)

```typescript
// Get 10-K annual report
const cik = await getCIK('AAPL'); // Apple's CIK number
const filings = await fetch(
  `https://data.sec.gov/submissions/CIK${cik}.json`,
  { headers: { 'User-Agent': 'AssetRail contact@assetrail.xyz' }}
);

// Parse latest 10-K for:
// - Audited revenue
// - Net income
// - Assets & liabilities
// - Cash flow statements
// - Management discussion
```

**Pricing:** FREE ✅

**Accuracy:** ⭐⭐⭐⭐⭐ (Audited financials, gold standard)

**Coverage:** ~4,000 US public companies

---

### 4. **LinkedIn Scraping** (Firecrawl)
**Best for:** Employee count (most accurate real-time data)

```typescript
const linkedinUrl = `https://www.linkedin.com/company/${companyName}`;
const scraped = await firecrawl.scrape(linkedinUrl);

// Extract with GPT-4:
// - Employee count (exact or range)
// - Growth rate ("25% employee growth last year")
// - Locations
// - Industry classification
```

**Pricing:** Uses your Firecrawl key

**Accuracy:** ⭐⭐⭐⭐ (Companies update regularly)

**Coverage:** 60M+ companies

---

### 5. **Companies House API** (UK Only)
**Best for:** UK registered companies

```typescript
const response = await fetch(
  `https://api.company-information.service.gov.uk/company/${companyNumber}`,
  {
    headers: {
      'Authorization': 'Basic ' + btoa(COMPANIES_HOUSE_KEY + ':')
    }
  }
);

// Returns:
// - Turnover (revenue)
// - Net assets
// - Employee count
// - Directors
// - Filing history
```

**Pricing:** FREE ✅

**Accuracy:** ⭐⭐⭐⭐⭐ (Official government registry)

**Coverage:** All UK companies (5M+)

---

## 💰 Valuation Method Recommendations

### SaaS / Tech Companies → **Revenue Multiple**
```typescript
Valuation = Revenue × (6-12x)
// Adjust for:
// - Growth rate (>100% = 1.5x multiple)
// - Profit margin (>20% = 1.2x multiple)
```

**Example:**
- $10M revenue, 50% growth, 30% margin
- Valuation: $10M × 8x × 1.3 × 1.2 = **$124.8M**

---

### Established Businesses → **EBITDA Multiple**
```typescript
Valuation = EBITDA × (5-15x)
// Adjust for:
// - Industry (software = 12x, retail = 5x)
// - Size ($10M+ EBITDA = 1.2x adjustment)
```

**Example:**
- $3M EBITDA, manufacturing, $5M+ size
- Valuation: $3M × 6x × 1.1 = **$19.8M**

---

### Any Business → **Hybrid AI Valuation** ⭐ BEST
```typescript
// Combine all methods
const revenueVal = valueByRevenue(data);
const ebitdaVal = valueByEBITDA(data);
const dcfVal = valueByDCF(data);

// Let GPT-4 synthesize
const final = await gpt4Synthesize({
  company: data,
  valuations: [revenueVal, ebitdaVal, dcfVal]
});

// Returns:
// {
//   estimatedValue: $X,
//   confidence: 85,
//   method: "Weighted average favoring EBITDA",
//   reasoning: "...",
//   riskFactors: [...],
//   investmentHighlights: [...]
// }
```

**Accuracy:** Best available (combines multiple methods)

---

## 📊 Data Extraction Strategy

### For Public Companies:
```
1. Start with ticker → Financial Modeling Prep
2. Get SEC filings for verification
3. Scrape website for qualitative data
4. Value with EBITDA multiple + DCF
```

### For Private Companies (Series A+):
```
1. Scrape company website → Firecrawl + GPT-4
2. Scrape LinkedIn for employees
3. Look for press releases mentioning revenue/funding
4. Value with revenue multiple
```

### For Small Businesses:
```
1. Scrape website for basics
2. Request financial statements (upload)
3. Manual entry for revenue/profit
4. Value with EBITDA or asset-based
```

---

## 🎯 Recommended Implementation Order

### Week 1: Foundation
1. ✅ Sign up for Financial Modeling Prep (free)
2. ✅ Create `businessExtractor.ts` (copy `propertyExtractor.ts` structure)
3. ✅ Test extraction on 5 company websites
4. ✅ Test FMP API with public company tickers

### Week 2: Valuation
1. ✅ Create `businessValuation.ts`
2. ✅ Implement revenue multiple method
3. ✅ Implement EBITDA multiple method
4. ✅ Implement GPT-4 synthesis
5. ✅ Validate against known company valuations

### Week 3: Integration
1. ✅ Add Asset Type selector to wizard
2. ✅ Create Business Details step
3. ✅ Adapt Trust Configuration for businesses
4. ✅ Update UAT metadata generator
5. ✅ Test end-to-end flow

---

## 📋 Data Fields to Extract

### Must Have (for valuation):
- ✅ Company name
- ✅ Industry/sector
- ✅ Annual revenue
- ✅ Growth rate
- ✅ Employee count

### Nice to Have:
- EBITDA / Net income
- Profit margin
- Operating cash flow
- Customer count
- Funding raised
- Market position

### For Trust Configuration:
- Founded year
- Headquarters location
- Key executives
- Business model
- Product/service description

---

## 🔧 Code Templates

### Extract from URL:
```typescript
// src/services/businessExtractor.ts
export async function extractBusinessData(url: string) {
  // 1. Scrape with Firecrawl (you already have this!)
  const scraped = await firecrawl.scrape(url);
  
  // 2. Extract with GPT-4 (copy from propertyExtractor.ts)
  const extracted = await gpt4Extract(scraped.markdown);
  
  return extracted;
}
```

### Get Public Company Data:
```typescript
// src/services/financialApis.ts
export async function getPublicCompanyData(ticker: string) {
  const FMP_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY;
  
  const [profile, income, ratios] = await Promise.all([
    fetch(`https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${FMP_KEY}`),
    fetch(`https://financialmodelingprep.com/api/v3/income-statement/${ticker}?limit=5&apikey=${FMP_KEY}`),
    fetch(`https://financialmodelingprep.com/api/v3/ratios/${ticker}?limit=1&apikey=${FMP_KEY}`)
  ]);
  
  return {
    companyName: profile[0].companyName,
    revenue: income[0].revenue,
    netIncome: income[0].netIncome,
    ebitda: income[0].ebitda,
    employees: profile[0].fullTimeEmployees,
    marketCap: profile[0].mktCap,
    // ... etc
  };
}
```

### Valuate Business:
```typescript
// src/services/businessValuation.ts
export async function estimateBusinessValue(data: BusinessData) {
  // Try multiple methods
  const methods = [];
  
  if (data.revenue) {
    methods.push(await valuateByRevenue(data));
  }
  
  if (data.ebitda) {
    methods.push(await valuateByEBITDA(data));
  }
  
  // Synthesize with GPT-4
  return await gpt4Synthesize(data, methods);
}
```

---

## 💡 Key Advantages

### Compared to Manual Appraisals:
- ⚡ **Speed:** 2 minutes vs 2 weeks
- 💰 **Cost:** $0-$5 vs $10,000+
- 🔄 **Updates:** Real-time vs annual
- 📊 **Methods:** Multiple vs single

### Compared to Competitors:
- ✅ You: Properties AND businesses
- ❌ Them: Properties only
- ✅ You: Multiple data sources
- ❌ Them: Single source
- ✅ You: AI valuation
- ❌ Them: Manual only

---

## 🚀 Go-Live Checklist

- [ ] Financial Modeling Prep API key obtained (free)
- [ ] `businessExtractor.ts` created
- [ ] `businessValuation.ts` created
- [ ] Tested with 3 public companies (via ticker)
- [ ] Tested with 3 private companies (via website)
- [ ] Valuations validated against known deals
- [ ] Asset Type selector added to wizard
- [ ] Business Details step created
- [ ] End-to-end test complete
- [ ] Documentation updated

---

## 📞 Support

**Financial Modeling Prep:**
- Docs: https://site.financialmodelingprep.com/developer/docs
- Support: support@financialmodelingprep.com
- Community: Active Discord

**SEC EDGAR:**
- Docs: https://www.sec.gov/developer
- No auth required (just set User-Agent)

---

**You now have everything needed to add business tokenization! 🎉**

**Next:** Sign up for FMP, test extraction, build the UI.

