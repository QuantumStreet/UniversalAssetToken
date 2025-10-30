#!/bin/bash
set -e

echo "🚀 UAT Factory - Quick Deploy to Devnet"
echo "========================================"
echo ""

# Navigate to contract directory
cd "$(dirname "$0")"

# Configure for devnet
echo "🔧 Configuring Solana CLI for devnet..."
solana config set --url https://api.devnet.solana.com
echo ""

# Get wallet address
WALLET=$(solana address)
echo "👛 Wallet: $WALLET"
echo ""

# Check balance
echo "💰 Checking balance..."
BALANCE=$(solana balance 2>/dev/null || echo "0 SOL")
echo "   Balance: $BALANCE"

# Parse balance number
BALANCE_NUM=$(echo $BALANCE | awk '{print $1}')

# Check if we need airdrop
if (( $(echo "$BALANCE_NUM < 1" | bc -l 2>/dev/null || echo "1") )); then
  echo ""
  echo "⚠️  Low balance detected. Requesting airdrop..."
  echo "   (This may take 30 seconds...)"
  
  # Try airdrop
  if solana airdrop 2 2>/dev/null; then
    echo "✅ Airdrop successful!"
    sleep 5
  else
    echo ""
    echo "❌ Airdrop failed. Please get devnet SOL manually:"
    echo "   1. Go to: https://faucet.solana.com/"
    echo "   2. Paste your wallet: $WALLET"
    echo "   3. Click 'Request Airdrop'"
    echo "   4. Wait 30 seconds"
    echo "   5. Run this script again"
    echo ""
    exit 1
  fi
fi

# Verify contract file exists
echo ""
echo "🔍 Checking contract file..."
if [ ! -f "target/deploy/uat_factory.so" ]; then
  echo "❌ ERROR: uat_factory.so not found!"
  echo "   Run 'anchor build' first or check path"
  exit 1
fi

FILE_SIZE=$(ls -lh target/deploy/uat_factory.so | awk '{print $5}')
echo "✅ Found: uat_factory.so ($FILE_SIZE)"
echo ""

# Get current balance for display
CURRENT_BALANCE=$(solana balance 2>/dev/null | awk '{print $1}')
echo "💰 Current balance: $CURRENT_BALANCE SOL"
echo ""

# Deploy
echo "🚀 Deploying to Solana Devnet..."
echo "   Program ID: UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm"
echo ""

if solana program deploy target/deploy/uat_factory.so \
  --program-id UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm \
  --keypair ~/.config/solana/id.json; then
  
  echo ""
  echo "✅ DEPLOYMENT SUCCESSFUL!"
  echo ""
  
  # Verify
  echo "🔍 Verifying deployment..."
  solana program show UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm
  echo ""
  
  # Copy IDL
  echo "📋 Copying IDL to wizard..."
  if [ -f "target/idl/uat_factory.json" ]; then
    mkdir -p ../../apps/property-tokenization-wizard/public/api/idl/
    cp target/idl/uat_factory.json \
      ../../apps/property-tokenization-wizard/public/api/idl/
    echo "✅ IDL copied"
  else
    echo "⚠️  IDL not found (not critical)"
  fi
  
  # Update wizard env
  echo ""
  echo "🎨 Updating wizard environment..."
  cd ../../apps/property-tokenization-wizard
  cat > .env.local << 'EOF'
NEXT_PUBLIC_UAT_PROGRAM_ID=UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
EOF
  echo "✅ Environment configured"
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ DEPLOYMENT COMPLETE!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "📍 Program ID:"
  echo "   UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm"
  echo ""
  echo "🔗 Solana Explorer:"
  echo "   https://explorer.solana.com/address/UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm?cluster=devnet"
  echo ""
  echo "🎬 Next Steps:"
  echo "   1. Open http://localhost:3000"
  echo "   2. Connect Phantom wallet (Devnet)"
  echo "   3. Test property tokenization"
  echo "   4. Record demo video"
  echo "   5. Submit to hackathon! 🏆"
  echo ""
  
else
  echo ""
  echo "❌ DEPLOYMENT FAILED"
  echo ""
  echo "Common issues:"
  echo "1. Insufficient balance - Get more SOL from faucet"
  echo "2. RPC connection issue - Try again in a moment"
  echo "3. Program already deployed - May just need to upgrade"
  echo ""
  echo "🔄 Alternative: Use simulation mode for demo"
  echo "   Your wizard works perfectly in simulation!"
  echo ""
  exit 1
fi

