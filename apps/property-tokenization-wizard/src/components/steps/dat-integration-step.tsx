"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PropertyDetails, TrustConfiguration, NFTMintingData, DeploymentData, DATIntegrationData } from "@/types/wizard";
import { Vault, ChevronLeft, Loader2, CheckCircle, TrendingUp, Coins } from "lucide-react";

type DATIntegrationStepProps = {
  nftData?: NFTMintingData;
  deploymentData?: DeploymentData;
  propertyData?: PropertyDetails;
  trustData?: TrustConfiguration;
  data?: DATIntegrationData;
  onComplete: (data: DATIntegrationData) => void;
  onBack: () => void;
};

export function DATIntegrationStep({ 
  nftData, 
  deploymentData,
  propertyData,
  trustData,
  data, 
  onComplete, 
  onBack 
}: DATIntegrationStepProps) {
  const [treasuryType, setTreasuryType] = useState<'new' | 'existing'>('new');
  const [isIntegrating, setIsIntegrating] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<'idle' | 'creating' | 'transferring' | 'complete'>('idle');
  const [datData, setDatData] = useState<DATIntegrationData | null>(data || null);
  const [allocationPercentage, setAllocationPercentage] = useState(100);
  const [existingTreasuryAddress, setExistingTreasuryAddress] = useState("");

  // Calculate enhanced yield
  const baseSOLApy = 5.5; // 5.5% SOL staking
  const assetYieldApy = trustData?.annualDistributionRate ? 
    (propertyData?.netIncome || 0) / (propertyData?.propertyValue || 1) * 100 : 12;
  const enhancedYieldApy = baseSOLApy + assetYieldApy;

  const handleIntegrate = async () => {
    if (!nftData || !deploymentData || !propertyData || !trustData) return;

    setIsIntegrating(true);
    setIntegrationStatus('creating');

    try {
      let treasuryAddress: string;

      if (treasuryType === 'new') {
        // Step 1: Create new DAT treasury
        const treasurySpec = {
          programName: "asset_treasury",
          programId: "DAtYXMpDEZL8RqQ7KVZp9YvKj8TqPSxKjHD2nNKFZC3L",
          instructions: [
            {
              name: "initialize_treasury",
              contextStruct: "InitializeTreasury",
              params: [
                { name: "treasury_name", type: "String" },
                { name: "sol_staking_apy", type: "u16" },
                { name: "minimum_stake", type: "u64" },
                { name: "lockup_period", type: "i64" }
              ]
            },
            {
              name: "add_asset",
              contextStruct: "AddAsset",
              params: [
                { name: "asset_type", type: "AssetType" },
                { name: "asset_name", type: "String" },
                { name: "asset_value", type: "u64" },
                { name: "annual_yield_bps", type: "u16" },
                { name: "metadata_uri", type: "String" }
              ]
            }
          ]
        };

        // TODO: Call API to create DAT treasury contract
        await new Promise(resolve => setTimeout(resolve, 2000));
        treasuryAddress = 'treasury-' + Date.now();
      } else {
        treasuryAddress = existingTreasuryAddress;
      }

      setIntegrationStatus('transferring');

      // Step 2: Transfer tokens to treasury
      const allocatedTokens = Math.floor((trustData.tokenSupply || 0) * (allocationPercentage / 100));
      
      // TODO: Call contract to transfer tokens
      await new Promise(resolve => setTimeout(resolve, 2000));

      const integration: DATIntegrationData = {
        treasuryAddress,
        treasuryType,
        allocatedTokens,
        allocationPercentage,
        enhancedYieldApy,
        transactionHash: 'tx-' + Date.now()
      };

      setDatData(integration);
      setIntegrationStatus('complete');
      
    } catch (error) {
      console.error('DAT integration failed:', error);
      alert('DAT integration failed: ' + (error as Error).message);
      setIntegrationStatus('idle');
    } finally {
      setIsIntegrating(false);
    }
  };

  const handleContinue = () => {
    if (!datData) {
      alert("Please integrate with DAT first");
      return;
    }
    onComplete(datData);
  };

  return (
    <div className="space-y-8">
      {/* Treasury Selection */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[var(--color-foreground)] flex items-center gap-2">
          <Vault className="h-5 w-5 text-[var(--accent)]" />
          Digital Asset Treasury
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTreasuryType('new')}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              treasuryType === 'new'
                ? "border-[var(--accent)]/70 bg-[rgba(34,211,238,0.12)]"
                : "border-[var(--color-card-border)]/30 bg-[rgba(6,11,26,0.6)] hover:border-[var(--accent)]/30"
            }`}
          >
            <h4 className="text-lg font-semibold text-[var(--color-foreground)]">Create New Treasury</h4>
            <p className="text-sm text-[var(--muted)] mt-2">
              Create a dedicated DAT for this property with custom parameters
            </p>
          </button>

          <button
            type="button"
            onClick={() => setTreasuryType('existing')}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              treasuryType === 'existing'
                ? "border-[var(--accent)]/70 bg-[rgba(34,211,238,0.12)]"
                : "border-[var(--color-card-border)]/30 bg-[rgba(6,11,26,0.6)] hover:border-[var(--accent)]/30"
            }`}
          >
            <h4 className="text-lg font-semibold text-[var(--color-foreground)]">Use Existing Treasury</h4>
            <p className="text-sm text-[var(--muted)] mt-2">
              Add this property to an existing multi-asset treasury
            </p>
          </button>
        </div>

        {treasuryType === 'existing' && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-cyan-200">
              Treasury Address
            </label>
            <input
              type="text"
              value={existingTreasuryAddress}
              onChange={(e) => setExistingTreasuryAddress(e.target.value)}
              placeholder="Enter existing treasury address..."
              className="w-full rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </div>
        )}
      </div>

      {/* Allocation Configuration */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[var(--color-foreground)]">
          Token Allocation
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-cyan-200">
              Percentage to Allocate to DAT
            </label>
            <span className="text-lg font-bold text-[var(--accent)]">{allocationPercentage}%</span>
          </div>
          <input
            type="range"
            value={allocationPercentage}
            onChange={(e) => setAllocationPercentage(Number(e.target.value))}
            min="0"
            max="100"
            step="5"
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-[rgba(6,11,26,0.8)] accent-[var(--accent)]"
          />
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span>0 tokens</span>
            <span>{Math.floor((trustData?.tokenSupply || 0) * (allocationPercentage / 100))} tokens</span>
            <span>{trustData?.tokenSupply} tokens</span>
          </div>
        </div>
      </div>

      {/* Enhanced Yield Preview */}
      <div className="rounded-2xl border border-[var(--accent)]/30 bg-[rgba(34,211,238,0.08)] p-6">
        <h4 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
          Enhanced Yield Preview
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[rgba(6,11,26,0.6)] border border-[var(--color-card-border)]/30">
            <p className="text-xs text-[var(--muted)] mb-1">Base SOL Staking</p>
            <p className="text-2xl font-bold text-purple-400">{baseSOLApy}%</p>
          </div>

          <div className="p-4 rounded-xl bg-[rgba(6,11,26,0.6)] border border-[var(--color-card-border)]/30">
            <p className="text-xs text-[var(--muted)] mb-1">Property Asset Yield</p>
            <p className="text-2xl font-bold text-blue-400">{assetYieldApy.toFixed(2)}%</p>
          </div>

          <div className="p-4 rounded-xl bg-[rgba(34,211,238,0.15)] border border-[var(--accent)]/50">
            <p className="text-xs text-[var(--muted)] mb-1">Total Enhanced APY</p>
            <p className="text-2xl font-bold text-[var(--accent)]">{enhancedYieldApy.toFixed(2)}%</p>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-[rgba(6,11,26,0.6)] border border-[var(--accent)]/20">
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            By integrating with a Digital Asset Treasury, token holders can earn <span className="text-[var(--accent)] font-semibold">{enhancedYieldApy.toFixed(2)}% APY</span> - 
            combining {baseSOLApy}% from SOL staking with {assetYieldApy.toFixed(2)}% from property returns.
            This is <span className="text-green-400 font-semibold">{((enhancedYieldApy / baseSOLApy - 1) * 100).toFixed(0)}% higher</span> than plain SOL staking alone!
          </p>
        </div>
      </div>

      {/* Integration Status */}
      {integrationStatus !== 'idle' && (
        <div className="rounded-2xl border border-[var(--accent)]/30 bg-[rgba(34,211,238,0.08)] p-6">
          <h4 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">
            Integration Progress
          </h4>
          
          <div className="space-y-3">
            {treasuryType === 'new' && (
              <div className={`flex items-center gap-3 p-3 rounded-xl ${
                integrationStatus === 'creating' ? 'bg-[var(--accent)]/20 border border-[var(--accent)]/30' : 
                ['transferring', 'complete'].includes(integrationStatus) ? 'bg-green-500/10 border border-green-500/30' : 
                'bg-[rgba(6,11,26,0.6)]'
              }`}>
                {integrationStatus === 'creating' ? (
                  <Loader2 className="h-5 w-5 text-[var(--accent)] animate-spin" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                )}
                <span className="text-sm text-[var(--color-foreground)]">
                  Creating DAT treasury contract...
                </span>
              </div>
            )}

            <div className={`flex items-center gap-3 p-3 rounded-xl ${
              integrationStatus === 'transferring' ? 'bg-[var(--accent)]/20 border border-[var(--accent)]/30' : 
              integrationStatus === 'complete' ? 'bg-green-500/10 border border-green-500/30' : 
              'bg-[rgba(6,11,26,0.6)]'
            }`}>
              {integrationStatus === 'transferring' ? (
                <Loader2 className="h-5 w-5 text-[var(--accent)] animate-spin" />
              ) : integrationStatus === 'complete' ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-[var(--muted)]" />
              )}
              <span className="text-sm text-[var(--color-foreground)]">
                Transferring tokens to treasury...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Integration Result */}
      {datData && integrationStatus === 'complete' && (
        <div className="rounded-2xl border border-green-500/30 bg-green-900/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-6 w-6 text-green-400" />
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              DAT Integration Complete!
            </h3>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-[rgba(6,11,26,0.8)] border border-[var(--color-card-border)]/30">
              <p className="text-xs text-[var(--muted)] mb-2">Treasury Address</p>
              <code className="text-sm text-[var(--accent)] font-mono break-all">
                {datData.treasuryAddress}
              </code>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-[rgba(6,11,26,0.8)] border border-[var(--color-card-border)]/30">
                <p className="text-xs text-[var(--muted)] mb-2">Allocated Tokens</p>
                <p className="text-xl font-bold text-[var(--accent)]">
                  {datData.allocatedTokens.toLocaleString()}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[rgba(34,211,238,0.15)] border border-[var(--accent)]/50">
                <p className="text-xs text-[var(--muted)] mb-2">Enhanced APY</p>
                <p className="text-xl font-bold text-green-400">
                  {datData.enhancedYieldApy.toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[rgba(6,11,26,0.8)] border border-[var(--color-card-border)]/30">
              <p className="text-xs text-[var(--muted)] mb-2">Transaction Hash</p>
              <code className="text-sm text-[var(--accent)] font-mono break-all">
                {datData.transactionHash}
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Integrate Button */}
      {integrationStatus === 'idle' && (
        <div className="flex justify-center">
          <Button
            type="button"
            onClick={handleIntegrate}
            disabled={isIntegrating || !nftData || (treasuryType === 'existing' && !existingTreasuryAddress)}
            className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[#041321] font-semibold px-12 py-6 text-lg rounded-xl"
          >
            {isIntegrating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Integrating with DAT...
              </>
            ) : (
              <>
                <Coins className="h-5 w-5 mr-2" />
                Integrate with DAT Treasury
              </>
            )}
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="border-[var(--color-card-border)]/50 hover:border-[var(--accent)]/50 text-[var(--muted)] hover:text-[var(--color-foreground)]"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        {datData && integrationStatus === 'complete' && (
          <Button
            type="button"
            onClick={handleContinue}
            className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[#041321] font-semibold px-8"
          >
            View Complete Summary
          </Button>
        )}
      </div>
    </div>
  );
}


