"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

export type YieldCalculation = {
  tokenPrice: number;
  yieldPerToken: number;
  monthlyYield: number;
  annualReturn: number;
  distributionPool: number;
  reserveFund: number;
  trusteeFees: number;
};

type YieldCalculatorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  calculation: YieldCalculation;
  tokenSupply: number;
};

export function YieldCalculatorModal({ 
  isOpen, 
  onClose, 
  calculation,
  tokenSupply 
}: YieldCalculatorModalProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [showCursor, setShowCursor] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  // Calculate ROI projections over time
  const calculateProjections = () => {
    const years = [1, 5, 10, 20];
    return years.map(year => {
      const totalReturn = calculation.yieldPerToken * year;
      const roi = ((totalReturn / calculation.tokenPrice) * 100);
      const totalValue = calculation.tokenPrice + totalReturn;
      return { year, totalReturn, roi, totalValue };
    });
  };

  const projections = calculateProjections();

  // ASCII bar chart for ROI growth
  const createROIChart = () => {
    const maxROI = projections[projections.length - 1].roi;
    const chartHeight = 12;
    const chart: string[] = [];
    
    for (let i = chartHeight; i >= 0; i--) {
      let line = `${(((chartHeight - i) / chartHeight) * maxROI).toFixed(0).padStart(4)}% |`;
      projections.forEach(p => {
        const barHeight = Math.round((p.roi / maxROI) * chartHeight);
        if (barHeight >= i) {
          line += '  ####  ';
        } else {
          line += '        ';
        }
      });
      chart.push(line);
    }
    
    chart.push('     +' + '--------'.repeat(projections.length));
    chart.push('      ' + projections.map(p => `  ${p.year}yr  `).join(''));
    
    return chart.join('\n');
  };

  // Full terminal output
  const terminalOutput = `
╔═══════════════════════════════════════════════════════════════════╗
║  ASSET TOKENIZATION SYSTEM v1.0 - QUANTUM SECURITIES PLATFORM    ║
║  COPYRIGHT (C) 1984 - PROPERTY YIELD CALCULATOR INITIALIZED       ║
╚═══════════════════════════════════════════════════════════════════╝

> LOADING PROPERTY DATA...
> CALCULATING TOKEN ECONOMICS...
> PROJECTING YIELD SCENARIOS...

═══════════════════════════════════════════════════════════════════

  TOKEN SUPPLY ANALYSIS
  
  TOTAL TOKENS....................... ${tokenSupply.toLocaleString().padEnd(12)}
  TOKEN PRICE........................ $${calculation.tokenPrice.toFixed(2).padEnd(11)}
  TOTAL CAPITALIZATION............... $${(tokenSupply * calculation.tokenPrice).toLocaleString().padEnd(11)}

═══════════════════════════════════════════════════════════════════

  ANNUAL YIELD PER TOKEN
  
                    $${calculation.yieldPerToken.toFixed(2)}
  
  MONTHLY DISTRIBUTION............... $${calculation.monthlyYield.toFixed(2).padEnd(11)}
  ANNUAL RETURN RATE................. ${calculation.annualReturn.toFixed(2)}%
  
═══════════════════════════════════════════════════════════════════

  INCOME DISTRIBUTION WATERFALL
  
  GROSS RENTAL INCOME................ $${(calculation.distributionPool + calculation.reserveFund + calculation.trusteeFees).toLocaleString().padEnd(11)}
  
  TOKEN HOLDERS (90%)................ $${calculation.distributionPool.toLocaleString().padEnd(11)}
  [${'#'.repeat(Math.round(90 / 2))}${'-'.repeat(50 - Math.round(90 / 2))}]
  
  RESERVE FUND (10%)................. $${calculation.reserveFund.toLocaleString().padEnd(11)}
  [${'#'.repeat(Math.round(10 / 2))}${'-'.repeat(50 - Math.round(10 / 2))}]
  
  TRUSTEE FEES (1%).................. $${calculation.trusteeFees.toLocaleString().padEnd(11)}
  [${'#'.repeat(1)}${'-'.repeat(49)}]

═══════════════════════════════════════════════════════════════════

  ROI PROJECTION ANALYSIS (Cumulative Returns)
  
${createROIChart()}

═══════════════════════════════════════════════════════════════════

  PROJECTION TABLE - SINGLE TOKEN RETURNS
  
  YEAR    ANNUAL YIELD    CUMULATIVE      ROI         TOKEN VALUE
  ----    ------------    ----------      ---         -----------
  ${projections.map(p => 
    `${p.year.toString().padEnd(8)}$${calculation.yieldPerToken.toFixed(2).padEnd(16)}$${p.totalReturn.toFixed(2).padEnd(16)}${p.roi.toFixed(1)}%${' '.repeat(8)}$${p.totalValue.toFixed(2)}`
  ).join('\n  ')}

═══════════════════════════════════════════════════════════════════

  EXAMPLE INVESTMENT SCENARIOS
  
  TOKENS    INVESTMENT      YEAR 1 RETURN   YEAR 5 RETURN   YEAR 10 RETURN
  ------    ----------      -------------   -------------   --------------
  10        $${(10 * calculation.tokenPrice).toFixed(0).padEnd(14)}$${(10 * calculation.yieldPerToken).toFixed(0).padEnd(16)}$${(10 * calculation.yieldPerToken * 5).toFixed(0).padEnd(16)}$${(10 * calculation.yieldPerToken * 10).toFixed(0)}
  50        $${(50 * calculation.tokenPrice).toFixed(0).padEnd(14)}$${(50 * calculation.yieldPerToken).toFixed(0).padEnd(16)}$${(50 * calculation.yieldPerToken * 5).toFixed(0).padEnd(16)}$${(50 * calculation.yieldPerToken * 10).toFixed(0)}
  100       $${(100 * calculation.tokenPrice).toFixed(0).padEnd(14)}$${(100 * calculation.yieldPerToken).toFixed(0).padEnd(16)}$${(100 * calculation.yieldPerToken * 5).toFixed(0).padEnd(16)}$${(100 * calculation.yieldPerToken * 10).toFixed(0)}
  500       $${(500 * calculation.tokenPrice).toFixed(0).padEnd(14)}$${(500 * calculation.yieldPerToken).toFixed(0).padEnd(16)}$${(500 * calculation.yieldPerToken * 5).toFixed(0).padEnd(16)}$${(500 * calculation.yieldPerToken * 10).toFixed(0)}

═══════════════════════════════════════════════════════════════════

  SCENARIO ANALYSIS
  
  BEST CASE (100% OCCUPANCY)......... $${calculation.yieldPerToken.toFixed(2)}/token/year
  EXPECTED (95% OCCUPANCY)........... $${(calculation.yieldPerToken * 0.95).toFixed(2)}/token/year
  CONSERVATIVE (90% OCCUPANCY)....... $${(calculation.yieldPerToken * 0.90).toFixed(2)}/token/year
  WORST CASE (80% OCCUPANCY)......... $${(calculation.yieldPerToken * 0.80).toFixed(2)}/token/year

═══════════════════════════════════════════════════════════════════

  WARNING: INVESTMENT RISK DISCLOSURE
  
  PROJECTED YIELDS ARE ESTIMATES BASED ON CURRENT RENTAL INCOME.
  ACTUAL RETURNS MAY VARY DUE TO MARKET CONDITIONS, VACANCY RATES,
  MAINTENANCE COSTS, PROPERTY APPRECIATION, AND OTHER FACTORS.
  
  PAST PERFORMANCE DOES NOT GUARANTEE FUTURE RESULTS.
  THIS IS NOT FINANCIAL ADVICE. CONSULT A FINANCIAL ADVISOR.
  
═══════════════════════════════════════════════════════════════════

> CALCULATION COMPLETE
> READY_
`;

  // Typewriter effect
  useEffect(() => {
    if (!isOpen) {
      setDisplayedText("");
      setIsTyping(true);
      return;
    }

    let currentIndex = 0;
    const typingSpeed = 3; // Characters per frame (faster than 1 char at a time)

    const typeText = () => {
      if (currentIndex < terminalOutput.length) {
        setDisplayedText(terminalOutput.substring(0, currentIndex + typingSpeed));
        currentIndex += typingSpeed;
        requestAnimationFrame(typeText);
      } else {
        setIsTyping(false);
      }
    };

    // Start typing after a brief delay
    const timer = setTimeout(() => {
      typeText();
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, terminalOutput]);

  // Blinking cursor effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  // Auto-scroll to bottom as text types
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [displayedText]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 z-50"
        onClick={onClose}
      />
      
      {/* CRT Monitor Container */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl max-h-[90vh] z-50 p-4">
        <div className="relative">
          {/* CRT Bezel Effect */}
          <div className="rounded-3xl bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900 p-8 shadow-2xl">
            {/* Screen Glow */}
            <div className="absolute inset-8 bg-green-500/20 blur-2xl rounded-2xl" />
            
            {/* CRT Screen */}
            <div className="relative rounded-2xl overflow-hidden border-4 border-gray-900 shadow-inner" style={{
              boxShadow: 'inset 0 0 50px rgba(0, 255, 0, 0.1)',
              background: '#001a00'
            }}>
              {/* Scanlines overlay */}
              <div 
                className="absolute inset-0 pointer-events-none z-20"
                style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15) 0px, rgba(0, 0, 0, 0.15) 1px, transparent 1px, transparent 2px)',
                  animation: 'scanline 8s linear infinite'
                }}
              />
              
              {/* Screen flicker */}
              <div 
                className="absolute inset-0 pointer-events-none z-10 opacity-10"
                style={{
                  background: 'radial-gradient(circle, rgba(0, 255, 0, 0.1) 0%, transparent 70%)',
                  animation: 'flicker 0.15s infinite'
                }}
              />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-30 rounded p-2 bg-green-900/50 text-green-400 hover:bg-green-800/50 hover:text-green-300 transition border border-green-500/30"
                title="Close (ESC)"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Terminal Content */}
              <div 
                ref={contentRef}
                className="relative h-[75vh] overflow-y-auto p-8 font-mono text-sm text-green-400"
                style={{
                  textShadow: '0 0 5px rgba(0, 255, 0, 0.7), 0 0 10px rgba(0, 255, 0, 0.3)',
                  letterSpacing: '0.05em'
                }}
              >
                <pre className="whitespace-pre leading-relaxed">
{displayedText}
{isTyping && showCursor && <span className="inline-block w-2 h-4 bg-green-400 ml-1 animate-pulse" />}
                </pre>
              </div>

              {/* CRT curve effect */}
              <div 
                className="absolute inset-0 pointer-events-none z-20"
                style={{
                  background: 'radial-gradient(ellipse at center, transparent 0%, transparent 70%, rgba(0, 0, 0, 0.3) 100%)'
                }}
              />
            </div>

            {/* Power LED */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50 animate-pulse" />
              <span className="text-xs text-gray-400 font-mono">PWR</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scanline {
          0% { transform: translateY(0); }
          100% { transform: translateY(100%); }
        }
        
        @keyframes flicker {
          0% { opacity: 0.1; }
          50% { opacity: 0.15; }
          100% { opacity: 0.1; }
        }
      `}</style>
    </>
  );
}
