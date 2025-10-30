"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { BlockchainOption } from "@/components/layout/blockchain-selector";

type BlockchainContextType = {
  blockchain: BlockchainOption;
  setBlockchain: (blockchain: BlockchainOption) => void;
};

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

export function BlockchainProvider({ children }: { children: ReactNode }) {
  const [blockchain, setBlockchain] = useState<BlockchainOption>({
    id: "solana-devnet",
    name: "Solana",
    network: "Devnet",
    color: "text-purple-400",
  });

  return (
    <BlockchainContext.Provider value={{ blockchain, setBlockchain }}>
      {children}
    </BlockchainContext.Provider>
  );
}

export function useBlockchain() {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error("useBlockchain must be used within BlockchainProvider");
  }
  return context;
}


