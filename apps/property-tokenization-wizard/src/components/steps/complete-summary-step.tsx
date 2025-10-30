"use client";

import { Button } from "@/components/ui/button";
import { WizardData } from "@/types/wizard";
import { CheckCircle, ExternalLink, Share2, Download, RefreshCw, Home, FileText, Image, Vault } from "lucide-react";
import { useAssetType } from "@/contexts/asset-type-context";

type CompleteSummaryStepProps = {
  wizardData: WizardData;
  onRestart: () => void;
};

export function CompleteSummaryStep({ wizardData, onRestart }: CompleteSummaryStepProps) {
  const { assetType } = useAssetType();
  
  const handleShare = () => {
    const assetInfo = assetType === "property" 
      ? `Property: ${wizardData.property?.propertyAddress}\nValue: $${wizardData.property?.propertyValue?.toLocaleString()}`
      : `Business: ${wizardData.business?.companyName}\nValue: $${wizardData.business?.aiEstimatedValue?.toLocaleString()}`;
    
    const summary = `
${assetType === "property" ? "Property" : "Business"} Tokenized! 🎉
${assetInfo}
Tokens: ${wizardData.trust?.tokenSupply?.toLocaleString()} ${wizardData.trust?.tokenSymbol}
Contract: ${wizardData.deployment?.contractAddress}
Enhanced Yield: ${wizardData.treasury?.enhancedYieldApy?.toFixed(2)}% APY
    `.trim();

    navigator.clipboard.writeText(summary);
    alert("Summary copied to clipboard!");
  };

  const handleDownloadReport = () => {
    const report = JSON.stringify(wizardData, null, 2);
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wizardData.trust?.trustName || (assetType === "property" ? 'property' : 'business')}-tokenization-report.json`;
    a.click();
  };

  return (
    <div className="space-y-8">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-500/20 p-6 border-4 border-green-500/30">
            <CheckCircle className="h-16 w-16 text-green-400" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-[var(--color-foreground)]">
          {assetType === "property" ? "Property" : "Business"} Successfully Tokenized!
        </h2>
        <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
          Your {assetType === "property" ? "property" : "business"} has been tokenized and integrated with a Digital Asset Treasury. 
          All contracts deployed and NFTs minted.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Asset Summary */}
        <div className="rounded-2xl border border-[var(--accent)]/30 bg-[rgba(34,211,238,0.08)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Home className="h-5 w-5 text-[var(--accent)]" />
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              {assetType === "property" ? "Property" : "Business"} Details
            </h3>
          </div>
          <div className="space-y-2 text-sm">
            {assetType === "property" ? (
              <>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Address:</span>
                  <span className="text-[var(--color-foreground)]">{wizardData.property?.propertyAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Value:</span>
                  <span className="text-[var(--accent)] font-semibold">${wizardData.property?.propertyValue?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Square Footage:</span>
                  <span className="text-[var(--color-foreground)]">{wizardData.property?.totalSquareFootage?.toLocaleString()} sq ft</span>
                </div>
                {wizardData.property?.netIncome && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Annual Income:</span>
                    <span className="text-green-400">${wizardData.property.netIncome.toLocaleString()}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Company:</span>
                  <span className="text-[var(--color-foreground)]">{wizardData.business?.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Valuation:</span>
                  <span className="text-[var(--accent)] font-semibold">${wizardData.business?.aiEstimatedValue?.toLocaleString()}</span>
                </div>
                {wizardData.business?.industry && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Industry:</span>
                    <span className="text-[var(--color-foreground)]">{wizardData.business.industry}</span>
                  </div>
                )}
                {wizardData.business?.annualRevenue && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">Annual Revenue:</span>
                    <span className="text-green-400">${wizardData.business.annualRevenue.toLocaleString()}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Trust Summary */}
        <div className="rounded-2xl border border-[var(--accent)]/30 bg-[rgba(34,211,238,0.08)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-[var(--accent)]" />
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Trust Configuration</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Trust Name:</span>
              <span className="text-[var(--color-foreground)]">{wizardData.trust?.trustName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Settlor:</span>
              <span className="text-[var(--color-foreground)]">{wizardData.trust?.settlorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Duration:</span>
              <span className="text-[var(--color-foreground)]">{wizardData.trust?.trustDuration} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Distribution Rate:</span>
              <span className="text-[var(--accent)] font-semibold">{wizardData.trust?.annualDistributionRate}%</span>
            </div>
          </div>
        </div>

        {/* Token Summary */}
        <div className="rounded-2xl border border-[var(--accent)]/30 bg-[rgba(34,211,238,0.08)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Image className="h-5 w-5 text-[var(--accent)]" />
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Token Details</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Token Name:</span>
              <span className="text-[var(--color-foreground)]">{wizardData.trust?.tokenName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Symbol:</span>
              <span className="text-[var(--accent)] font-semibold">{wizardData.trust?.tokenSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Total Supply:</span>
              <span className="text-[var(--color-foreground)]">{wizardData.trust?.tokenSupply?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Price per Token:</span>
              <span className="text-[var(--accent)] font-semibold">${wizardData.trust?.tokenPrice?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Minted:</span>
              <span className="text-green-400">{wizardData.nfts?.totalMinted?.toLocaleString()} NFTs</span>
            </div>
          </div>
        </div>

        {/* DAT Summary */}
        <div className="rounded-2xl border border-[var(--accent)]/30 bg-[rgba(34,211,238,0.08)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Vault className="h-5 w-5 text-[var(--accent)]" />
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">DAT Treasury</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Treasury Type:</span>
              <span className="text-[var(--color-foreground)] capitalize">{wizardData.treasury?.treasuryType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Allocated Tokens:</span>
              <span className="text-[var(--color-foreground)]">{wizardData.treasury?.allocatedTokens?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Allocation:</span>
              <span className="text-[var(--accent)]">{wizardData.treasury?.allocationPercentage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Enhanced Yield:</span>
              <span className="text-green-400 font-bold text-lg">{wizardData.treasury?.enhancedYieldApy?.toFixed(2)}% APY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Links */}
      <div className="rounded-2xl border border-[var(--accent)]/20 bg-[rgba(6,11,26,0.7)] p-6">
        <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">
          Contract Addresses & Links
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(6,11,26,0.8)] border border-[var(--color-card-border)]/30">
            <div>
              <p className="text-xs text-[var(--muted)] mb-1">{assetType === "property" ? "Property" : "Business"} Contract</p>
              <code className="text-sm text-[var(--accent)] font-mono">
                {wizardData.deployment?.contractAddress}
              </code>
            </div>
            {wizardData.deployment?.explorerUrl && (
              <a
                href={wizardData.deployment.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:text-[var(--accent)]/80 flex items-center gap-1"
              >
                Explorer
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>

          {wizardData.nfts?.collectionAddress && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(6,11,26,0.8)] border border-[var(--color-card-border)]/30">
              <div>
                <p className="text-xs text-[var(--muted)] mb-1">NFT Collection</p>
                <code className="text-sm text-[var(--accent)] font-mono">
                  {wizardData.nfts.collectionAddress}
                </code>
              </div>
              <a
                href="#"
                className="text-[var(--accent)] hover:text-[var(--accent)]/80 flex items-center gap-1"
              >
                View
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          {wizardData.treasury?.treasuryAddress && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(6,11,26,0.8)] border border-[var(--color-card-border)]/30">
              <div>
                <p className="text-xs text-[var(--muted)] mb-1">DAT Treasury</p>
                <code className="text-sm text-[var(--accent)] font-mono">
                  {wizardData.treasury.treasuryAddress}
                </code>
              </div>
              <a
                href="#"
                className="text-[var(--accent)] hover:text-[var(--accent)]/80 flex items-center gap-1"
              >
                Dashboard
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          type="button"
          onClick={handleShare}
          variant="outline"
          className="border-[var(--accent)]/50 text-[var(--accent)] hover:bg-[var(--accent)]/10"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share Summary
        </Button>

        <Button
          type="button"
          onClick={handleDownloadReport}
          variant="outline"
          className="border-[var(--accent)]/50 text-[var(--accent)] hover:bg-[var(--accent)]/10"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>

        <Button
          type="button"
          onClick={onRestart}
          className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[#041321] font-semibold"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Tokenize Another {assetType === "property" ? "Property" : "Business"}
        </Button>
      </div>

      {/* What's Next */}
      <div className="rounded-2xl border border-[var(--accent)]/20 bg-[rgba(34,211,238,0.05)] p-6">
        <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">
          What's Next?
        </h3>
        
        <div className="space-y-3 text-sm text-[var(--muted)]">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[rgba(6,11,26,0.6)]">
            <div className="rounded-full bg-[var(--accent)]/20 p-2">
              <span className="text-[var(--accent)] font-bold text-xs">1</span>
            </div>
            <div>
              <p className="text-[var(--color-foreground)] font-medium">Monitor Your Treasury</p>
              <p className="text-[var(--muted)] text-xs mt-1">
                Track yields, distributions, and asset performance in the DAT dashboard
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[rgba(6,11,26,0.6)]">
            <div className="rounded-full bg-[var(--accent)]/20 p-2">
              <span className="text-[var(--accent)] font-bold text-xs">2</span>
            </div>
            <div>
              <p className="text-[var(--color-foreground)] font-medium">Distribute Tokens</p>
              <p className="text-[var(--muted)] text-xs mt-1">
                Transfer {assetType === "property" ? "property" : "business"} tokens to beneficiaries and investors
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[rgba(6,11,26,0.6)]">
            <div className="rounded-full bg-[var(--accent)]/20 p-2">
              <span className="text-[var(--accent)] font-bold text-xs">3</span>
            </div>
            <div>
              <p className="text-[var(--color-foreground)] font-medium">Manage Distributions</p>
              <p className="text-[var(--muted)] text-xs mt-1">
                Set up automatic {assetType === "property" ? "rental income" : "revenue"} distributions to token holders
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[rgba(6,11,26,0.6)]">
            <div className="rounded-full bg-[var(--accent)]/20 p-2">
              <span className="text-[var(--accent)] font-bold text-xs">4</span>
            </div>
            <div>
              <p className="text-[var(--color-foreground)] font-medium">View Analytics</p>
              <p className="text-[var(--muted)] text-xs mt-1">
                Access real-time analytics and yield projections
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[rgba(6,11,26,0.8)] border border-[var(--accent)]/20 text-center">
          <p className="text-xs text-[var(--muted)] mb-2">Total Value</p>
          <p className="text-2xl font-bold text-[var(--accent)]">
            ${assetType === "property" 
              ? wizardData.property?.propertyValue?.toLocaleString() 
              : wizardData.business?.aiEstimatedValue?.toLocaleString()
            }
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[rgba(6,11,26,0.8)] border border-[var(--accent)]/20 text-center">
          <p className="text-xs text-[var(--muted)] mb-2">Total Tokens</p>
          <p className="text-2xl font-bold text-[var(--accent)]">
            {wizardData.trust?.tokenSupply?.toLocaleString()}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[rgba(6,11,26,0.8)] border border-[var(--accent)]/20 text-center">
          <p className="text-xs text-[var(--muted)] mb-2">NFTs Minted</p>
          <p className="text-2xl font-bold text-green-400">
            {wizardData.nfts?.totalMinted?.toLocaleString()}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[rgba(34,211,238,0.15)] border border-[var(--accent)]/40 text-center">
          <p className="text-xs text-[var(--muted)] mb-2">Enhanced APY</p>
          <p className="text-2xl font-bold text-green-400">
            {wizardData.treasury?.enhancedYieldApy?.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Network & Blockchain Info */}
      <div className="text-center text-sm text-[var(--muted)]">
        <p>
          Deployed on{" "}
          <span className="text-[var(--accent)] capitalize">{wizardData.deployment?.blockchain}</span>
          {" "}({wizardData.deployment?.network})
        </p>
        <p className="mt-2">
          Transaction: <code className="text-xs text-[var(--accent)]">{wizardData.deployment?.transactionHash}</code>
        </p>
      </div>
    </div>
  );
}


