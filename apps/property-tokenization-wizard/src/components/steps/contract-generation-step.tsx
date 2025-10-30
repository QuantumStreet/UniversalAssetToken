"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useBlockchain } from "@/contexts/blockchain-context";
import { PropertyDetails, TrustConfiguration, BeneficiaryRights, SmartContractData } from "@/types/wizard";
import { Code, Sparkles, ChevronLeft, Zap, Eye, Download, FileCode } from "lucide-react";

type ContractGenerationStepProps = {
  propertyData?: PropertyDetails;
  trustData?: TrustConfiguration;
  beneficiaryData?: BeneficiaryRights;
  data?: SmartContractData;
  onComplete: (data: SmartContractData) => void;
  onBack: () => void;
};

export function ContractGenerationStep({ 
  propertyData, 
  trustData, 
  beneficiaryData,
  data, 
  onComplete, 
  onBack 
}: ContractGenerationStepProps) {
  const { blockchain } = useBlockchain();
  const [generationMethod, setGenerationMethod] = useState<'template' | 'ai'>('template');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContract, setGeneratedContract] = useState<string>("");
  const [aiDescription, setAiDescription] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Map blockchain context to contract type
  const selectedBlockchain = blockchain.name.toLowerCase() as 'ethereum' | 'solana' | 'radix';

  const blockchainConfig = {
    ethereum: {
      name: "Ethereum",
      logo: "⟠",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      language: "Solidity"
    },
    solana: {
      name: "Solana",
      logo: "◎",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      language: "Rust/Anchor"
    },
    radix: {
      name: "Radix",
      logo: "⚛",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30",
      language: "Scrypto"
    }
  };

  const handleGenerateTemplate = async () => {
    setIsGenerating(true);
    try {
      // Build contract specification from wizard data
      const contractSpec = {
        license: "MIT",
        pragmaVersion: "^0.8.19",
        name: "WyomingTrustTokenization",
        description: `Wyoming Trust Tokenization for ${propertyData?.propertyAddress}`,
        contractType: "Contract",
        state: [
          { type: "string", visibility: "public", name: "trustName", description: "Name of the trust" },
          { type: "string", visibility: "public", name: "settlorName", description: "Settlor name" },
          { type: "string", visibility: "public", name: "propertyAddress", description: "Property address" },
          { type: "uint256", visibility: "public", name: "propertyValue", description: "Property value" },
          { type: "uint256", visibility: "public", name: "totalSupply", description: "Total token supply" },
          { type: "uint256", visibility: "public", name: "tokenPrice", description: "Price per token" },
          { type: "uint256", visibility: "public", name: "annualDistributionRate", description: "Annual distribution %" },
          { type: "bool", visibility: "public", name: "occupancyRights", description: "Occupancy rights enabled" },
          { type: "bool", visibility: "public", name: "votingRights", description: "Voting rights enabled" },
        ],
        events: [
          {
            name: "TrustCreated",
            params: [
              { type: "string", name: "trustName" },
              { type: "uint256", name: "propertyValue" }
            ]
          },
          {
            name: "TokenMinted",
            params: [
              { type: "address", indexed: true, name: "to" },
              { type: "uint256", name: "amount" }
            ]
          }
        ],
        functions: [
          {
            name: "mintTokens",
            visibility: "external",
            params: [
              { type: "address", name: "to" },
              { type: "uint256", name: "amount" }
            ],
            body: [
              "require(to != address(0), \"Cannot mint to zero address\");",
              "require(amount > 0, \"Amount must be greater than 0\");",
              "emit TokenMinted(to, amount);"
            ]
          }
        ],
        constructor: {
          params: [],
          body: [
            `trustName = "${trustData?.trustName || 'Property Trust'}";`,
            `settlorName = "${trustData?.settlorName || ''}";`,
            `propertyAddress = "${propertyData?.propertyAddress || ''}";`,
            `propertyValue = ${propertyData?.propertyValue || 0};`,
            `totalSupply = ${trustData?.tokenSupply || 0};`,
            `tokenPrice = ${trustData?.tokenPrice || 0};`,
            `annualDistributionRate = ${trustData?.annualDistributionRate || 90};`,
            `occupancyRights = ${beneficiaryData?.occupancyRights || false};`,
            `votingRights = ${beneficiaryData?.votingRights || false};`,
            "emit TrustCreated(trustName, propertyValue);"
          ]
        }
      };

      // Call Smart Contract Generator API
      const jsonBlob = new Blob([JSON.stringify(contractSpec, null, 2)], { type: 'application/json' });
      const jsonFile = new File([jsonBlob], 'contract-spec.json', { type: 'application/json' });
      
      const formData = new FormData();
      formData.append('JsonFile', jsonFile);
      formData.append('Language', selectedBlockchain === 'ethereum' ? 'Solidity' : selectedBlockchain === 'solana' ? 'Rust' : 'Scrypto');

      const response = await fetch('http://localhost:5000/api/v1/contracts/generate', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Contract generation failed');
      }

      const contract = await response.text();
      setGeneratedContract(contract);
      setShowPreview(true);
    } catch (error) {
      console.error('Template generation failed:', error);
      alert('Template generation failed. Please try again or use AI generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiDescription) {
      alert("Please describe your contract requirements");
      return;
    }

    setIsGenerating(true);
    try {
      const fullDescription = `
        Create a Wyoming Trust property tokenization smart contract for:
        - Property: ${propertyData?.propertyAddress}
        - Value: $${propertyData?.propertyValue?.toLocaleString()}
        - Trust: ${trustData?.trustName}
        - Token: ${trustData?.tokenName} (${trustData?.tokenSymbol})
        - Supply: ${trustData?.tokenSupply} tokens at $${trustData?.tokenPrice} each
        - Annual Distribution: ${trustData?.annualDistributionRate}%
        - Reserve Fund: ${trustData?.reserveFundRate}%
        - Occupancy Rights: ${beneficiaryData?.occupancyRights ? 'Yes' : 'No'}
        - Voting Rights: ${beneficiaryData?.votingRights ? 'Yes' : 'No'}
        
        Additional requirements: ${aiDescription}
      `;

      const response = await fetch('https://api.assetrail.xyz/api/v1/contracts/generate-from-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: fullDescription,
          blockchain: selectedBlockchain,
          additionalContext: JSON.stringify({ propertyData, trustData, beneficiaryData })
        })
      });

      if (!response.ok) {
        throw new Error('AI generation failed');
      }

      const blob = await response.blob();
      const contract = await blob.text();
      setGeneratedContract(contract);
      setShowPreview(true);
    } catch (error) {
      console.error('AI generation failed:', error);
      alert('AI generation failed. Please try template generation instead.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinue = () => {
    if (!generatedContract) {
      alert("Please generate a contract first");
      return;
    }

    onComplete({
      contractCode: generatedContract,
      generationMethod,
      blockchain: selectedBlockchain,
      description: aiDescription || undefined
    });
  };

  const currentBlockchain = blockchainConfig[selectedBlockchain];

  return (
    <div className="space-y-8">
      {/* Current Blockchain Info */}
      <div className="rounded-xl border border-[var(--accent)]/30 bg-[rgba(34,211,238,0.05)] p-4">
        <div className="flex items-center gap-3">
          <Code className="h-5 w-5 text-[var(--accent)]" />
          <div>
            <p className="text-sm text-[var(--muted)]">Deploying to</p>
            <p className="text-lg font-semibold text-[var(--color-foreground)]">
              {blockchain.name} {blockchain.network}
            </p>
          </div>
          <div className="ml-auto">
            <span className={`text-xs px-3 py-1 rounded-full ${currentBlockchain.bgColor} ${currentBlockchain.color} border ${currentBlockchain.borderColor}`}>
              {currentBlockchain.language}
            </span>
          </div>
        </div>
      </div>

      {/* Generation Method */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[var(--color-foreground)]">
          Generation Method
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setGenerationMethod('template')}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              generationMethod === 'template'
                ? "border-[var(--accent)]/70 bg-[rgba(34,211,238,0.12)]"
                : "border-[var(--color-card-border)]/30 bg-[rgba(6,11,26,0.6)] hover:border-[var(--accent)]/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <Zap className={`h-6 w-6 mt-1 ${generationMethod === 'template' ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`} />
              <div>
                <h4 className="text-lg font-semibold text-[var(--color-foreground)]">Template-Based</h4>
                <p className="text-sm text-[var(--muted)] mt-1">Fast, standardized contract generation using proven templates</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-[var(--accent)]">⚡ ~2 seconds</span>
                  <span className="text-xs text-[var(--muted)]">•</span>
                  <span className="text-xs text-green-400">Free</span>
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setGenerationMethod('ai')}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              generationMethod === 'ai'
                ? "border-[var(--accent)]/70 bg-[rgba(34,211,238,0.12)]"
                : "border-[var(--color-card-border)]/30 bg-[rgba(6,11,26,0.6)] hover:border-[var(--accent)]/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <Sparkles className={`h-6 w-6 mt-1 ${generationMethod === 'ai' ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`} />
              <div>
                <h4 className="text-lg font-semibold text-[var(--color-foreground)]">AI-Enhanced</h4>
                <p className="text-sm text-[var(--muted)] mt-1">Advanced contract with custom logic powered by ChatGPT</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-[var(--accent)]">🤖 ~30 seconds</span>
                  <span className="text-xs text-[var(--muted)]">•</span>
                  <span className="text-xs text-yellow-400">~$2</span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* AI Description Input */}
      {generationMethod === 'ai' && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-cyan-200 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Describe Contract Requirements (Optional)
          </label>
          <textarea
            value={aiDescription}
            onChange={(e) => setAiDescription(e.target.value)}
            placeholder="Add any specific requirements, custom logic, or special features you want in the contract..."
            rows={4}
            className="w-full rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          />
          <p className="text-xs text-[var(--muted)]">
            AI will enhance the contract with intelligent business logic based on your requirements
          </p>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          type="button"
          onClick={generationMethod === 'template' ? handleGenerateTemplate : handleGenerateAI}
          disabled={isGenerating || (generationMethod === 'ai' && !aiDescription && !propertyData)}
          className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[#041321] font-semibold px-12 py-6 text-lg rounded-xl"
        >
          {isGenerating ? (
            <>
              <Sparkles className="h-5 w-5 mr-2 animate-spin" />
              Generating Contract...
            </>
          ) : (
            <>
              {generationMethod === 'template' ? (
                <><Zap className="h-5 w-5 mr-2" /> Generate from Template</>
              ) : (
                <><Sparkles className="h-5 w-5 mr-2" /> Generate with AI</>
              )}
            </>
          )}
        </Button>
      </div>

      {/* Contract Preview */}
      {showPreview && generatedContract && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-green-500/30 bg-green-900/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                <FileCode className="h-5 w-5 text-green-400" />
                Contract Generated Successfully
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-3 py-1 rounded-full ${currentBlockchain.bgColor} ${currentBlockchain.color} border ${currentBlockchain.borderColor}`}>
                  {currentBlockchain.name}
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30">
                  {generationMethod === 'template' ? 'Template' : 'AI-Enhanced'}
                </span>
              </div>
            </div>

            {/* Contract Preview */}
            <div className="rounded-xl bg-[rgba(6,11,26,0.9)] border border-[var(--color-card-border)]/30 p-4 max-h-[400px] overflow-y-auto">
              <pre className="text-xs text-[var(--muted)] font-mono whitespace-pre-wrap">
                {generatedContract.slice(0, 1000)}...
              </pre>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-4">
              <Button
                type="button"
                onClick={() => {
                  const blob = new Blob([generatedContract], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${trustData?.trustName || 'contract'}.${selectedBlockchain === 'ethereum' ? 'sol' : 'rs'}`;
                  a.click();
                }}
                variant="outline"
                className="border-[var(--accent)]/50 text-[var(--accent)] hover:bg-[var(--accent)]/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Contract
              </Button>
              
              <Button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                className="border-[var(--color-card-border)]/50 text-[var(--muted)] hover:text-[var(--color-foreground)]"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide' : 'View'} Full Code
              </Button>
            </div>
          </div>
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
        
        {generatedContract && (
          <Button
            type="button"
            onClick={handleContinue}
            className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[#041321] font-semibold px-8"
          >
            Continue to Deployment
          </Button>
        )}
      </div>
    </div>
  );
}

