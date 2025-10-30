/**
 * QuickBooks Integration Service
 * 
 * Provides OAuth authentication and financial data extraction from QuickBooks Online
 * 
 * Setup Required:
 * 1. Create app at https://developer.intuit.com
 * 2. Get Client ID and Client Secret
 * 3. Set redirect URI to: http://localhost:3000/api/quickbooks/callback
 * 4. Add scopes: com.intuit.quickbooks.accounting
 */

import type { BusinessData } from '@/types/business';

// QuickBooks OAuth Configuration
const QB_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const QB_API_BASE = 'https://quickbooks.api.intuit.com/v3/company';
const QB_DISCOVERY_URL = 'https://developer.api.intuit.com/.well-known/openid_configuration';

export interface QuickBooksAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface QuickBooksTokens {
  accessToken: string;
  refreshToken: string;
  realmId: string; // Company ID
  expiresAt: number;
}

export interface QuickBooksFinancialData {
  companyInfo: {
    companyName: string;
    legalName: string;
    address: string;
    industry?: string;
    fiscalYearStart: string;
  };
  profitAndLoss: {
    revenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    operatingExpenses: number;
    netIncome: number;
    period: string;
  };
  balanceSheet: {
    totalAssets: number;
    totalLiabilities: number;
    equity: number;
    currentAssets: number;
    currentLiabilities: number;
  };
  cashFlow?: {
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
  };
  metrics: {
    profitMargin: number;
    growthRate?: number;
    currentRatio: number;
    debtToEquity: number;
  };
}

/**
 * Step 1: Initialize OAuth flow
 */
export function initiateQuickBooksAuth(config: QuickBooksAuthConfig): string {
  const state = generateRandomState();
  
  // Store state in sessionStorage for verification
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('qb_oauth_state', state);
  }
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state: state,
  });
  
  return `${QB_AUTH_URL}?${params.toString()}`;
}

/**
 * Step 2: Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  realmId: string,
  config: QuickBooksAuthConfig
): Promise<QuickBooksTokens> {
  
  const basicAuth = btoa(`${config.clientId}:${config.clientSecret}`);
  
  const response = await fetch(QB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: config.redirectUri,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`QuickBooks OAuth failed: ${error.error_description || 'Unknown error'}`);
  }
  
  const tokens = await response.json();
  
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    realmId: realmId,
    expiresAt: Date.now() + (tokens.expires_in * 1000),
  };
}

/**
 * Step 3: Get Company Info
 */
export async function getCompanyInfo(tokens: QuickBooksTokens): Promise<QuickBooksFinancialData['companyInfo']> {
  const response = await fetch(
    `${QB_API_BASE}/${tokens.realmId}/companyinfo/${tokens.realmId}`,
    {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch company info');
  }
  
  const data = await response.json();
  const companyInfo = data.CompanyInfo;
  
  return {
    companyName: companyInfo.CompanyName,
    legalName: companyInfo.LegalName,
    address: formatAddress(companyInfo.CompanyAddr),
    industry: companyInfo.NameValue?.find((nv: any) => nv.Name === 'Industry')?.Value,
    fiscalYearStart: companyInfo.FiscalYearStartMonth,
  };
}

/**
 * Step 4: Get Profit & Loss Report
 */
export async function getProfitAndLoss(
  tokens: QuickBooksTokens,
  startDate?: string,
  endDate?: string
): Promise<QuickBooksFinancialData['profitAndLoss']> {
  
  // Default to last 12 months
  const end = endDate || new Date().toISOString().split('T')[0];
  const start = startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const params = new URLSearchParams({
    start_date: start,
    end_date: end,
    accounting_method: 'Accrual',
  });
  
  const response = await fetch(
    `${QB_API_BASE}/${tokens.realmId}/reports/ProfitAndLoss?${params}`,
    {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch P&L report');
  }
  
  const data = await response.json();
  const rows = data.Rows?.Row || [];
  
  // Parse P&L data
  const revenue = extractLineItemValue(rows, 'Total Income') || 0;
  const cogs = extractLineItemValue(rows, 'Total Cost of Goods Sold') || 0;
  const grossProfit = extractLineItemValue(rows, 'Gross Profit') || (revenue - cogs);
  const operatingExpenses = extractLineItemValue(rows, 'Total Operating Expenses') || 0;
  const netIncome = extractLineItemValue(rows, 'Net Income') || 0;
  
  return {
    revenue,
    costOfGoodsSold: cogs,
    grossProfit,
    operatingExpenses,
    netIncome,
    period: `${start} to ${end}`,
  };
}

/**
 * Step 5: Get Balance Sheet
 */
export async function getBalanceSheet(
  tokens: QuickBooksTokens
): Promise<QuickBooksFinancialData['balanceSheet']> {
  
  const params = new URLSearchParams({
    date: new Date().toISOString().split('T')[0],
  });
  
  const response = await fetch(
    `${QB_API_BASE}/${tokens.realmId}/reports/BalanceSheet?${params}`,
    {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${tokens.accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch balance sheet');
  }
  
  const data = await response.json();
  const rows = data.Rows?.Row || [];
  
  const totalAssets = extractLineItemValue(rows, 'Total Assets') || 0;
  const totalLiabilities = extractLineItemValue(rows, 'Total Liabilities') || 0;
  const equity = extractLineItemValue(rows, 'Total Equity') || 0;
  const currentAssets = extractLineItemValue(rows, 'Total Current Assets') || 0;
  const currentLiabilities = extractLineItemValue(rows, 'Total Current Liabilities') || 0;
  
  return {
    totalAssets,
    totalLiabilities,
    equity,
    currentAssets,
    currentLiabilities,
  };
}

/**
 * Step 6: Get all financial data and convert to BusinessData format
 */
export async function getCompleteFinancialData(
  tokens: QuickBooksTokens
): Promise<{ businessData: Partial<BusinessData>; rawData: QuickBooksFinancialData }> {
  
  console.log('📊 Fetching complete financial data from QuickBooks...');
  
  // Fetch all data in parallel
  const [companyInfo, profitAndLoss, balanceSheet] = await Promise.all([
    getCompanyInfo(tokens),
    getProfitAndLoss(tokens),
    getBalanceSheet(tokens),
  ]);
  
  const rawData: QuickBooksFinancialData = {
    companyInfo,
    profitAndLoss,
    balanceSheet,
    metrics: {
      profitMargin: (profitAndLoss.netIncome / profitAndLoss.revenue) * 100,
      currentRatio: balanceSheet.currentAssets / balanceSheet.currentLiabilities,
      debtToEquity: balanceSheet.totalLiabilities / balanceSheet.equity,
    },
  };
  
  // Convert to BusinessData format
  const businessData: Partial<BusinessData> = {
    companyName: companyInfo.companyName,
    headquarters: companyInfo.address,
    industry: companyInfo.industry,
    
    annualRevenue: profitAndLoss.revenue,
    netIncome: profitAndLoss.netIncome,
    ebitda: profitAndLoss.netIncome + operatingExpenses, // Rough EBITDA approximation
    profitMargin: rawData.metrics.profitMargin,
    
    // Note: QuickBooks doesn't directly provide these, would need historical data
    // growthRate: calculated from comparing periods
    // operatingCashFlow: from cash flow statement if available
  };
  
  console.log('✅ QuickBooks data extracted successfully');
  console.log('💰 Revenue:', profitAndLoss.revenue);
  console.log('📊 Net Income:', profitAndLoss.netIncome);
  console.log('🏢 Company:', companyInfo.companyName);
  
  return {
    businessData,
    rawData,
  };
}

/**
 * Helper: Extract value from QuickBooks report rows
 */
function extractLineItemValue(rows: any[], lineItemName: string): number | null {
  for (const row of rows) {
    if (row.type === 'Section' && row.Summary) {
      // Check section summary
      if (row.Summary.ColData?.[0]?.value === lineItemName) {
        return parseFloat(row.Summary.ColData[1]?.value || '0');
      }
    }
    
    if (row.type === 'Data' && row.ColData) {
      // Check data row
      if (row.ColData[0]?.value === lineItemName) {
        return parseFloat(row.ColData[1]?.value || '0');
      }
    }
    
    // Recursively check nested rows
    if (row.Rows?.Row) {
      const nested = extractLineItemValue(row.Rows.Row, lineItemName);
      if (nested !== null) return nested;
    }
  }
  
  return null;
}

/**
 * Helper: Format address from QuickBooks format
 */
function formatAddress(addr: any): string {
  if (!addr) return '';
  
  const parts = [
    addr.City,
    addr.CountrySubDivisionCode,
    addr.PostalCode,
  ].filter(Boolean);
  
  return parts.join(', ');
}

/**
 * Helper: Generate random state for OAuth
 */
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Refresh access token when expired
 */
export async function refreshAccessToken(
  refreshToken: string,
  config: QuickBooksAuthConfig
): Promise<QuickBooksTokens> {
  
  const basicAuth = btoa(`${config.clientId}:${config.clientSecret}`);
  
  const response = await fetch(QB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to refresh QuickBooks token');
  }
  
  const tokens = await response.json();
  
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    realmId: '', // Preserve existing realmId
    expiresAt: Date.now() + (tokens.expires_in * 1000),
  };
}

/**
 * Check if tokens are still valid
 */
export function areTokensValid(tokens: QuickBooksTokens): boolean {
  return tokens.expiresAt > Date.now();
}

/**
 * Store tokens securely (in production, use encrypted storage)
 */
export function storeTokens(tokens: QuickBooksTokens): void {
  if (typeof window !== 'undefined') {
    // In production: Store in secure httpOnly cookie via API route
    // For now: sessionStorage (not secure, just for demo)
    sessionStorage.setItem('qb_tokens', JSON.stringify(tokens));
  }
}

/**
 * Retrieve stored tokens
 */
export function getStoredTokens(): QuickBooksTokens | null {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('qb_tokens');
    return stored ? JSON.parse(stored) : null;
  }
  return null;
}

/**
 * Clear stored tokens
 */
export function clearStoredTokens(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('qb_tokens');
  }
}

/**
 * Main function: Connect to QuickBooks and extract all data
 */
export async function connectAndExtractQuickBooks(
  config: QuickBooksAuthConfig,
  onProgress?: (message: string) => void
): Promise<{ businessData: Partial<BusinessData>; rawData: QuickBooksFinancialData }> {
  
  onProgress?.('🔐 Initiating QuickBooks OAuth...');
  
  // Check for existing valid tokens
  let tokens = getStoredTokens();
  
  if (tokens && areTokensValid(tokens)) {
    onProgress?.('✅ Using existing QuickBooks connection');
  } else {
    // Need to authenticate
    onProgress?.('🔐 Please authorize QuickBooks access...');
    
    // Open OAuth popup
    const authUrl = initiateQuickBooksAuth(config);
    window.open(authUrl, 'QuickBooks OAuth', 'width=600,height=800');
    
    // Wait for OAuth callback (in production, handle this properly)
    throw new Error('OAuth flow not complete. Please complete authorization.');
  }
  
  onProgress?.('📊 Fetching financial data...');
  
  // Extract all data
  const result = await getCompleteFinancialData(tokens);
  
  onProgress?.('✅ QuickBooks data extracted!');
  
  return result;
}

