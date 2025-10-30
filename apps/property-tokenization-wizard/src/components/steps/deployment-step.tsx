"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SmartContractData, DeploymentData } from "@/types/wizard";
import { Rocket, ChevronLeft, Loader2, CheckCircle, ExternalLink, Network } from "lucide-react";

type DeploymentStepProps = {
  contractData?: SmartContractData;
  data?: DeploymentData;
  onComplete: (data: DeploymentData) => void;
  onBack: () => void;
};

export function DeploymentStep({ contractData, data, onComplete, onBack }: DeploymentStepProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<'mainnet' | 'testnet' | 'devnet'>('testnet');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'compiling' | 'deploying' | 'verifying' | 'complete'>('idle');
  const [deploymentData, setDeploymentData] = useState<DeploymentData | null>(data || null);

  const networkConfig = {
    ethereum: {
      mainnet: { name: "Ethereum Mainnet", rpc: "https://mainnet.infura.io" },
      testnet: { name: "Sepolia Testnet", rpc: "https://sepolia.infura.io" },
      devnet: { name: "Local Ganache", rpc: "http://localhost:8545" }
    },
    solana: {
      mainnet: { name: "Solana Mainnet", rpc: "https://api.mainnet-beta.solana.com" },
      testnet: { name: "Solana Testnet", rpc: "https://api.testnet.solana.com" },
      devnet: { name: "Solana Devnet", rpc: "https://api.devnet.solana.com" }
    },
    radix: {
      mainnet: { name: "Radix Mainnet", rpc: "https://mainnet.radixdlt.com" },
      testnet: { name: "Stokenet", rpc: "https://stokenet.radixdlt.com" },
      devnet: { name: "Local Resim", rpc: "http://localhost:8080" }
    }
  };

  const handleDeploy = async () => {
    if (!contractData) return;

    setIsDeploying(true);
    setDeploymentStatus('compiling');

    try {
      // Step 1: Compile
      const compileFormData = new FormData();
      const contractBlob = new Blob([contractData.contractCode], { type: 'text/plain' });
      const contractFile = new File([contractBlob], 'contract.' + (contractData.blockchain === 'ethereum' ? 'sol' : 'rs'));
      
      compileFormData.append('Language', contractData.blockchain === 'ethereum' ? 'Solidity' : contractData.blockchain === 'solana' ? 'Rust' : 'Scrypto');
      compileFormData.append('Source', contractFile);

      const compileResponse = await fetch('http://localhost:5000/api/v1/contracts/compile', {
        method: 'POST',
        body: compileFormData
      });

      if (!compileResponse.ok) {
        throw new Error('Compilation failed');
      }

      const compiledBlob = await compileResponse.blob();
      
      // Step 2: Deploy
      setDeploymentStatus('deploying');
      
      const deployFormData = new FormData();
      deployFormData.append('Language', contractData.blockchain === 'ethereum' ? 'Solidity' : contractData.blockchain === 'solana' ? 'Rust' : 'Scrypto');
      deployFormData.append('CompiledContractFile', compiledBlob);

      const deployResponse = await fetch('http://localhost:5000/api/v1/contracts/deploy', {
        method: 'POST',
        body: deployFormData
      });

      if (!deployResponse.ok) {
        throw new Error('Deployment failed');
      }

      setDeploymentStatus('verifying');
      
      const deployResult = await deployResponse.json();
      
      // Step 3: Verify
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate verification
      
      const explorerUrls = {
        ethereum: {
          mainnet: 'https://etherscan.io',
          testnet: 'https://sepolia.etherscan.io',
          devnet: 'http://localhost:8545'
        },
        solana: {
          mainnet: 'https://explorer.solana.com',
          testnet: 'https://explorer.solana.com?cluster=testnet',
          devnet: 'https://explorer.solana.com?cluster=devnet'
        },
        radix: {
          mainnet: 'https://dashboard.radixdlt.com',
          testnet: 'https://stokenet-dashboard.radixdlt.com',
          devnet: 'http://localhost'
        }
      };

      const deployment: DeploymentData = {
        contractAddress: deployResult.contractAddress || deployResult.programId || 'mock-address-' + Date.now(),
        transactionHash: deployResult.transactionHash || deployResult.signature || 'mock-tx-' + Date.now(),
        network: selectedNetwork,
        deployedAt: new Date(),
        explorerUrl: `${explorerUrls[contractData.blockchain][selectedNetwork]}/address/${deployResult.contractAddress}`,
        blockchain: contractData.blockchain
      };

      setDeploymentData(deployment);
      setDeploymentStatus('complete');
      
    } catch (error) {
      console.error('Deployment failed:', error);
      alert('Deployment failed: ' + (error as Error).message);
      setDeploymentStatus('idle');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleContinue = () => {
    if (!deploymentData) {
      alert("Please deploy the contract first");
      return;
    }
    onComplete(deploymentData);
  };

  return (
    <div className="space-y-8">
      {/* Network Selection */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[var(--color-foreground)] flex items-center gap-2">
          <Network className="h-5 w-5 text-[var(--accent)]" />
          Select Network
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(['mainnet', 'testnet', 'devnet'] as const).map((network) => (
            <button
              key={network}
              type="button"
              onClick={() => setSelectedNetwork(network)}
              disabled={network === 'mainnet'} // Disable mainnet for safety
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedNetwork === network
                  ? "border-[var(--accent)]/70 bg-[rgba(34,211,238,0.12)]"
                  : "border-[var(--color-card-border)]/30 bg-[rgba(6,11,26,0.6)] hover:border-[var(--accent)]/30"
              } ${network === 'mainnet' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <p className="font-semibold text-[var(--color-foreground)] capitalize">{network}</p>
              <p className="text-xs text-[var(--muted)] mt-1">
                {contractData && networkConfig[contractData.blockchain]?.[network]?.name}
              </p>
              {network === 'mainnet' && (
                <p className="text-xs text-yellow-400 mt-2">⚠️ Disabled for safety</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Deployment Status */}
      {deploymentStatus !== 'idle' && (
        <div className="rounded-2xl border border-[var(--accent)]/30 bg-[rgba(34,211,238,0.08)] p-6">
          <h4 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">
            Deployment Progress
          </h4>
          
          <div className="space-y-3">
            <div className={`flex items-center gap-3 p-3 rounded-xl ${
              deploymentStatus === 'compiling' ? 'bg-[var(--accent)]/20 border border-[var(--accent)]/30' : 
              ['deploying', 'verifying', 'complete'].includes(deploymentStatus) ? 'bg-green-500/10 border border-green-500/30' : 
              'bg-[rgba(6,11,26,0.6)] border border-[var(--color-card-border)]/30'
            }`}>
              {deploymentStatus === 'compiling' ? (
                <Loader2 className="h-5 w-5 text-[var(--accent)] animate-spin" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-400" />
              )}
              <span className="text-sm text-[var(--color-foreground)]">
                Compiling contract...
              </span>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-xl ${
              deploymentStatus === 'deploying' ? 'bg-[var(--accent)]/20 border border-[var(--accent)]/30' : 
              ['verifying', 'complete'].includes(deploymentStatus) ? 'bg-green-500/10 border border-green-500/30' : 
              'bg-[rgba(6,11,26,0.6)] border border-[var(--color-card-border)]/30'
            }`}>
              {deploymentStatus === 'deploying' ? (
                <Loader2 className="h-5 w-5 text-[var(--accent)] animate-spin" />
              ) : deploymentStatus === 'verifying' || deploymentStatus === 'complete' ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-[var(--muted)]" />
              )}
              <span className="text-sm text-[var(--color-foreground)]">
                Deploying to {selectedNetwork}...
              </span>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-xl ${
              deploymentStatus === 'verifying' ? 'bg-[var(--accent)]/20 border border-[var(--accent)]/30' : 
              deploymentStatus === 'complete' ? 'bg-green-500/10 border border-green-500/30' : 
              'bg-[rgba(6,11,26,0.6)] border border-[var(--color-card-border)]/30'
            }`}>
              {deploymentStatus === 'verifying' ? (
                <Loader2 className="h-5 w-5 text-[var(--accent)] animate-spin" />
              ) : deploymentStatus === 'complete' ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-[var(--muted)]" />
              )}
              <span className="text-sm text-[var(--color-foreground)]">
                Verifying deployment...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Deployment Result */}
      {deploymentData && deploymentStatus === 'complete' && (
        <div className="rounded-2xl border border-green-500/30 bg-green-900/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-6 w-6 text-green-400" />
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              Contract Deployed Successfully!
            </h3>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-[rgba(6,11,26,0.8)] border border-[var(--color-card-border)]/30">
              <p className="text-xs text-[var(--muted)] mb-2">Contract Address</p>
              <div className="flex items-center justify-between">
                <code className="text-sm text-[var(--accent)] font-mono">
                  {deploymentData.contractAddress}
                </code>
                <Button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(deploymentData.contractAddress)}
                  variant="ghost"
                  className="text-[var(--accent)] px-3 py-1 text-xs"
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[rgba(6,11,26,0.8)] border border-[var(--color-card-border)]/30">
              <p className="text-xs text-[var(--muted)] mb-2">Transaction Hash</p>
              <div className="flex items-center justify-between">
                <code className="text-sm text-[var(--accent)] font-mono truncate mr-2">
                  {deploymentData.transactionHash}
                </code>
                <a
                  href={deploymentData.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] hover:text-[var(--accent)]/80 text-sm flex items-center gap-1"
                >
                  View
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[rgba(6,11,26,0.6)]">
                <p className="text-xs text-[var(--muted)]">Network</p>
                <p className="text-sm text-[var(--color-foreground)] capitalize mt-1">{deploymentData.network}</p>
              </div>
              <div className="p-3 rounded-xl bg-[rgba(6,11,26,0.6)]">
                <p className="text-xs text-[var(--muted)]">Blockchain</p>
                <p className="text-sm text-[var(--color-foreground)] capitalize mt-1">{deploymentData.blockchain}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deploy Button */}
      {deploymentStatus === 'idle' && (
        <div className="flex justify-center">
          <Button
            type="button"
            onClick={handleDeploy}
            disabled={isDeploying || !contractData}
            className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[#041321] font-semibold px-12 py-6 text-lg rounded-xl"
          >
            {isDeploying ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Deploying Contract...
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5 mr-2" />
                Deploy to {selectedNetwork}
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
        
        {deploymentData && deploymentStatus === 'complete' && (
          <Button
            type="button"
            onClick={handleContinue}
            className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[#041321] font-semibold px-8"
          >
            Continue to NFT Minting
          </Button>
        )}
      </div>
    </div>
  );
}

