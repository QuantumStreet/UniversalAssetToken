"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";

type ExtractedDetailsTerminalProps = {
  data: any;
  extractedFieldCount: number;
};

export function ExtractedDetailsTerminal({ data, extractedFieldCount }: ExtractedDetailsTerminalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  // Create terminal output text
  const createTerminalOutput = () => {
    let output = `
╔═══════════════════════════════════════════════════════════════════╗
║  PROPERTY DATA EXTRACTION SYSTEM v1.0 - ASSETRAIL PLATFORM      ║
║  COPYRIGHT (C) 1984 - ${extractedFieldCount} FIELDS EXTRACTED ${new Date().getFullYear().toString().slice(-2)}           ║
╚═══════════════════════════════════════════════════════════════════╝

> PROCESSING LISTING DATA...
> PARSING PROPERTY ATTRIBUTES...
> VALIDATING EXTRACTED FIELDS...

═══════════════════════════════════════════════════════════════════

  LOCATION INFORMATION
  
  ADDRESS........................ ${(data.propertyAddress || 'N/A').substring(0, 40).padEnd(40)}
  CITY........................... ${(data.city || 'N/A').padEnd(40)}
  STATE.......................... ${(data.state || 'N/A').padEnd(40)}
  ZIP CODE....................... ${(data.zipCode || 'N/A').padEnd(40)}
  COUNTY......................... ${(data.county || 'N/A').padEnd(40)}

═══════════════════════════════════════════════════════════════════

  PROPERTY VALUATION
  
  LISTED PRICE................... $${(data.propertyValue || 0).toLocaleString().padEnd(38)}
  SQUARE FOOTAGE................. ${(data.totalSquareFootage || 0).toLocaleString().padEnd(29)} SQ FT
  LOT SIZE....................... ${(data.lotSize || 'N/A')} ${data.lotSizeUnit || 'ACRES'}
  PRICE PER SQ FT................ $${data.propertyValue && data.totalSquareFootage ? Math.round(data.propertyValue / data.totalSquareFootage).toLocaleString() : 'N/A'}

═══════════════════════════════════════════════════════════════════

  PROPERTY CHARACTERISTICS
  
  BEDROOMS....................... ${(data.bedrooms || 'N/A').toString().padEnd(40)}
  FULL BATHROOMS................. ${(data.bathroomsFull || 'N/A').toString().padEnd(40)}
  PARTIAL BATHROOMS.............. ${(data.bathroomsPartial || 'N/A').toString().padEnd(40)}
  YEAR BUILT..................... ${(data.yearBuilt || 'N/A').toString().padEnd(40)}
  ${data.yearRenovated ? `YEAR RENOVATED................. ${data.yearRenovated.toString().padEnd(40)}` : ''}

═══════════════════════════════════════════════════════════════════

  PROPERTY CLASSIFICATION
  
  PROPERTY TYPE.................. ${(data.propertyType || 'N/A').toUpperCase().replace(/_/g, ' ').padEnd(40)}
  ARCHITECTURAL STYLE............ ${(data.architecturalStyle || 'N/A').toUpperCase().padEnd(40)}
  OVERALL CONDITION.............. ${(data.overallCondition || 'N/A').toUpperCase().padEnd(40)}

═══════════════════════════════════════════════════════════════════

  BUILDING SYSTEMS
  
  PARKING SPACES................. ${(data.parkingSpaces || 'N/A').toString().padEnd(40)}
  PARKING TYPE................... ${(data.parkingType || 'N/A').toUpperCase().padEnd(40)}
  HVAC SYSTEM.................... ${(data.hvacType || 'N/A').toUpperCase().substring(0, 40).padEnd(40)}
  FIREPLACES..................... ${(data.fireplaces || 'N/A').toString().padEnd(40)}

${data.premiumAmenities && data.premiumAmenities.length > 0 ? `
═══════════════════════════════════════════════════════════════════

  PREMIUM AMENITIES (${data.premiumAmenities.length} TOTAL)
  
${data.premiumAmenities.map((amenity: string, idx: number) => 
  `  ${(idx + 1).toString().padStart(2, '0')}. ${amenity.toUpperCase().substring(0, 60)}`
).join('\n')}
` : ''}

${data.mlsNumber ? `
═══════════════════════════════════════════════════════════════════

  LISTING INFORMATION
  
  MLS NUMBER..................... ${data.mlsNumber.padEnd(40)}
  ${data.schoolDistrict ? `  SCHOOL DISTRICT................ ${data.schoolDistrict.substring(0, 40).padEnd(40)}` : ''}
` : ''}

${Array.isArray(data.propertyImages) && typeof data.propertyImages[0] === 'string' && data.propertyImages.length > 0 ? `
═══════════════════════════════════════════════════════════════════

  PROPERTY IMAGES (${data.propertyImages.length} TOTAL)
  
  ${(data.propertyImages as unknown as string[]).slice(0, 6).map((url: string, idx: number) => 
    `  ${(idx + 1).toString().padStart(2, '0')}. IMAGE_${idx + 1}.JPG - ${url.substring(0, 55)}...`
  ).join('\n')}
  ${(data.propertyImages as unknown as string[]).length > 6 ? `\n  ... AND ${(data.propertyImages as unknown as string[]).length - 6} MORE IMAGES` : ''}
` : ''}

═══════════════════════════════════════════════════════════════════

> EXTRACTION COMPLETE
> ${extractedFieldCount} FIELDS VALIDATED
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
    const typingSpeed = 2; // Characters per frame (faster than yield calculator)
    
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

  if (!isExpanded) {
    // Collapsed state - minimal button
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-900/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center font-mono text-green-400 text-sm">
              CRT
            </div>
            <div>
              <h4 className="text-lg font-semibold text-green-400 font-mono">EXTRACTED PROPERTY DATA</h4>
              <p className="text-xs text-green-500 font-mono">
                [{extractedFieldCount} FIELDS LOADED] • CLICK TO VIEW TERMINAL OUTPUT
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 font-mono text-sm transition"
          >
            <ChevronDown className="h-4 w-4" />
            VIEW DATA
          </button>
        </div>
      </div>
    );
  }

  // Expanded state - Full 1980s CRT terminal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border-4 border-gray-700 shadow-2xl" style={{
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
        boxShadow: '0 0 60px rgba(34, 197, 94, 0.3), inset 0 0 100px rgba(0, 0, 0, 0.8)',
      }}>
        {/* CRT Screen Bezel */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }} />
        
        {/* Scanlines */}
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34, 197, 94, 0.05) 2px, rgba(34, 197, 94, 0.05) 4px)',
          animation: 'scanlines 8s linear infinite',
        }} />

        {/* CRT Screen Flicker */}
        <div className="absolute inset-0 pointer-events-none opacity-10" style={{
          background: 'linear-gradient(transparent 50%, rgba(34, 197, 94, 0.1) 50%)',
          backgroundSize: '100% 4px',
          animation: 'flicker 0.15s infinite',
        }} />

        {/* Header */}
        <div className="relative bg-gray-900/50 border-b-2 border-green-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono text-green-400 text-sm tracking-wider">
              PROPERTY DATA TERMINAL - ACTIVE
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
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
          
          {/* Image Gallery (if images extracted) */}
          {!isTyping && Array.isArray(data.propertyImages) && typeof data.propertyImages[0] === 'string' && data.propertyImages.length > 0 && (
            <div className="mt-8 pt-8 border-t-2 border-green-500/30">
              <div className="font-mono text-green-400 text-sm mb-4" style={{
                textShadow: '0 0 10px rgba(34, 197, 94, 0.8)',
              }}>
                ═══ PROPERTY IMAGE GALLERY ({(data.propertyImages as unknown as string[]).length} IMAGES) ═══
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(data.propertyImages as unknown as string[]).slice(0, 6).map((imgUrl: string, idx: number) => (
                  <div
                    key={idx}
                    className="aspect-video rounded border-2 border-green-500/40 overflow-hidden bg-black/50"
                    style={{
                      boxShadow: '0 0 15px rgba(34, 197, 94, 0.3)',
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={`Property ${idx + 1}`}
                      className="w-full h-full object-cover opacity-90 hover:opacity-100 transition"
                      style={{
                        filter: 'sepia(0.2) contrast(1.1)',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="60"%3E%3Crect fill="%230a0a0a" width="100" height="60"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%2322c55e" font-family="monospace" font-size="8"%3EIMAGE ERROR%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                ))}
              </div>
              {(data.propertyImages as unknown as string[]).length > 6 && (
                <p className="font-mono text-green-500 text-xs mt-3" style={{
                  textShadow: '0 0 10px rgba(34, 197, 94, 0.6)',
                }}>
                  + {(data.propertyImages as unknown as string[]).length - 6} MORE IMAGES AVAILABLE
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer with collapse button */}
        <div className="relative bg-gray-900/50 border-t-2 border-green-500/30 p-4 flex items-center justify-between">
          <span className="font-mono text-green-500 text-xs">
            READY • {isTyping ? 'LOADING...' : 'DATA COMPLETE'}
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
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
        
        @keyframes flicker {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.08; }
        }
      `}</style>
    </div>
  );
}

