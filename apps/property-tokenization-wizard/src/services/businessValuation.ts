/**
 * Business Valuation Service
 * 
 * Provides multiple valuation methods for businesses:
 * - Revenue Multiple (best for SaaS/high-growth)
 * - EBITDA Multiple (best for established businesses)
 * - Hybrid AI Valuation (combines multiple methods)
 */

import type { BusinessData, BusinessValuationResult } from '@/types/business';

// Industry-specific revenue multiples
const REVENUE_MULTIPLES: Record<string, number> = {
  'SaaS': 8.0,
  'Software': 8.0,
  'FinTech': 6.0,
  'MarTech': 5.0,
  'E-commerce': 1.5,
  'Marketplace': 3.0,
  'Healthcare': 3.0,
  'Manufacturing': 0.8,
  'Professional Services': 2.0,
  'Consulting': 1.5,
  'Retail': 0.5,
};

// Industry-specific EBITDA multiples
const EBITDA_MULTIPLES: Record<string, number> = {
  'Software': 12.0,
  'SaaS': 12.0,
  'FinTech': 10.0,
  'Healthcare': 8.0,
  'Manufacturing': 6.0,
  'Retail': 5.0,
  'Construction': 5.5,
  'Transportation': 6.5,
};

/**
 * Main valuation function - tries multiple methods and synthesizes
 */
export async function estimateBusinessValue(
  businessData: BusinessData
): Promise<BusinessValuationResult> {
  
  console.log('💰 Starting business valuation for:', businessData.companyName);
  
  const valuations: BusinessValuationResult[] = [];
  
  // Method 1: Revenue Multiple (if revenue available)
  if (businessData.annualRevenue) {
    try {
      const revenueVal = valuateByRevenue(businessData);
      valuations.push(revenueVal);
      console.log('✅ Revenue multiple valuation:', revenueVal.estimatedValue);
    } catch (error) {
      console.warn('Revenue valuation failed:', error);
    }
  }
  
  // Method 2: EBITDA Multiple (if EBITDA available)
  if (businessData.ebitda) {
    try {
      const ebitdaVal = valuateByEBITDA(businessData);
      valuations.push(ebitdaVal);
      console.log('✅ EBITDA multiple valuation:', ebitdaVal.estimatedValue);
    } catch (error) {
      console.warn('EBITDA valuation failed:', error);
    }
  }
  
  // If we have multiple valuations, use GPT-4 to synthesize
  if (valuations.length > 1) {
    try {
      const synthesized = await synthesizeWithGPT4(businessData, valuations);
      console.log('✅ GPT-4 synthesized valuation:', synthesized.estimatedValue);
      return synthesized;
    } catch (error) {
      console.warn('GPT-4 synthesis failed, using weighted average:', error);
      return weightedAverageValuation(valuations);
    }
  }
  
  // If only one valuation method worked, return it
  if (valuations.length === 1) {
    return valuations[0];
  }
  
  // Fallback: estimate based on available data
  return getFallbackValuation(businessData);
}

/**
 * Revenue Multiple Valuation
 */
function valuateByRevenue(businessData: BusinessData): BusinessValuationResult {
  const revenue = businessData.annualRevenue!;
  
  console.log('📊 Revenue Valuation Input:', {
    revenue,
    industry: businessData.industry,
    growthRate: businessData.growthRate,
    profitMargin: businessData.profitMargin
  });
  
  // Get industry multiple
  let baseMultiple = 2.0; // Default
  for (const [industry, multiple] of Object.entries(REVENUE_MULTIPLES)) {
    if (businessData.industry?.toLowerCase().includes(industry.toLowerCase())) {
      baseMultiple = multiple;
      console.log(`✅ Matched industry: ${industry} with multiple ${multiple}x`);
      break;
    }
  }
  
  // Adjust for growth rate
  let growthAdjustment = 1.0;
  if (businessData.growthRate) {
    if (businessData.growthRate > 100) growthAdjustment = 1.5; // Hypergrowth
    else if (businessData.growthRate > 50) growthAdjustment = 1.3; // High growth
    else if (businessData.growthRate > 20) growthAdjustment = 1.1; // Moderate growth
    else if (businessData.growthRate < 0) growthAdjustment = 0.7; // Declining
  }
  
  // Adjust for profitability
  let profitAdjustment = 1.0;
  if (businessData.profitMargin) {
    if (businessData.profitMargin > 20) profitAdjustment = 1.2; // Highly profitable
    else if (businessData.profitMargin > 10) profitAdjustment = 1.0; // Good margins
    else if (businessData.profitMargin > 0) profitAdjustment = 0.9; // Break-even
    else profitAdjustment = 0.7; // Unprofitable
  }
  
  const finalMultiple = baseMultiple * growthAdjustment * profitAdjustment;
  const valuation = revenue * finalMultiple;
  
  console.log('💰 Valuation Calculation:', {
    baseMultiple,
    growthAdjustment,
    profitAdjustment,
    finalMultiple,
    valuation: `$${(valuation / 1000000).toFixed(1)}M`
  });
  
  const keyFactors = [
    `Revenue: $${(revenue / 1000000).toFixed(1)}M`,
    `Base Multiple: ${baseMultiple.toFixed(1)}x (${businessData.industry})`,
  ];
  
  if (businessData.growthRate) {
    keyFactors.push(`Growth: ${businessData.growthRate.toFixed(0)}% (${growthAdjustment.toFixed(2)}x adj)`);
  }
  
  if (businessData.profitMargin) {
    keyFactors.push(`Margin: ${businessData.profitMargin.toFixed(0)}% (${profitAdjustment.toFixed(2)}x adj)`);
  }
  
  return {
    estimatedValue: Math.round(valuation),
    method: 'Revenue Multiple',
    confidence: businessData.isPublic ? 85 : 70,
    valueLow: Math.round(valuation * 0.7),
    valueHigh: Math.round(valuation * 1.3),
    reasoning: `Valued at ${finalMultiple.toFixed(1)}x revenue (${baseMultiple.toFixed(1)}x base for ${businessData.industry}, adjusted for growth and profitability).`,
    keyFactors,
    dataSource: businessData.isPublic ? 'Public Financials + Industry Benchmarks' : 'Estimated Financials + Industry Benchmarks',
  };
}

/**
 * EBITDA Multiple Valuation
 */
function valuateByEBITDA(businessData: BusinessData): BusinessValuationResult {
  const ebitda = businessData.ebitda!;
  
  // Get industry multiple
  let baseMultiple = 6.0; // Default
  for (const [sector, multiple] of Object.entries(EBITDA_MULTIPLES)) {
    if (businessData.sector?.toLowerCase().includes(sector.toLowerCase()) ||
        businessData.industry?.toLowerCase().includes(sector.toLowerCase())) {
      baseMultiple = multiple;
      break;
    }
  }
  
  // Adjust for size (larger companies get higher multiples)
  let sizeAdjustment = 1.0;
  if (ebitda > 10000000) sizeAdjustment = 1.2; // $10M+ EBITDA
  else if (ebitda > 5000000) sizeAdjustment = 1.1; // $5M+ EBITDA
  else if (ebitda > 2000000) sizeAdjustment = 1.0; // $2M+ EBITDA
  else sizeAdjustment = 0.9; // < $2M EBITDA
  
  const finalMultiple = baseMultiple * sizeAdjustment;
  const valuation = ebitda * finalMultiple;
  
  const ebitdaMargin = businessData.annualRevenue 
    ? (ebitda / businessData.annualRevenue) * 100
    : undefined;
  
  const keyFactors = [
    `EBITDA: $${(ebitda / 1000000).toFixed(1)}M`,
    `Base Multiple: ${baseMultiple.toFixed(1)}x (${businessData.sector || businessData.industry})`,
    `Size Factor: ${sizeAdjustment.toFixed(2)}x`,
  ];
  
  if (ebitdaMargin) {
    keyFactors.push(`EBITDA Margin: ${ebitdaMargin.toFixed(1)}%`);
  }
  
  return {
    estimatedValue: Math.round(valuation),
    method: 'EBITDA Multiple',
    confidence: 80,
    valueLow: Math.round(valuation * 0.75),
    valueHigh: Math.round(valuation * 1.25),
    reasoning: `Valued at ${finalMultiple.toFixed(1)}x EBITDA (${baseMultiple.toFixed(1)}x base for ${businessData.sector || businessData.industry}, ${sizeAdjustment.toFixed(2)}x size adjustment).`,
    keyFactors,
    dataSource: businessData.isPublic ? 'Public Financials + Industry Benchmarks' : 'Estimated Financials + Industry Benchmarks',
  };
}

/**
 * GPT-4 Synthesis of Multiple Valuations
 */
async function synthesizeWithGPT4(
  businessData: BusinessData,
  valuations: BusinessValuationResult[]
): Promise<BusinessValuationResult> {
  
  const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!openaiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  const prompt = `You are a professional business valuator analyzing a company for tokenization.

COMPANY:
- Name: ${businessData.companyName}
- Industry: ${businessData.industry}
- Sector: ${businessData.sector || 'Unknown'}
- Revenue: $${businessData.annualRevenue?.toLocaleString() || 'Unknown'}
- EBITDA: $${businessData.ebitda?.toLocaleString() || 'Unknown'}
- Growth Rate: ${businessData.growthRate?.toFixed(0) || 'Unknown'}%
- Profit Margin: ${businessData.profitMargin?.toFixed(0) || 'Unknown'}%
- Employees: ${businessData.employeeCount?.toLocaleString() || businessData.employeeRange || 'Unknown'}
- Type: ${businessData.isPublic ? 'Public Company' : 'Private Company'}

VALUATIONS FROM DIFFERENT METHODS:
${valuations.map((v, i) => `
${i + 1}. ${v.method}: $${v.estimatedValue.toLocaleString()}
   Confidence: ${v.confidence}%
   Range: $${v.valueLow.toLocaleString()} - $${v.valueHigh.toLocaleString()}
   Reasoning: ${v.reasoning}
   Key Factors: ${v.keyFactors.join(', ')}
`).join('\n')}

TASK:
Provide a final valuation that:
1. Weighs each method by confidence and appropriateness for this business
2. Considers industry-specific factors
3. Accounts for growth trajectory and profitability  
4. Provides conservative estimate suitable for investment tokenization
5. Identifies key risks and investment highlights

Respond with JSON in this EXACT format:
{
  "estimatedValue": number,
  "confidence": number (0-100),
  "valueLow": number,
  "valueHigh": number,
  "reasoning": "2-3 sentences explaining final valuation and which methods you weighted most",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "primaryMethod": "which valuation method weighted most heavily",
  "riskFactors": ["risk1", "risk2", "risk3"],
  "investmentHighlights": ["highlight1", "highlight2", "highlight3"]
}`;

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
          content: 'You are a professional business valuator with expertise in M&A and investment analysis. Provide conservative, well-reasoned valuations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error('GPT-4 synthesis failed');
  }

  const result = await response.json();
  const parsed = JSON.parse(result.choices[0]?.message?.content || '{}');
  
  // GPT-4 might return values in millions (e.g., 8 for $8M) - detect and fix
  let estimatedValue = parsed.estimatedValue;
  let valueLow = parsed.valueLow;
  let valueHigh = parsed.valueHigh;
  
  // If values are suspiciously small (< 1000), they're likely in millions
  if (estimatedValue < 1000) {
    console.log(`⚠️ GPT-4 returned value in millions (${estimatedValue}M), converting to dollars`);
    estimatedValue = estimatedValue * 1000000;
    valueLow = valueLow * 1000000;
    valueHigh = valueHigh * 1000000;
  }
  
  console.log(`💎 Final GPT-4 valuation: $${(estimatedValue / 1000000).toFixed(1)}M`);
  
  return {
    estimatedValue: Math.round(estimatedValue),
    method: 'Hybrid AI Valuation',
    confidence: parsed.confidence,
    valueLow: Math.round(valueLow),
    valueHigh: Math.round(valueHigh),
    reasoning: parsed.reasoning,
    keyFactors: parsed.keyFactors || [],
    dataSource: 'Multi-Method + GPT-4 Synthesis',
    riskFactors: parsed.riskFactors,
    investmentHighlights: parsed.investmentHighlights,
  };
}

/**
 * Weighted average of multiple valuations (fallback if GPT-4 fails)
 */
function weightedAverageValuation(
  valuations: BusinessValuationResult[]
): BusinessValuationResult {
  
  const totalConfidence = valuations.reduce((sum, v) => sum + v.confidence, 0);
  
  const weightedValue = valuations.reduce((sum, v) => {
    const weight = v.confidence / totalConfidence;
    return sum + (v.estimatedValue * weight);
  }, 0);
  
  const avgConfidence = totalConfidence / valuations.length;
  
  return {
    estimatedValue: Math.round(weightedValue),
    method: 'Weighted Average',
    confidence: Math.round(avgConfidence),
    valueLow: Math.round(weightedValue * 0.75),
    valueHigh: Math.round(weightedValue * 1.25),
    reasoning: `Weighted average of ${valuations.length} valuation methods based on confidence scores.`,
    keyFactors: valuations.flatMap(v => v.keyFactors).slice(0, 5),
    dataSource: 'Multiple Methods Combined',
  };
}

/**
 * Fallback valuation when limited data available
 */
function getFallbackValuation(businessData: BusinessData): BusinessValuationResult {
  
  let estimate = 0;
  const keyFactors: string[] = [];
  
  // Try to estimate based on whatever data we have
  if (businessData.annualRevenue) {
    estimate = businessData.annualRevenue * 2.0; // Conservative 2x revenue
    keyFactors.push(`Revenue: $${(businessData.annualRevenue / 1000000).toFixed(1)}M`);
    keyFactors.push('Conservative 2x revenue multiple');
  } else if (businessData.employeeCount) {
    // Very rough: $200K revenue per employee assumption
    const estimatedRevenue = businessData.employeeCount * 200000;
    estimate = estimatedRevenue * 2.0;
    keyFactors.push(`Estimated based on ${businessData.employeeCount} employees`);
    keyFactors.push('~$200K revenue per employee assumption');
  } else {
    // Ultra-fallback
    estimate = 1000000; // $1M baseline
    keyFactors.push('Insufficient data for accurate valuation');
    keyFactors.push('Baseline $1M estimate - please provide financial data');
  }
  
  return {
    estimatedValue: Math.round(estimate),
    method: 'Fallback Estimate',
    confidence: 40,
    valueLow: Math.round(estimate * 0.5),
    valueHigh: Math.round(estimate * 2.0),
    reasoning: 'Limited financial data available. This is a rough estimate - please provide revenue or EBITDA for accurate valuation.',
    keyFactors,
    dataSource: 'Estimated from Limited Data',
  };
}

