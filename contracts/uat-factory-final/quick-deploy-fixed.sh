#!/bin/bash
set -e

echo "🚀 UAT Factory - Quick Deploy to Devnet"
echo "========================================"
echo ""

# Navigate to contract directory
cd "$(dirname "$0")"

# Get wallet address
WALLET=$(cat ~/.config/solana/id.json | grep -o '"publicKey":"[^"]*"' | cut -d'"' -f4 2>/dev/null || solana address 2>/dev/null || echo "")

if [ -z "$WALLET" ]; then
  echo "❌ Could not get wallet address"
  echo "   Please make sure Solana CLI is configured"
  exit 1
fi

echo "👛 Wallet: $WALLET"
echo ""

# Check balance using direct RPC call (more reliable)
echo "💰 Checking balance via RPC..."
BALANCE_JSON=$(curl -s -X POST https://api.devnet.solana.com \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getBalance\",\"params\":[\"$WALLET\"]}" 2>/dev/null)

if [ -z "$BALANCE_JSON" ]; then
  echo "⚠️  Could not check balance via standard RPC"
  echo "   Trying alternative RPC..."
  BALANCE_JSON=$(curl -s -X POST https://rpc.ankr.com/solana_devnet \
    -H "Content-Type: application/json" \
    -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getBalance\",\"params\":[\"$WALLET\"]}" 2>/dev/null)
fi

# Extract balance (in lamports)
BALANCE_LAMPORTS=$(echo $BALANCE_JSON | grep -o '"value":[0-9]*' | cut -d':' -f2)

if [ -z "$BALANCE_LAMPORTS" ] || [ "$BALANCE_LAMPORTS" = "0" ]; then
  echo "⚠️  Balance check failed or balance is 0"
  echo ""
  echo "   Your wallet address: $WALLET"
  echo ""
  echo "   Please:"
  echo "   1. Go to: https://faucet.solana.com/"
  echo "   2. Paste your wallet address"
  echo "   3. Request 2 SOL"
  echo "   4. Wait 30 seconds"
  echo "   5. Run this script again"
  echo ""
  read -p "   Press Enter to continue anyway, or Ctrl+C to exit... "
else
  # Convert lamports to SOL (divide by 1 billion)
  BALANCE_SOL=$(echo "scale=4; $BALANCE_LAMPORTS / 1000000000" | bc 2>/dev/null || echo "Unknown")
  echo "✅ Balance: $BALANCE_SOL SOL ($BALANCE_LAMPORTS lamports)"
  
  # Check if sufficient (need at least 2 SOL = 2000000000 lamports)
  if [ "$BALANCE_LAMPORTS" -lt 2000000000 ]; then
    echo "⚠️  Balance might be low for deployment"
    echo "   Recommended: 2+ SOL"
    echo ""
    read -p "   Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi
fi

echo ""

# Verify contract file exists
echo "🔍 Checking contract file..."
if [ ! -f "target/deploy/uat_factory.so" ]; then
  echo "❌ ERROR: uat_factory.so not found!"
  echo "   Path checked: target/deploy/uat_factory.so"
  exit 1
fi

FILE_SIZE=$(ls -lh target/deploy/uat_factory.so | awk '{print $5}')
echo "✅ Found: uat_factory.so ($FILE_SIZE)"
echo ""

# Deploy using alternative RPC endpoints
echo "🚀 Deploying to Solana Devnet..."
echo "   Program ID: UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm"
echo "   (This may take 30-60 seconds...)"
echo ""

# Try multiple RPC endpoints
RPC_ENDPOINTS=(
  "https://api.devnet.solana.com"
  "https://rpc.ankr.com/solana_devnet"
  "https://devnet.helius-rpc.com"
)

DEPLOYED=false

for RPC in "${RPC_ENDPOINTS[@]}"; do
  echo "📡 Trying RPC: $RPC"
  
  if solana program deploy target/deploy/uat_factory.so \
    --program-id UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm \
    --keypair ~/.config/solana/id.json \
    --url "$RPC" 2>&1; then
    
    DEPLOYED=true
    echo ""
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    break
  else
    echo "   ⚠️  Failed with this RPC, trying next..."
    echo ""
  fi
done

if [ "$DEPLOYED" = false ]; then
  echo "❌ DEPLOYMENT FAILED on all RPC endpoints"
  echo ""
  echo "Possible issues:"
  echo "1. Network congestion - try again in a moment"
  echo "2. RPC rate limits - wait 1-2 minutes"
  echo "3. Insufficient balance - get more SOL from faucet"
  echo ""
  echo "🔄 Alternative: Use simulation mode for demo"
  echo "   Your wizard works perfectly in simulation!"
  echo ""
  exit 1
fi

# Verify deployment
echo ""
echo "🔍 Verifying deployment..."
for RPC in "${RPC_ENDPOINTS[@]}"; do
  if solana program show UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm --url "$RPC" 2>/dev/null; then
    echo "✅ Verified on $RPC"
    break
  fi
done

echo ""

# Copy IDL
echo "📋 Copying IDL to wizard..."
if [ -f "target/idl/uat_factory.json" ]; then
  mkdir -p ../../apps/property-tokenization-wizard/public/api/idl/
  cp target/idl/uat_factory.json \
    ../../apps/property-tokenization-wizard/public/api/idl/
  echo "✅ IDL copied"
else
  echo "⚠️  IDL not found (not critical for demo)"
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
echo "👛 Your Wallet:"
echo "   $WALLET"
echo ""
echo "🎬 Next Steps:"
echo "   1. Open http://localhost:3000"
echo "   2. Connect Phantom wallet (Devnet)"
echo "   3. Make sure Phantom uses address: $WALLET"
echo "   4. Test property tokenization"
echo "   5. Record demo video"
echo "   6. Submit to hackathon! 🏆"
echo ""

