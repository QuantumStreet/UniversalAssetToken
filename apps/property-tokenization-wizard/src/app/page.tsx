"use client";

import { useMemo, useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { WizardShell } from "@/components/wizard/wizard-shell";
import { PropertyDetailsStep } from "@/components/steps/property-details-step";
import { BusinessDetailsStep } from "@/components/steps/business-details-step";
import { TrustConfigurationStep } from "@/components/steps/trust-configuration-step";
import { MetadataConfigurationStep } from "@/components/steps/metadata-configuration-step";
import { NFTMintingStep } from "@/components/steps/nft-minting-step";
import { DATIntegrationStep } from "@/components/steps/dat-integration-step";
import { CompleteSummaryStep } from "@/components/steps/complete-summary-step";
import { BlockchainProvider, useBlockchain } from "@/contexts/blockchain-context";
import { AssetTypeProvider, useAssetType } from "@/contexts/asset-type-context";
import { AssetTypeDropdown } from "@/components/ui/asset-type-dropdown";
import { cn } from "@/lib/utils";
import type { WizardData, WizardStep } from "@/types/wizard";
import type { BusinessData } from "@/types/business";

const PROPERTY_WIZARD_STEPS: WizardStep[] = [
  {
    id: "property",
    title: "Property Details",
    description: "Upload images and enter property information with AI valuation.",
  },
  {
    id: "trust",
    title: "Trust Configuration",
    description: "Configure Wyoming Trust parameters with AI optimization.",
  },
  {
    id: "metadata",
    title: "UAT Metadata",
    description: "Generate Universal Asset Token metadata and upload to IPFS.",
  },
  {
    id: "mint",
    title: "Mint Tokens",
    description: "Mint property tokens from UAT factory contract.",
  },
  {
    id: "treasury",
    title: "DAT Integration",
    description: "Add tokens to Digital Asset Treasury for enhanced yields.",
  },
  {
    id: "complete",
    title: "Complete",
    description: "Review your tokenized property and access all resources.",
  },
];

const BUSINESS_WIZARD_STEPS: WizardStep[] = [
  {
    id: "business",
    title: "Business Details",
    description: "Extract company data from website, SEC filings, or enter manually.",
  },
  {
    id: "trust",
    title: "Trust Configuration",
    description: "Configure trust parameters for business tokenization.",
  },
  {
    id: "metadata",
    title: "UAT Metadata",
    description: "Generate Universal Asset Token metadata and upload to IPFS.",
  },
  {
    id: "mint",
    title: "Mint Tokens",
    description: "Mint business tokens from UAT factory contract.",
  },
  {
    id: "treasury",
    title: "DAT Integration",
    description: "Add tokens to Digital Asset Treasury for enhanced yields.",
  },
  {
    id: "complete",
    title: "Complete",
    description: "Review your tokenized business and access all resources.",
  },
];

function WizardContent() {
  const { blockchain } = useBlockchain();
  const { assetType } = useAssetType();
  const wizardSteps = assetType === "property" ? PROPERTY_WIZARD_STEPS : BUSINESS_WIZARD_STEPS;
  const [activeStep, setActiveStep] = useState<string>(wizardSteps[0]?.id ?? "property");
  const [wizardData, setWizardData] = useState<WizardData & { business?: BusinessData }>({});
  const [statusState, setStatusState] = useState<"idle" | "ready">("idle");

  // Reset to first step when asset type changes
  useEffect(() => {
    const firstStepId = assetType === "property" ? "property" : "business";
    setActiveStep(firstStepId);
  }, [assetType]);

  const updateWizardData = (step: string, data: any) => {
    setWizardData((prev) => ({ ...prev, [step]: data }));
  };

  const handleStepComplete = (step: string, data: any) => {
    updateWizardData(step, data);
    
    // Auto-advance to next step
    const currentIndex = wizardSteps.findIndex((s) => s.id === step);
    if (currentIndex < wizardSteps.length - 1) {
      setActiveStep(wizardSteps[currentIndex + 1].id);
    }
  };

  // Auto-save partial data (for step navigation without clicking Continue)
  const handlePartialUpdate = (step: string, data: any) => {
    updateWizardData(step, data);
  };

  const handleStepBack = (step: string) => {
    const currentIndex = wizardSteps.findIndex((s) => s.id === step);
    if (currentIndex > 0) {
      setActiveStep(wizardSteps[currentIndex - 1].id);
    }
  };

  const isStepReady = useMemo(() => {
    return wizardData.contract && wizardData.deployment && wizardData.nfts;
  }, [wizardData]);

  const renderSessionSummary = (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-card-border)]/50 bg-[rgba(8,12,26,0.7)] px-4 py-3 text-[11px] text-[var(--muted)]">
      <span className="text-[9px] uppercase tracking-[0.4em] text-[var(--muted)]">Session Summary</span>
      {assetType === "property" && wizardData.property && (
        <div className="flex items-center gap-3">
          <span className="text-[var(--accent)] text-xs font-semibold">Property</span>
          <span>{wizardData.property.propertyAddress || "Not set"}</span>
        </div>
      )}
      {assetType === "business" && wizardData.business && (
        <div className="flex items-center gap-3">
          <span className="text-[var(--accent)] text-xs font-semibold">Business</span>
          <span>{wizardData.business.companyName || "Not set"}</span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <span className="text-[var(--accent)] text-xs font-semibold">Blockchain</span>
        <span>{blockchain.name} {blockchain.network}</span>
      </div>
      {wizardData.deployment && (
        <div className="flex items-center gap-3">
          <span className="text-[var(--accent)] text-xs font-semibold">Status</span>
          <span className="text-green-400">Deployed ✓</span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <span className="text-[var(--accent)] text-xs font-semibold">Progress</span>
        <span>{wizardSteps.findIndex((s) => s.id === activeStep) + 1} of {wizardSteps.length}</span>
      </div>
    </div>
  );

  return (
    <AppLayout
      sidebar={null}
      footer={
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-card-border)]/40 bg-[rgba(7,10,26,0.75)] p-6 text-center text-sm text-[var(--muted)] md:flex-row md:justify-between md:text-left">
          <div>
            <p className="text-[var(--color-foreground)]">AssetRail Property Tokenization</p>
            <p>Powered by Smart Contract Generator API • Multi-chain deployment</p>
          </div>
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Wyoming Trust • DAT Enhanced</p>
        </div>
      }
    >
      <section id="wizard" className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-[var(--muted)]">Property Tokenization</p>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <h2 className="mt-2 text-3xl font-semibold text-[var(--color-foreground)] flex items-center gap-2 flex-wrap">
                Tokenize your <AssetTypeDropdown /> with AI-powered smart contracts
              </h2>
              <span
                className={cn(
                  "mt-2 h-fit rounded-full border px-3 py-1 text-xs uppercase tracking-[0.4em]",
                  statusState === "ready" && isStepReady
                    ? "border-[var(--color-positive)]/60 bg-[rgba(20,118,96,0.25)] text-[var(--color-positive)]"
                    : "border-[var(--negative)]/60 bg-[rgba(120,35,50,0.2)] text-[var(--negative)]"
                )}
              >
                {statusState === "ready" && isStepReady ? "Ready To Complete" : "In Progress"}
              </span>
            </div>
            {renderSessionSummary}
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--muted)]">
            {assetType === "property" 
              ? "Complete property tokenization in 6 steps: Property details → Trust configuration → UAT metadata generation → Token minting → DAT treasury integration → Complete. Powered by Universal Asset Token (UAT) standard with AI-enhanced data extraction."
              : "Complete business tokenization in 6 steps: Business details → Trust configuration → UAT metadata generation → Token minting → DAT treasury integration → Complete. Extract financial data from SEC filings, company websites, or manual entry with multi-method AI valuation."
            }
          </p>
        </div>
        
        <WizardShell steps={wizardSteps} activeStep={activeStep} onStepChange={setActiveStep}>
          {activeStep === "property" ? (
            <PropertyDetailsStep
              data={wizardData.property}
              onComplete={(data) => handleStepComplete("property", data)}
              onPartialUpdate={(data) => handlePartialUpdate("property", data)}
            />
          ) : null}
          
          {activeStep === "business" ? (
            <BusinessDetailsStep
              data={wizardData.business}
              onComplete={(data) => handleStepComplete("business", data)}
              onPartialUpdate={(data) => handlePartialUpdate("business", data)}
            />
          ) : null}
          
          {activeStep === "trust" ? (
            <TrustConfigurationStep
              propertyData={assetType === "property" ? wizardData.property : undefined}
              businessData={assetType === "business" ? wizardData.business : undefined}
              data={wizardData.trust}
              onComplete={(data) => handleStepComplete("trust", data)}
              onBack={() => handleStepBack("trust")}
            />
          ) : null}
          
          {activeStep === "metadata" ? (
            <MetadataConfigurationStep
              propertyData={wizardData.property}
              trustData={wizardData.trust}
              blockchain={blockchain}
              onComplete={(data) => handleStepComplete("metadata", data)}
              onBack={() => handleStepBack("metadata")}
            />
          ) : null}
          
          {activeStep === "mint" ? (
            <NFTMintingStep
              deploymentData={wizardData.metadata}
              propertyData={wizardData.property}
              trustData={wizardData.trust}
              data={wizardData.nfts}
              onComplete={(data) => handleStepComplete("mint", data)}
              onBack={() => handleStepBack("mint")}
            />
          ) : null}
          
          {activeStep === "treasury" ? (
            <DATIntegrationStep
              nftData={wizardData.nfts}
              deploymentData={wizardData.deployment}
              propertyData={wizardData.property}
              trustData={wizardData.trust}
              data={wizardData.treasury}
              onComplete={(data) => handleStepComplete("treasury", data)}
              onBack={() => handleStepBack("treasury")}
            />
          ) : null}
          
          {activeStep === "complete" ? (
            <CompleteSummaryStep
              wizardData={wizardData}
              onRestart={() => {
                setWizardData({});
                setActiveStep(WIZARD_STEPS[0].id);
                setStatusState("idle");
              }}
            />
          ) : null}
        </WizardShell>
      </section>
    </AppLayout>
  );
}

export default function PropertyTokenizationWizard() {
  return (
    <AssetTypeProvider>
      <BlockchainProvider>
        <WizardContent />
      </BlockchainProvider>
    </AssetTypeProvider>
  );
}
