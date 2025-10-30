/**
 * Deploy UAT Factory using the EXISTING source code
 * 
 * This uses the already-written Rust code from contracts/uat-factory-final/
 */

import fs from 'fs';
import path from 'path';

const API_BASE_URL = 'https://api.assetrail.xyz';

async function deployExistingUATFactory() {
  console.log('🚀 Deploying EXISTING UAT Factory code...');
  console.log('📍 Using: contracts/uat-factory-final/programs/rust-main-template/src/lib.rs');
  console.log('');

  try {
    // Read the existing Rust source code
    const contractsRoot = path.join(process.cwd(), '../../contracts/uat-factory-final');
    const sourcePath = path.join(contractsRoot, 'programs/rust-main-template/src/lib.rs');
    
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`UAT Factory source not found at: ${sourcePath}`);
    }

    const sourceCode = fs.readFileSync(sourcePath, 'utf-8');
    console.log('✅ Loaded existing UAT Factory source');
    console.log(`   Size: ${sourceCode.length} characters`);
    console.log('');

    // Step 1: Compile the existing code
    console.log('📋 Step 1/2: Compiling contract...');
    
    const FormData = (await import('form-data')).default;
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    
    const tempSourcePath = path.join(tempDir, 'lib.rs');
    fs.writeFileSync(tempSourcePath, sourceCode);
    
    const compileForm = new FormData();
    compileForm.append('SourceCodeFile', fs.createReadStream(tempSourcePath));
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

    // Step 2: Deploy
    console.log('📋 Step 2/2: Deploying to Solana devnet...');
    
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
    
    console.log('✅ UAT Factory deployed!');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 Contract Address:', result.contractAddress);
    console.log('🔗 Transaction Hash:', result.transactionHash);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🌐 View on Explorer:');
    console.log(`https://explorer.solana.com/address/${result.contractAddress}?cluster=devnet`);
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

    console.log('✅ Config saved: uat-factory-config.json');
    console.log('');
    console.log('📝 Update your wizard:');
    console.log('   File: src/services/uatFactory.ts');
    console.log(`   Line 13: export const UAT_FACTORY_PROGRAM_ID = new PublicKey('${result.contractAddress}');`);
    console.log('');

    return result;

  } catch (error: any) {
    console.error('');
    console.error('❌ Deployment failed');
    console.error(`   Error: ${error.message}`);
    console.error('');
    
    // Provide helpful suggestions
    if (error.message.includes('Compilation failed')) {
      console.error('💡 Suggestion: The API might not support Solana/Anchor compilation.');
      console.error('   Alternative: Use `anchor build` locally in contracts/uat-factory-final/');
      console.error('   Then deploy the compiled .so file manually to Solana devnet.');
    }
    
    process.exit(1);
  }
}

deployExistingUATFactory();











