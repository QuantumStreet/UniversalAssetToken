"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Home, Building2 } from "lucide-react";
import { useAssetType, type AssetType } from "@/contexts/asset-type-context";
import { cn } from "@/lib/utils";

export function AssetTypeDropdown() {
  const { assetType, setAssetType, assetTypeLabel } = useAssetType();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (type: AssetType) => {
    setAssetType(type);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-3xl font-semibold transition-all",
          "hover:bg-[rgba(34,211,238,0.1)] active:scale-95",
          "text-[var(--accent)] cursor-pointer",
          "border border-transparent hover:border-[var(--accent)]/30"
        )}
      >
        {assetTypeLabel}
        <ChevronDown
          size={28}
          className={cn(
            "transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute left-0 top-full mt-2 min-w-[250px] z-50",
            "rounded-xl border border-[var(--color-card-border)]/50",
            "bg-[rgba(8,12,26,0.95)] backdrop-blur-xl",
            "shadow-2xl shadow-[var(--accent)]/10",
            "overflow-hidden"
          )}
        >
          <div className="p-2 space-y-1">
            <button
              onClick={() => handleSelect("property")}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg",
                "transition-all text-left",
                assetType === "property"
                  ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                  : "text-[var(--color-foreground)] hover:bg-[rgba(34,211,238,0.1)]"
              )}
            >
              <Home size={20} />
              <div className="flex-1">
                <div className="font-semibold">Property</div>
                <div className="text-xs text-[var(--muted)]">
                  Real estate tokenization
                </div>
              </div>
              {assetType === "property" && (
                <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              )}
            </button>

            <button
              onClick={() => handleSelect("business")}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg",
                "transition-all text-left",
                assetType === "business"
                  ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                  : "text-[var(--color-foreground)] hover:bg-[rgba(34,211,238,0.1)]"
              )}
            >
              <Building2 size={20} />
              <div className="flex-1">
                <div className="font-semibold">Business</div>
                <div className="text-xs text-[var(--muted)]">
                  Company tokenization
                </div>
              </div>
              {assetType === "business" && (
                <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              )}
            </button>
          </div>

          <div className="border-t border-[var(--color-card-border)]/30 p-3 text-xs text-[var(--muted)]">
            {assetType === "property" ? (
              <p>
                ✓ Property extraction from Sotheby&apos;s/Zillow<br />
                ✓ Census data + AI valuation<br />
                ✓ Rental income distribution
              </p>
            ) : (
              <p>
                ✓ Financial data from SEC/FMP API<br />
                ✓ Multi-method AI valuation<br />
                ✓ Profit/cash flow distribution
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

