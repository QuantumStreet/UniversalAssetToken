"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type AssetType = "property" | "business";

type AssetTypeContextType = {
  assetType: AssetType;
  setAssetType: (type: AssetType) => void;
  assetTypeLabel: string;
};

const AssetTypeContext = createContext<AssetTypeContextType | undefined>(undefined);

export function AssetTypeProvider({ children }: { children: ReactNode }) {
  const [assetType, setAssetType] = useState<AssetType>("property");

  const assetTypeLabel = assetType === "property" ? "property" : "business";

  return (
    <AssetTypeContext.Provider value={{ assetType, setAssetType, assetTypeLabel }}>
      {children}
    </AssetTypeContext.Provider>
  );
}

export function useAssetType() {
  const context = useContext(AssetTypeContext);
  if (!context) {
    throw new Error("useAssetType must be used within AssetTypeProvider");
  }
  return context;
}

