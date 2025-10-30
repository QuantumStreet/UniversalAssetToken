/**
 * AssetRail API Service
 * 
 * Integrates with the actual AssetRail API at api.assetrail.xyz
 * Uses the 3-step deployment pipeline: Generate → Compile → Deploy
 */

import { API_CONFIG } from '@/lib/config';

const API_BASE_URL = API_CONFIG.AI_API; // https://api.assetrail.xyz

// ============================================================================
// Type Definitions
// ============================================================================

export interface DeploymentResult {
  contractAddress: string;
  success: boolean;
  transactionHash: string;
}

export interface ContractGenerationSpec {
  contractType: 'UAT_FACTORY' | 'PROPERTY_TOKEN';
  blockchain: 'solana' | 'ethereum' | 'radix';
  network: 'mainnet' | 'testnet' | 'devnet';
  parameters: {
    tokenName?: string;
    tokenSymbol?: string;
    totalSupply?: number;
    metadataUri?: string;
    [key: string]: any;
  };
}

// ============================================================================
// AssetRail API Client
// ============================================================================

export class AssetRailApiClient {
  private baseUrl: string;
  private onProgress?: (message: string) => void;

  constructor(baseUrl: string = API_BASE_URL, onProgress?: (message: string) => void) {
    this.baseUrl = baseUrl;
    this.onProgress = onProgress;
  }

  private log(message: string) {
    console.log(`[AssetRail API] ${message}`);
    this.onProgress?.(message);
  }

  /**
   * Step 1: Generate contract source code from JSON specification
   */
  async generateContract(
    spec: ContractGenerationSpec,
    language: 'Rust' | 'Solidity' | 'Scrypto'
  ): Promise<string> {
    this.log('📝 Step 1/3: Generating contract source code...');
    this.log(`   Language: ${language}`);
    this.log(`   Contract Type: ${spec.contractType}`);

    try {
      // Create JSON specification file
      const jsonSpec = JSON.stringify(spec, null, 2);
      const jsonBlob = new Blob([jsonSpec], { type: 'application/json' });
      const jsonFile = new File([jsonBlob], 'contract-spec.json', { type: 'application/json' });

      // Prepare form data
      const formData = new FormData();
      formData.append('JsonFile', jsonFile);
      formData.append('Language', language);

      // Call API
      const response = await fetch(`${this.baseUrl}/api/v1/contracts/generate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Generation failed (${response.status}): ${errorText}`);
      }

      const sourceCode = await response.text();
      this.log('✅ Contract source code generated');
      this.log(`   Size: ${sourceCode.length} characters`);

      return sourceCode;
    } catch (error: any) {
      this.log(`❌ Generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Step 2: Compile contract source code to bytecode + ABI
   */
  async compileContract(
    sourceCode: string,
    language: 'Rust' | 'Solidity' | 'Scrypto',
    filename: string
  ): Promise<Blob> {
    this.log('🔨 Step 2/3: Compiling contract...');
    this.log(`   Language: ${language}`);

    try {
      // Create source code file
      const sourceBlob = new Blob([sourceCode], { type: 'text/plain' });
      const sourceFile = new File([sourceBlob], filename);

      // Prepare form data
      const formData = new FormData();
      formData.append('SourceCodeFile', sourceFile);
      formData.append('Language', language);

      // Call API
      const response = await fetch(`${this.baseUrl}/api/v1/contracts/compile`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Compilation failed (${response.status}): ${errorText}`);
      }

      const compiledBlob = await response.blob();
      this.log('✅ Contract compiled successfully');
      this.log(`   Artifact size: ${compiledBlob.size} bytes`);

      return compiledBlob;
    } catch (error: any) {
      this.log(`❌ Compilation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Step 3: Deploy compiled contract to blockchain
   */
  async deployContract(
    compiledBlob: Blob,
    language: 'Rust' | 'Solidity' | 'Scrypto'
  ): Promise<DeploymentResult> {
    this.log('🚀 Step 3/3: Deploying contract to blockchain...');
    this.log(`   Language: ${language}`);

    try {
      // Extract ABI and bytecode from compiled blob
      // For now, we'll send the whole blob as both (the API will handle it)
      const formData = new FormData();
      formData.append('AbiFile', compiledBlob, 'contract.abi');
      formData.append('BytecodeFile', compiledBlob, 'contract.bytecode');
      formData.append('Language', language);

      // Call API
      const response = await fetch(`${this.baseUrl}/api/v1/contracts/deploy`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Deployment failed (${response.status}): ${errorText}`);
      }

      const result: DeploymentResult = await response.json();
      
      this.log('✅ Contract deployed successfully!');
      this.log(`   Contract Address: ${result.contractAddress}`);
      this.log(`   Transaction Hash: ${result.transactionHash}`);
      this.log(`   Success: ${result.success}`);

      return result;
    } catch (error: any) {
      this.log(`❌ Deployment failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Complete workflow: Generate → Compile → Deploy
   */
  async deployUATFactory(
    network: 'mainnet' | 'testnet' | 'devnet' = 'devnet'
  ): Promise<DeploymentResult> {
    this.log('🎯 Starting UAT Factory deployment workflow...');
    this.log(`   Network: ${network}`);
    this.log('');

    try {
      // Step 1: Generate contract specification
      const spec: ContractGenerationSpec = {
        contractType: 'UAT_FACTORY',
        blockchain: 'solana',
        network: network,
        parameters: {
          // UAT Factory doesn't need specific parameters at deploy time
          // The factory will create property tokens on demand
        },
      };

      const sourceCode = await this.generateContract(spec, 'Rust');
      this.log('');

      // Step 2: Compile
      const compiledBlob = await this.compileContract(
        sourceCode,
        'Rust',
        'uat_factory.rs'
      );
      this.log('');

      // Step 3: Deploy
      const result = await this.deployContract(compiledBlob, 'Rust');
      this.log('');

      this.log('✅ UAT Factory deployment complete!');
      this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.log(`📍 Factory Address: ${result.contractAddress}`);
      this.log(`🔗 Transaction: ${result.transactionHash}`);
      this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return result;
    } catch (error: any) {
      this.log('');
      this.log('❌ Deployment workflow failed');
      this.log(`   Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deploy a property-specific token contract
   */
  async deployPropertyToken(
    tokenName: string,
    tokenSymbol: string,
    totalSupply: number,
    metadataUri: string,
    network: 'mainnet' | 'testnet' | 'devnet' = 'devnet'
  ): Promise<DeploymentResult> {
    this.log('🏠 Starting Property Token deployment...');
    this.log(`   Token: ${tokenName} (${tokenSymbol})`);
    this.log(`   Supply: ${totalSupply.toLocaleString()}`);
    this.log(`   Network: ${network}`);
    this.log('');

    try {
      // Step 1: Generate contract
      const spec: ContractGenerationSpec = {
        contractType: 'PROPERTY_TOKEN',
        blockchain: 'solana',
        network: network,
        parameters: {
          tokenName,
          tokenSymbol,
          totalSupply,
          metadataUri,
        },
      };

      const sourceCode = await this.generateContract(spec, 'Rust');
      this.log('');

      // Step 2: Compile
      const compiledBlob = await this.compileContract(
        sourceCode,
        'Rust',
        `${tokenSymbol.toLowerCase()}_token.rs`
      );
      this.log('');

      // Step 3: Deploy
      const result = await this.deployContract(compiledBlob, 'Rust');
      this.log('');

      this.log('✅ Property Token deployment complete!');
      this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.log(`📍 Contract Address: ${result.contractAddress}`);
      this.log(`🔗 Transaction: ${result.transactionHash}`);
      this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return result;
    } catch (error: any) {
      this.log('');
      this.log('❌ Property Token deployment failed');
      this.log(`   Error: ${error.message}`);
      throw error;
    }
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create AssetRail API client
 */
export function createAssetRailClient(onProgress?: (message: string) => void): AssetRailApiClient {
  return new AssetRailApiClient(API_BASE_URL, onProgress);
}

/**
 * Deploy UAT Factory using AssetRail API
 */
export async function deployUATFactory(
  network: 'mainnet' | 'testnet' | 'devnet' = 'devnet',
  onProgress?: (message: string) => void
): Promise<DeploymentResult> {
  const client = createAssetRailClient(onProgress);
  return await client.deployUATFactory(network);
}

/**
 * Deploy Property Token using AssetRail API
 */
export async function deployPropertyToken(
  tokenName: string,
  tokenSymbol: string,
  totalSupply: number,
  metadataUri: string,
  network: 'mainnet' | 'testnet' | 'devnet' = 'devnet',
  onProgress?: (message: string) => void
): Promise<DeploymentResult> {
  const client = createAssetRailClient(onProgress);
  return await client.deployPropertyToken(
    tokenName,
    tokenSymbol,
    totalSupply,
    metadataUri,
    network
  );
}

/**
 * Check API health
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}


