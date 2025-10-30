# AssetRail Smart Contract API - Quick Start Guide

**Status:** ✅ API Running on http://localhost:5000  
**Date:** October 16, 2025

---

## 🚀 Your API is Live!

The smart contract generation API is now running and ready to use. Here's how to use it:

---

## Quick Test

```bash
# Health check
curl http://localhost:5000/health

# Expected: {"status":"healthy","timestamp":"..."}
```

---

## Step 1: Generate a Smart Contract

### Ethereum (Solidity)

```bash
# Create a simple JSON spec
cat > /tmp/simple-token.json << 'EOF'
{
  "license": "MIT",
  "pragmaVersion": "^0.8.0",
  "name": "SimpleToken",
  "state": [
    {
      "name": "totalSupply",
      "type": "uint256",
      "visibility": "public"
    }
  ],
  "functions": [
    {
      "name": "mint",
      "visibility": "public",
      "params": [
        {"name": "amount", "type": "uint256"}
      ],
      "body": ["totalSupply += amount;"]
    }
  ]
}
EOF

# Generate contract
curl -X POST http://localhost:5000/api/v1/contracts/generate \
  -F "Language=Solidity" \
  -F "JsonFile=@/tmp/simple-token.json" \
  -o /tmp/SimpleToken.sol

# View generated code
cat /tmp/SimpleToken.sol
```

### Solana (Rust/Anchor)

```bash
# Use existing test file
curl -X POST http://localhost:5000/api/v1/contracts/generate \
  -F "Language=Rust" \
  -F "JsonFile=@/Volumes/Storage/QS_Asset_Rail/tests/contracts/data/Solana/rust-test1.json" \
  -o /tmp/solana-contract.zip

# Extract
unzip -d /tmp/solana-contract /tmp/solana-contract.zip

# View generated Rust code
cat /tmp/solana-contract/programs/rust-main-template/src/lib.rs
```

### Radix (Scrypto)

```bash
curl -X POST http://localhost:5000/api/v1/contracts/generate \
  -F "Language=Scrypto" \
  -F "JsonFile=@/Volumes/Storage/QS_Asset_Rail/tests/contracts/data/Radix/scrypto-test1.json" \
  -o /tmp/radix-contract.zip
```

---

## Step 2: Compile the Contract

### Ethereum

```bash
# Compile Solidity contract
curl -X POST http://localhost:5000/api/v1/contracts/compile \
  -F "Language=Solidity" \
  -F "Source=@/tmp/SimpleToken.sol" \
  -o /tmp/compiled-artifacts.zip

# Extract artifacts
unzip -d /tmp/compiled /tmp/compiled-artifacts.zip

# You'll get:
# - SimpleToken.bin (bytecode)
# - SimpleToken.abi (ABI)
```

### Solana

```bash
# Compile Rust/Anchor program
curl -X POST http://localhost:5000/api/v1/contracts/compile \
  -F "Language=Rust" \
  -F "Source=@/tmp/solana-contract.zip" \
  -o /tmp/solana-compiled.zip

# Extract compiled program
unzip -d /tmp/solana-compiled /tmp/solana-compiled.zip

# You'll get:
# - program.so (compiled program)
# - idl.json (Interface Definition)
```

---

## Step 3: Deploy to Blockchain

### Ethereum (Requires local node or testnet)

```bash
# Deploy to Ethereum
curl -X POST http://localhost:5000/api/v1/contracts/deploy \
  -F "Language=Solidity" \
  -F "Schema=@/tmp/compiled/SimpleToken.abi" \
  -F "CompiledContractFile=@/tmp/compiled/SimpleToken.bin"

# Returns:
# {
#   "transactionHash": "0x...",
#   "contractAddress": "0x...",
#   "blockNumber": 12345
# }
```

### Solana (Requires Solana CLI and devnet)

```bash
# Deploy to Solana devnet
curl -X POST http://localhost:5000/api/v1/contracts/deploy \
  -F "Language=Rust" \
  -F "CompiledContractFile=@/tmp/solana-compiled/program.so"

# Returns:
# {
#   "programId": "...",
#   "transactionHash": "...",
#   "network": "devnet"
# }
```

---

## Complete Example: End-to-End

```bash
#!/bin/bash
# Complete pipeline: Generate → Compile → Deploy

# 1. Generate
echo "📝 Generating contract..."
curl -s -X POST http://localhost:5000/api/v1/contracts/generate \
  -F "Language=Solidity" \
  -F "JsonFile=@/tmp/simple-token.json" \
  -o /tmp/contract.sol

# 2. Compile
echo "🔨 Compiling contract..."
curl -s -X POST http://localhost:5000/api/v1/contracts/compile \
  -F "Language=Solidity" \
  -F "Source=@/tmp/contract.sol" \
  -o /tmp/compiled.zip

# 3. Extract artifacts
unzip -q -d /tmp/compiled /tmp/compiled.zip

# 4. Deploy
echo "🚀 Deploying contract..."
curl -s -X POST http://localhost:5000/api/v1/contracts/deploy \
  -F "Language=Solidity" \
  -F "Schema=@/tmp/compiled/SimpleToken.abi" \
  -F "CompiledContractFile=@/tmp/compiled/SimpleToken.bin"

echo "✅ Complete!"
```

---

## Advanced: Create DAT Treasury Contract

```bash
# Create DAT specification
cat > /tmp/dat-treasury.json << 'EOF'
{
  "programName": "asset_treasury",
  "programId": "DAtYXMpDEZL8RqQ7KVZp9YvKj8TqPSxKjHD2nNKFZC3L",
  "imports": ["anchor_lang::prelude::*"],
  "constants": [
    {
      "name": "MIN_STAKE",
      "type": "u64",
      "value": "1000000000",
      "description": "Minimum stake amount (1 SOL)"
    }
  ],
  "instructions": [
    {
      "name": "initialize_treasury",
      "description": "Initialize a new Digital Asset Treasury",
      "contextStruct": "InitializeTreasury",
      "params": [
        {"name": "treasury_name", "type": "String"},
        {"name": "sol_staking_apy", "type": "u16"}
      ],
      "body": [
        "let treasury = &mut ctx.accounts.treasury;",
        "treasury.name = treasury_name;",
        "treasury.sol_staking_apy = sol_staking_apy;",
        "Ok(())"
      ]
    }
  ],
  "accounts": [
    {
      "name": "InitializeTreasury",
      "fields": [
        {"name": "authority", "type": "Signer<'info>"},
        {"name": "system_program", "type": "Program<'info, System>"}
      ]
    }
  ],
  "dataStructs": [
    {
      "name": "Treasury",
      "fields": [
        {"name": "name", "type": "String"},
        {"name": "sol_staking_apy", "type": "u16"},
        {"name": "total_staked", "type": "u64"}
      ]
    }
  ],
  "errors": [
    {
      "name": "InvalidAmount",
      "message": "Amount must be greater than minimum",
      "code": 6000
    }
  ]
}
EOF

# Generate DAT contract
curl -X POST http://localhost:5000/api/v1/contracts/generate \
  -F "Language=Rust" \
  -F "JsonFile=@/tmp/dat-treasury.json" \
  -o /tmp/dat-treasury.zip

# View generated code
unzip -d /tmp/dat-treasury /tmp/dat-treasury.zip
cat /tmp/dat-treasury/programs/rust-main-template/src/lib.rs
```

---

## Using from Frontend (React/Next.js)

```typescript
// components/ContractGenerator.tsx
import { useState } from 'react';

export function ContractGenerator() {
  const [contract, setContract] = useState<string | null>(null);

  const generateContract = async (spec: any) => {
    const formData = new FormData();
    formData.append('Language', 'Rust');
    
    // Convert spec to JSON file
    const blob = new Blob([JSON.stringify(spec)], { type: 'application/json' });
    formData.append('JsonFile', blob, 'contract.json');

    const response = await fetch('http://localhost:5000/api/v1/contracts/generate', {
      method: 'POST',
      body: formData,
    });

    const contractZip = await response.blob();
    setContract(URL.createObjectURL(contractZip));
  };

  const compileContract = async (sourceFile: File) => {
    const formData = new FormData();
    formData.append('Language', 'Rust');
    formData.append('Source', sourceFile);

    const response = await fetch('http://localhost:5000/api/v1/contracts/compile', {
      method: 'POST',
      body: formData,
    });

    return await response.blob();
  };

  const deployContract = async (compiledFile: File) => {
    const formData = new FormData();
    formData.append('Language', 'Rust');
    formData.append('CompiledContractFile', compiledFile);

    const response = await fetch('http://localhost:5000/api/v1/contracts/deploy', {
      method: 'POST',
      body: formData,
    });

    return await response.json();
  };

  return (
    <div>
      <button onClick={() => generateContract({/* spec */})}>
        Generate Contract
      </button>
      {/* Add compile and deploy buttons */}
    </div>
  );
}
```

---

## Environment Configuration

### Update appsettings.json for Your Networks

```json
{
  "Ethereum": {
    "RpcUrl": "https://mainnet.infura.io/v3/YOUR_KEY",
    "PrivateKey": "YOUR_PRIVATE_KEY",
    "GasLimit": 3000000
  },
  "Solana": {
    "RpcUrl": "https://api.devnet.solana.com",
    "KeyPairPath": "/path/to/your/keypair.json",
    "UseLocalValidator": false
  },
  "Radix": {
    "UseResim": false,
    "NetworkUrl": "https://stokenet.radixdlt.com",
    "AccountAddress": "YOUR_ACCOUNT_ADDRESS"
  }
}
```

---

## Troubleshooting

### API not responding

```bash
# Check if process is running
ps aux | grep "dotnet"

# Check port
lsof -i :5000

# Restart API
cd /Volumes/Storage/QS_Asset_Rail/smart-contract-generator/src/SmartContractGen/ScGen.API
dotnet run
```

### Compilation fails

```bash
# Check Docker is running (needed for compilation)
docker ps

# Check language support
# Ensure you have the correct compiler installed
```

### Deployment fails

```bash
# Check network configuration in appsettings.json
# Ensure you have funds in wallet
# Verify RPC endpoint is accessible
```

---

## API Endpoints Reference

### Generate
- **URL:** `POST /api/v1/contracts/generate`
- **Params:**
  - `Language`: `Solidity` | `Rust` | `Scrypto`
  - `JsonFile`: Contract specification (JSON)
- **Returns:** Contract source code (file or ZIP)

### Compile
- **URL:** `POST /api/v1/contracts/compile`
- **Params:**
  - `Language`: `Solidity` | `Rust` | `Scrypto`
  - `Source`: Contract source file or ZIP
- **Returns:** Compiled artifacts (ZIP)

### Deploy
- **URL:** `POST /api/v1/contracts/deploy`
- **Params:**
  - `Language`: `Solidity` | `Rust` | `Scrypto`
  - `Schema`: ABI/IDL file (optional)
  - `CompiledContractFile`: Compiled bytecode/program
- **Returns:** Deployment info (tx hash, address)

### Health Check
- **URL:** `GET /health`
- **Returns:** `{"status":"healthy","timestamp":"..."}`

---

## Next Steps

1. ✅ **API is running** - You can now generate contracts!
2. ⏳ **Test full pipeline** - Try generate → compile → deploy
3. ⏳ **Integrate with frontend** - Use API in your React app
4. ⏳ **Add AI enhancement** - Follow implementation guide
5. ⏳ **Deploy to production** - Set up on cloud server

---

## Resources

- **Comparison Analysis:** `/docs/technical/SMART_CONTRACT_COMPARISON_ANALYSIS.md`
- **Full Pipeline Guide:** `/docs/FULL_PIPELINE_COMPARISON.md`
- **Hybrid Implementation:** `/docs/technical/HYBRID_CONTRACT_GENERATION_IMPLEMENTATION.md`
- **API Source:** `/smart-contract-generator/`

---

**Your API gives you a massive advantage:** Automated end-to-end smart contract deployment that no competitor offers! 🚀


