/**
 * Deploy UAT Factory to Solana Devnet
 * 
 * This script deploys the UAT Factory smart contract once using the AssetRail API.
 * The wizard will then use this contract address to create property tokens on demand.
 */

import fs from 'fs';
import path from 'path';

const API_BASE_URL = 'https://api.assetrail.xyz';

// UAT Factory Contract Specification
const UAT_FACTORY_SPEC = {
  contractType: 'UAT_FACTORY',
  blockchain: 'solana',
  network: 'devnet',
  parameters: {
    name: 'UAT Property Token Factory',
    description: 'Universal Asset Token factory for property tokenization with Wyoming Trust compliance',
    version: '1.0.0',
    
    features: {
      propertyTokenCreation: true,
      investorWhitelisting: true,
      kycCompliance: true,
      accreditationChecks: true,
      supplyManagement: true,
      investorCapEnforcement: true,
    },
    
    compliance: {
      maxInvestors: 2000,
      lockUpPeriod: 365,
      accreditedOnly: true,
      kycRequired: true,
    },
    
    instructions: [
      {
        name: 'initialize_factory',
        description: 'Initialize the UAT factory',
        accounts: ['factory', 'authority', 'system_program'],
        parameters: [],
      },
      {
        name: 'create_property_token',
        description: 'Create a new property token collection',
        accounts: ['factory', 'property', 'mint', 'authority', 'token_program', 'system_program', 'rent'],
        parameters: [
          { name: 'metadata_uri', type: 'String', maxLength: 200 },
          { name: 'token_name', type: 'String', maxLength: 64 },
          { name: 'token_symbol', type: 'String', maxLength: 10 },
          { name: 'total_supply', type: 'u64' },
        ],
      },
      {
        name: 'add_to_whitelist',
        description: 'Add an investor to the whitelist',
        accounts: ['property', 'whitelist', 'investor', 'authority', 'system_program'],
        parameters: [
          { name: 'investor', type: 'Pubkey' },
          { name: 'kyc_hash', type: '[u8; 32]' },
          { name: 'is_accredited', type: 'bool' },
        ],
      },
      {
        name: 'mint_property_tokens',
        description: 'Mint tokens to a whitelisted investor',
        accounts: [
          'property', 'mint', 'whitelist', 'recipient_token_account',
          'recipient', 'authority', 'token_program', 'associated_token_program',
          'system_program', 'rent'
        ],
        parameters: [
          { name: 'amount', type: 'u64' },
        ],
      },
    ],
  },
};

async function deployUATFactory() {
  console.log('🚀 Starting UAT Factory deployment...');
  console.log('📍 API:', API_BASE_URL);
  console.log('🌐 Network: devnet');
  console.log('');

  try {
    // Step 1: Generate contract
    console.log('📋 Step 1/3: Generating contract source code...');
    
    // Save spec to temp file
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    
    const specPath = path.join(tempDir, 'uat-factory-spec.json');
    fs.writeFileSync(specPath, JSON.stringify(UAT_FACTORY_SPEC, null, 2));
    
    const FormData = (await import('form-data')).default;
    const generateForm = new FormData();
    generateForm.append('JsonFile', fs.createReadStream(specPath));
    generateForm.append('Language', 'Rust');

    const generateResponse = await fetch(`${API_BASE_URL}/api/v1/contracts/generate`, {
      method: 'POST',
      body: generateForm,
      headers: generateForm.getHeaders(),
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      throw new Error(`Generation failed (${generateResponse.status}): ${errorText}`);
    }

    const sourceCode = await generateResponse.text();
    console.log('✅ Contract generated');
    console.log(`   Size: ${sourceCode.length} characters`);
    console.log('');

    // Step 2: Compile contract
    console.log('📋 Step 2/3: Compiling contract...');
    
    const sourcePath = path.join(tempDir, 'uat_factory.rs');
    fs.writeFileSync(sourcePath, sourceCode);
    
    const compileForm = new FormData();
    compileForm.append('SourceCodeFile', fs.createReadStream(sourcePath));
    compileForm.append('Language', 'Rust');

    const compileResponse = await fetch(`${API_BASE_URL}/api/v1/contracts/compile`, {
      method: 'POST',
      body: compileForm,
      headers: compileForm.getHeaders(),
    });

    if (!compileResponse.ok) {
      const errorText = await compileResponse.text();
      throw new Error(`Compilation failed (${compileResponse.status}): ${errorText}`);
    }

    const compiledBuffer = Buffer.from(await compileResponse.arrayBuffer());
    console.log('✅ Contract compiled');
    console.log(`   Artifact size: ${compiledBuffer.length} bytes`);
    console.log('');

    // Step 3: Deploy contract
    console.log('📋 Step 3/3: Deploying to Solana devnet...');
    
    const abiPath = path.join(tempDir, 'uat_factory.abi');
    const bytecodePath = path.join(tempDir, 'uat_factory.so');
    fs.writeFileSync(abiPath, compiledBuffer);
    fs.writeFileSync(bytecodePath, compiledBuffer);
    
    const deployForm = new FormData();
    deployForm.append('AbiFile', fs.createReadStream(abiPath));
    deployForm.append('BytecodeFile', fs.createReadStream(bytecodePath));
    deployForm.append('Language', 'Rust');

    const deployResponse = await fetch(`${API_BASE_URL}/api/v1/contracts/deploy`, {
      method: 'POST',
      body: deployForm,
      headers: deployForm.getHeaders(),
    });

    if (!deployResponse.ok) {
      const errorText = await deployResponse.text();
      throw new Error(`Deployment failed (${deployResponse.status}): ${errorText}`);
    }

    const result = await deployResponse.json();
    console.log('✅ Contract deployed successfully!');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 Contract Address:', result.contractAddress);
    console.log('🔗 Transaction Hash:', result.transactionHash);
    console.log('✅ Success:', result.success);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🌐 View on Explorer:');
    console.log(`https://explorer.solana.com/address/${result.contractAddress}?cluster=devnet`);
    console.log('');
    console.log('📝 Next Steps:');
    console.log('1. Update src/services/uatFactory.ts with this address');
    console.log('2. The wizard will now use this factory for all property tokenizations');
    console.log('');

    // Save config
    const config = {
      uatFactoryAddress: result.contractAddress,
      transactionHash: result.transactionHash,
      network: 'devnet',
      deployedAt: new Date().toISOString(),
      explorerUrl: `https://explorer.solana.com/address/${result.contractAddress}?cluster=devnet`,
    };

    fs.writeFileSync(
      './uat-factory-config.json',
      JSON.stringify(config, null, 2)
    );

    console.log('✅ Configuration saved to: uat-factory-config.json');
    console.log('');

    return result;

  } catch (error: any) {
    console.error('');
    console.error('❌ Deployment failed');
    console.error(`   Error: ${error.message}`);
    console.error('');
    process.exit(1);
  }
}

// Run deployment
deployUATFactory();

