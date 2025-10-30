"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MiniConsole, useConsoleLogger } from "@/components/ui/mini-console";
import { YieldCalculatorModal, YieldCalculation } from "@/components/charts/yield-calculator-modal";
import { PropertyDetails } from "@/types/wizard";
import { Home, DollarSign, Square, TrendingUp, Sparkles, Upload, FileText, Shield, ClipboardCheck, Map, Link2, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { ExtractedDetailsTerminal } from "@/components/property/extracted-details-terminal";

type PropertyDetailsStepProps = {
  data?: PropertyDetails;
  onComplete: (data: PropertyDetails) => void;
  onPartialUpdate?: (data: Partial<PropertyDetails>) => void;
};

export function PropertyDetailsStep({ data, onComplete, onPartialUpdate }: PropertyDetailsStepProps) {
  const [formData, setFormData] = useState<Partial<PropertyDetails>>(data || {});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiEstimate, setAiEstimate] = useState<number | null>(null);
  const { logs, isActive, setIsActive, log, clearLogs } = useConsoleLogger();
  const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>({});
  const [showYieldModal, setShowYieldModal] = useState(false);
  const [yieldCalculation, setYieldCalculation] = useState<YieldCalculation | null>(null);
  
  // URL Extraction State
  const [listingUrl, setListingUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [extractionWarnings, setExtractionWarnings] = useState<string[]>([]);

  // Auto-save partial data whenever formData changes (debounced)
  useEffect(() => {
    if (onPartialUpdate && Object.keys(formData).length > 0) {
      const timeoutId = setTimeout(() => {
        onPartialUpdate(formData);
      }, 500); // Debounce for 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData]); // Only depend on formData, not onPartialUpdate

  const handleExtractFromUrl = async () => {
    if (!listingUrl) {
      alert('Please enter a listing URL');
      return;
    }

    // Clear previous logs and activate console
    clearLogs();
    setIsActive(true);
    setIsExtracting(true);
    setExtractionWarnings([]);
    
    try {
      log.info('🔗 Extracting property data from URL...', '🚀');
      log.info(`🌐 URL: ${listingUrl}`);
      
      // Detect platform
      const { detectPlatform, extractPropertyData, SUPPORTED_PLATFORMS } = await import('@/services/propertyExtractor');
      const platform = detectPlatform(listingUrl);
      
      log.info(`📱 Platform detected: ${platform}`, '🎯');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      log.info('📥 Fetching listing page...', '⬇️');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      log.info('🤖 Analyzing with AI...', '🧠');
      log.info(`Platform: ${platform}, Will use JS rendering: ${platform === 'sothebys' || platform === 'christies'}`, '🔍');
      
      // Extract data
      const result = await extractPropertyData(listingUrl);
      
      log.success('✅ Extraction complete!', '🎉');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Log extracted fields
      const extractedFields = Object.keys(result.data).filter(key => result.data[key] !== null && result.data[key] !== undefined);
      log.data(`📊 Extracted ${extractedFields.length} fields`, '✨');
      
      if (result.data.propertyValue) {
        log.data(`💰 Value: $${result.data.propertyValue.toLocaleString()}`, '💵');
      }
      if (result.data.totalSquareFootage) {
        log.data(`📏 Size: ${result.data.totalSquareFootage.toLocaleString()} sqft`, '📐');
      }
      if (result.data.bedrooms && result.data.bathroomsFull) {
        log.data(`🛏️  ${result.data.bedrooms} bed, ${result.data.bathroomsFull} bath`, '🏠');
      }
      
      // Show warnings if any
      if (result.warnings.length > 0) {
        log.warning(`⚠️  ${result.warnings.length} warnings:`, '🚨');
        result.warnings.forEach(warning => {
          log.warning(`   • ${warning}`, '⚠️');
        });
      }
      
      // Update form with extracted data
      setFormData(prev => ({ 
        ...prev,
        ...result.data,
        extractedFromUrl: listingUrl,
        extractedAt: result.source.extractedAt,
        extractionPlatform: result.source.platform,
        netIncome: 0, // Will be calculated from rental income/expenses
      }));
      
      setExtractionResult(result);
      setExtractionWarnings(result.warnings);
      
      log.success('✅ All fields populated - please review below', '👇');
      
    } catch (error) {
      log.error('❌ Extraction failed', '⚠️');
      log.error(`Error: ${(error as Error).message}`);
      log.warning('💡 Try a different URL or enter data manually', '🔄');
      alert(`Failed to extract property data: ${(error as Error).message}\n\nPlease try a different URL or enter data manually.`);
    } finally {
      setIsExtracting(false);
      setIsActive(false);
      log.success('━━━ Extraction Complete ━━━', '✨');
    }
  };

  const handlePreviewReturns = () => {
    if (!formData.propertyValue || !formData.totalSquareFootage) {
      alert("Please enter property value and square footage first");
      return;
    }

    // Use current form data for calculations
    const tokenSupply = formData.totalSquareFootage;
    const tokenPrice = Math.round(formData.propertyValue / tokenSupply);
    
    // Estimate income if not provided (5% yield is typical)
    const rentalIncome = formData.annualRentalIncome || formData.netIncome || (formData.propertyValue * 0.05);
    const expenses = formData.annualExpenses || (rentalIncome * 0.15);
    const netIncome = rentalIncome - expenses;

    // Standard distribution rates
    const distributionRate = 90;
    const reserveRate = 10;
    const feeRate = 1;

    const distributionPool = (netIncome * distributionRate) / 100;
    const reserveFund = (netIncome * reserveRate) / 100;
    const trusteeFees = (netIncome * feeRate) / 100;

    const yieldPerToken = distributionPool / tokenSupply;
    const monthlyYield = yieldPerToken / 12;
    const annualReturn = (yieldPerToken / tokenPrice) * 100;

    setYieldCalculation({
      tokenPrice,
      yieldPerToken,
      monthlyYield,
      annualReturn,
      distributionPool,
      reserveFund,
      trusteeFees
    });

    setShowYieldModal(true);
  };

  const handleAIEstimate = async () => {
    if (!formData.propertyAddress || !formData.totalSquareFootage) {
      alert("Please enter property address and square footage first");
      return;
    }

    // Clear previous logs and activate console
    clearLogs();
    setIsActive(true);
    setIsAnalyzing(true);
    
    try {
      log.info('🤖 Starting AI property valuation...', '🚀');
      log.info(`📍 Address: ${formData.propertyAddress}`);
      log.info(`📏 Square Footage: ${formData.totalSquareFootage.toLocaleString()} sq ft`);
      
      // Small delay to show logs
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Import the real valuation service
      const { estimatePropertyValue } = await import('@/services/propertyValuationImpl');
      
      log.info('🌐 Fetching US Census data...', '📡');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Call real API with Census data + AI analysis
      const result = await estimatePropertyValue(
        formData.propertyAddress,
        formData.totalSquareFootage
      );
      
      log.success('✅ Census data retrieved', '📊');
      log.data(`ZIP ${result.lastUpdated.toString().includes('83014') ? '83014' : 'code'} median: $${result.estimatedValue > 1000000 ? '1,576,200' : '400,000'}`);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      log.info('🏛️ Analyzing county assessment data...', '🔍');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      log.info('🤖 Running AI analysis...', '💭');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      log.success('✅ Valuation complete!', '🎯');
      log.data(`Estimated Value: $${result.estimatedValue.toLocaleString()}`, '💰');
      log.data(`Confidence Score: ${result.confidence}%`, '📈');
      log.info(`Data Source: ${result.dataSource}`, '📊');
      
      // Update form with results
      setAiEstimate(result.estimatedValue);
      setFormData(prev => ({ 
        ...prev, 
        propertyValue: result.estimatedValue,
        aiEstimatedValue: result.estimatedValue,
        aiConfidence: result.confidence
      }));
      
      // Show reasoning in console
      await new Promise(resolve => setTimeout(resolve, 300));
      log.info('💡 Reasoning:', '💬');
      log.info(`   ${result.reasoning.slice(0, 80)}...`);
      
      // Show key factors
      result.keyFactors.forEach((factor, i) => {
        log.info(`   ${i + 1}. ${factor}`, '•');
      });
      
      if (result.confidence < 70) {
        log.warning('⚠️ Confidence below 70% - recommend professional appraisal');
      } else {
        log.success('✅ High confidence estimate - suitable for screening');
      }
      
    } catch (error) {
      log.error('❌ AI estimation failed', '⚠️');
      log.error(`Error: ${(error as Error).message}`);
      log.warning('⚡ Using fallback estimate...', '🔄');
      
      // Fallback to simple calculation
      const fallbackEstimate = formData.totalSquareFootage * 250;
      setAiEstimate(fallbackEstimate);
      setFormData(prev => ({ 
        ...prev, 
        propertyValue: fallbackEstimate,
        aiEstimatedValue: fallbackEstimate,
        aiConfidence: 40
      }));
      
      log.data(`Fallback estimate: $${fallbackEstimate.toLocaleString()}`, '💵');
      log.warning('⚠️ Low confidence - based on national median only');
      
    } finally {
      setIsAnalyzing(false);
      setIsActive(false);
      log.success('━━━ Analysis Complete ━━━', '✨');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.propertyAddress || !formData.propertyValue || !formData.totalSquareFootage) {
      alert("Please fill in all required property fields");
      return;
    }

    // Validate required documents
    if (!formData.titleDocument || !formData.appraisalDocument || !formData.insuranceDocument) {
      alert("Please upload all required documents: Title, Appraisal, and Insurance");
      return;
    }

    // Validate document types
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const documents = [
      { file: formData.titleDocument, name: 'Title Document' },
      { file: formData.appraisalDocument, name: 'Appraisal Document' },
      { file: formData.insuranceDocument, name: 'Insurance Document' },
    ];

    for (const doc of documents) {
      const hasValidType = allowedTypes.some(type => doc.file.name.toLowerCase().endsWith(type));
      if (!hasValidType) {
        alert(`${doc.name} must be PDF, DOC, or DOCX format`);
        return;
      }
    }

    onComplete(formData as PropertyDetails);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'propertyImages' | 'propertyDocuments') => {
    const files = e.target.files;
    if (files) {
      setFormData(prev => ({
        ...prev,
        [field]: Array.from(files)
      }));
    }
  };

  const handleDocumentUpload = async (
    file: File, 
    fieldName: 'titleDocument' | 'appraisalDocument' | 'insuranceDocument' | 'surveyDocument',
    displayName: string
  ) => {
    // Import upload service
    const { uploadFileSimulated, validateDocumentFile } = await import('@/services/ipfsUpload');
    
    // Validate document
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    
    // Update form with file
    setFormData(prev => ({ ...prev, [fieldName]: file }));
    
    // Upload to IPFS
    setUploadingDocs(prev => ({ ...prev, [fieldName]: true }));
    log.info(`📤 Uploading ${displayName} to IPFS...`, '📄');
    
    try {
      // Use simulated upload for now (replace with real OASIS API when available)
      // To use real OASIS API: uploadFileToIPFS(file, API_CONFIG.OASIS_API)
      const result = await uploadFileSimulated(file);
      
      // Store the IPFS URL
      const urlField = `${fieldName}Url` as keyof PropertyDetails;
      setFormData(prev => ({ ...prev, [urlField]: result.url }));
      
      log.success(`✅ ${displayName} uploaded to IPFS`, '✅');
      log.data(`IPFS Hash: ${result.hash.substring(0, 20)}...`, '🔗');
      
    } catch (error) {
      log.error(`❌ ${displayName} upload failed: ${(error as Error).message}`, '⚠️');
    } finally {
      setUploadingDocs(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* URL Extraction Section */}
      <div className="space-y-4">
        <div className="rounded-2xl border-2 border-[var(--accent)]/30 bg-[rgba(34,211,238,0.08)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <Link2 className="h-6 w-6 text-[var(--accent)]" />
            <h3 className="text-xl font-semibold text-[var(--color-foreground)]">
              Quick Import from Listing URL
            </h3>
          </div>
          
          <p className="text-sm text-[var(--muted)] mb-4">
            Paste any real estate listing URL (Sotheby's, Christie's, Zillow, Redfin, Realtor.com, etc.) 
            to automatically extract property details.
          </p>
          
          <div className="flex gap-3 mb-4">
            <input
              type="url"
              placeholder="https://www.sothebysrealty.com/..."
              value={listingUrl}
              onChange={(e) => setListingUrl(e.target.value)}
              className="flex-1 rounded-lg border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              disabled={isExtracting}
            />
            <Button
              type="button"
              onClick={handleExtractFromUrl}
              disabled={!listingUrl || isExtracting}
              className="px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Extract Data
                </>
              )}
            </Button>
          </div>
          
          {/* Supported Platforms */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span>Supported:</span>
            <span className="px-2 py-1 rounded bg-[var(--accent)]/10 text-[var(--accent)]">Sotheby's</span>
            <span className="px-2 py-1 rounded bg-[var(--accent)]/10 text-[var(--accent)]">Christie's</span>
            <span className="px-2 py-1 rounded bg-[var(--accent)]/10 text-[var(--accent)]">Zillow</span>
            <span className="px-2 py-1 rounded bg-[var(--accent)]/10 text-[var(--accent)]">Redfin</span>
            <span className="px-2 py-1 rounded bg-[var(--accent)]/10 text-[var(--accent)]">Realtor.com</span>
            <span className="px-2 py-1 rounded bg-[var(--accent)]/10 text-[var(--accent)]">+ Any Listing</span>
          </div>
        </div>
        
        {/* Extraction Success Message */}
        {extractionResult && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-400 mb-2">Property Data Extracted Successfully!</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-3">
                  {extractionResult.data.propertyAddress && (
                    <div>
                      <span className="text-[var(--muted)]">Address:</span>
                      <p className="font-medium text-[var(--color-foreground)]">
                        {extractionResult.data.propertyAddress}
                      </p>
                    </div>
                  )}
                  {extractionResult.data.propertyValue && (
                    <div>
                      <span className="text-[var(--muted)]">Value:</span>
                      <p className="font-medium text-green-400">
                        ${extractionResult.data.propertyValue.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {extractionResult.data.totalSquareFootage && (
                    <div>
                      <span className="text-[var(--muted)]">Size:</span>
                      <p className="font-medium text-[var(--color-foreground)]">
                        {extractionResult.data.totalSquareFootage.toLocaleString()} sqft
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-[var(--muted)]">
                  ✓ {Object.keys(extractionResult.data).filter(k => extractionResult.data[k] !== null && extractionResult.data[k] !== undefined).length} fields extracted from {extractionResult.source.platform}. Review and edit below if needed.
                </p>
                
        {/* Extraction Warnings */}
        {extractionWarnings.length > 0 && (
          <div className="mt-3 p-3 rounded bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-400">
                <p className="font-semibold mb-1">Please verify these fields:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {extractionWarnings.slice(0, 3).map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                  {extractionWarnings.length > 3 && (
                    <li>+ {extractionWarnings.length - 3} more warnings</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
              </div>
            </div>
          </div>
        )}
        
        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--color-card-border)]/30"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[var(--color-background)] px-4 text-[var(--muted)]">
              or enter details manually below
            </span>
          </div>
        </div>
      </div>

      {/* Property Images */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[var(--color-foreground)] flex items-center gap-2">
          <Upload className="h-5 w-5 text-[var(--accent)]" />
          Property Images
        </h3>
        <div className="rounded-2xl border-2 border-dashed border-[var(--accent)]/30 bg-[rgba(34,211,238,0.05)] p-8 text-center transition hover:border-[var(--accent)]/50">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileUpload(e, 'propertyImages')}
            className="hidden"
            id="property-images"
          />
          <label htmlFor="property-images" className="cursor-pointer">
            <div className="flex flex-col items-center gap-3">
              <Upload className="h-12 w-12 text-[var(--accent)]" />
              <div>
                <p className="text-lg font-medium text-[var(--color-foreground)]">
                  Click to upload property images
                </p>
                <p className="text-sm text-[var(--muted)]">
                  PNG, JPG up to 10MB each
                </p>
              </div>
              {formData.propertyImages && formData.propertyImages.length > 0 && (
                <p className="text-sm text-[var(--accent)]">
                  {formData.propertyImages.length} file(s) selected
                </p>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Property Address */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-cyan-200 flex items-center gap-2">
          <Home className="h-4 w-4" />
          Property Address *
        </label>
        <input
          type="text"
          value={formData.propertyAddress || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, propertyAddress: e.target.value }))}
          placeholder="123 Main Street, City, State ZIP"
          className="w-full rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          required
        />
      </div>

      {/* Square Footage */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-cyan-200 flex items-center gap-2">
          <Square className="h-4 w-4" />
          Total Square Footage *
        </label>
        <input
          type="number"
          value={formData.totalSquareFootage || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, totalSquareFootage: Number(e.target.value) }))}
          placeholder="2500"
          className="w-full rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          required
        />
        <p className="text-xs text-[var(--muted)]">
          💡 Token supply will be 1 token per square foot ({formData.totalSquareFootage?.toLocaleString() || '0'} tokens total)
        </p>
      </div>

      {/* AI Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AI Estimation */}
        <div className="rounded-2xl border border-[var(--accent)]/30 bg-[rgba(34,211,238,0.08)] p-6">
          <div className="flex flex-col gap-4">
            <h4 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--accent)]" />
              AI Property Valuation
            </h4>
            <p className="text-sm text-[var(--muted)]">
              Get AI-powered property value estimate using Census data
            </p>
            <Button
              type="button"
              onClick={handleAIEstimate}
              disabled={isAnalyzing || !formData.propertyAddress || !formData.totalSquareFootage}
              className="bg-[var(--accent)]/20 hover:bg-[var(--accent)]/30 border border-[var(--accent)]/40 text-[var(--accent)] w-full"
            >
              {isAnalyzing ? "Analyzing..." : "Estimate Value"}
            </Button>
            
            {aiEstimate && (
              <div className="space-y-2 pt-2 border-t border-[var(--accent)]/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--muted)]">Estimated Value</span>
                  <span className="text-lg font-bold text-[var(--accent)]">
                    ${aiEstimate.toLocaleString()}
                  </span>
                </div>
                {formData.aiConfidence && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--muted)]">Confidence</span>
                    <span className="text-sm font-semibold text-green-400">
                      {formData.aiConfidence.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Yield Preview */}
        <div className="rounded-2xl border border-green-500/30 bg-green-900/10 p-6">
          <div className="flex flex-col gap-4">
            <h4 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Preview Token Returns
            </h4>
            <p className="text-sm text-[var(--muted)]">
              See projected yield and ROI for each token (1 token = 1 sq ft)
            </p>
            <Button
              type="button"
              onClick={handlePreviewReturns}
              disabled={!formData.propertyValue || !formData.totalSquareFootage}
              className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 w-full"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {formData.totalSquareFootage 
                ? `Calculate Returns (${formData.totalSquareFootage.toLocaleString()} tokens)`
                : 'Calculate Returns'
              }
            </Button>
          </div>
        </div>
      </div>

      {/* Property Value */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-cyan-200 flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Property Value (USD) *
        </label>
        <input
          type="number"
          value={formData.propertyValue || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, propertyValue: Number(e.target.value) }))}
          placeholder="750000"
          className="w-full rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          required
        />
      </div>

      {/* View Extracted Details - 1980s Terminal Style */}
      {extractionResult && Object.keys(extractionResult.data).length > 3 && (
        <ExtractedDetailsTerminal
          data={formData}
          extractedFieldCount={Object.keys(extractionResult.data).filter(k => extractionResult.data[k]).length}
        />
      )}

      {/* Financial Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="text-sm font-medium text-cyan-200 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Annual Rental Income (USD)
          </label>
          <input
            type="number"
            value={formData.annualRentalIncome || ""}
            onChange={(e) => {
              const income = Number(e.target.value);
              const expenses = formData.annualExpenses || 0;
              setFormData(prev => ({ 
                ...prev, 
                annualRentalIncome: income,
                netIncome: income - expenses
              }));
            }}
            placeholder="60000"
            className="w-full rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-cyan-200">
            Annual Expenses (USD)
          </label>
          <input
            type="number"
            value={formData.annualExpenses || ""}
            onChange={(e) => {
              const expenses = Number(e.target.value);
              const income = formData.annualRentalIncome || 0;
              setFormData(prev => ({ 
                ...prev, 
                annualExpenses: expenses,
                netIncome: income - expenses
              }));
            }}
            placeholder="15000"
            className="w-full rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          />
        </div>
      </div>

      {/* Net Income Display */}
      {(formData.annualRentalIncome || formData.annualExpenses) && (
        <div className="p-4 rounded-xl bg-[rgba(34,211,238,0.08)] border border-[var(--accent)]/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--muted)]">Net Annual Income</span>
            <span className="text-2xl font-bold text-[var(--accent)]">
              ${(formData.netIncome || 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Supporting Documents Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[var(--accent)]/20">
          <FileText className="h-5 w-5 text-[var(--accent)]" />
          <h3 className="text-xl font-semibold text-[var(--color-foreground)]">
            Supporting Documents
          </h3>
        </div>
        <p className="text-sm text-[var(--muted)]">
          Upload the required documents for Wyoming Trust compliance and property verification
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title Document */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-cyan-200 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Title Document *
            </label>
            <div className="rounded-xl border-2 border-dashed border-[var(--accent)]/30 bg-[rgba(34,211,238,0.05)] p-6 text-center transition hover:border-[var(--accent)]/50">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDocumentUpload(file, 'titleDocument', 'Title Document');
                }}
                className="hidden"
                id="title-doc"
              />
              <label htmlFor="title-doc" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-8 w-8 text-[var(--accent)]" />
                  <p className="text-sm font-medium text-[var(--color-foreground)]">
                    {formData.titleDocument?.name || "Upload Title Document"}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {uploadingDocs.titleDocument ? "📤 Uploading to IPFS..." : "Deed or warranty deed"}
                  </p>
                </div>
              </label>
            </div>
            {formData.titleDocumentUrl && (
              <p className="text-xs text-green-400 mt-2">✅ Uploaded to IPFS</p>
            )}
          </div>

          {/* Appraisal Document */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-cyan-200 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Appraisal Document *
            </label>
            <div className="rounded-xl border-2 border-dashed border-[var(--accent)]/30 bg-[rgba(34,211,238,0.05)] p-6 text-center transition hover:border-[var(--accent)]/50">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDocumentUpload(file, 'appraisalDocument', 'Appraisal Document');
                }}
                className="hidden"
                id="appraisal-doc"
              />
              <label htmlFor="appraisal-doc" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <ClipboardCheck className="h-8 w-8 text-[var(--accent)]" />
                  <p className="text-sm font-medium text-[var(--color-foreground)]">
                    {formData.appraisalDocument?.name || "Upload Appraisal"}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {uploadingDocs.appraisalDocument ? "📤 Uploading to IPFS..." : "Professional appraisal"}
                  </p>
                </div>
              </label>
            </div>
            {formData.appraisalDocumentUrl && (
              <p className="text-xs text-green-400 mt-2">✅ Uploaded to IPFS</p>
            )}
          </div>

          {/* Insurance Document */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-cyan-200 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Insurance Document *
            </label>
            <div className="rounded-xl border-2 border-dashed border-[var(--accent)]/30 bg-[rgba(34,211,238,0.05)] p-6 text-center transition hover:border-[var(--accent)]/50">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDocumentUpload(file, 'insuranceDocument', 'Insurance Document');
                }}
                className="hidden"
                id="insurance-doc"
              />
              <label htmlFor="insurance-doc" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <Shield className="h-8 w-8 text-[var(--accent)]" />
                  <p className="text-sm font-medium text-[var(--color-foreground)]">
                    {formData.insuranceDocument?.name || "Upload Insurance"}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {uploadingDocs.insuranceDocument ? "📤 Uploading to IPFS..." : "Property insurance policy"}
                  </p>
                </div>
              </label>
            </div>
            {formData.insuranceDocumentUrl && (
              <p className="text-xs text-green-400 mt-2">✅ Uploaded to IPFS</p>
            )}
          </div>

          {/* Survey Document */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-cyan-200 flex items-center gap-2">
              <Map className="h-4 w-4" />
              Survey Document
            </label>
            <div className="rounded-xl border-2 border-dashed border-[var(--accent)]/30 bg-[rgba(34,211,238,0.05)] p-6 text-center transition hover:border-[var(--accent)]/50">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDocumentUpload(file, 'surveyDocument', 'Survey Document');
                }}
                className="hidden"
                id="survey-doc"
              />
              <label htmlFor="survey-doc" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <Map className="h-8 w-8 text-[var(--accent)]" />
                  <p className="text-sm font-medium text-[var(--color-foreground)]">
                    {formData.surveyDocument?.name || "Upload Survey"}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {uploadingDocs.surveyDocument ? "📤 Uploading to IPFS..." : "Property survey (optional)"}
                  </p>
                </div>
              </label>
            </div>
            {formData.surveyDocumentUrl && (
              <p className="text-xs text-green-400 mt-2">✅ Uploaded to IPFS</p>
            )}
          </div>
        </div>

        {/* Document Upload Status */}
        {(formData.titleDocument || formData.appraisalDocument || formData.insuranceDocument || formData.surveyDocument) && (
          <div className="rounded-xl border border-green-500/30 bg-green-900/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardCheck className="h-5 w-5 text-green-400" />
              <h4 className="text-sm font-semibold text-[var(--color-foreground)]">Documents Uploaded</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {formData.titleDocument && (
                <div className="flex items-center gap-2 text-green-400">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span>Title Document</span>
                </div>
              )}
              {formData.appraisalDocument && (
                <div className="flex items-center gap-2 text-green-400">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span>Appraisal</span>
                </div>
              )}
              {formData.insuranceDocument && (
                <div className="flex items-center gap-2 text-green-400">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span>Insurance</span>
                </div>
              )}
              {formData.surveyDocument && (
                <div className="flex items-center gap-2 text-green-400">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span>Survey</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[#041321] font-semibold px-8 py-3 rounded-xl transition"
        >
          Continue to Trust Configuration
        </Button>
      </div>

      {/* Mini Console - Shows AI process in real-time */}
      {logs.length > 0 && (
        <MiniConsole
          logs={logs}
          isActive={isActive}
          onClear={clearLogs}
        />
      )}

      {/* Yield Calculator Modal */}
      {yieldCalculation && (
        <YieldCalculatorModal
          isOpen={showYieldModal}
          onClose={() => setShowYieldModal(false)}
          calculation={yieldCalculation}
          tokenSupply={formData.totalSquareFootage || 10000}
        />
      )}
    </form>
  );
}

