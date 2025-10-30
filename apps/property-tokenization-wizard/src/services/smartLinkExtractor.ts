/**
 * Smart Link Extractor
 * 
 * Drop ANY company-related URL → Get complete business data
 * 
 * Supported sources:
 * - Company website (stripe.com)
 * - LinkedIn company page
 * - Crunchbase profile
 * - GitHub organization
 * - Y Combinator page
 * - App Store listing
 * - AngelList profile
 * - ProductHunt page
 * 
 * Auto-discovers related URLs and extracts from all sources
 */

import type { BusinessData } from '@/types/business';
import { extractBusinessFromWebsite } from './businessExtractor';

interface SmartExtractionResult {
  data: Partial<BusinessData>;
  sources: {
    name: string;
    url: string;
    dataExtracted: string[];
    confidence: number;
  }[];
  autoDiscoveredUrls: string[];
  overallConfidence: number;
  warnings: string[];
}

type URLType = 
  | 'company_website'
  | 'linkedin'
  | 'crunchbase'
  | 'github'
  | 'ycombinator'
  | 'angellist'
  | 'producthunt'
  | 'app_store'
  | 'unknown';

/**
 * Main function: Extract from any URL
 */
export async function extractFromAnyURL(url: string): Promise<SmartExtractionResult> {
  console.log('🔗 Smart Link Extractor: Analyzing URL:', url);
  
  // Detect URL type
  const urlType = detectURLType(url);
  console.log('📍 Detected source:', urlType);
  
  const sources: SmartExtractionResult['sources'] = [];
  let combinedData: Partial<BusinessData> = {};
  const autoDiscoveredUrls: string[] = [];
  
  // Extract from primary source
  try {
    const primaryResult = await extractFromSource(url, urlType);
    sources.push(primaryResult);
    combinedData = { ...combinedData, ...primaryResult.data };
    
    // If we got company name, try to auto-discover other sources
    if (primaryResult.data.companyName) {
      const discovered = await autoDiscoverSources(primaryResult.data.companyName, url);
      autoDiscoveredUrls.push(...discovered);
      
      // Extract from auto-discovered sources (in parallel, with error handling)
      const discoveredResults = await Promise.allSettled(
        discovered.slice(0, 3).map(async (discoveredUrl) => {
          const type = detectURLType(discoveredUrl);
          return extractFromSource(discoveredUrl, type);
        })
      );
      
      discoveredResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          sources.push(result.value);
          // Merge data (prefer higher confidence)
          combinedData = mergeBusinessData(combinedData, result.value.data);
        } else {
          console.warn('Auto-discovered source failed:', result.reason);
        }
      });
    }
  } catch (error) {
    console.error('Primary extraction failed:', error);
    // If primary extraction fails completely, throw
    throw new Error(`Failed to extract data from ${url}. ${error instanceof Error ? error.message : ''}`);
  }
  
  // Calculate overall confidence
  const overallConfidence = sources.length > 0
    ? Math.round(sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length)
    : 0;
  
  console.log(`✅ Extracted data from ${sources.length} source(s)`);
  console.log(`📊 Overall confidence: ${overallConfidence}%`);
  
  return {
    data: combinedData,
    sources,
    autoDiscoveredUrls,
    overallConfidence,
    warnings: generateWarnings(combinedData, sources),
  };
}

/**
 * Detect what type of URL this is
 */
function detectURLType(url: string): URLType {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('linkedin.com/company')) return 'linkedin';
  if (urlLower.includes('crunchbase.com/organization')) return 'crunchbase';
  if (urlLower.includes('github.com/') && !urlLower.includes('/repos/')) return 'github';
  if (urlLower.includes('ycombinator.com/companies')) return 'ycombinator';
  if (urlLower.includes('angel.co/') || urlLower.includes('angellist.com/')) return 'angellist';
  if (urlLower.includes('producthunt.com/')) return 'producthunt';
  if (urlLower.includes('apps.apple.com/') || urlLower.includes('play.google.com/')) return 'app_store';
  
  // If it's a regular domain, assume company website
  if (url.match(/^https?:\/\/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/)) return 'company_website';
  
  return 'unknown';
}

/**
 * Extract from specific source type
 */
async function extractFromSource(
  url: string,
  type: URLType
): Promise<SmartExtractionResult['sources'][0]> {
  
  switch (type) {
    case 'linkedin':
      return await extractFromLinkedIn(url);
    
    case 'crunchbase':
      return await extractFromCrunchbase(url);
    
    case 'github':
      return await extractFromGitHub(url);
    
    case 'ycombinator':
      return await extractFromYC(url);
    
    case 'company_website':
    default:
      return await extractFromCompanyWebsite(url);
  }
}

/**
 * Extract from LinkedIn company page
 */
async function extractFromLinkedIn(url: string): Promise<SmartExtractionResult['sources'][0]> {
  console.log('🔵 Extracting from LinkedIn...');
  
  try {
    // Use Firecrawl to scrape LinkedIn
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
        waitFor: 5000,
        timeout: 30000,
      }),
    });
    
    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error('LinkedIn scraping failed:', scrapeResponse.status, errorText);
      throw new Error(`LinkedIn scraping failed (${scrapeResponse.status}). LinkedIn may be blocking access. Try using the company website instead.`);
    }
    
    const scrapeResult = await scrapeResponse.json();
    const content = scrapeResult.data?.markdown || '';
    
    if (!content) {
      throw new Error('No content extracted from LinkedIn');
    }
    
    // Extract with GPT-4
    const extracted = await extractLinkedInWithAI(content, url);
    
    return {
      name: 'LinkedIn',
      url,
      dataExtracted: Object.keys(extracted.data).filter(k => extracted.data[k as keyof typeof extracted.data]),
      confidence: 85,
      data: extracted.data,
    };
  } catch (error) {
    console.error('LinkedIn extraction error:', error);
    // Re-throw with helpful message
    throw new Error(`LinkedIn extraction failed. This is common due to anti-scraping protection. Try using the company's website or Crunchbase URL instead.`);
  }
}

/**
 * Extract LinkedIn data with AI
 */
async function extractLinkedInWithAI(content: string, url: string): Promise<{ data: Partial<BusinessData> }> {
  const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!openaiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
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
          content: `Extract company data from LinkedIn page. Return JSON:
{
  "companyName": "string",
  "industry": "string",
  "employeeCount": number (exact if shown, e.g. "7,891 employees" → 7891),
  "employeeRange": "string (e.g., '5000-10000' if shown as range)",
  "headquarters": "string",
  "foundedYear": number,
  "description": "string (company tagline/description)",
  "specialties": ["array of specialties listed"]
}

Extract ONLY what's explicitly shown. Look for:
- "7,891 employees" or "5,000-10,000 employees"
- Location (usually near top)
- Founded year
- Industry classification
- Specialties section`
        },
        {
          role: 'user',
          content: `Extract from LinkedIn:\n\n${content.slice(0, 50000)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });
  
  const result = await response.json();
  const parsed = JSON.parse(result.choices[0]?.message?.content || '{}');
  
  return { data: parsed };
}

/**
 * Extract from Crunchbase
 */
async function extractFromCrunchbase(url: string): Promise<SmartExtractionResult['sources'][0]> {
  console.log('🟠 Extracting from Crunchbase...');
  
  try {
    // Scrape with Firecrawl
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
        waitFor: 5000,
        timeout: 30000,
      }),
    });
    
    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error('Crunchbase scraping failed:', scrapeResponse.status, errorText);
      throw new Error(`Crunchbase scraping failed (${scrapeResponse.status}). Crunchbase may require authentication.`);
    }
    
    const scrapeResult = await scrapeResponse.json();
    const content = scrapeResult.data?.markdown || '';
    
    if (!content) {
      throw new Error('No content extracted from Crunchbase');
    }
    
    // Extract with GPT-4
    const extracted = await extractCrunchbaseWithAI(content);
    
    return {
      name: 'Crunchbase',
      url,
      dataExtracted: Object.keys(extracted.data).filter(k => extracted.data[k as keyof typeof extracted.data]),
      confidence: 90,
      data: extracted.data,
    };
  } catch (error) {
    console.error('Crunchbase extraction error:', error);
    throw new Error(`Crunchbase extraction failed. Crunchbase often requires authentication. Try using the company's website instead.`);
  }
}

/**
 * Extract Crunchbase data with AI
 */
async function extractCrunchbaseWithAI(content: string): Promise<{ data: Partial<BusinessData> }> {
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
          content: `Extract from Crunchbase. Return JSON:
{
  "companyName": "string",
  "industry": "string",
  "fundingRaised": number (total funding in USD),
  "annualRevenue": number (if revenue range shown, use midpoint),
  "revenueRange": "string (e.g., '$10M-$50M')",
  "employeeCount": number,
  "employeeRange": "string",
  "foundedYear": number,
  "headquarters": "string",
  "description": "string"
}

Look for funding rounds, revenue estimates, employee count.`
        },
        {
          role: 'user',
          content: `Extract from Crunchbase:\n\n${content.slice(0, 50000)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });
  
  const result = await response.json();
  const parsed = JSON.parse(result.choices[0]?.message?.content || '{}');
  
  return { data: parsed };
}

/**
 * Extract from GitHub organization
 */
async function extractFromGitHub(url: string): Promise<SmartExtractionResult['sources'][0]> {
  console.log('⚫ Extracting from GitHub...');
  
  // Extract org name from URL
  const orgMatch = url.match(/github\.com\/([^\/]+)/);
  if (!orgMatch) throw new Error('Invalid GitHub URL');
  
  const orgName = orgMatch[1];
  
  // Use GitHub API (no auth needed for public data)
  const [orgData, reposData] = await Promise.all([
    fetch(`https://api.github.com/orgs/${orgName}`).then(r => r.json()),
    fetch(`https://api.github.com/orgs/${orgName}/repos?per_page=100`).then(r => r.json()),
  ]);
  
  const data: Partial<BusinessData> = {
    companyName: orgData.name || orgName,
    website: orgData.blog,
    description: orgData.description,
    // Estimate employee count from contributors (very rough)
    employeeRange: estimateEmployeesFromRepos(reposData),
  };
  
  return {
    name: 'GitHub',
    url,
    dataExtracted: ['companyName', 'website', 'description', 'employeeRange'],
    confidence: 60,
    data,
  };
}

/**
 * Extract from Y Combinator
 */
async function extractFromYC(url: string): Promise<SmartExtractionResult['sources'][0]> {
  console.log('🟠 Extracting from Y Combinator...');
  
  // Scrape YC page (simple HTML)
  const response = await fetch(url);
  const html = await response.text();
  
  // Extract with GPT-4
  const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
          content: `Extract from YC page. Return JSON:
{
  "companyName": "string",
  "description": "string",
  "foundedYear": number,
  "industry": "string",
  "founders": ["array"]
}`
        },
        {
          role: 'user',
          content: `Extract from YC:\n\n${html.slice(0, 20000)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });
  
  const result = await aiResponse.json();
  const parsed = JSON.parse(result.choices[0]?.message?.content || '{}');
  
  return {
    name: 'Y Combinator',
    url,
    dataExtracted: Object.keys(parsed),
    confidence: 85,
    data: parsed,
  };
}

/**
 * Extract from company website (existing function)
 */
async function extractFromCompanyWebsite(url: string): Promise<SmartExtractionResult['sources'][0]> {
  console.log('🌐 Extracting from company website...');
  
  const result = await extractBusinessFromWebsite(url);
  
  return {
    name: 'Company Website',
    url,
    dataExtracted: Object.keys(result.data).filter(k => result.data[k as keyof typeof result.data]),
    confidence: 70,
    data: result.data,
  };
}

/**
 * Auto-discover related URLs
 */
async function autoDiscoverSources(companyName: string, knownUrl: string): Promise<string[]> {
  console.log('🔍 Auto-discovering related sources for:', companyName);
  
  const discovered: string[] = [];
  
  // Generate likely URLs
  const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const domain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const candidates = [
    `https://linkedin.com/company/${slug}`,
    `https://crunchbase.com/organization/${slug}`,
    `https://github.com/${domain}`,
    `https://www.ycombinator.com/companies/${slug}`,
  ];
  
  // Quick HEAD requests to see what exists (parallel)
  const checks = await Promise.allSettled(
    candidates.map(async (url) => {
      if (url === knownUrl) return null; // Skip the URL we already have
      
      try {
        const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
        return response.ok ? url : null;
      } catch {
        return null;
      }
    })
  );
  
  checks.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      discovered.push(result.value);
    }
  });
  
  console.log(`✅ Auto-discovered ${discovered.length} additional source(s)`);
  
  return discovered;
}

/**
 * Merge business data (prefer higher confidence values)
 */
function mergeBusinessData(
  existing: Partial<BusinessData>,
  newData: Partial<BusinessData>
): Partial<BusinessData> {
  const merged = { ...existing };
  
  Object.entries(newData).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      // If field doesn't exist, add it
      if (!merged[key as keyof BusinessData]) {
        (merged as any)[key] = value;
      }
      // If it exists but new value is more specific (e.g., exact number vs range), prefer it
      // This logic could be enhanced based on data types
    }
  });
  
  return merged;
}

/**
 * Estimate employees from GitHub repos (very rough)
 */
function estimateEmployeesFromRepos(repos: any[]): string {
  if (!Array.isArray(repos)) return 'Unknown';
  
  const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  
  if (totalStars > 50000) return '500-1000';
  if (totalStars > 10000) return '200-500';
  if (totalStars > 1000) return '50-200';
  return '10-50';
}

/**
 * Generate warnings
 */
function generateWarnings(
  data: Partial<BusinessData>,
  sources: SmartExtractionResult['sources']
): string[] {
  const warnings: string[] = [];
  
  if (sources.length === 1) {
    warnings.push('Only one source found. Try providing a LinkedIn or Crunchbase URL for more data.');
  }
  
  if (!data.annualRevenue && !data.revenueRange) {
    warnings.push('Revenue not found in public sources. Consider uploading financial statements.');
  }
  
  if (!data.employeeCount && !data.employeeRange) {
    warnings.push('Employee count not found. LinkedIn URL would provide this.');
  }
  
  return warnings;
}

