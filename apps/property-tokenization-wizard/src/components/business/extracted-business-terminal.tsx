"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import type { BusinessData } from "@/types/business";

type ExtractedBusinessTerminalProps = {
  data: BusinessData;
  extractedFieldCount: number;
  sources?: { name: string; url: string }[];
  onClose?: () => void;
};

export function ExtractedBusinessTerminal({ data, extractedFieldCount, sources = [], onClose }: ExtractedBusinessTerminalProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Auto-expand on first show
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  // Create terminal output text
  const createTerminalOutput = () => {
    const formatCurrency = (num?: number) => num ? `$${num.toLocaleString()}` : 'N/A';
    const formatNumber = (num?: number) => num ? num.toLocaleString() : 'N/A';
    const formatPercent = (num?: number) => num ? `${num.toFixed(1)}%` : 'N/A';
    
    let output = `
╔═══════════════════════════════════════════════════════════════════╗
║  BUSINESS DATA EXTRACTION SYSTEM v2.0 - ASSETRAIL PLATFORM     ║
║  COPYRIGHT (C) 1984 - ${extractedFieldCount} FIELDS EXTRACTED ${new Date().getFullYear().toString().slice(-2)}           ║
╚═══════════════════════════════════════════════════════════════════╝

> ANALYZING COMPANY DATA...
> CROSS-REFERENCING ${sources.length} SOURCE(S)...
> VALIDATING EXTRACTED FIELDS...

═══════════════════════════════════════════════════════════════════

  COMPANY INFORMATION
  
  NAME........................... ${(data.companyName || 'N/A').substring(0, 40).padEnd(40)}
  INDUSTRY....................... ${(data.industry || 'N/A').padEnd(40)}
  ${data.sector ? `SECTOR......................... ${data.sector.padEnd(40)}` : ''}
  HEADQUARTERS................... ${(data.headquarters || 'N/A').padEnd(40)}
  ${data.foundedYear ? `FOUNDED........................ ${data.foundedYear.toString().padEnd(40)}` : ''}
  ${data.website ? `WEBSITE........................ ${data.website.substring(0, 40).padEnd(40)}` : ''}

═══════════════════════════════════════════════════════════════════

  FINANCIAL METRICS
  
  ANNUAL REVENUE................. ${formatCurrency(data.annualRevenue).padEnd(40)}
  ${data.revenueRange ? `REVENUE RANGE.................. ${data.revenueRange.padEnd(40)}` : ''}
  ${data.ebitda ? `EBITDA......................... ${formatCurrency(data.ebitda).padEnd(40)}` : ''}
  ${data.netIncome ? `NET INCOME..................... ${formatCurrency(data.netIncome).padEnd(40)}` : ''}
  ${data.profitMargin ? `PROFIT MARGIN.................. ${formatPercent(data.profitMargin).padEnd(40)}` : ''}
  ${data.growthRate ? `GROWTH RATE (YOY).............. ${formatPercent(data.growthRate).padEnd(40)}` : ''}
  ${data.operatingCashFlow ? `OPERATING CASH FLOW............ ${formatCurrency(data.operatingCashFlow).padEnd(40)}` : ''}

${data.aiEstimatedValue ? `
═══════════════════════════════════════════════════════════════════

  AI VALUATION
  
  ESTIMATED VALUE................ ${formatCurrency(data.aiEstimatedValue).padEnd(40)}
  CONFIDENCE SCORE............... ${data.aiConfidence?.toFixed(0) || 'N/A'}%
  ${data.valuationData?.method ? `VALUATION METHOD............... ${data.valuationData.method.padEnd(40)}` : ''}
  ${data.valuationData?.valueLow && data.valuationData?.valueHigh ? `VALUE RANGE.................... ${formatCurrency(data.valuationData.valueLow)} - ${formatCurrency(data.valuationData.valueHigh)}` : ''}
` : ''}

═══════════════════════════════════════════════════════════════════

  COMPANY SIZE
  
  EMPLOYEES...................... ${formatNumber(data.employeeCount).padEnd(40)}
  ${data.employeeRange ? `EMPLOYEE RANGE................. ${data.employeeRange.padEnd(40)}` : ''}
  ${data.officeCount ? `OFFICE LOCATIONS............... ${formatNumber(data.officeCount).padEnd(40)}` : ''}

${data.fundingRaised || data.marketCap ? `
═══════════════════════════════════════════════════════════════════

  MARKET DATA
  
  ${data.fundingRaised ? `TOTAL FUNDING RAISED........... ${formatCurrency(data.fundingRaised).padEnd(40)}` : ''}
  ${data.marketCap ? `MARKET CAPITALIZATION.......... ${formatCurrency(data.marketCap).padEnd(40)}` : ''}
  ${data.stockTicker ? `STOCK TICKER................... ${data.stockTicker.padEnd(40)}` : ''}
  ${data.isPublic !== undefined ? `COMPANY TYPE................... ${(data.isPublic ? 'PUBLIC' : 'PRIVATE').padEnd(40)}` : ''}
` : ''}

${data.founders && data.founders.length > 0 ? `
═══════════════════════════════════════════════════════════════════

  LEADERSHIP
  
  ${data.founders.map((founder: string, idx: number) => 
    `FOUNDER ${(idx + 1).toString().padStart(2, '0')}.................... ${founder.substring(0, 40).padEnd(40)}`
  ).join('\n  ')}
  ${data.keyExecutives && data.keyExecutives.length > 0 ? data.keyExecutives.slice(0, 3).map((exec: string, idx: number) => 
    `EXECUTIVE ${(idx + 1).toString().padStart(2, '0')}................. ${exec.substring(0, 40).padEnd(40)}`
  ).join('\n  ') : ''}
` : ''}

${sources.length > 0 ? `
═══════════════════════════════════════════════════════════════════

  DATA SOURCES (${sources.length} TOTAL)
  
${sources.map((source, idx: number) => 
  `  ${(idx + 1).toString().padStart(2, '0')}. ${source.name.toUpperCase().padEnd(20)} ${source.url.substring(0, 40)}`
).join('\n')}
` : ''}

═══════════════════════════════════════════════════════════════════

> EXTRACTION COMPLETE
> ${extractedFieldCount} FIELDS VALIDATED
> ${sources.length} SOURCE(S) VERIFIED
> READY FOR TOKENIZATION

TYPE 'EDIT' TO MODIFY FIELDS OR 'CONTINUE' TO PROCEED_
`;
    return output;
  };

  // Typewriter effect
  useEffect(() => {
    if (!isExpanded) {
      setDisplayedText("");
      setIsTyping(false);
      return;
    }

    const fullText = createTerminalOutput();
    setIsTyping(true);
    setDisplayedText("");
    
    let currentIndex = 0;
    const typingSpeed = 2;
    
    const interval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.substring(0, currentIndex + typingSpeed));
        currentIndex += typingSpeed;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [isExpanded]);

  // Blinking cursor effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);

    return () => clearInterval(cursorInterval);
  }, []);

  // Full CRT terminal (always expanded when shown)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border-4 border-gray-700 shadow-2xl" style={{
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
        boxShadow: '0 0 60px rgba(34, 197, 94, 0.3), inset 0 0 100px rgba(0, 0, 0, 0.8)',
      }}>
        {/* CRT Screen effects */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }} />
        
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34, 197, 94, 0.05) 2px, rgba(34, 197, 94, 0.05) 4px)',
          animation: 'scanlines 8s linear infinite',
        }} />

        {/* Header */}
        <div className="relative bg-gray-900/50 border-b-2 border-green-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono text-green-400 text-sm tracking-wider">
              BUSINESS DATA TERMINAL - ACTIVE
            </span>
          </div>
          <button
            onClick={() => onClose?.()}
            className="p-2 rounded-lg hover:bg-green-500/10 text-green-500 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Terminal Content */}
        <div className="relative overflow-y-auto max-h-[calc(90vh-80px)] p-8" style={{
          background: '#000a00',
        }}>
          <pre className="font-mono text-sm leading-relaxed text-green-400 whitespace-pre-wrap" style={{
            textShadow: '0 0 10px rgba(34, 197, 94, 0.8), 0 0 20px rgba(34, 197, 94, 0.4)',
            fontFamily: '"Courier New", Courier, monospace',
          }}>
            {displayedText}
            {isTyping && showCursor && <span className="inline-block w-2 h-4 bg-green-400 ml-1 animate-pulse" />}
          </pre>
        </div>

        {/* Footer */}
        <div className="relative bg-gray-900/50 border-t-2 border-green-500/30 p-4 flex items-center justify-between">
          <span className="font-mono text-green-500 text-xs">
            READY • {isTyping ? 'LOADING...' : 'DATA COMPLETE'}
          </span>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 font-mono text-sm transition"
          >
            <ChevronUp className="h-4 w-4" />
            CLOSE TERMINAL
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scanlines {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }
      `}</style>
    </div>
  );
}

