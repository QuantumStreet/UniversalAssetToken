"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MiniConsole, useConsoleLogger } from "@/components/ui/mini-console";
import { WalletButton, WalletStatus } from "@/components/wallet/simple-wallet-button";
import { YieldChart } from "@/components/charts/yield-chart";
import { PropertyDetails, TrustConfiguration, DeploymentData, NFTMintingData } from "@/types/wizard";
import { Image, ChevronLeft, Loader2, CheckCircle, Upload, Wallet, TrendingUp } from "lucide-react";
import { usePhantomWallet } from '@/hooks/usePhantomWallet';
import { PublicKey, Connection } from '@solana/web3.js';
import { 
  UAT_FACTORY_PROGRAM_ID,
  createProvider, 
  isWalletConnected, 
  completeUATWorkflow 
} from '@/services/uatFactory';

type NFTMintingStepProps = {
  deploymentData?: DeploymentData | { uatMetadata: any; metadataUri: string };
  propertyData?: PropertyDetails;
  trustData?: TrustConfiguration;
  data?: NFTMintingData;
  onComplete: (data: NFTMintingData) => void;
  onBack: () => void;
};

export function NFTMintingStep({ 
  deploymentData, 
  propertyData, 
  trustData,
  data, 
  onComplete, 
  onBack 
}: NFTMintingStepProps) {
  // Solana wallet hooks
  const { publicKey: publicKeyString } = usePhantomWallet();
  const publicKey = publicKeyString ? new PublicKey(publicKeyString) : null;

  const [isMinting, setIsMinting] = useState(false);
  const [mintingStatus, setMintingStatus] = useState<'idle' | 'uploading' | 'minting' | 'complete'>('idle');
  const [nftData, setNftData] = useState<NFTMintingData | null>(data || null);
  const [recipientAddress, setRecipientAddress] = useState(publicKeyString || "");
  const [tokenAmount, setTokenAmount] = useState(1000);
  const { logs, isActive, setIsActive, log, clearLogs } = useConsoleLogger();

  // Check if we're using UAT metadata or legacy deployment
  const isUATMode = deploymentData && 'metadataUri' in deploymentData;
  const uatFactoryAddress = UAT_FACTORY_PROGRAM_ID.toBase58();

  const handleMintNFTs = async () => {
    if (!deploymentData || !propertyData || !trustData) return;

    // Clear previous logs and activate console
    clearLogs();
    setIsActive(true);
    setIsMinting(true);
    setMintingStatus('uploading');

    try {
      log.info('🎯 Starting token minting process...', '🚀');
      
      if (isUATMode) {
        log.info(`📍 UAT Factory: ${uatFactoryAddress}`);
        log.info(`📄 Metadata: ${(deploymentData as any).metadataUri}`);
      } else {
        log.info(`📍 Contract: ${(deploymentData as DeploymentData).contractAddress?.slice(0, 20)}...`);
      }
      
      log.info(`💰 Minting ${tokenAmount.toLocaleString()} tokens`);
      
      // Step 1: Create metadata
      log.info('📝 Creating token metadata...', '✍️');
      const metadata = {
        name: trustData.tokenName,
        symbol: trustData.tokenSymbol,
        description: `Tokenized ownership of property at ${propertyData.propertyAddress}.`,
        image: "ipfs://placeholder-image", // TODO: Upload actual property images
        attributes: [
          { trait_type: "Property Address", value: propertyData.propertyAddress },
          { trait_type: "Property Value", value: `$${propertyData.propertyValue.toLocaleString()}` },
          { trait_type: "Square Footage", value: propertyData.totalSquareFootage },
          { trait_type: "Annual Distribution", value: `${trustData.annualDistributionRate}%` },
          { trait_type: "Token Price", value: `$${trustData.tokenPrice}` },
          { trait_type: "Trust Name", value: trustData.trustName },
        ],
        properties: {
          category: "Real Estate",
          trustType: "Wyoming Statutory Trust",
          blockchain: isUATMode ? 'solana' : (deploymentData as DeploymentData).blockchain,
          contractAddress: isUATMode ? uatFactoryAddress : (deploymentData as DeploymentData).contractAddress
        }
      };
      
      log.success('✅ Metadata created', '📦');
      
      // Step 2: Upload metadata to IPFS
      log.info('📤 Uploading metadata to IPFS...', '🌐');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate IPFS upload for now
      const metadataUri = "ipfs://Qm" + Math.random().toString(36).substring(7);
      log.success('✅ Metadata uploaded to IPFS', '📦');
      log.data(`URI: ${metadataUri}`, '🔗');

      setMintingStatus('minting');

      // Step 3: Mint tokens
      const blockchain = isUATMode ? 'solana' : (deploymentData as DeploymentData).blockchain;
      
      if (blockchain === 'solana') {
        log.info('🔌 Connecting to Solana wallet...', '👛');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Import Universal Minting Service
        const { mintFromContract, isWalletConnected, getWalletAddress } = await import('@/services/contractMinting');
        
        // Check wallet connection
        console.log('🔍 Debug - Wallet connection check:', {
          publicKeyString,
          publicKey: publicKey?.toString(),
          hasPublicKey: !!publicKey
        });
        
        if (!publicKey) {
          log.warning('⚠️ Wallet not connected - user needs to connect', '👛');
          log.warning(`Debug: publicKeyString = ${publicKeyString}`, '🔍');
          throw new Error('Please connect your Solana wallet first');
        }
        
        log.success('✅ Wallet connected', '👛');
        const addressString = publicKey.toString();
        log.data(`Address: ${addressString.slice(0, 8)}...${addressString.slice(-8)}`, '📍');
        
        if (isUATMode) {
          log.info('🏭 Using UAT Factory contract...', '🏗️');
          log.info(`📍 Factory Address: ${uatFactoryAddress}`, '🏗️');
          log.info('');
          
          // Check wallet connection
          if (!publicKey) {
            log.warning('⚠️ Wallet not connected', '👛');
            throw new Error('Please connect your Solana wallet to continue');
          }
          
          log.success('✅ Wallet connected', '👛');
          const addressString = publicKey.toString();
          log.data(`Address: ${addressString.slice(0, 20)}...`, '📍');
          log.info('');
          
          // Create Solana connection
          const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
          
          // Create wallet adapter
          const wallet = {
            publicKey: publicKey,
            signTransaction: async (tx: any) => {
              if (window.solana) {
                return await window.solana.signTransaction(tx);
              }
              throw new Error('Phantom wallet not available');
            },
            signAllTransactions: async (txs: any[]) => {
              if (window.solana) {
                return await window.solana.signAllTransactions(txs);
              }
              throw new Error('Phantom wallet not available');
            }
          };
          
          // Create Anchor provider
          const provider = createProvider(connection, wallet as any);
          
          // Get recipient address (default to connected wallet)
          const recipientPubkey = recipientAddress 
            ? new PublicKey(recipientAddress)
            : new PublicKey(publicKey);
          
          // Extract UAT data
          const uatData = deploymentData as { uatMetadata: any; metadataUri: string };
          
          log.info('📋 Property Token Details:', '📝');
          log.data(`Name: ${trustData.tokenName}`, '🏷️');
          log.data(`Symbol: ${trustData.tokenSymbol}`, '🔤');
          log.data(`Total Supply: ${trustData.tokenSupply?.toLocaleString()} tokens`, '💰');
          log.data(`Metadata: ${uatData.metadataUri.slice(0, 40)}...`, '📄');
          log.info('');
          
          // Execute complete UAT workflow
          const result = await completeUATWorkflow(
            provider,
            uatData.metadataUri,
            trustData.tokenName || 'Property Token',
            trustData.tokenSymbol || 'PROP',
            trustData.tokenSupply || 10000,
            recipientPubkey,
            tokenAmount,
            true, // is_accredited (default to true for MVP)
            (message) => {
              // Log progress from the service
              if (message.includes('✅')) {
                log.success(message, '🎉');
              } else if (message.includes('⚠️')) {
                log.warning(message, '⚠️');
              } else if (message.includes('📍')) {
                log.data(message, '📍');
              } else if (message.includes('📋')) {
                log.info(message, '📋');
              } else {
                log.info(message);
              }
            }
          );
          
          log.info('');
          log.success('✅ UAT Property Tokenization Complete!', '🎉');
          log.info('');
          log.data('Transaction Signatures:', '✍️');
          log.data(`  Create Property: ${result.signatures.createProperty}`, '📝');
          log.data(`  Whitelist Investor: ${result.signatures.whitelist}`, '👤');
          log.data(`  Mint Tokens: ${result.signatures.mint}`, '💰');
          log.info('');
          log.data('On-Chain Addresses:', '📍');
          log.data(`  Property PDA: ${result.propertyPDA.toBase58()}`, '🏠');
          log.data(`  Mint: ${result.mintPDA.toBase58()}`, '💳');
          log.data(`  Token Account: ${result.tokenAccount.toBase58()}`, '💰');
          log.data(`  Whitelist PDA: ${result.whitelistPDA.toBase58()}`, '✅');
          
          const mintData: NFTMintingData = {
            metadataUri: uatData.metadataUri,
            mintedTokens: [{
              tokenId: result.signatures.mint,
              recipient: recipientPubkey.toBase58(),
              amount: tokenAmount
            }],
            totalMinted: tokenAmount,
            collectionAddress: result.propertyPDA.toBase58(),
            explorerUrl: `https://explorer.solana.com/address/${result.mintPDA.toBase58()}?cluster=devnet`
          };
          
          setNftData(mintData);
          setMintingStatus('complete');
        } else {
          // Legacy: Mint from custom deployed contract
          log.info('🏭 Fetching contract IDL...', '📥');
          log.info('🔑 Deriving program accounts...', '🗝️');
          log.info('💳 Setting up token accounts...', '🏦');
          log.info('🎨 Minting tokens from YOUR contract...', '⚙️');
          
          // Mint from YOUR deployed contract using Universal Service
          const result = await mintFromContract(
            (deploymentData as DeploymentData).contractAddress,
            recipientAddress || publicKey,
            tokenAmount,
            'https://api.devnet.solana.com',
            (progress) => {
              // Log progress updates
              if (progress.step === 'fetching-idl') {
                log.info(progress.message, '📥');
              } else if (progress.step === 'deriving-accounts') {
                log.info(progress.message, '🔑');
              } else if (progress.step === 'creating-ata') {
                log.info(progress.message, '💳');
              } else if (progress.step === 'minting') {
                log.info(progress.message, '🎨');
              } else if (progress.step === 'confirming') {
                log.info(progress.message, '⏳');
              }
            }
          );
          
          log.success('✅ Tokens minted successfully!', '🎉');
          log.data(`Signature: ${result.signature.slice(0, 30)}...`, '✍️');
          log.data(`Token Account: ${result.tokenAccount.slice(0, 30)}...`, '💳');
          log.data(`Total Minted: ${result.totalMinted.toLocaleString()}`, '📊');
          
          const mintData: NFTMintingData = {
            metadataUri,
            mintedTokens: [{
              tokenId: result.signature,
              recipient: recipientAddress || publicKey,
              amount: tokenAmount
            }],
            totalMinted: tokenAmount,
            collectionAddress: (deploymentData as DeploymentData).contractAddress,
            explorerUrl: result.explorerUrl
          };

          setNftData(mintData);
          setMintingStatus('complete');
        }
        
      } else {
        // Ethereum or Radix minting logic (placeholder for now)
        log.info('⚠️ Non-Solana minting not yet implemented', '🚧');
        log.info('💡 Using simulated minting for now...', '🎭');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const mockMintData: NFTMintingData = {
          metadataUri: isUATMode ? (deploymentData as any).metadataUri : metadataUri,
          mintedTokens: [{
            tokenId: 'token-' + Date.now(),
            recipient: recipientAddress || 'mock-address',
            amount: tokenAmount
          }],
          totalMinted: tokenAmount,
          collectionAddress: isUATMode ? uatFactoryAddress : (deploymentData as DeploymentData).contractAddress
        };

        setNftData(mockMintData);
        setMintingStatus('complete');
        log.success('✅ Simulated minting complete', '✨');
      }
      
      log.success('━━━ Minting Complete ━━━', '🎉');
      
    } catch (error) {
      log.error('❌ Minting failed', '⚠️');
      log.error(`Error: ${(error as Error).message}`, '🔴');
      console.error('Token minting failed:', error);
      alert('Token minting failed: ' + (error as Error).message);
      setMintingStatus('idle');
    } finally {
      setIsMinting(false);
      setIsActive(false);
    }
  };

  const handleContinue = () => {
    if (!nftData) {
      alert("Please mint NFTs first");
      return;
    }
    onComplete(nftData);
  };

  const beneficiaryData = { occupancyRights: false, votingRights: false, transferRights: false };

  return (
    <div className="space-y-8">
      {/* Wallet Connection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[var(--color-foreground)] flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[var(--accent)]" />
            Wallet Connection
          </h3>
          <WalletButton />
        </div>
        
        <WalletStatus />
      </div>

      {/* NFT Configuration */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-[var(--color-foreground)] flex items-center gap-2">
          <Image className="h-5 w-5 text-[var(--accent)]" />
          Token Minting Configuration
        </h3>

        <div className="rounded-2xl border border-[var(--accent)]/20 bg-[rgba(34,211,238,0.05)] p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-[var(--muted)] mb-2">Token Name</p>
              <p className="text-lg font-semibold text-[var(--color-foreground)]">{trustData?.tokenName}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--muted)] mb-2">Symbol</p>
              <p className="text-lg font-semibold text-[var(--color-foreground)]">{trustData?.tokenSymbol}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--muted)] mb-2">Total Supply</p>
              <p className="text-lg font-semibold text-[var(--color-foreground)]">{trustData?.tokenSupply?.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-cyan-200">
            Recipient Address (Optional)
          </label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="0x... or wallet address"
            className="w-full rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          />
          <p className="text-xs text-[var(--muted)]">
            Leave empty to mint to your connected wallet
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-cyan-200">
            Initial Mint Amount
          </label>
          <input
            type="number"
            value={tokenAmount}
            onChange={(e) => setTokenAmount(Number(e.target.value))}
            min="1"
            max={trustData?.tokenSupply || 1}
            className="w-full rounded-xl border border-[var(--color-card-border)]/50 bg-[rgba(6,11,26,0.8)] px-4 py-3 text-[var(--color-foreground)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          />
          <p className="text-xs text-[var(--muted)]">
            Mint {tokenAmount.toLocaleString()} of {trustData?.tokenSupply?.toLocaleString()} total tokens
          </p>
        </div>
      </div>

      {/* Yield Projections */}
      {propertyData && trustData && (propertyData.annualRentalIncome || propertyData.netIncome) && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-[var(--color-foreground)] flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
            Token Yield Projections
          </h3>

          <YieldChart
            data={{
              annualRentalIncome: propertyData.annualRentalIncome || (propertyData.netIncome || 0) * 1.1,
              annualExpenses: propertyData.annualExpenses || (propertyData.annualRentalIncome || 0) * 0.1,
              tokenSupply: trustData.tokenSupply || 1,
              distributionRate: trustData.annualDistributionRate || 90,
              reserveFundRate: trustData.reserveFundRate || 10,
              trusteeFeeRate: trustData.trusteeFeeRate || 1
            }}
            tokenPrice={trustData.tokenPrice || 0}
          />
        </div>
      )}

      {/* Minting Status */}
      {mintingStatus !== 'idle' && (
        <div className="rounded-2xl border border-[var(--accent)]/30 bg-[rgba(34,211,238,0.08)] p-6">
          <h4 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">
            Minting Progress
          </h4>
          
          <div className="space-y-3">
            <div className={`flex items-center gap-3 p-3 rounded-xl ${
              mintingStatus === 'uploading' ? 'bg-[var(--accent)]/20 border border-[var(--accent)]/30' : 
              ['minting', 'complete'].includes(mintingStatus) ? 'bg-green-500/10 border border-green-500/30' : 
              'bg-[rgba(6,11,26,0.6)]'
            }`}>
              {mintingStatus === 'uploading' ? (
                <Loader2 className="h-5 w-5 text-[var(--accent)] animate-spin" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-400" />
              )}
              <span className="text-sm text-[var(--color-foreground)]">
                Uploading metadata to IPFS...
              </span>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-xl ${
              mintingStatus === 'minting' ? 'bg-[var(--accent)]/20 border border-[var(--accent)]/30' : 
              mintingStatus === 'complete' ? 'bg-green-500/10 border border-green-500/30' : 
              'bg-[rgba(6,11,26,0.6)]'
            }`}>
              {mintingStatus === 'minting' ? (
                <Loader2 className="h-5 w-5 text-[var(--accent)] animate-spin" />
              ) : mintingStatus === 'complete' ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-[var(--muted)]" />
              )}
              <span className="text-sm text-[var(--color-foreground)]">
                Minting NFTs...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Minting Result */}
      {nftData && mintingStatus === 'complete' && (
        <div className="rounded-2xl border border-green-500/30 bg-green-900/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-6 w-6 text-green-400" />
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              Property Tokens Minted Successfully!
            </h3>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-[rgba(6,11,26,0.8)] border border-[var(--color-card-border)]/30">
              <p className="text-xs text-[var(--muted)] mb-2">Transaction Signature</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm text-[var(--accent)] font-mono truncate">
                  {nftData.mintedTokens[0]?.tokenId}
                </code>
                {nftData.explorerUrl && (
                  <a
                    href={nftData.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:text-[var(--accent)]/80 text-xs whitespace-nowrap"
                  >
                    View on Explorer →
                  </a>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[rgba(6,11,26,0.8)] border border-[var(--color-card-border)]/30">
              <p className="text-xs text-[var(--muted)] mb-2">Total Minted</p>
              <p className="text-2xl font-bold text-[var(--accent)]">
                {nftData.totalMinted.toLocaleString()} {nftData.totalMinted === 1 ? 'Token' : 'Tokens'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[rgba(6,11,26,0.8)] border border-[var(--color-card-border)]/30">
              <p className="text-xs text-[var(--muted)] mb-2">Recipient</p>
              <code className="text-sm text-[var(--accent)] font-mono break-all">
                {nftData.mintedTokens[0]?.recipient}
              </code>
            </div>

            {nftData.metadataUri && (
              <div className="p-4 rounded-xl bg-[rgba(6,11,26,0.8)] border border-[var(--color-card-border)]/30">
                <p className="text-xs text-[var(--muted)] mb-2">Metadata URI</p>
                <code className="text-sm text-[var(--accent)] font-mono break-all">
                  {nftData.metadataUri}
                </code>
              </div>
            )}

            {nftData.collectionAddress && (
              <div className="p-4 rounded-xl bg-[rgba(6,11,26,0.8)] border border-[var(--color-card-border)]/30">
                <p className="text-xs text-[var(--muted)] mb-2">Contract Address</p>
                <code className="text-sm text-[var(--accent)] font-mono break-all">
                  {nftData.collectionAddress}
                </code>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mint Button */}
      {mintingStatus === 'idle' && (
        <div className="flex justify-center">
          <Button
            type="button"
            onClick={handleMintNFTs}
            disabled={isMinting || !deploymentData}
            className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[#041321] font-semibold px-12 py-6 text-lg rounded-xl"
          >
            {isMinting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Minting NFTs...
              </>
            ) : (
              <>
                <Image className="h-5 w-5 mr-2" />
                Mint Property Tokens from Contract
              </>
            )}
          </Button>
        </div>
      )}

      {/* Info Card */}
      <div className="rounded-xl border border-[var(--accent)]/20 bg-[rgba(34,211,238,0.05)] p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-[var(--accent)]/20 p-2">
            <Wallet className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <div className="flex-1">
            {isUATMode ? (
              <>
                <p className="text-sm font-semibold text-[var(--color-foreground)] mb-1">
                  Minting from UAT Factory Contract
                </p>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  This will create a new property token collection using the Universal Asset Token factory at{' '}
                  <code className="text-[var(--accent)] font-mono text-[11px]">
                    {uatFactoryAddress.slice(0, 20)}...
                  </code>
                  {'. '}
                  Your UAT metadata (at <code className="text-[var(--accent)] font-mono text-[11px]">
                    {(deploymentData as any)?.metadataUri?.slice(0, 30)}...
                  </code>) will be linked on-chain.
                </p>
                <p className="text-xs text-[var(--muted)] mt-2">
                  💡 All Wyoming Trust business logic (75% distributions, 20% reserve, 5% fees) will be enforced on-chain.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-[var(--color-foreground)] mb-1">
                  Minting from YOUR Contract
                </p>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  This will mint tokens directly from your deployed Wyoming Trust property contract at{' '}
                  <code className="text-[var(--accent)] font-mono text-[11px]">
                    {(deploymentData as DeploymentData)?.contractAddress?.slice(0, 20)}...
                  </code>
                  {'. '}
                  All Wyoming Trust business logic will be enforced on-chain.
                </p>
                <p className="text-xs text-[var(--muted)] mt-2">
                  💡 Your connected Phantom/Solflare wallet will sign the transaction.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

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
        
        {nftData && mintingStatus === 'complete' && (
          <Button
            type="button"
            onClick={handleContinue}
            className="bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-[#041321] font-semibold px-8"
          >
            Continue to DAT Integration
          </Button>
        )}
      </div>

      {/* Mini Console - Shows minting process */}
      {logs.length > 0 && (
        <MiniConsole
          logs={logs}
          isActive={isActive}
          onClear={clearLogs}
        />
      )}
    </div>
  );
}

