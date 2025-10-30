/**
 * Financial Statement Parser
 * 
 * Extracts verifiable financial data from uploaded documents:
 * - P&L Statements (Revenue, EBITDA, Net Income)
 * - Balance Sheets (Assets, Liabilities, Equity)
 * - Cash Flow Statements (Operating Cash Flow)
 * 
 * Uses GPT-4 Vision to parse PDF/image financial statements
 */

import type { BusinessData } from '@/types/business';

interface FinancialStatementResult {
  data: Partial<BusinessData>;
  confidence: Record<string, number>;
  extractedFields: string[];
  warnings: string[];
  documentType: 'P&L' | 'Balance Sheet' | 'Cash Flow' | 'Unknown';
}

/**
 * Parse financial statement from uploaded file
 */
export async function parseFinancialStatement(
  file: File
): Promise<FinancialStatementResult> {
  
  console.log('📄 Parsing financial statement:', file.name);
  
  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    // Check if it's a PDF or image
    const fileType = file.type;
    const isPDF = fileType === 'application/pdf';
    const isImage = fileType.startsWith('image/');
    
    if (!isPDF && !isImage) {
      throw new Error('File must be PDF or image format');
    }
    
    // For PDF, we need to convert to image first (or use GPT-4 Vision with PDF support)
    let imageData = base64;
    if (isPDF) {
      // GPT-4 Vision now supports PDFs directly
      console.log('📄 Processing PDF document');
    } else {
      console.log('🖼️ Processing image document');
    }
    
    // Extract data with GPT-4 Vision
    const extracted = await extractWithGPT4Vision(imageData, fileType);
    
    return extracted;
    
  } catch (error) {
    console.error('Failed to parse financial statement:', error);
    throw error;
  }
}

/**
 * Extract financial data using GPT-4 Vision
 */
async function extractWithGPT4Vision(
  base64Data: string,
  fileType: string
): Promise<FinancialStatementResult> {
  
  const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!openaiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  const isPDF = fileType === 'application/pdf';
  const imageUrl = isPDF 
    ? `data:application/pdf;base64,${base64Data}`
    : `data:${fileType};base64,${base64Data}`;
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o', // Supports vision + PDFs
      messages: [
        {
          role: 'system',
          content: `You are a financial analyst extracting data from financial statements.

Extract ALL financial data from this document and identify the statement type.

Return JSON with this EXACT schema:
{
  "documentType": "P&L" | "Balance Sheet" | "Cash Flow" | "Unknown",
  "companyName": "string (from header)",
  "statementDate": "string (date or period)",
  "financialYear": number (year),
  
  "annualRevenue": number (total revenue/sales in USD),
  "costOfGoodsSold": number (COGS if shown),
  "grossProfit": number (revenue - COGS),
  "operatingExpenses": number (total opex),
  "ebitda": number (earnings before interest, tax, depreciation, amortization),
  "netIncome": number (net profit/loss),
  "profitMargin": number (net income / revenue * 100),
  
  "totalAssets": number (from balance sheet),
  "totalLiabilities": number (from balance sheet),
  "shareholdersEquity": number (from balance sheet),
  "currentAssets": number (if shown),
  "currentLiabilities": number (if shown),
  
  "operatingCashFlow": number (from cash flow statement),
  "investingCashFlow": number (if shown),
  "financingCashFlow": number (if shown),
  
  "extractedFields": ["list of fields successfully extracted"],
  "confidence": {
    "fieldName": 0.0-1.0 (confidence for each extracted field)
  },
  "warnings": ["any issues or uncertainties"],
  "notes": "any additional relevant information"
}

CRITICAL RULES:
1. Extract ONLY numbers that are explicitly shown in the document
2. Identify currency (assume USD if not specified)
3. Handle thousands/millions notation (e.g., "5,234" in thousands = 5,234,000)
4. Look for these common labels:
   - Revenue: Sales, Total Revenue, Gross Revenue
   - EBITDA: Operating Income, EBIT, Earnings
   - Net Income: Net Profit, Bottom Line, Earnings After Tax
5. Set confidence: 1.0 = clearly labeled, 0.8 = inferred from context, 0.5 = calculated from other fields
6. Use null for fields not found in the document
7. Add warnings for any ambiguities`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all financial data from this statement. Identify the statement type and extract every relevant number.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }
  
  const result = await response.json();
  const parsed = JSON.parse(result.choices[0]?.message?.content || '{}');
  
  console.log('✅ Financial data extracted:', parsed.documentType);
  console.log('📊 Extracted fields:', parsed.extractedFields);
  
  // Convert to BusinessData format
  const businessData: Partial<BusinessData> = {
    companyName: parsed.companyName,
    annualRevenue: parsed.annualRevenue,
    ebitda: parsed.ebitda,
    netIncome: parsed.netIncome,
    profitMargin: parsed.profitMargin,
    operatingCashFlow: parsed.operatingCashFlow,
  };
  
  return {
    data: businessData,
    confidence: parsed.confidence || {},
    extractedFields: parsed.extractedFields || [],
    warnings: parsed.warnings || [],
    documentType: parsed.documentType || 'Unknown',
  };
}

/**
 * Convert File to base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Parse multiple financial statements and combine data
 */
export async function parseMultipleStatements(
  files: File[]
): Promise<{
  combinedData: Partial<BusinessData>;
  statements: FinancialStatementResult[];
  overallConfidence: number;
}> {
  
  console.log(`📄 Parsing ${files.length} financial statements...`);
  
  const results = await Promise.all(
    files.map(file => parseFinancialStatement(file))
  );
  
  // Combine data from multiple statements
  const combinedData: Partial<BusinessData> = {};
  const allConfidenceScores: number[] = [];
  
  results.forEach(result => {
    // Merge data (prefer highest confidence values)
    Object.entries(result.data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        const confidence = result.confidence[key] || 0;
        const existingConfidence = result.confidence[key] || 0;
        
        if (!combinedData[key as keyof BusinessData] || confidence > existingConfidence) {
          (combinedData as any)[key] = value;
        }
        
        allConfidenceScores.push(confidence);
      }
    });
  });
  
  const overallConfidence = allConfidenceScores.length > 0
    ? Math.round((allConfidenceScores.reduce((a, b) => a + b, 0) / allConfidenceScores.length) * 100)
    : 0;
  
  console.log(`✅ Combined data from ${results.length} statements`);
  console.log(`📊 Overall confidence: ${overallConfidence}%`);
  
  return {
    combinedData,
    statements: results,
    overallConfidence,
  };
}

