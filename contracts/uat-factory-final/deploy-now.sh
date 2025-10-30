#!/bin/bash

echo "🚀 Deploying UAT Factory to Solana Devnet"
echo "=========================================="
echo ""
echo "📍 Program ID: UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm"
echo ""
echo "⏳ Deploying... (this takes 30-60 seconds)"
echo ""

cd "$(dirname "$0")"

# Deploy with Ankr RPC (most reliable)
solana program deploy target/deploy/uat_factory.so \
  --program-id UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm \
  --keypair ~/.config/solana/id.json \
  --url https://rpc.ankr.com/solana_devnet

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ DEPLOYMENT SUCCESSFUL!"
  echo ""
  echo "🔗 View on Explorer:"
  echo "https://explorer.solana.com/address/UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm?cluster=devnet"
  echo ""
  
  # Copy IDL
  if [ -f "target/idl/uat_factory.json" ]; then
    mkdir -p ../../apps/property-tokenization-wizard/public/api/idl/
    cp target/idl/uat_factory.json ../../apps/property-tokenization-wizard/public/api/idl/
    echo "✅ IDL copied to wizard"
  fi
  
  echo ""
  echo "🎬 Next: Open http://localhost:3000 and test!"
else
  echo ""
  echo "❌ Deployment failed"
  echo ""
  echo "Try alternative RPC:"
  echo "solana program deploy target/deploy/uat_factory.so \\"
  echo "  --program-id UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm \\"
  echo "  --keypair ~/.config/solana/id.json \\"
  echo "  --url https://api.devnet.solana.com"
fi

