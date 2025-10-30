"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MiniConsole, useConsoleLogger } from "@/components/ui/mini-console";
import { Rocket, CheckCircle, AlertCircle, Loader2, Download, Copy } from "lucide-react";
import { deployUATFactory } from "@/services/assetRailApi";

export function UATFactoryDeployment() {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<
    'idle' | 'deploying' | 'complete' | 'error'
  >('idle');
  const [deploymentResult, setDeploymentResult] = useState<{
    contractAddress: string;
    transactionHash: string;
    success: boolean;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState<'mainnet' | 'testnet' | 'devnet'>('devnet');
  const { logs, isActive, setIsActive, log, clearLogs } = useConsoleLogger();

  const handleDeploy = async () => {
    clearLogs();
    setIsActive(true);
    setIsDeploying(true);
    setDeploymentStatus('deploying');
    setErrorMessage('');

    try {
      log.info('🚀 Starting UAT Factory deployment...', '🎯');
      log.info(`📍 Network: ${selectedNetwork}`, '🌐');
      log.info(`📍 API: https://api.assetrail.xyz`, '🔗');
      log.info('');
      log.info('This will use the 3-step pipeline:', '📋');
      log.info('  1. Generate contract from spec', '📝');
      log.info('  2. Compile Rust/Anchor code', '🔨');
      log.info('  3. Deploy to Solana', '🚀');
      log.info('');

      const result = await deployUATFactory(selectedNetwork, (message) => {
        // Format log messages based on content
        if (message.includes('✅')) {
          log.success(message, '✅');
        } else if (message.includes('❌')) {
          log.error(message, '❌');
        } else if (message.includes('📍') || message.includes('🔗')) {
          log.data(message, '📊');
        } else if (message.includes('Step')) {
          log.info(message, '📋');
        } else {
          log.info(message);
        }
      });

      setDeploymentResult(result);
      setDeploymentStatus('complete');

      log.info('');
      log.success('✅ UAT Factory deployed successfully!', '🎉');
      log.info('');
      log.data('You can now use this factory in your wizard:', '💡');
      log.info('  1. Copy the contract address below', '📋');
      log.info('  2. Update your wizard configuration', '⚙️');
      log.info('  3. Start tokenizing properties!', '🏠');

    } catch (error: any) {
      log.error('❌ Deployment failed', '⚠️');
      log.error(`Error: ${error.message}`, '🔴');
      console.error('Deployment error:', error);
      setErrorMessage(error.message);
      setDeploymentStatus('error');
    } finally {
      setIsDeploying(false);
      setIsActive(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      log.success('✅ Copied to clipboard!', '📋');
    } catch (error) {
      log.error('❌ Failed to copy', '⚠️');
    }
  };

  const downloadConfig = () => {
    if (!deploymentResult) return;

    const config = {
      uatFactoryAddress: deploymentResult.contractAddress,
      network: selectedNetwork,
      transactionHash: deploymentResult.transactionHash,
      deployedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uat-factory-${selectedNetwork}-config.json`;
    a.click();
    URL.revokeObjectURL(url);

    log.success('✅ Configuration downloaded!', '📥');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#041321] via-[#06182B] to-[#041321] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            UAT Factory Deployment
          </h1>
          <p className="text-lg text-cyan-200/80">
            Deploy the Universal Asset Token Factory smart contract to Solana
          </p>
        </div>

        {/* Network Selection */}
        {deploymentStatus === 'idle' && (
          <div className="rounded-2xl border border-cyan-500/20 bg-[rgba(34,211,238,0.05)] p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Select Network
            </h3>
            <div className="flex gap-4">
              {(['devnet', 'testnet', 'mainnet'] as const).map((network) => (
                <button
                  key={network}
                  onClick={() => setSelectedNetwork(network)}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    selectedNetwork === network
                      ? 'border-cyan-400 bg-cyan-500/20 text-white'
                      : 'border-gray-600/50 bg-gray-800/20 text-gray-400 hover:border-cyan-500/50'
                  }`}
                >
                  <div className="text-lg font-semibold capitalize">{network}</div>
                  <div className="text-xs mt-1">
                    {network === 'devnet' && 'Development & Testing'}
                    {network === 'testnet' && 'Pre-production Testing'}
                    {network === 'mainnet' && 'Production (Real SOL)'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Deployment Info */}
        <div className="rounded-2xl border border-cyan-500/20 bg-[rgba(34,211,238,0.05)] p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Rocket className="h-5 w-5 text-cyan-400" />
            What will be deployed?
          </h3>
          <div className="space-y-3 text-cyan-100/80">
            <div className="flex items-start gap-3">
              <div className="mt-1">✅</div>
              <div>
                <strong>UAT Factory Contract:</strong> A Solana Anchor program that creates property tokens on demand
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">✅</div>
              <div>
                <strong>Features:</strong> Property token creation, investor whitelisting, KYC compliance, accreditation checks
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">✅</div>
              <div>
                <strong>Compliance:</strong> Reg D 506(c) compliant (2,000 max investors, 365-day lock-up)
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">✅</div>
              <div>
                <strong>Integration:</strong> Works seamlessly with your property tokenization wizard
              </div>
            </div>
          </div>
        </div>

        {/* Deployment Status */}
        {deploymentStatus === 'deploying' && (
          <div className="rounded-2xl border border-cyan-500/30 bg-[rgba(34,211,238,0.08)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
              <h3 className="text-xl font-semibold text-white">
                Deploying to {selectedNetwork}...
              </h3>
            </div>
            <p className="text-cyan-200/80">
              This may take a few minutes. The API is generating, compiling, and deploying your contract.
            </p>
          </div>
        )}

        {/* Error Message */}
        {deploymentStatus === 'error' && (
          <div className="rounded-2xl border border-red-500/30 bg-red-900/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-400" />
              <h3 className="text-xl font-semibold text-red-400">
                Deployment Failed
              </h3>
            </div>
            <p className="text-red-300 mb-4">{errorMessage}</p>
            <Button
              onClick={handleDeploy}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Retry Deployment
            </Button>
          </div>
        )}

        {/* Success Result */}
        {deploymentStatus === 'complete' && deploymentResult && (
          <div className="rounded-2xl border border-green-500/30 bg-green-900/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="h-6 w-6 text-green-400" />
              <h3 className="text-xl font-semibold text-white">
                Deployment Successful!
              </h3>
            </div>

            <div className="space-y-4">
              {/* Contract Address */}
              <div className="p-4 rounded-xl bg-[rgba(6,11,26,0.8)] border border-gray-700">
                <p className="text-xs text-gray-400 mb-2">Contract Address</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-cyan-400 font-mono break-all">
                    {deploymentResult.contractAddress}
                  </code>
                  <button
                    onClick={() => copyToClipboard(deploymentResult.contractAddress)}
                    className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 transition-colors"
                    title="Copy address"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Transaction Hash */}
              <div className="p-4 rounded-xl bg-[rgba(6,11,26,0.8)] border border-gray-700">
                <p className="text-xs text-gray-400 mb-2">Transaction Hash</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-cyan-400 font-mono break-all">
                    {deploymentResult.transactionHash}
                  </code>
                  <button
                    onClick={() => copyToClipboard(deploymentResult.transactionHash)}
                    className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 transition-colors"
                    title="Copy hash"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Network */}
              <div className="p-4 rounded-xl bg-[rgba(6,11,26,0.8)] border border-gray-700">
                <p className="text-xs text-gray-400 mb-2">Network</p>
                <p className="text-lg font-semibold text-white capitalize">{selectedNetwork}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={downloadConfig}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Config
                </Button>
                <a
                  href={`https://explorer.solana.com/address/${deploymentResult.contractAddress}?cluster=${selectedNetwork}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    View on Explorer →
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Deploy Button */}
        {deploymentStatus === 'idle' && (
          <div className="flex justify-center">
            <Button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-12 py-6 text-lg rounded-xl"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="h-5 w-5 mr-2" />
                  Deploy UAT Factory to {selectedNetwork}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Mini Console */}
        {logs.length > 0 && (
          <MiniConsole logs={logs} isActive={isActive} onClear={clearLogs} />
        )}

        {/* Next Steps */}
        {deploymentStatus === 'complete' && (
          <div className="rounded-xl border border-cyan-500/20 bg-[rgba(34,211,238,0.05)] p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Next Steps</h3>
            <ol className="space-y-2 text-cyan-100/80">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">1.</span>
                <span>Copy the contract address above</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">2.</span>
                <span>Update your wizard's <code className="text-cyan-400">uatFactory.ts</code> with the new address</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">3.</span>
                <span>Start tokenizing properties using your wizard!</span>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}











