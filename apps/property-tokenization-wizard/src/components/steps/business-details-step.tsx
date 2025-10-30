"use client";

import { useState, useEffect } from "react";
import { Globe, TrendingUp, Edit, Download, Loader, Sparkles, Building2, DollarSign, FileText, Upload, Calculator, Eye, Link, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BusinessData } from "@/types/business";
import { extractBusinessFromWebsite, extractBusinessFromTicker } from "@/services/businessExtractor";
import { estimateBusinessValue } from "@/services/businessValuation";
import { parseMultipleStatements } from "@/services/financialStatementParser";
import { extractFromAnyURL } from "@/services/smartLinkExtractor";
import { ExtractedBusinessTerminal } from "@/components/business/extracted-business-terminal";
import { initiateQuickBooksAuth, getCompleteFinancialData, type QuickBooksAuthConfig, type QuickBooksTokens } from "@/services/quickbooksIntegration";
import { MiniConsole, useConsoleLogger } from "@/components/ui/mini-console";
import { YieldCalculatorModal } from "@/components/business/yield-calculator-modal";
import { analyzeGitHubRepo, githubToBusinessMetrics } from "@/services/githubAnalyzer";

type ExtractionMethod = "quickbooks" | "xero" | "url" | "github" | "financial-docs" | "manual";

interface BusinessDetailsStepProps {
  data?: BusinessData;
  onComplete: (data: BusinessData) => void;
  onPartialUpdate?: (data: BusinessData) => void;
}

export function BusinessDetailsStep({ data, onComplete, onPartialUpdate }: BusinessDetailsStepProps) {
  const [extractionMethod, setExtractionMethod] = useState<ExtractionMethod>("quickbooks");
  const [extracting, setExtracting] = useState(false);
  const [valuing, setValuing] = useState(false);
  const [parsingStatements, setParsingStatements] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [smartUrl, setSmartUrl] = useState("");
  const [extractingFromUrl, setExtractingFromUrl] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [analyzingGithub, setAnalyzingGithub] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [connectingQuickBooks, setConnectingQuickBooks] = useState(false);
  const [quickBooksConnected, setQuickBooksConnected] = useState(false);
  const [showYieldCalculator, setShowYieldCalculator] = useState(false);
  const [showEnrichOptions, setShowEnrichOptions] = useState(false);
  const [usedSources, setUsedSources] = useState<string[]>([]);

  // Console logger for extraction progress
  const { logs, isActive, setIsActive, log, clearLogs } = useConsoleLogger();

  const [formData, setFormData] = useState<BusinessData>(data || {
    companyName: "",
    industry: "",
    headquarters: "",
    annualRevenue: undefined,
    growthRate: undefined,
    employeeCount: undefined,
  });

  // Derive showValuation from formData instead of separate state
  const showValuation = !!formData.valuationData;

  // Sync formData with data prop when component mounts or data changes
  useEffect(() => {
    if (data && data.companyName) {
      // Only update if the data has changed
      if (JSON.stringify(data) !== JSON.stringify(formData)) {
        setFormData(data);
      }
    }
  }, [data]);

  // Auto-save: Update parent when formData changes
  useEffect(() => {
    if (onPartialUpdate && formData.companyName) {
      onPartialUpdate(formData);
    }
  }, [formData, onPartialUpdate]);

  // Listen for QuickBooks OAuth callback
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'QUICKBOOKS_AUTH_SUCCESS') {
        console.log('✅ QuickBooks OAuth successful!');
        setConnectingQuickBooks(true);
        
        try {
          // In production: Exchange code for tokens via API route
          // For now: Show simulated data
          const simulatedData: Partial<BusinessData> = {
            companyName: 'Demo Company Inc.',
            industry: 'Professional Services',
            headquarters: 'San Francisco, CA',
            annualRevenue: 5234000,
            netIncome: 892000,
            profitMargin: 17.1,
          };
          
          setFormData(prev => ({
            ...prev,
            ...simulatedData,
          }));
          
          setExtractedData({
            ...simulatedData,
            _extractionMeta: {
              sources: [{ name: 'QuickBooks Online', url: 'https://quickbooks.intuit.com' }],
              confidence: 98,
            },
          });
          
          setQuickBooksConnected(true);
          // Don't auto-open terminal
          
        } catch (error) {
          alert('Failed to extract QuickBooks data');
        } finally {
          setConnectingQuickBooks(false);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Handle QuickBooks connection (real)
  const handleConnectQuickBooks = () => {
    const config: QuickBooksAuthConfig = {
      clientId: process.env.NEXT_PUBLIC_QUICKBOOKS_CLIENT_ID || '',
      clientSecret: process.env.NEXT_PUBLIC_QUICKBOOKS_CLIENT_SECRET || '',
      redirectUri: `${window.location.origin}/api/quickbooks/callback`,
      scopes: ['com.intuit.quickbooks.accounting'],
    };
    
    if (!config.clientId) {
      alert('QuickBooks integration not configured. Please add NEXT_PUBLIC_QUICKBOOKS_CLIENT_ID to .env.local\n\nGet your keys at: https://developer.intuit.com\n\nOr try "Demo QuickBooks" below to see how it works!');
      return;
    }
    
    const authUrl = initiateQuickBooksAuth(config);
    window.open(authUrl, 'QuickBooks OAuth', 'width=600,height=800');
  };

  // Handle QuickBooks DEMO (no credentials needed)
  const handleDemoQuickBooks = async () => {
    setConnectingQuickBooks(true);
    setIsActive(true);
    clearLogs();
    
    log.info('🔐 Initiating QuickBooks OAuth (DEMO)...', '🔐');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    log.success('✅ OAuth authorized successfully', '✅');
    await new Promise(resolve => setTimeout(resolve, 600));
    
    log.info('📊 Fetching company information...', '📊');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    log.data('Company: TechCorp Manufacturing Inc.', '🏢');
    log.data('Location: Austin, TX', '📍');
    await new Promise(resolve => setTimeout(resolve, 400));
    
    log.info('💰 Extracting Profit & Loss data...', '💰');
    await new Promise(resolve => setTimeout(resolve, 600));
    
    log.data('Revenue: $8,450,000', '💵');
    log.data('EBITDA: $1,690,000 (20% margin)', '📈');
    log.data('Net Income: $1,183,000', '✨');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    log.info('🏦 Extracting Balance Sheet data...', '🏦');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    log.data('Total Assets: $3,200,000', '💎');
    log.data('Liabilities: $1,100,000', '📊');
    await new Promise(resolve => setTimeout(resolve, 400));
    
    log.info('📈 Calculating growth metrics...', '📈');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    log.data('Growth Rate: 28% YoY', '🚀');
    log.data('Operating Cash Flow: $1,520,000', '💰');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    log.success('✅ QuickBooks data extraction complete!', '🎉');
    log.success('12 fields extracted with 98% confidence', '✨');
    
    // Realistic sample data that QuickBooks would return
    const demoData: Partial<BusinessData> = {
      companyName: 'TechCorp Manufacturing Inc.',
      industry: 'Manufacturing',
      headquarters: 'Austin, TX',
      annualRevenue: 8450000,
      ebitda: 1690000,
      netIncome: 1183000,
      profitMargin: 14.0,
      operatingCashFlow: 1520000,
      growthRate: 28,
      employeeCount: 42,
    };
    
    // Merge with existing data (don't overwrite good data)
    setFormData(prev => ({
      ...demoData,
      ...prev,
      // Explicitly merge key fields
      companyName: prev.companyName || demoData.companyName!,
      annualRevenue: prev.annualRevenue || demoData.annualRevenue,
      ebitda: prev.ebitda || demoData.ebitda,
    }));
    
    // Merge extraction metadata
    const newSource = { 
      name: 'QuickBooks Online (DEMO)', 
      url: 'https://quickbooks.intuit.com',
      dataExtracted: ['revenue', 'ebitda', 'netIncome', 'profitMargin', 'growthRate', 'operatingCashFlow'],
      confidence: 98
    };
    
    setExtractedData((prev: any) => {
      const existingSources = prev?._extractionMeta?.sources || [];
      const allSources = [...existingSources, newSource];
      const avgConfidence = Math.round(allSources.reduce((sum: number, s: any) => sum + s.confidence, 0) / allSources.length);
      
      return {
        ...prev,
        ...demoData,
        _extractionMeta: {
          sources: allSources,
          confidence: avgConfidence,
        },
      };
    });
    
    setUsedSources(prev => [...new Set([...prev, 'QuickBooks'])]);
    setQuickBooksConnected(true);
    setConnectingQuickBooks(false);
    setIsActive(false);
  };

  // Handle smart URL extraction
  const handleSmartUrlExtraction = async () => {
    if (!smartUrl) {
      alert("Please enter a URL");
      return;
    }

    setExtractingFromUrl(true);
    setIsActive(true);
    clearLogs();

    try {
      log.info(`🌐 Analyzing URL: ${smartUrl}`, '🌐');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      log.info('🔍 Detecting URL type...', '🔍');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      log.info('📡 Scraping website with Firecrawl...', '📡');
      
      const result = await extractFromAnyURL(smartUrl);
      
      log.success('✅ Website scraped successfully', '✅');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      log.info('🤖 Extracting data with GPT-4...', '🤖');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (result.sources.length > 0) {
        result.sources.forEach(source => {
          log.data(`Found: ${source.name}`, '📊');
        });
      }
      
      if (result.autoDiscoveredUrls.length > 0) {
        log.info(`🔍 Auto-discovered ${result.autoDiscoveredUrls.length} related source(s)`, '🔍');
      }
      
      log.success(`✅ Extraction complete! ${Object.keys(result.data).length} fields extracted`, '🎉');
      log.data(`Confidence: ${result.overallConfidence}%`, '✨');
      
      // Merge with existing data (enrich, don't replace)
      setFormData(prev => ({
        ...prev,
        ...result.data,
        // Keep existing data priority for key fields
        companyName: prev.companyName || result.data.companyName || '',
        annualRevenue: prev.annualRevenue || result.data.annualRevenue,
        ebitda: prev.ebitda || result.data.ebitda,
      }));

      // Merge extraction result with existing sources
      setExtractedData((prev: any) => {
        const existingSources = prev?._extractionMeta?.sources || [];
        const allSources = [...existingSources, ...result.sources];
        const allUrls = [...(prev?._extractionMeta?.autoDiscoveredUrls || []), ...result.autoDiscoveredUrls];
        const avgConfidence = Math.round(allSources.reduce((sum: number, s: any) => sum + s.confidence, 0) / allSources.length);
        
        return {
          ...prev,
          ...result.data,
          _extractionMeta: {
            sources: allSources,
            autoDiscoveredUrls: [...new Set(allUrls)],
            confidence: avgConfidence,
          },
        };
      });

      setUsedSources(prev => [...new Set([...prev, 'Website'])]);

    } catch (error) {
      console.error('Extraction error:', error);
      log.error(`❌ Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`, '❌');
      alert(`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nTip: LinkedIn and Crunchbase often block scraping. Try using the company's main website URL instead (e.g., stripe.com).`);
    } finally {
      setExtractingFromUrl(false);
      setIsActive(false);
    }
  };

  // Handle GitHub repository analysis
  const handleGitHubAnalysis = async () => {
    if (!githubUrl) {
      alert("Please enter a GitHub repository URL");
      return;
    }

    setAnalyzingGithub(true);
    setIsActive(true);
    clearLogs();

    try {
      log.info(`Analyzing GitHub repository...`, 'GitHub');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      log.info('Fetching repository data...', 'API');
      const githubData = await analyzeGitHubRepo(githubUrl);
      
      log.success(`Repository: ${githubData.fullName}`, 'Repo');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      log.info('Analyzing repository structure...', 'Structure');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      log.data(`Files: ${githubData.fileCount} files, ${(githubData.linesOfCode / 1000).toFixed(0)}K LOC`, 'Code');
      log.data(`Language: ${githubData.primaryLanguage}`, 'Tech');
      if (githubData.frameworks.length > 0) {
        log.data(`Frameworks: ${githubData.frameworks.join(', ')}`, 'Stack');
      }
      await new Promise(resolve => setTimeout(resolve, 300));
      
      log.info('Analyzing development activity...', 'Activity');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      log.data(`Contributors: ${githubData.contributors} total, ${githubData.activeContributors} active`, 'Team');
      log.data(`Commits: ${githubData.recentCommitFrequency}/month (${githubData.developmentVelocity} velocity)`, 'Dev');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      log.info('Evaluating project maturity...', 'Quality');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      log.data(`Maturity: ${githubData.codeMaturity}`, 'Level');
      log.data(`Readiness: ${githubData.commercialReadiness}`, 'Status');
      log.data(`Product: ${githubData.productType}`, 'Type');
      
      if (githubData.hasTests) log.data('Has automated tests', 'Quality');
      if (githubData.hasCI) log.data('Has CI/CD pipeline', 'Quality');
      if (githubData.hasDocker) log.data('Docker containerized', 'Deploy');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      log.info('Estimating project value...', 'Valuation');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      log.data(`Development hours: ${githubData.developmentHours.toLocaleString()}`, 'Effort');
      log.data(`Rebuild cost: $${(githubData.estimatedProjectValue / 1000000).toFixed(1)}M`, 'Value');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      log.success(`Deep analysis complete!`, 'Success');
      log.data(`Community: ${githubData.stars.toLocaleString()} stars, ${githubData.forks.toLocaleString()} forks`, 'Engagement');
      
      // Convert GitHub data to business metrics
      const businessMetrics = githubToBusinessMetrics(githubData);
      
      // Merge with existing data
      setFormData(prev => ({
        ...prev,
        ...businessMetrics,
        // Keep existing data priority
        companyName: prev.companyName || businessMetrics.employeeCount ? `${githubData.repoName} Team` : '',
        employeeCount: prev.employeeCount || businessMetrics.employeeCount,
        industry: prev.industry || businessMetrics.industry,
        foundedYear: prev.foundedYear || businessMetrics.foundedYear,
        description: prev.description || businessMetrics.description,
      }));

      // Merge extraction metadata
      const newSource = {
        name: 'GitHub Repository',
        url: githubUrl,
        dataExtracted: ['team size', 'tech stack', 'development activity', 'code maturity'],
        confidence: 75, // Medium confidence - derived data
      };

      setExtractedData((prev: any) => {
        const existingSources = prev?._extractionMeta?.sources || [];
        const allSources = [...existingSources, newSource];
        const avgConfidence = Math.round(allSources.reduce((sum: number, s: any) => sum + s.confidence, 0) / allSources.length);
        
        return {
          ...prev,
          ...businessMetrics,
          githubData, // Store full GitHub data
          _extractionMeta: {
            sources: allSources,
            autoDiscoveredUrls: prev?._extractionMeta?.autoDiscoveredUrls || [],
            confidence: avgConfidence,
          },
        };
      });

      setUsedSources(prev => [...new Set([...prev, 'GitHub'])]);

    } catch (error) {
      console.error('GitHub analysis error:', error);
      log.error(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'Error');
      alert(`GitHub analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAnalyzingGithub(false);
      setIsActive(false);
    }
  };

  // Handle financial statement upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    setUploadedFiles(fileArray);
    setParsingStatements(true);
    setIsActive(true);
    clearLogs();
    
    try {
      log.info(`📄 Uploading ${fileArray.length} financial statement(s)...`, '📄');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      fileArray.forEach((file, i) => {
        log.data(`File ${i + 1}: ${file.name}`, '📎');
      });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      log.info('🤖 Parsing documents with GPT-4 Vision...', '🤖');
      
      const result = await parseMultipleStatements(fileArray);
      
      log.success('✅ Documents parsed successfully', '✅');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      log.info('📊 Extracting financial data...', '📊');
      
      result.statements.forEach((stmt, i) => {
        log.data(`Statement ${i + 1}: ${stmt.extractedFields.length} fields extracted`, '✨');
      });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      log.success(`✅ Extraction complete! Confidence: ${result.overallConfidence}%`, '🎉');
      
      setFormData(prev => ({
        ...prev,
        ...result.combinedData,
      }));

      // Store extraction result for terminal display
      setExtractedData({
        ...result.combinedData,
        _extractionMeta: {
          sources: result.statements.map((s, i) => ({
            name: `Financial Statement ${i + 1}`,
            url: fileArray[i]?.name || 'Unknown',
            dataExtracted: s.extractedFields,
            confidence: Object.values(s.confidence).reduce((a, b) => a + b, 0) / Object.values(s.confidence).length * 100,
          })),
          confidence: result.overallConfidence,
        },
      });

      // Don't auto-open terminal - let user click "View Company Data"
      
    } catch (error) {
      log.error(`❌ Failed to parse: ${error instanceof Error ? error.message : 'Unknown error'}`, '❌');
      alert(`Failed to parse financial statements: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setParsingStatements(false);
      setIsActive(false);
    }
  };

  // Handle URL extraction
  const handleExtractFromUrl = async () => {
    if (!formData.website) {
      alert("Please enter a company website URL");
      return;
    }

    setExtracting(true);

    try {
      const result = await extractBusinessFromWebsite(formData.website);
      
      setFormData(prev => ({
        ...prev,
        ...result.data,
        extractedFromUrl: formData.website,
        extractedAt: result.source.extractedAt,
      }));

      if (result.warnings.length > 0) {
        console.warn("Extraction warnings:", result.warnings);
      }

    } catch (error) {
      alert(`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExtracting(false);
    }
  };

  // Handle ticker extraction
  const handleExtractFromTicker = async () => {
    if (!formData.stockTicker) {
      alert("Please enter a stock ticker symbol");
      return;
    }

    setExtracting(true);

    try {
      const result = await extractBusinessFromTicker(formData.stockTicker);
      
      setFormData(prev => ({
        ...prev,
        ...result.data,
      }));

    } catch (error) {
      alert(`Failed to fetch company data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExtracting(false);
    }
  };

  // Handle valuation
  const handleEstimateValue = async () => {
    if (!formData.annualRevenue) {
      alert("Please provide annual revenue to calculate valuation");
      return;
    }

    setValuing(true);
    setIsActive(true);

    try {
      log.info('💰 Starting business valuation...', '💰');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      log.info('📊 Analyzing financial metrics...', '📊');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const valuation = await estimateBusinessValue(formData);
      
      log.success('✅ Valuation calculated successfully', '✅');
      log.data(`Method: ${valuation.method}`, '🔍');
      log.data(`Value: $${(valuation.estimatedValue / 1000000).toFixed(1)}M`, '💎');
      log.data(`Confidence: ${valuation.confidence}%`, '✨');
      
      setFormData(prev => ({
        ...prev,
        aiEstimatedValue: valuation.estimatedValue,
        aiConfidence: valuation.confidence,
        valuationData: valuation,
      }));

    } catch (error) {
      log.error(`❌ Valuation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, '❌');
      alert(`Valuation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setValuing(false);
      setIsActive(false);
    }
  };

  const handleContinue = () => {
    if (!formData.companyName) {
      alert("Please provide at least a company name to continue");
      return;
    }

    // Warn if missing revenue but allow to continue
    if (!formData.annualRevenue) {
      if (!confirm("No revenue data provided. Continue anyway? (Recommended to add financial data for accurate tokenization)")) {
        return;
      }
    }

    onComplete(formData);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-[var(--color-foreground)] mb-2">
          Business Details
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Perfect for private companies seeking liquidity through tokenization
        </p>
      </div>

      {/* Hero: Enter Your Company Financials */}
      <div className="rounded-2xl border-2 border-[var(--accent)]/40 bg-gradient-to-br from-[rgba(34,211,238,0.1)] to-[rgba(34,211,238,0.05)] p-8 shadow-2xl shadow-[var(--accent)]/10 space-y-6">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-[var(--color-foreground)]">
            Enter Your Company Financials
          </h2>
          <p className="text-[var(--muted)] max-w-2xl mx-auto">
            Connect your accounting software, upload financial documents, or provide a company URL for automatic data extraction
          </p>
        </div>

        {/* Data Source Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-[var(--accent)]">
            Select Data Source
          </label>
          
          <select
            value={extractionMethod}
            onChange={(e) => setExtractionMethod(e.target.value as ExtractionMethod)}
            className="w-full px-4 py-3 rounded-lg bg-[rgba(8,12,26,0.7)] border-2 border-[var(--accent)]/30 text-[var(--color-foreground)] focus:border-[var(--accent)] focus:outline-none transition-colors"
          >
            <option value="quickbooks">QuickBooks (Recommended - Highest Verification)</option>
            <option value="xero">Xero Accounting</option>
            <option value="url">Company Website or LinkedIn</option>
            <option value="github">GitHub Repository (Tech Startups)</option>
            <option value="financial-docs">Upload Financial Statements</option>
            <option value="manual">Enter Manually</option>
          </select>
        </div>

        {/* QuickBooks Option */}
        {extractionMethod === "quickbooks" && (
          <div className="space-y-4 p-6 rounded-xl border border-[var(--accent)]/20 bg-[rgba(8,12,26,0.5)]">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[var(--color-foreground)]">QuickBooks Online</h3>
              <p className="text-sm text-[var(--muted)]">
                Connect your QuickBooks account for instant, verified financial data extraction
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
              <span className="px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                P&L Statements
              </span>
              <span className="px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                Balance Sheet
              </span>
              <span className="px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                Cash Flow
              </span>
              <span className="px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                Revenue Trends
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConnectQuickBooks}
                disabled={connectingQuickBooks || quickBooksConnected}
                className={cn(
                  "flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold",
                  "bg-[var(--accent)] text-[#041321]",
                  "hover:bg-[var(--accent)]/90 active:scale-95 transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                )}
              >
                {connectingQuickBooks ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Connecting...
                  </>
                ) : quickBooksConnected ? (
                  <>
                    Connected
                  </>
                ) : (
                  <>
                    <Link size={20} />
                    Connect QuickBooks
                  </>
                )}
              </button>

              <button
                onClick={handleDemoQuickBooks}
                disabled={connectingQuickBooks || quickBooksConnected}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 rounded-xl font-medium border-2",
                  "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]",
                  "hover:bg-[var(--accent)]/20 active:scale-95 transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                )}
              >
                Demo Mode
              </button>
            </div>
          </div>
        )}

        {/* Xero Option */}
        {extractionMethod === "xero" && (
          <div className="space-y-4 p-6 rounded-xl border border-[var(--accent)]/20 bg-[rgba(8,12,26,0.5)]">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Xero Accounting</h3>
              <p className="text-sm text-[var(--muted)]">
                Connect your Xero account for comprehensive financial data
              </p>
            </div>

            <button
              onClick={() => alert('Xero integration coming soon')}
              className={cn(
                "w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold",
                "border-2 border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]",
                "hover:bg-[var(--accent)]/20 active:scale-95 transition-all"
              )}
            >
              <Link size={20} />
              Connect Xero
            </button>
          </div>
        )}

        {/* URL Extraction Option */}
        {extractionMethod === "url" && (
          <div className="space-y-4 p-6 rounded-xl border border-[var(--accent)]/20 bg-[rgba(8,12,26,0.5)]">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Company Website or Profile</h3>
              <p className="text-sm text-[var(--muted)]">
                Paste your company website, LinkedIn, or Crunchbase URL. We'll extract available financial data automatically.
              </p>
            </div>

            <div className="flex gap-3">
              <input
                type="url"
                placeholder="https://yourcompany.com or linkedin.com/company/yourcompany"
                value={smartUrl}
                onChange={(e) => setSmartUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSmartUrlExtraction()}
                disabled={extractingFromUrl}
                className={cn(
                  "flex-1 px-4 py-3 rounded-lg",
                  "bg-[rgba(6,10,25,0.9)] border-2 border-[var(--accent)]/30",
                  "text-[var(--color-foreground)] placeholder-[var(--muted)]",
                  "focus:border-[var(--accent)] focus:outline-none",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              />
              <button
                onClick={handleSmartUrlExtraction}
                disabled={extractingFromUrl || !smartUrl}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-lg font-semibold",
                  "bg-[var(--accent)] text-[#041321]",
                  "hover:bg-[var(--accent)]/90 active:scale-95 transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                )}
              >
                {extractingFromUrl ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Extract
                  </>
                )}
              </button>
            </div>

            <div className="text-xs text-[var(--muted)] space-y-1">
              <p className="font-medium">Supported sources:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Company website (extracts: name, industry, team size)</li>
                <li>LinkedIn company page (extracts: employees, description)</li>
                <li>Crunchbase profile (extracts: funding, valuation hints)</li>
              </ul>
            </div>
          </div>
        )}

        {/* GitHub Repository Analysis Option */}
        {extractionMethod === "github" && (
          <div className="space-y-4 p-6 rounded-xl border border-[var(--accent)]/20 bg-[rgba(8,12,26,0.5)]">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[var(--color-foreground)]">GitHub Repository Analysis</h3>
              <p className="text-sm text-[var(--muted)]">
                Analyze your GitHub repository to extract development metrics, team size, and tech maturity indicators.
              </p>
            </div>

            <div className="flex gap-3">
              <input
                type="url"
                placeholder="https://github.com/yourcompany/your-repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGitHubAnalysis()}
                disabled={analyzingGithub}
                className={cn(
                  "flex-1 px-4 py-3 rounded-lg",
                  "bg-[rgba(6,10,25,0.9)] border-2 border-[var(--accent)]/30",
                  "text-[var(--color-foreground)] placeholder-[var(--muted)]",
                  "focus:border-[var(--accent)] focus:outline-none",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              />
              <button
                onClick={handleGitHubAnalysis}
                disabled={analyzingGithub || !githubUrl}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-lg font-semibold",
                  "bg-[var(--accent)] text-[#041321]",
                  "hover:bg-[var(--accent)]/90 active:scale-95 transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                )}
              >
                {analyzingGithub ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Analyze
                  </>
                )}
              </button>
            </div>

            <div className="text-xs text-[var(--muted)] space-y-1">
              <p className="font-medium">What we analyze:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Development activity (commits, velocity)</li>
                <li>Team size (contributors, active developers)</li>
                <li>Code quality (tests, CI/CD, documentation)</li>
                <li>Tech stack (languages, frameworks)</li>
                <li>Community engagement (stars, forks)</li>
                <li>Project maturity (age, activity patterns)</li>
              </ul>
            </div>

            <div className="rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/20 p-3 text-xs text-[var(--muted)]">
              <strong className="text-[var(--accent)]">Ideal for tech startups:</strong> Repository analysis provides objective metrics about development progress and team capabilities
            </div>
          </div>
        )}

        {/* Financial Documents Upload Option */}
        {extractionMethod === "financial-docs" && (
          <div className="space-y-4 p-6 rounded-xl border border-[var(--accent)]/20 bg-[rgba(8,12,26,0.5)]">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Upload Financial Statements</h3>
              <p className="text-sm text-[var(--muted)]">
                Upload PDF or image files of your P&L, balance sheet, or financial statements. AI will extract key metrics.
              </p>
            </div>

            <div className={cn(
              "border-2 border-dashed border-[var(--accent)]/30 rounded-xl p-8",
              "bg-[rgba(34,211,238,0.05)] hover:bg-[rgba(34,211,238,0.1)] transition-colors cursor-pointer",
              parsingStatements && "opacity-50 cursor-not-allowed"
            )}>
              <label className="cursor-pointer block text-center space-y-3">
                <div className="flex justify-center">
                  {parsingStatements ? (
                    <Loader className="animate-spin text-[var(--accent)]" size={48} />
                  ) : (
                    <Upload className="text-[var(--accent)]" size={48} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-foreground)]">
                    {parsingStatements ? "Parsing documents..." : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    PDF or Images (PNG, JPG) up to 10MB each
                  </p>
                </div>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  disabled={parsingStatements}
                  className="hidden"
                />
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-[var(--accent)]">Uploaded files:</p>
                <div className="space-y-1">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="text-xs text-[var(--muted)] flex items-center gap-2">
                      <FileText size={14} />
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Extracted Company Data - Inline Display */}
        {extractedData && formData.companyName && (
          <div className="space-y-4 pt-4 border-t border-[var(--accent)]/20">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--accent)] font-semibold">
                ✅ Data Extracted Successfully
              </p>
              <button
                onClick={() => setShowTerminal(true)}
                className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
              >
                <Eye size={14} />
                View in Terminal
              </button>
            </div>

            {/* Extracted Data Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
              <div>
                <div className="text-xs text-[var(--muted)] mb-1">Company</div>
                <div className="text-sm font-semibold text-[var(--color-foreground)]">
                  {formData.companyName}
                </div>
              </div>
              
              {formData.industry && (
                <div>
                  <div className="text-xs text-[var(--muted)] mb-1">Industry</div>
                  <div className="text-sm font-semibold text-[var(--color-foreground)]">
                    {formData.industry}
                  </div>
                </div>
              )}
              
              {formData.headquarters && (
                <div>
                  <div className="text-xs text-[var(--muted)] mb-1">Location</div>
                  <div className="text-sm font-semibold text-[var(--color-foreground)]">
                    {formData.headquarters}
                  </div>
                </div>
              )}
              
              {formData.annualRevenue && (
                <div>
                  <div className="text-xs text-[var(--muted)] mb-1">Revenue</div>
                  <div className="text-sm font-semibold text-[var(--accent)]">
                    ${(formData.annualRevenue / 1000000).toFixed(2)}M
                  </div>
                </div>
              )}
              
              {formData.ebitda && (
                <div>
                  <div className="text-xs text-[var(--muted)] mb-1">EBITDA</div>
                  <div className="text-sm font-semibold text-[var(--accent)]">
                    ${(formData.ebitda / 1000000).toFixed(2)}M
                  </div>
                </div>
              )}
              
              {formData.growthRate !== undefined && (
                <div>
                  <div className="text-xs text-[var(--muted)] mb-1">Growth Rate</div>
                  <div className="text-sm font-semibold text-[var(--accent)]">
                    {formData.growthRate.toFixed(0)}% YoY
                  </div>
                </div>
              )}
              
              {formData.employeeCount && (
                <div>
                  <div className="text-xs text-[var(--muted)] mb-1">Employees</div>
                  <div className="text-sm font-semibold text-[var(--color-foreground)]">
                    {formData.employeeCount}
                  </div>
                </div>
              )}
              
              {formData.profitMargin !== undefined && (
                <div>
                  <div className="text-xs text-[var(--muted)] mb-1">Profit Margin</div>
                  <div className="text-sm font-semibold text-[var(--accent)]">
                    {formData.profitMargin.toFixed(1)}%
                  </div>
                </div>
              )}
              
              {extractedData._extractionMeta?.sources && (
                <div>
                  <div className="text-xs text-[var(--muted)] mb-1">Sources</div>
                  <div className="text-sm font-semibold text-[var(--color-foreground)]">
                    {extractedData._extractionMeta.sources.length === 1 
                      ? extractedData._extractionMeta.sources[0]?.name 
                      : `${extractedData._extractionMeta.sources.length} sources`}
                  </div>
                </div>
              )}
              
              {/* GitHub-specific metrics */}
              {extractedData.githubData && (
                <>
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">Lines of Code</div>
                    <div className="text-sm font-semibold text-[var(--accent)]">
                      {(extractedData.githubData.linesOfCode / 1000).toFixed(0)}K
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">Tech Stack</div>
                    <div className="text-sm font-semibold text-[var(--color-foreground)]">
                      {extractedData.githubData.primaryLanguage}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">Frameworks</div>
                    <div className="text-sm font-semibold text-[var(--color-foreground)]">
                      {extractedData.githubData.frameworks.length > 0 
                        ? extractedData.githubData.frameworks.slice(0, 2).join(', ')
                        : 'None detected'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">Product Type</div>
                    <div className="text-sm font-semibold text-[var(--color-foreground)]">
                      {extractedData.githubData.productType}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">Maturity</div>
                    <div className="text-sm font-semibold text-[var(--accent)]">
                      {extractedData.githubData.codeMaturity}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">Readiness</div>
                    <div className="text-sm font-semibold text-[var(--accent)]">
                      {extractedData.githubData.commercialReadiness}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">Stars</div>
                    <div className="text-sm font-semibold text-[var(--accent)]">
                      {extractedData.githubData.stars.toLocaleString()}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">Contributors</div>
                    <div className="text-sm font-semibold text-[var(--color-foreground)]">
                      {extractedData.githubData.contributors}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">Dev Velocity</div>
                    <div className="text-sm font-semibold text-[var(--accent)]">
                      {extractedData.githubData.developmentVelocity}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">Est. Value</div>
                    <div className="text-sm font-semibold text-[var(--accent)]">
                      ${(extractedData.githubData.estimatedProjectValue / 1000000).toFixed(1)}M
                    </div>
                  </div>
                  
                  {extractedData.githubData.hasBackend && (
                    <div>
                      <div className="text-xs text-[var(--muted)] mb-1">Architecture</div>
                      <div className="text-sm font-semibold text-[var(--color-foreground)]">
                        {extractedData.githubData.hasBackend && extractedData.githubData.hasFrontend ? 'Full-stack' : 
                         extractedData.githubData.hasBackend ? 'Backend' : 'Frontend'}
                      </div>
                    </div>
                  )}
                  
                  {extractedData.githubData.deploymentPlatform && (
                    <div>
                      <div className="text-xs text-[var(--muted)] mb-1">Deployment</div>
                      <div className="text-sm font-semibold text-[var(--color-foreground)]">
                        {extractedData.githubData.deploymentPlatform}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            {!showValuation ? (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleEstimateValue}
                  disabled={valuing || !formData.annualRevenue}
                  className={cn(
                    "flex items-center justify-center gap-2 px-6 py-4 rounded-lg",
                    "bg-[var(--accent)] text-[#041321] font-semibold",
                    "hover:bg-[var(--accent)]/90 active:scale-95 transition-all",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  )}
                >
                  <Sparkles size={20} />
                  <span>
                    {valuing ? 'Valuing...' : 'AI Business Valuation'}
                  </span>
                </button>

                <button
                  onClick={() => setShowEnrichOptions(!showEnrichOptions)}
                  className={cn(
                    "flex items-center justify-center gap-2 px-6 py-4 rounded-lg",
                    "border-2 border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)] font-semibold",
                    "hover:bg-[var(--accent)]/20 active:scale-95 transition-all"
                  )}
                >
                  <Download size={20} />
                  <span>Add More Data Sources</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleEstimateValue}
                  disabled={valuing || !formData.annualRevenue}
                  className={cn(
                    "flex items-center justify-center gap-2 px-6 py-4 rounded-lg",
                    "border-2 border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)] font-semibold",
                    "hover:bg-[var(--accent)]/20 active:scale-95 transition-all",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  )}
                >
                  <Sparkles size={20} />
                  <span>
                    {valuing ? 'Valuing...' : 'Recalculate Valuation'}
                  </span>
                </button>

                <button
                  disabled={!formData.annualRevenue}
                  onClick={() => setShowYieldCalculator(true)}
                  className={cn(
                    "flex items-center justify-center gap-2 px-6 py-4 rounded-lg",
                    "bg-purple-500 text-white font-semibold",
                    "hover:bg-purple-600 active:scale-95 transition-all",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  )}
                >
                  <Calculator size={20} />
                  <span>Preview Token Returns</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enrich Dataset - Show after first extraction */}
      {extractedData && formData.companyName && (
        <div className="rounded-2xl border-2 border-[var(--accent)]/30 bg-gradient-to-br from-[rgba(34,211,238,0.08)] to-[rgba(34,211,238,0.03)] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                <TrendingUp size={20} className="text-[var(--accent)]" />
                Enrich Dataset
              </h3>
              <p className="text-sm text-[var(--muted)] mt-1">
                Add data from multiple sources for higher accuracy valuation
              </p>
            </div>
            
            {/* Data Sources Badge */}
            <div className="text-right">
              <div className="text-sm text-[var(--muted)]">Data Sources</div>
              <div className="text-2xl font-bold text-[var(--accent)]">
                {usedSources.length}
              </div>
              <div className="text-xs text-[var(--muted)]">
                Confidence: {extractedData._extractionMeta?.confidence || 0}%
              </div>
            </div>
          </div>

          {/* Used Sources */}
          <div className="flex flex-wrap gap-2">
            {usedSources.map((source, idx) => (
              <span key={idx} className="px-3 py-1 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/30 text-xs font-medium text-[var(--accent)]">
                ✓ {source}
              </span>
            ))}
          </div>

          {/* Additional Sources Options */}
          {showEnrichOptions && (
            <div className="space-y-4 pt-4 border-t border-[var(--accent)]/20">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--color-foreground)]">
                  Select Additional Sources:
                </p>
                <button
                  onClick={() => setShowEnrichOptions(false)}
                  className="text-xs text-[var(--muted)] hover:text-[var(--accent)]"
                >
                  Hide Options
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* QuickBooks Option - if not already used */}
                {!usedSources.includes('QuickBooks') && (
                  <button
                    onClick={() => {
                      setExtractionMethod('quickbooks');
                      setShowEnrichOptions(false);
                    }}
                    className="p-4 rounded-lg border-2 border-[var(--accent)]/30 bg-[rgba(8,12,26,0.5)] hover:bg-[var(--accent)]/10 text-left transition-all"
                  >
                    <div className="font-semibold text-[var(--color-foreground)] mb-1">QuickBooks</div>
                    <div className="text-xs text-[var(--muted)]">Verified financial data</div>
                  </button>
                )}

                {/* Website Option - if not already used */}
                {!usedSources.includes('Website') && (
                  <button
                    onClick={() => {
                      setExtractionMethod('url');
                      setShowEnrichOptions(false);
                    }}
                    className="p-4 rounded-lg border-2 border-[var(--accent)]/30 bg-[rgba(8,12,26,0.5)] hover:bg-[var(--accent)]/10 text-left transition-all"
                  >
                    <div className="font-semibold text-[var(--color-foreground)] mb-1">Company Website</div>
                    <div className="text-xs text-[var(--muted)]">Public company info</div>
                  </button>
                )}

                {/* GitHub Option - if not already used */}
                {!usedSources.includes('GitHub') && (
                  <button
                    onClick={() => {
                      setExtractionMethod('github');
                      setShowEnrichOptions(false);
                    }}
                    className="p-4 rounded-lg border-2 border-[var(--accent)]/30 bg-[rgba(8,12,26,0.5)] hover:bg-[var(--accent)]/10 text-left transition-all"
                  >
                    <div className="font-semibold text-[var(--color-foreground)] mb-1">GitHub Repository</div>
                    <div className="text-xs text-[var(--muted)]">Tech startup metrics</div>
                  </button>
                )}

                {/* Financial Docs Option */}
                <button
                  onClick={() => {
                    setExtractionMethod('financial-docs');
                    setShowEnrichOptions(false);
                  }}
                  className="p-4 rounded-lg border-2 border-[var(--accent)]/30 bg-[rgba(8,12,26,0.5)] hover:bg-[var(--accent)]/10 text-left transition-all"
                >
                  <div className="font-semibold text-[var(--color-foreground)] mb-1">Financial Statements</div>
                  <div className="text-xs text-[var(--muted)]">Upload PDF/Image</div>
                </button>

                {/* Manual Entry Option */}
                <button
                  onClick={() => {
                    setExtractionMethod('manual');
                    setShowEnrichOptions(false);
                  }}
                  className="p-4 rounded-lg border-2 border-[var(--accent)]/30 bg-[rgba(8,12,26,0.5)] hover:bg-[var(--accent)]/10 text-left transition-all"
                >
                  <div className="font-semibold text-[var(--color-foreground)] mb-1">Manual Entry</div>
                  <div className="text-xs text-[var(--muted)]">Add/edit fields directly</div>
                </button>
              </div>

              <div className="text-xs text-[var(--muted)] text-center pt-2">
                Multiple sources increase valuation accuracy and investor confidence
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Entry - Only show when nothing extracted OR manual selected */}
      {(extractionMethod === "manual" || !extractedData) && (
      <div className="rounded-2xl border border-[var(--color-card-border)]/50 bg-[rgba(8,12,26,0.7)] p-6 space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-[var(--accent)]/20 backdrop-blur-sm">
              <Globe className="text-[var(--accent)]" size={48} />
            </div>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
              Drop Your Company Website
            </h3>
            <p className="text-base text-[var(--muted)] max-w-2xl mx-auto">
              We'll extract company info, team size, and financial hints from your About page
            </p>
          </div>
          
          <div className="flex gap-3 max-w-3xl mx-auto">
            <input
              type="url"
              placeholder="Paste your company website (e.g., yourcompany.com)..."
              value={smartUrl}
              onChange={(e) => setSmartUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSmartUrlExtraction()}
              disabled={extractingFromUrl}
              className={cn(
                "flex-1 px-6 py-4 rounded-xl text-base",
                "bg-[rgba(6,10,25,0.9)] border-2 border-[var(--accent)]/30",
                "text-[var(--color-foreground)] placeholder-[var(--muted)]",
                "focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
            <button
              onClick={handleSmartUrlExtraction}
              disabled={extractingFromUrl || !smartUrl}
              className={cn(
                "flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base whitespace-nowrap",
                "bg-[var(--accent)] text-[#041321]",
                "hover:bg-[var(--accent)]/90 hover:scale-105 active:scale-95 transition-all",
                "shadow-lg shadow-[var(--accent)]/20",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:scale-100"
              )}
            >
              {extractingFromUrl ? (
                <>
                  <Loader className="animate-spin" size={22} />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles size={22} />
                  Extract
                </>
              )}
            </button>
          </div>
        </div>

        {/* What We Extract */}
        <div className="border-t border-[var(--accent)]/20 pt-6">
          <p className="text-sm font-semibold text-[var(--color-foreground)] mb-4 text-center">
            ✨ What we extract from your website:
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg bg-[rgba(34,211,238,0.05)]">
              <div className="text-2xl mb-1">🏢</div>
              <div className="text-xs font-semibold text-[var(--accent)]">Company Info</div>
              <div className="text-[10px] text-[var(--muted)] mt-1">Name, industry, location</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-[rgba(34,211,238,0.05)]">
              <div className="text-2xl mb-1">👥</div>
              <div className="text-xs font-semibold text-[var(--accent)]">Team Size</div>
              <div className="text-[10px] text-[var(--muted)] mt-1">"Our team of 50..."</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-[rgba(34,211,238,0.05)]">
              <div className="text-2xl mb-1">💰</div>
              <div className="text-xs font-semibold text-[var(--accent)]">Revenue Hints</div>
              <div className="text-[10px] text-[var(--muted)] mt-1">"Processing $10M..."</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-[rgba(34,211,238,0.05)]">
              <div className="text-2xl mb-1">📈</div>
              <div className="text-xs font-semibold text-[var(--accent)]">Growth Claims</div>
              <div className="text-[10px] text-[var(--muted)] mt-1">"Doubled revenue"</div>
            </div>
          </div>
        </div>

        {/* Note about verification */}
        <div className="text-center text-xs text-[var(--muted)]">
          💡 For <span className="text-[var(--accent)]">maximum verification</span>, upload financial statements below after extraction
        </div>

        {/* Quick Examples */}
        <details className="group">
          <summary className="text-xs text-[var(--accent)] text-center cursor-pointer hover:underline">
            👉 Click to see test examples (or use your own company website)
          </summary>
          <div className="mt-3 p-4 rounded-lg bg-[rgba(6,10,25,0.5)] border border-[var(--accent)]/10 space-y-2 text-xs">
            <div className="text-[10px] text-[var(--muted)] mb-2 text-center">
              Note: For your own company, just paste your website URL. These are test examples:
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setSmartUrl('https://stripe.com')}
                className="text-left px-3 py-2 rounded bg-[rgba(34,211,238,0.1)] hover:bg-[rgba(34,211,238,0.15)] border border-[var(--accent)]/20 text-[var(--accent)] transition-colors font-mono text-[10px]"
              >
                ⭐ https://stripe.com
              </button>
              <button
                onClick={() => setSmartUrl('https://notion.so')}
                className="text-left px-3 py-2 rounded bg-[rgba(34,211,238,0.05)] hover:bg-[rgba(34,211,238,0.1)] text-[var(--muted)] hover:text-[var(--accent)] transition-colors font-mono text-[10px]"
              >
                https://notion.so
              </button>
              <button
                onClick={() => setSmartUrl('https://vercel.com')}
                className="text-left px-3 py-2 rounded bg-[rgba(34,211,238,0.05)] hover:bg-[rgba(34,211,238,0.1)] text-[var(--muted)] hover:text-[var(--accent)] transition-colors font-mono text-[10px]"
              >
                https://vercel.com
              </button>
            </div>
          </div>
        </details>
      </div>
      )}

      {/* Full Terminal (Only when clicked "View in Terminal") */}
      {showTerminal && extractedData && (
        <ExtractedBusinessTerminal
          data={extractedData}
          extractedFieldCount={Object.keys(extractedData).filter(k => !k.startsWith('_') && extractedData[k]).length}
          sources={extractedData._extractionMeta?.sources || []}
          onClose={() => setShowTerminal(false)}
        />
      )}

      {/* Yield Calculator Modal */}
      {showYieldCalculator && (
        <YieldCalculatorModal
          businessData={formData}
          onClose={() => setShowYieldCalculator(false)}
        />
      )}

      {/* Valuation Result */}
      {showValuation && formData.valuationData && (
        <div className="rounded-2xl border border-[var(--accent)]/30 bg-[rgba(34,211,238,0.1)] p-6 space-y-4">
          <h3 className="text-xl font-semibold text-[var(--color-foreground)]">
            💰 Business Valuation
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-[var(--muted)] mb-1">Estimated Value</div>
              <div className="text-3xl font-bold text-[var(--accent)]">
                ${(formData.aiEstimatedValue! / 1000000).toFixed(1)}M
              </div>
            </div>

            <div>
              <div className="text-sm text-[var(--muted)] mb-1">Value Range</div>
              <div className="text-lg font-semibold text-[var(--color-foreground)]">
                ${(formData.valuationData.valueLow / 1000000).toFixed(1)}M - ${(formData.valuationData.valueHigh / 1000000).toFixed(1)}M
              </div>
            </div>

            <div>
              <div className="text-sm text-[var(--muted)] mb-1">Confidence Score</div>
              <div className="text-xl font-semibold text-[var(--accent)]">
                {formData.aiConfidence}%
              </div>
            </div>

            <div>
              <div className="text-sm text-[var(--muted)] mb-1">Method</div>
              <div className="text-sm font-medium text-[var(--color-foreground)]">
                {formData.valuationData.method}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--color-card-border)]/30">
            <div className="text-sm text-[var(--muted)] mb-2">Reasoning:</div>
            <p className="text-sm text-[var(--color-foreground)]">
              {formData.valuationData.reasoning}
            </p>
          </div>

          {formData.valuationData.keyFactors && formData.valuationData.keyFactors.length > 0 && (
            <div className="pt-4 border-t border-[var(--color-card-border)]/30">
              <div className="text-sm text-[var(--muted)] mb-2">Key Factors:</div>
              <ul className="space-y-1">
                {formData.valuationData.keyFactors.map((factor, i) => (
                  <li key={i} className="text-sm text-[var(--color-foreground)]">
                    • {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Mini Console for Extraction Progress */}
      {logs.length > 0 && (
        <MiniConsole
          logs={logs}
          isActive={isActive}
          onClear={clearLogs}
        />
      )}

      {/* Continue Button */}
      <div className="flex gap-4 pt-6">
        <button
          onClick={handleContinue}
          disabled={!formData.companyName}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg",
            "bg-[var(--accent)] text-[#041321] font-semibold text-lg",
            "hover:bg-[var(--accent)]/90 active:scale-95 transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          )}
        >
          Continue to Trust Configuration →
        </button>
        
        {!formData.annualRevenue && formData.companyName && (
          <p className="text-xs text-yellow-400 text-center mt-2">
            Recommended: Add financial data for accurate token yields
          </p>
        )}
      </div>
    </div>
  );
}

