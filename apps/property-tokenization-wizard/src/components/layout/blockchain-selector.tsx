"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type BlockchainOption = {
  id: string;
  name: string;
  network: string;
  logo?: string;
  color: string;
};

const BLOCKCHAIN_OPTIONS: BlockchainOption[] = [
  {
    id: "solana-devnet",
    name: "Solana",
    network: "Devnet",
    color: "text-purple-400",
  },
  {
    id: "solana-mainnet",
    name: "Solana",
    network: "Mainnet",
    color: "text-purple-400",
  },
  {
    id: "ethereum-sepolia",
    name: "Ethereum",
    network: "Sepolia",
    color: "text-blue-400",
  },
  {
    id: "ethereum-mainnet",
    name: "Ethereum",
    network: "Mainnet",
    color: "text-blue-400",
  },
  {
    id: "radix-stokenet",
    name: "Radix",
    network: "Stokenet",
    color: "text-cyan-400",
  },
  {
    id: "radix-mainnet",
    name: "Radix",
    network: "Mainnet",
    color: "text-cyan-400",
  },
];

type BlockchainSelectorProps = {
  value?: string;
  onChange?: (blockchain: BlockchainOption) => void;
};

export function BlockchainSelector({ value, onChange }: BlockchainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<BlockchainOption>(
    BLOCKCHAIN_OPTIONS.find(opt => opt.id === value) || BLOCKCHAIN_OPTIONS[0]
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen]);

  const handleSelect = (option: BlockchainOption) => {
    setSelected(option);
    setIsOpen(false);
    onChange?.(option);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-full border border-[var(--accent-soft)] bg-[var(--accent-soft)] px-3 py-1 text-xs uppercase tracking-wide text-[var(--accent)]",
          "transition-opacity hover:opacity-80"
        )}
      >
        {selected.name} {selected.network}
      </button>

      {/* Dropdown Menu - Portaled to body to escape overflow */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed w-56 z-[9999]"
          style={{ top: `${dropdownPosition.top}px`, right: `${dropdownPosition.right}px` }}
        >
          <div className="rounded-xl border border-[var(--accent)]/30 bg-[rgba(6,11,26,0.95)] backdrop-blur-xl shadow-2xl shadow-[var(--accent)]/20 overflow-hidden">
            {/* Header */}
            <div className="border-b border-[var(--accent)]/20 px-4 py-2">
              <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--muted)]">
                Select Network
              </p>
            </div>

            {/* Options */}
            <div className="max-h-80 overflow-y-auto">
              {BLOCKCHAIN_OPTIONS.map((option) => {
                const isSelected = option.id === selected.id;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 transition-colors",
                      "hover:bg-[var(--accent)]/10",
                      isSelected && "bg-[var(--accent)]/5"
                    )}
                  >
                    <div className="flex flex-col items-start">
                      <span className={cn("font-semibold text-sm", option.color)}>
                        {option.name}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {option.network}
                      </span>
                    </div>
                    
                    {isSelected && (
                      <Check className="h-4 w-4 text-[var(--accent)]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--accent)]/20 px-4 py-2">
              <p className="text-[10px] text-[var(--muted)]">
                {selected.network === 'Mainnet' ? '🔴 Live network' : '🟢 Test network'}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// Export the options for use in other components
export { BLOCKCHAIN_OPTIONS };

