/**
 * Solana Playground Integration Component
 * 
 * This component provides easy integration with Solana Playground
 * for viewing, editing, and testing generated smart contracts.
 * 
 * Features:
 * - Open generated contracts in Solana Playground
 * - Preview code with Monaco editor
 * - Download contract ZIP
 * - Seamless workflow integration
 * 
 * Usage:
 * ```tsx
 * <SolanaPlaygroundIntegration
 *   contractZip={generatedZipBlob}
 *   contractSpec={contractSpecification}
 *   onDeploy={() => navigateToDeploymentStep()}
 * />
 * ```
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download, Code, Rocket, Eye } from 'lucide-react';

interface SolanaPlaygroundIntegrationProps {
  /** The generated contract ZIP blob */
  contractZip: Blob | null;
  
  /** Contract specification used for generation */
  contractSpec?: {
    programName?: string;
    programId?: string;
    instructions?: Array<{ name: string; description?: string }>;
  };
  
  /** Callback when user wants to proceed to deployment */
  onDeploy?: () => void;
  
  /** Optional: Show inline preview */
  showPreview?: boolean;
  
  /** Optional: Custom class name */
  className?: string;
}

export function SolanaPlaygroundIntegration({
  contractZip,
  contractSpec,
  onDeploy,
  showPreview = false,
  className = '',
}: SolanaPlaygroundIntegrationProps) {
  const [contractCode, setContractCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contractZip && showPreview) {
      loadContractCode();
    }
  }, [contractZip, showPreview]);

  async function loadContractCode() {
    if (!contractZip) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Dynamic import to avoid SSR issues
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(contractZip);
      
      // Try common paths for the main contract file
      const possiblePaths = [
        'programs/rust-main-template/src/lib.rs',
        'src/lib.rs',
        'lib.rs',
      ];
      
      let code = '';
      for (const path of possiblePaths) {
        const file = zip.file(path);
        if (file) {
          code = await file.async('string');
          break;
        }
      }
      
      if (!code) {
        throw new Error('Contract code not found in ZIP');
      }
      
      setContractCode(code);
    } catch (err) {
      console.error('Error loading contract code:', err);
      setError('Failed to load contract code');
    } finally {
      setLoading(false);
    }
  }

  function openInSolanaPlayground() {
    // Strategy 1: Try to open with code (may have URL length limits)
    // Strategy 2: Just open playground and show instructions
    
    try {
      // For now, open blank Solana Playground
      // User can manually import the downloaded ZIP
      const playgroundUrl = 'https://beta.solpg.io/';
      window.open(playgroundUrl, '_blank');
      
      // Show helpful instructions
      const instructions = `
🚀 Solana Playground opened in a new tab!

To use your generated contract:

1. In Solana Playground, click "New Project" → "Anchor"
2. Click "Import" and upload your downloaded ZIP
3. The contract code will be automatically loaded
4. Click "Build" to compile
5. Connect your wallet (Playground Wallet or Phantom)
6. Click "Deploy" to deploy to devnet
7. Copy the Program ID for use in AssetRail

Need help? Check the Solana Playground docs or AssetRail documentation.
      `.trim();
      
      // Could show this in a modal instead of alert
      setTimeout(() => {
        if (confirm(instructions + '\n\nDownload the contract ZIP now?')) {
          downloadZip();
        }
      }, 500);
      
    } catch (error) {
      console.error('Error opening Solana Playground:', error);
      alert('Failed to open Solana Playground. Please try again or visit https://beta.solpg.io/ directly.');
    }
  }

  function downloadZip() {
    if (!contractZip) return;
    
    try {
      const url = URL.createObjectURL(contractZip);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contractSpec?.programName || 'contract'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading ZIP:', error);
      alert('Failed to download contract ZIP. Please try again.');
    }
  }

  function viewCode() {
    if (!contractCode) {
      loadContractCode();
    }
  }

  if (!contractZip) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Action Buttons */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Code className="w-5 h-5" />
          Contract Generated Successfully!
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Your Solana smart contract is ready. Choose how you'd like to proceed:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Open in Playground */}
          <Button
            onClick={openInSolanaPlayground}
            variant="default"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white h-auto py-3 flex flex-col items-center gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            <div className="text-center">
              <div className="font-semibold">Open in Solana Playground</div>
              <div className="text-xs opacity-90">Edit, test, and deploy</div>
            </div>
          </Button>

          {/* Download ZIP */}
          <Button
            onClick={downloadZip}
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-2"
          >
            <Download className="w-5 h-5" />
            <div className="text-center">
              <div className="font-semibold">Download ZIP</div>
              <div className="text-xs text-muted-foreground">Full project files</div>
            </div>
          </Button>

          {/* Deploy Now */}
          {onDeploy && (
            <Button
              onClick={onDeploy}
              variant="default"
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-auto py-3 flex flex-col items-center gap-2"
            >
              <Rocket className="w-5 h-5" />
              <div className="text-center">
                <div className="font-semibold">Deploy Now</div>
                <div className="text-xs opacity-90">Automated deployment</div>
              </div>
            </Button>
          )}
        </div>
      </div>

      {/* Contract Details */}
      {contractSpec && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold mb-2">Contract Details</h4>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {contractSpec.programName && (
              <>
                <dt className="text-gray-600">Program Name:</dt>
                <dd className="font-mono">{contractSpec.programName}</dd>
              </>
            )}
            {contractSpec.programId && contractSpec.programId !== 'TBD' && (
              <>
                <dt className="text-gray-600">Program ID:</dt>
                <dd className="font-mono text-xs">{contractSpec.programId}</dd>
              </>
            )}
            {contractSpec.instructions && (
              <>
                <dt className="text-gray-600">Instructions:</dt>
                <dd>{contractSpec.instructions.length} instruction(s)</dd>
              </>
            )}
          </dl>
        </div>
      )}

      {/* Code Preview (if enabled) */}
      {showPreview && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-semibold">Contract Code Preview</span>
            {!contractCode && !loading && (
              <Button
                size="sm"
                variant="ghost"
                onClick={viewCode}
              >
                <Eye className="w-4 h-4 mr-1" />
                Load Preview
              </Button>
            )}
          </div>
          
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 text-sm text-red-800">
              {error}
            </div>
          )}
          
          {contractCode && !loading && (
            <div className="bg-gray-900 text-gray-100 p-4 overflow-x-auto">
              <pre className="text-xs">
                <code>{contractCode}</code>
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Helpful Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-2">💡 Quick Tips</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>Solana Playground</strong> lets you edit and test without local setup</li>
          <li>• Use <strong>Download ZIP</strong> to deploy locally with Anchor CLI</li>
          <li>• <strong>Deploy Now</strong> uses AssetRail's automated deployment</li>
          <li>• All options deploy to Solana Devnet for testing first</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Lightweight version - just the buttons without extras
 */
export function SolanaPlaygroundButtons({
  contractZip,
  onOpenPlayground,
  onDownload,
  onDeploy,
}: {
  contractZip: Blob | null;
  onOpenPlayground?: () => void;
  onDownload?: () => void;
  onDeploy?: () => void;
}) {
  const handleOpenPlayground = () => {
    window.open('https://beta.solpg.io/', '_blank');
    onOpenPlayground?.();
  };

  const handleDownload = () => {
    if (!contractZip) return;
    
    const url = URL.createObjectURL(contractZip);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contract.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    onDownload?.();
  };

  if (!contractZip) return null;

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleOpenPlayground}
        variant="outline"
        size="sm"
      >
        <ExternalLink className="w-4 h-4 mr-1" />
        Solana Playground
      </Button>
      
      <Button
        onClick={handleDownload}
        variant="outline"
        size="sm"
      >
        <Download className="w-4 h-4 mr-1" />
        Download
      </Button>
      
      {onDeploy && (
        <Button
          onClick={onDeploy}
          size="sm"
        >
          <Rocket className="w-4 h-4 mr-1" />
          Deploy
        </Button>
      )}
    </div>
  );
}


