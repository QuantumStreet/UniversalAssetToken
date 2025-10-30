/**
 * UAT Factory Deployment Script
 * 
 * Alternative deployment method using Node.js + Anchor
 * Works around the need for Solana build tools
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚀 UAT Factory Deployment to Solana Devnet');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

const PROGRAM_ID = 'UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm';
const CONTRACT_PATH = 'programs/rust-main-template/src/lib.rs';

// Check if contract exists
if (!fs.existsSync(CONTRACT_PATH)) {
  console.error('❌ Contract not found at:', CONTRACT_PATH);
  process.exit(1);
}

console.log('✅ Contract found');
console.log('📍 Program ID:', PROGRAM_ID);
console.log('');

// Step 1: Check prerequisites
console.log('📋 Checking prerequisites...');
try {
  const rustVersion = execSync('rustc --version', { encoding: 'utf-8' }).trim();
  console.log('  ✅ Rust:', rustVersion);
} catch (e) {
  console.error('  ❌ Rust not installed');
  process.exit(1);
}

try {
  const solanaVersion = execSync('solana --version', { encoding: 'utf-8' }).trim();
  console.log('  ✅ Solana CLI:', solanaVersion);
} catch (e) {
  console.error('  ❌ Solana CLI not installed');
  process.exit(1);
}

try {
  const anchorVersion = execSync('anchor --version', { encoding: 'utf-8' }).trim();
  console.log('  ✅ Anchor:', anchorVersion);
} catch (e) {
  console.error('  ❌ Anchor not installed');
  process.exit(1);
}

console.log('');

// Step 2: Configure Solana
console.log('⚙️  Configuring Solana for devnet...');
try {
  execSync('solana config set --url https://api.devnet.solana.com', { stdio: 'inherit' });
  const wallet = execSync('solana address', { encoding: 'utf-8' }).trim();
  console.log('  ✅ Wallet:', wallet);
  
  const balance = execSync('solana balance', { encoding: 'utf-8' }).trim();
  console.log('  💰 Balance:', balance);
} catch (e) {
  console.error('  ❌ Solana configuration failed');
  process.exit(1);
}

console.log('');

// Step 3: Build
console.log('🔨 Building contract...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
try {
  execSync('anchor build', { stdio: 'inherit', cwd: __dirname });
  console.log('');
  console.log('✅ Build successful!');
  
  // Check if binary exists
  const binaryPath = 'target/deploy/uat_factory.so';
  if (fs.existsSync(binaryPath)) {
    const stats = fs.statSync(binaryPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`  📦 Binary size: ${sizeKB} KB`);
  }
} catch (e) {
  console.error('');
  console.error('❌ Build failed!');
  console.error('');
  console.error('This likely means you need to install Solana platform tools:');
  console.error('  sh -c "$(curl -sSfL https://release.solana.com/v1.18.20/install)"');
  console.error('');
  console.error('Or upgrade Anchor to 0.29.0:');
  console.error('  cargo install --git https://github.com/coral-xyz/anchor avm --locked --force');
  console.error('  avm install 0.29.0 && avm use 0.29.0');
  process.exit(1);
}

console.log('');

// Step 4: Deploy
console.log('🚀 Deploying to Solana Devnet...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
try {
  execSync('anchor deploy --provider.cluster devnet', { stdio: 'inherit', cwd: __dirname });
  console.log('');
  console.log('✅ Deployment successful!');
} catch (e) {
  console.error('');
  console.error('❌ Deployment failed!');
  console.error('');
  console.error('Common issues:');
  console.error('  - Insufficient SOL (need ~2 SOL for deployment)');
  console.error('  - Network connectivity');
  console.error('  - Program already deployed (use anchor upgrade instead)');
  process.exit(1);
}

console.log('');

// Step 5: Verify
console.log('🔍 Verifying deployment...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
try {
  const programInfo = execSync(`solana program show ${PROGRAM_ID} --url devnet`, { encoding: 'utf-8' });
  console.log(programInfo);
} catch (e) {
  console.warn('⚠️  Could not fetch program info (might take a moment to propagate)');
}

console.log('');

// Step 6: Success message
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ DEPLOYMENT COMPLETE!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('Program ID:', PROGRAM_ID);
console.log('Network: Solana Devnet');
console.log('Explorer: https://explorer.solana.com/address/' + PROGRAM_ID + '?cluster=devnet');
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📝 Next Steps:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('1. Copy IDL to wizard:');
console.log('   cp target/idl/uat_factory.json ../../apps/property-tokenization-wizard/src/idl/');
console.log('');
console.log('2. Update wizard service:');
console.log('   - Open: apps/property-tokenization-wizard/src/services/uatFactory.ts');
console.log('   - Add: import idl from \'../idl/uat_factory.json\'');
console.log('   - Uncomment real Anchor code (replace simulation)');
console.log('');
console.log('3. Test in wizard:');
console.log('   cd ../../apps/property-tokenization-wizard');
console.log('   npm run dev');
console.log('   - Extract property, configure trust, mint tokens!');
console.log('');
console.log('🎉 Your UAT Factory is now live on Solana Devnet!');
console.log('');

