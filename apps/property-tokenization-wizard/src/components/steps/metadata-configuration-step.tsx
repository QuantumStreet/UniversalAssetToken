"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PropertyDetails, TrustConfiguration, BeneficiaryRights } from "@/types/wizard";
import { generateUATMetadata, validateUATMetadata, UATMetadata } from "@/services/uatGenerator";
import { useAssetType } from "@/contexts/asset-type-context";
import { 
  FileJson, 
  CheckCircle, 
  XCircle, 
  Download, 
  Upload, 
  ChevronLeft, 
  Eye, 
  CheckSquare,
  AlertTriangle 
} from "lucide-react";

type MetadataConfigurationStepProps = {
  propertyData: PropertyDetails;
  trustData: TrustConfiguration & BeneficiaryRights;
  blockchain: { name: string; network: string };
  onComplete: (data: { uatMetadata: UATMetadata; metadataUri: string }) => void;
  onBack: () => void;
};

export function MetadataConfigurationStep({
  propertyData,
  trustData,
  blockchain,
  onComplete,
  onBack
}: MetadataConfigurationStepProps) {
  const { assetType } = useAssetType();
  const [uatMetadata, setUatMetadata] = useState<UATMetadata | null>(null);
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [metadataUri, setMetadataUri] = useState<string>("");

  // Generate UAT metadata on mount
  useEffect(() => {
    // Don't generate if required data is missing
    if (!propertyData || !trustData) {
      return;
    }
    
    const metadata = generateUATMetadata(propertyData, trustData, blockchain);
    setUatMetadata(metadata);
    
    const validationResult = validateUATMetadata(metadata);
    setValidation(validationResult);
  }, [propertyData, trustData, blockchain]);

  const handleDownloadJson = () => {
    if (!uatMetadata) return;

    const blob = new Blob([JSON.stringify(uatMetadata, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${uatMetadata.symbol}-metadata.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUploadToIPFS = async () => {
    if (!uatMetadata || !validation?.valid) return;

    setIsUploading(true);
    try {
      // TODO: Integrate with actual IPFS upload service (Pinata/Filebase)
      // For now, simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulated IPFS hash
      const simulatedHash = `ipfs://Qm${Math.random().toString(36).substring(2, 15)}`;
      setMetadataUri(simulatedHash);
      
      // TODO: Replace with actual Pinata API call:
      // const formData = new FormData();
      // formData.append('file', new Blob([JSON.stringify(uatMetadata)], { type: 'application/json' }));
      // const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${PINATA_JWT}` },
      //   body: formData
      // });
      // const result = await response.json();
      // setMetadataUri(`ipfs://${result.IpfsHash}`);
      
    } catch (error) {
      console.error('IPFS upload failed:', error);
      alert('Failed to upload metadata to IPFS');
    } finally {
      setIsUploading(false);
    }
  };

  const handleContinue = () => {
    if (!uatMetadata || !validation?.valid || !metadataUri) return;
    onComplete({ uatMetadata, metadataUri });
  };

  // Show error if required data is missing
  if (!propertyData || !trustData) {
    return (
      <div className="text-center py-12 space-y-4">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
        <h3 className="text-xl font-semibold text-[var(--color-foreground)]">
          Missing Required Data
        </h3>
        <p className="text-[var(--muted)]">
          Please complete {assetType === "property" ? "Property" : "Business"} Details and Trust Configuration steps first.
        </p>
        <Button onClick={onBack} variant="outline">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  if (!uatMetadata) {
    return <div className="text-center py-12">Generating UAT metadata...</div>;
  }

  const enabledModules = Object.entries(uatMetadata.modules)
    .filter(([_, enabled]) => enabled)
    .map(([module]) => module);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] flex items-center gap-3">
          <FileJson className="h-7 w-7 text-[var(--accent)]" />
          Universal Asset Token (UAT) Metadata
        </h2>
        <p className="mt-2 text-[var(--muted)]">
          Review your UAT-compliant metadata before uploading to IPFS. This metadata will be permanently linked to your {assetType === "property" ? "property" : "business"} tokens.
        </p>
      </div>

      {/* Validation Status */}
      <div className={`rounded-2xl border-2 p-6 ${
        validation?.valid 
          ? 'border-green-500/50 bg-green-500/10' 
          : 'border-red-500/50 bg-red-500/10'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          {validation?.valid ? (
            <CheckCircle className="h-6 w-6 text-green-400" />
          ) : (
            <XCircle className="h-6 w-6 text-red-400" />
          )}
          <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
            {validation?.valid ? 'Metadata Valid ✓' : 'Validation Failed'}
          </h3>
        </div>

        {validation && !validation.valid && (
          <div className="space-y-2">
            {validation.errors.map((error, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-red-300">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        )}

        {validation?.valid && (
          <p className="text-sm text-green-300">
            All required fields are present and valid. Ready to upload to IPFS.
          </p>
        )}
      </div>

      {/* Metadata Summary */}
      <div className="rounded-2xl border border-[var(--color-card-border)]/50 bg-[rgba(8,10,25,0.85)] p-6">
        <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">
          Token Summary
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-[var(--muted)]">Token Name</p>
            <p className="text-lg font-semibold text-[var(--color-foreground)]">{uatMetadata.name}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs text-[var(--muted)]">Symbol</p>
            <p className="text-lg font-semibold text-[var(--accent)]">{uatMetadata.symbol}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs text-[var(--muted)]">Total Supply</p>
            <p className="text-lg font-semibold text-[var(--color-foreground)]">
              {uatMetadata.total_supply.toLocaleString()} tokens
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs text-[var(--muted)]">Blockchain</p>
            <p className="text-lg font-semibold text-[var(--color-foreground)]">
              {blockchain.name} {blockchain.network}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--color-card-border)]/30">
          <p className="text-xs text-[var(--muted)] mb-2">Description</p>
          <p className="text-sm text-[var(--color-foreground)]">{uatMetadata.description}</p>
        </div>
      </div>

      {/* Enabled Modules */}
      <div className="rounded-2xl border border-[var(--accent)]/30 bg-[rgba(34,211,238,0.08)] p-6">
        <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-4 flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-[var(--accent)]" />
          Enabled Modules ({enabledModules.length}/8)
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(uatMetadata.modules).map(([module, enabled]) => (
            <div 
              key={module}
              className={`flex items-center gap-2 p-3 rounded-lg border ${
                enabled 
                  ? 'border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent)]' 
                  : 'border-[var(--muted)]/30 bg-[rgba(0,0,0,0.3)] text-[var(--muted)]'
              }`}
            >
              {enabled ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-[var(--muted)]/50" />
              )}
              <span className="text-xs font-medium capitalize">
                {module.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* JSON Preview */}
      <div className="rounded-2xl border border-[var(--color-card-border)]/50 bg-[rgba(8,10,25,0.85)] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-card-border)]/30">
          <h3 className="text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
            <FileJson className="h-5 w-5 text-[var(--accent)]" />
            UAT JSON Metadata
          </h3>
          <Button
            type="button"
            onClick={() => setShowJson(!showJson)}
            variant="outline"
            className="text-sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showJson ? 'Hide' : 'View'} JSON
          </Button>
        </div>
        
        {showJson && (
          <div className="p-4 bg-[rgba(0,0,0,0.5)] max-h-96 overflow-y-auto">
            <pre className="text-xs text-[var(--muted)] font-mono whitespace-pre-wrap">
              {JSON.stringify(uatMetadata, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          type="button"
          onClick={handleDownloadJson}
          variant="outline"
          className="border-[var(--accent)]/50 hover:bg-[var(--accent)]/10 text-[var(--accent)]"
        >
          <Download className="h-4 w-4 mr-2" />
          Download JSON
        </Button>

        <Button
          type="button"
          onClick={handleUploadToIPFS}
          disabled={!validation?.valid || isUploading || !!metadataUri}
          className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-black font-semibold"
        >
          {isUploading ? (
            <>
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-black border-t-transparent" />
              Uploading to IPFS...
            </>
          ) : metadataUri ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Uploaded to IPFS
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload to IPFS
            </>
          )}
        </Button>
      </div>

      {/* IPFS URI Display */}
      {metadataUri && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-400 mb-1">
                Metadata Uploaded Successfully
              </p>
              <p className="text-xs text-[var(--muted)] break-all">
                {metadataUri}
              </p>
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
        
        <Button
          type="button"
          onClick={handleContinue}
          disabled={!validation?.valid || !metadataUri}
          className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-black font-semibold px-8"
        >
          Continue to Token Minting
        </Button>
      </div>
    </div>
  );
}

