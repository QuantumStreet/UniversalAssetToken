/**
 * Generic Property Data Extractor
 * 
 * Extracts structured property data from ANY real estate listing URL using AI.
 * Supports: Sotheby's, Christie's, Zillow, Redfin, Realtor.com, or any custom listing.
 */

interface PropertyExtractionResult {
  data: {
    // Location
    propertyAddress?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    county?: string;
    
    // Valuation
    propertyValue?: number;
    
    // Size
    totalSquareFootage?: number;
    lotSize?: number;
    lotSizeUnit?: 'acres' | 'sqft';
    
    // Core Characteristics
    bedrooms?: number;
    bathroomsFull?: number;
    bathroomsPartial?: number;
    yearBuilt?: number;
    
    // Property Classification
    propertyType?: 'single_family' | 'multi_family' | 'estate' | 'commercial' | 'condo' | 'townhouse';
    architecturalStyle?: string;
    
    // Premium Features
    premiumAmenities?: string[];
    
    // Building Systems
    parkingSpaces?: number;
    parkingType?: string;
    hvacType?: string;
    fireplaces?: number;
    fireplaceTypes?: string[];
    
    // Condition
    yearRenovated?: number;
    overallCondition?: 'excellent' | 'good' | 'fair' | 'needs work';
    recentUpgrades?: string[];
    
    // Additional Info
    schoolDistrict?: string;
    mlsNumber?: string;
    description?: string;
    propertyImages?: string[];
    virtualTourUrl?: string;
  };
  confidence: Record<string, number>;
  warnings: string[];
  source: {
    url: string;
    platform: string;
    extractedAt: string;
  };
}

/**
 * Extract property data from any real estate listing URL
 * Uses Firecrawl for JavaScript rendering and bot protection bypass
 */
export async function extractPropertyData(
  url: string,
  apiKey?: string
): Promise<PropertyExtractionResult> {
  try {
    // Validate URL
    if (!isValidUrl(url)) {
      throw new Error('Invalid URL provided');
    }

    // Step 1: Try scraping with Firecrawl (handles JavaScript + bot protection)
    let contentToExtract = '';
    
    try {
      console.log('🔥 Using Firecrawl to scrape listing...');
      console.log('🌐 URL:', url);
      
      const firecrawlKey = process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY || 'fc-bfeed1545a9a463cb142ec582922a0f5';
      
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firecrawlKey}`,
        },
        body: JSON.stringify({
          url: url,
          formats: ['markdown', 'html'],
          onlyMainContent: false, // Get full page content, not just main
          waitFor: 5000, // Wait 5 seconds for JavaScript to fully render
          timeout: 30000, // 30 second timeout
        }),
      });

      if (!scrapeResponse.ok) {
        const errorText = await scrapeResponse.text();
        console.error('❌ Firecrawl API Error:', {
          status: scrapeResponse.status,
          statusText: scrapeResponse.statusText,
          error: errorText,
          url: url
        });
        
        // Provide more helpful error messages based on status codes
        if (scrapeResponse.status === 500) {
          throw new Error(`Website scraping failed: The website "${url}" may be blocking automated access or has JavaScript issues. Try a different property listing URL.`);
        } else if (scrapeResponse.status === 400) {
          throw new Error(`Invalid URL format: Please check that "${url}" is a valid property listing URL.`);
        } else if (scrapeResponse.status === 401) {
          throw new Error(`Firecrawl API authentication failed. Please check your API key.`);
        } else if (scrapeResponse.status === 429) {
          throw new Error(`Rate limit exceeded. Please wait a moment and try again.`);
        } else {
          throw new Error(`Firecrawl API error (${scrapeResponse.status}): ${errorText}`);
        }
      }

      const scrapeResult = await scrapeResponse.json();
      
      console.log('✅ Page scraped successfully with Firecrawl');
      console.log('📄 Markdown length:', scrapeResult.data?.markdown?.length || 0, 'characters');
      console.log('📄 HTML length:', scrapeResult.data?.html?.length || 0, 'characters');
      
      // Use markdown if available, otherwise fall back to HTML
      contentToExtract = scrapeResult.data?.markdown || scrapeResult.data?.html || '';
      
      if (!contentToExtract) {
        throw new Error('Firecrawl returned empty content');
      }
      
      console.log('📝 Using', scrapeResult.data?.markdown ? 'markdown' : 'HTML', 'for extraction');
      
    } catch (firecrawlError) {
      console.warn('⚠️ Firecrawl failed, trying fallback method...', firecrawlError);
      
      // Fallback: Try direct fetch (may not work for JS-heavy sites)
      try {
        console.log('🔄 Attempting direct fetch as fallback...');
        const directResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (directResponse.ok) {
          contentToExtract = await directResponse.text();
          console.log('✅ Direct fetch successful, using HTML content');
        } else {
          throw new Error(`Direct fetch failed: ${directResponse.status}`);
        }
      } catch (directError) {
        console.error('❌ Both Firecrawl and direct fetch failed');
        const suggestions = getScrapingSuggestions(url);
        throw new Error(`Unable to scrape the website "${url}". Both Firecrawl and direct fetch methods failed. ${suggestions}`);
      }
    }
    console.log('📄 First 500 chars:', contentToExtract.substring(0, 500));
    
    // Extract image URLs from the scraped content
    const imageUrls = extractImageUrls(contentToExtract, []);
    console.log('📸 Found', imageUrls.length, 'property images');
    
    // Step 2: Extract structured data with OpenAI
    const extractedData = await extractWithOpenAI(contentToExtract, url, imageUrls);
    
    // Step 3: Validate and return
    const validatedData = validateExtractedData(extractedData.data);
    const warnings = generateWarnings(validatedData, extractedData.confidence);
    
    return {
      data: {
        ...validatedData,
        propertyImages: imageUrls.length > 0 ? imageUrls : validatedData.propertyImages,
      },
      confidence: extractedData.confidence || {},
      warnings,
      source: {
        url,
        platform: detectPlatform(url),
        extractedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Property extraction failed:', error);
    throw new Error(`Failed to extract property data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract image URLs from HTML and links
 */
function extractImageUrls(html: string, links: string[]): string[] {
  const imageUrls: string[] = [];
  const seenUrls = new Set<string>();
  
  // Extract from img tags in HTML
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const matches = html.matchAll(imgRegex);
  
  for (const match of matches) {
    let imgUrl = match[1];
    
    // Skip icons, logos, and tiny images
    if (imgUrl.includes('icon') || imgUrl.includes('logo') || imgUrl.includes('avatar')) {
      continue;
    }
    
    // Make absolute URLs
    if (imgUrl.startsWith('//')) {
      imgUrl = 'https:' + imgUrl;
    } else if (imgUrl.startsWith('/')) {
      const urlObj = new URL(html);
      imgUrl = urlObj.origin + imgUrl;
    }
    
    // Only include valid image URLs
    if (imgUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) && !seenUrls.has(imgUrl)) {
      imageUrls.push(imgUrl);
      seenUrls.add(imgUrl);
    }
  }
  
  // Also check links array for image URLs
  if (links && Array.isArray(links)) {
    for (const link of links) {
      if (link.match(/\.(jpg|jpeg|png|webp|gif)/i) && !seenUrls.has(link)) {
        imageUrls.push(link);
        seenUrls.add(link);
      }
    }
  }
  
  // Limit to first 20 images to avoid overwhelming the UI
  return imageUrls.slice(0, 20);
}

/**
 * Extract JSON-LD structured data from HTML
 */
function extractJsonLd(html: string): any {
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const matches = html.matchAll(jsonLdRegex);
  
  for (const match of matches) {
    try {
      const jsonData = JSON.parse(match[1]);
      // Look for RealEstateListing, Product, or similar structured data
      if (jsonData['@type'] === 'RealEstateListing' || 
          jsonData['@type'] === 'Product' ||
          jsonData['@type'] === 'SingleFamilyResidence') {
        return jsonData;
      }
      // Sometimes it's nested in @graph
      if (jsonData['@graph']) {
        for (const item of jsonData['@graph']) {
          if (item['@type'] === 'RealEstateListing' || 
              item['@type'] === 'Product' ||
              item['@type'] === 'SingleFamilyResidence') {
            return item;
          }
        }
      }
    } catch (e) {
      // Invalid JSON, continue to next script tag
      continue;
    }
  }
  
  return null;
}

/**
 * Fetch listing HTML (with JavaScript rendering for Sotheby's and similar sites)
 */
async function fetchListingHtml(url: string): Promise<string> {
  try {
    // For JavaScript-heavy sites like Sotheby's, use Jina AI's reader API
    // This service renders JavaScript and returns clean, readable content
    // Free tier available: https://jina.ai/reader
    
    const isSothebys = url.includes('sothebysrealty.com');
    const isChristies = url.includes('christiesrealestate.com');
    const needsJSRendering = isSothebys || isChristies;
    
    if (needsJSRendering) {
      console.log('🔧 Using Jina AI reader for JavaScript rendering...');
      console.log('🔗 Jina URL:', `https://r.jina.ai/${url}`);
      
      // Jina AI reader renders JavaScript and returns clean HTML/markdown
      const jinaUrl = `https://r.jina.ai/${url}`;
      
      try {
        const response = await fetch(jinaUrl, {
          headers: {
            'Accept': 'text/html',
            'X-Return-Format': 'html', // Request HTML format
          },
        });
        
        console.log('📡 Jina AI response status:', response.status);
        
        if (response.ok) {
          const html = await response.text();
          console.log('✅ JavaScript-rendered content fetched via Jina AI');
          console.log('📄 HTML length:', html.length, 'characters');
          console.log('🔍 First 500 chars:', html.substring(0, 500));
          return html;
        }
        
        console.log('⚠️ Jina AI failed with status:', response.status);
      } catch (error) {
        console.log('❌ Jina AI error:', error);
      }
      
      console.log('🔄 Falling back to direct fetch...');
    }
    
    // Try direct fetch for other sites or as fallback
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    // Final fallback: try with CORS proxy (no JS rendering)
    console.log('All methods failed, trying CORS proxy...');
    
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch listing page');
    }
    
    return await response.text();
  }
}

/**
 * Extract structured data using OpenAI GPT-4o with Firecrawl's clean content
 */
async function extractWithOpenAI(
  content: string,
  url: string,
  imageUrls: string[]
): Promise<{ data: any; confidence: Record<string, number> }> {
  const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!openaiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Truncate to avoid token limits
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
          content: `You are a real estate data extraction expert. Extract structured property data from ANY real estate listing (Sotheby's, Christie's, Zillow, Redfin, Realtor.com, or custom).

Return JSON with this exact schema:
{
  "propertyAddress": "string (street address)",
  "city": "string",
  "state": "string (2-letter code)",
  "zipCode": "string",
  "county": "string (if available)",
  "propertyValue": number (in USD, no commas),
  "totalSquareFootage": number (interior sqft),
  "lotSize": number,
  "lotSizeUnit": "acres" | "sqft",
  "bedrooms": number,
  "bathroomsFull": number (full baths)",
  "bathroomsPartial": number (half/partial baths)",
  "yearBuilt": number,
  "propertyType": "single_family" | "multi_family" | "estate" | "commercial" | "condo" | "townhouse",
  "architecturalStyle": "string (e.g., Colonial, Modern, Mediterranean)",
  "premiumAmenities": ["array of premium features like Pool, Tennis Court, Wine Cellar, etc."],
  "parkingSpaces": number,
  "parkingType": "string (Garage, Carport, etc.)",
  "hvacType": "string (Central A/C, Zoned, etc.)",
  "fireplaces": number,
  "fireplaceTypes": ["array like Gas, Wood Burning, Stone"],
  "yearRenovated": number (if mentioned),
  "overallCondition": "excellent" | "good" | "fair" | "needs work",
  "recentUpgrades": ["array of recent improvements"],
  "schoolDistrict": "string (if mentioned)",
  "mlsNumber": "string (MLS# if available)",
  "description": "string (brief property description)",
  "propertyImages": ["array of image URLs"],
  "virtualTourUrl": "string (if available)",
  "confidence": {
    "fieldName": 0.0-1.0 (confidence score for each field)
  }
}

IMPORTANT:
- Extract ALL available data, even if not explicitly listed in schema
- For premium amenities, look for: Pool, Tennis Court, Spa, Wine Cellar, Home Theater, Gym, Library, Guest House, Helipad, etc.
- Use null for fields you cannot find
- Set confidence scores: 1.0 = certain, 0.8 = very confident, 0.5 = moderate, 0.3 = guess
- Parse numbers correctly (remove $ and commas)
- Convert text numbers to digits ("five bedrooms" → 5)`
        },
      {
        role: 'user',
        content: `Extract property data from this real estate listing:\n\nURL: ${url}\n\nCONTENT (Markdown from rendered page):\n${truncatedContent}\n\nIMPORTANT: This content has been extracted from a fully-rendered page, so all JavaScript data should be present. Extract all available property details accurately.`,
      },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1, // Low temperature for consistency
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const result = await response.json();
  const aiResponse = result.choices[0]?.message?.content;
  
  if (!aiResponse) {
    throw new Error('No response from OpenAI');
  }

  const parsed = JSON.parse(aiResponse);
  
  return {
    data: parsed,
    confidence: parsed.confidence || {},
  };
}

/**
 * Validate and clean extracted data
 */
function validateExtractedData(extracted: any): any {
  const validated: any = {};
  
  // Clean and validate each field
  if (extracted.propertyAddress) validated.propertyAddress = String(extracted.propertyAddress).trim();
  if (extracted.city) validated.city = String(extracted.city).trim();
  if (extracted.state) validated.state = String(extracted.state).trim();
  if (extracted.zipCode) validated.zipCode = String(extracted.zipCode).trim();
  if (extracted.county) validated.county = String(extracted.county).trim();
  
  // Validate numeric fields
  if (extracted.propertyValue && extracted.propertyValue > 0) {
    validated.propertyValue = Number(extracted.propertyValue);
  }
  if (extracted.totalSquareFootage && extracted.totalSquareFootage > 0) {
    validated.totalSquareFootage = Number(extracted.totalSquareFootage);
  }
  if (extracted.lotSize && extracted.lotSize > 0) {
    validated.lotSize = Number(extracted.lotSize);
  }
  if (extracted.lotSizeUnit) {
    validated.lotSizeUnit = extracted.lotSizeUnit === 'acres' ? 'acres' : 'sqft';
  }
  
  // Validate counts
  if (extracted.bedrooms && extracted.bedrooms >= 0) {
    validated.bedrooms = Number(extracted.bedrooms);
  }
  if (extracted.bathroomsFull && extracted.bathroomsFull >= 0) {
    validated.bathroomsFull = Number(extracted.bathroomsFull);
  }
  if (extracted.bathroomsPartial !== undefined && extracted.bathroomsPartial >= 0) {
    validated.bathroomsPartial = Number(extracted.bathroomsPartial);
  }
  if (extracted.yearBuilt && extracted.yearBuilt > 1700 && extracted.yearBuilt <= new Date().getFullYear()) {
    validated.yearBuilt = Number(extracted.yearBuilt);
  }
  
  // Property type
  if (extracted.propertyType) {
    const validTypes = ['single_family', 'multi_family', 'estate', 'commercial', 'condo', 'townhouse'];
    if (validTypes.includes(extracted.propertyType)) {
      validated.propertyType = extracted.propertyType;
    }
  }
  
  if (extracted.architecturalStyle) validated.architecturalStyle = String(extracted.architecturalStyle);
  
  // Arrays
  if (Array.isArray(extracted.premiumAmenities)) {
    validated.premiumAmenities = extracted.premiumAmenities.filter(a => a && typeof a === 'string');
  }
  
  if (extracted.parkingSpaces && extracted.parkingSpaces >= 0) {
    validated.parkingSpaces = Number(extracted.parkingSpaces);
  }
  if (extracted.parkingType) validated.parkingType = String(extracted.parkingType);
  if (extracted.hvacType) validated.hvacType = String(extracted.hvacType);
  
  if (extracted.fireplaces && extracted.fireplaces >= 0) {
    validated.fireplaces = Number(extracted.fireplaces);
  }
  if (Array.isArray(extracted.fireplaceTypes)) {
    validated.fireplaceTypes = extracted.fireplaceTypes.filter(t => t && typeof t === 'string');
  }
  
  if (extracted.yearRenovated && extracted.yearRenovated > 1700) {
    validated.yearRenovated = Number(extracted.yearRenovated);
  }
  
  if (extracted.overallCondition) {
    const validConditions = ['excellent', 'good', 'fair', 'needs work'];
    if (validConditions.includes(extracted.overallCondition)) {
      validated.overallCondition = extracted.overallCondition;
    }
  }
  
  if (Array.isArray(extracted.recentUpgrades)) {
    validated.recentUpgrades = extracted.recentUpgrades.filter(u => u && typeof u === 'string');
  }
  
  if (extracted.schoolDistrict) validated.schoolDistrict = String(extracted.schoolDistrict);
  if (extracted.mlsNumber) validated.mlsNumber = String(extracted.mlsNumber);
  if (extracted.description) validated.description = String(extracted.description);
  
  if (Array.isArray(extracted.propertyImages)) {
    validated.propertyImages = extracted.propertyImages.filter(img => img && isValidUrl(img));
  }
  
  if (extracted.virtualTourUrl && isValidUrl(extracted.virtualTourUrl)) {
    validated.virtualTourUrl = String(extracted.virtualTourUrl);
  }
  
  return validated;
}

/**
 * Generate warnings for low-confidence or missing fields
 */
function generateWarnings(data: any, confidence: Record<string, number>): string[] {
  const warnings: string[] = [];
  
  // Check for low confidence fields
  Object.entries(confidence).forEach(([field, conf]) => {
    if (conf < 0.7 && data[field] !== undefined) {
      warnings.push(`Low confidence for "${field}" (${Math.round(conf * 100)}%). Please verify.`);
    }
  });
  
  // Check for missing critical fields
  const criticalFields = [
    { key: 'propertyValue', label: 'Property Value' },
    { key: 'totalSquareFootage', label: 'Square Footage' },
    { key: 'bedrooms', label: 'Bedrooms' },
    { key: 'bathroomsFull', label: 'Bathrooms' },
  ];
  
  criticalFields.forEach(({ key, label }) => {
    if (!data[key]) {
      warnings.push(`Missing critical field: ${label}`);
    }
  });
  
  // Validate property value
  if (data.propertyValue && data.propertyValue < 10000) {
    warnings.push('Property value seems unusually low. Please verify.');
  }
  
  // Validate square footage
  if (data.totalSquareFootage && data.totalSquareFootage < 100) {
    warnings.push('Square footage seems unusually low. Please verify.');
  }
  
  return warnings;
}

/**
 * Detect the platform from URL
 */
export function detectPlatform(url: string): string {
  const platforms = {
    sothebys: /sothebysrealty\.com/i,
    christies: /christiesrealestate\.com/i,
    zillow: /zillow\.com/i,
    redfin: /redfin\.com/i,
    realtor: /realtor\.com/i,
    trulia: /trulia\.com/i,
    'homes.com': /homes\.com/i,
  };
  
  for (const [platform, regex] of Object.entries(platforms)) {
    if (regex.test(url)) {
      return platform;
    }
  }
  
  return 'unknown';
}

/**
 * Validate URL format
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function getScrapingSuggestions(failedUrl: string): string {
  const url = new URL(failedUrl);
  const domain = url.hostname.toLowerCase();
  
  if (domain.includes('zillow.com')) {
    return 'Try using Zillow\'s direct listing URL or consider using Redfin/Realtor.com instead.';
  } else if (domain.includes('redfin.com')) {
    return 'Try using Redfin\'s direct listing URL or consider using Zillow/Realtor.com instead.';
  } else if (domain.includes('realtor.com')) {
    return 'Try using Realtor.com\'s direct listing URL or consider using Zillow/Redfin instead.';
  } else if (domain.includes('sothebys') || domain.includes('christies')) {
    return 'Luxury real estate sites may have strong bot protection. Try copying the property details manually or use a different listing site.';
  } else {
    return 'Please try a different property listing URL from sites like Zillow, Redfin, or Realtor.com.';
  }
}

/**
 * Get supported platforms list
 */
export const SUPPORTED_PLATFORMS = [
  { name: 'Sotheby\'s International Realty', domain: 'sothebysrealty.com' },
  { name: 'Christie\'s Real Estate', domain: 'christiesrealestate.com' },
  { name: 'Zillow', domain: 'zillow.com' },
  { name: 'Redfin', domain: 'redfin.com' },
  { name: 'Realtor.com', domain: 'realtor.com' },
  { name: 'Trulia', domain: 'trulia.com' },
  { name: 'Homes.com', domain: 'homes.com' },
  { name: 'Custom Listings', domain: 'any domain' },
];

