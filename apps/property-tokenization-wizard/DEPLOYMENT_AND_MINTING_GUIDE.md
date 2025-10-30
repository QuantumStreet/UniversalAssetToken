# 🚀 Deployment & NFT Minting - How It Works

## Current Status

### ✅ What's Built
- Complete UI flow for deployment
- Complete UI flow for NFT minting  
- Visual progress indicators
- Error handling
- Success states with explorer links

### ⚠️ API Integration Status
- **Smart Contract Generator API**: Partially integrated (needs testing)
- **OASIS API (NFT Minting)**: Code ready, commented out (needs API key/auth)
- **IPFS Uploads**: Simulated (ready to switch to real)

---

## 🔧 How Deployment Works

### Step 4: Deploy Contract

```
┌─────────────────────────────────────────────────────────┐
│  DEPLOYMENT FLOW                                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Select Network                                       │
│     ○ Mainnet (disabled for safety)                     │
│     ● Testnet (Sepolia/Testnet/Stokenet)               │
│     ○ Devnet (default)                                  │
│                                                          │
│  2. Click "Deploy to devnet"                            │
│     ↓                                                    │
│  3. Compile Contract                                     │
│     POST → http://localhost:5000/api/v1/contracts/compile│
│     Body: {                                              │
│       Language: "Rust" / "Solidity" / "Scrypto"         │
│       Source: contract.rs (from Step 3)                 │
│     }                                                    │
│     Response: compiled.zip (contains .so/.bin/.wasm)    │
│     ↓                                                    │
│  4. Deploy to Blockchain                                │
│     POST → http://localhost:5000/api/v1/contracts/deploy│
│     Body: {                                              │
│       Language: "Rust" / "Solidity" / "Scrypto"         │
│       CompiledContractFile: program.so                  │
│     }                                                    │
│     Response: {                                          │
│       contractAddress: "ABC123...",                     │
│       transactionHash: "xyz789...",                     │
│       programId: "..." (for Solana)                     │
│     }                                                    │
│     ↓                                                    │
│  5. Verify Deployment                                   │
│     - Check transaction on explorer                     │
│     - Confirm contract is live                          │
│     ✅ Success!                                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Code Implementation

```typescript
// From deployment-step.tsx

const handleDeploy = async () => {
  setDeploymentStatus('compiling');
  
  // STEP 1: Compile Contract
  const compileFormData = new FormData();
  const contractFile = new File(
    [contractData.contractCode], 
    'contract.rs'
  );
  compileFormData.append('Language', 'Rust');
  compileFormData.append('Source', contractFile);

  const compileResponse = await fetch(
    'http://localhost:5000/api/v1/contracts/compile',
    { method: 'POST', body: compileFormData }
  );
  
  const compiledBlob = await compileResponse.blob();
  
  // STEP 2: Deploy to Blockchain
  setDeploymentStatus('deploying');
  
  const deployFormData = new FormData();
  deployFormData.append('Language', 'Rust');
  deployFormData.append('CompiledContractFile', compiledBlob);

  const deployResponse = await fetch(
    'http://localhost:5000/api/v1/contracts/deploy',
    { method: 'POST', body: deployFormData }
  );
  
  const deployResult = await deployResponse.json();
  
  // STEP 3: Save Deployment Data
  const deployment = {
    contractAddress: deployResult.contractAddress,
    transactionHash: deployResult.transactionHash,
    network: selectedNetwork,
    blockchain: contractData.blockchain,
    explorerUrl: `https://explorer.solana.com/address/${deployResult.contractAddress}?cluster=devnet`
  };
  
  setDeploymentData(deployment);
  setDeploymentStatus('complete');
};
```

### What User Sees

```
Deployment Progress:
┌──────────────────────────────────┐
│ ✅ Compiling contract...         │
│ ⏳ Deploying to devnet...        │
│ ○  Verifying deployment...       │
└──────────────────────────────────┘

After Success:
┌──────────────────────────────────────────────┐
│ ✅ Contract Deployed Successfully!           │
├──────────────────────────────────────────────┤
│ Contract Address:                            │
│ ABC123xyz789... [Copy]                       │
│                                              │
│ Transaction Hash:                            │
│ tx789abc123... [View] →                     │
│                                              │
│ Network: Devnet | Blockchain: Solana        │
└──────────────────────────────────────────────┘
```

---

## 🎨 How NFT Minting Works

### Step 5: Mint NFTs

```
┌─────────────────────────────────────────────────────────┐
│  NFT MINTING FLOW                                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Auto-Generate Metadata                              │
│     {                                                    │
│       name: "Property Trust Token",                     │
│       symbol: "PTT",                                    │
│       description: "Tokenized property at...",          │
│       image: "ipfs://...",                              │
│       attributes: [                                     │
│         { trait_type: "Property Value", value: "$1.8M" }│
│         { trait_type: "Annual Distribution", value: "90%"}│
│         { trait_type: "Occupancy Rights", value: "Yes" }│
│       ]                                                  │
│     }                                                    │
│     ↓                                                    │
│  2. Upload Metadata to IPFS                             │
│     Using: OASIS API or Pinata                         │
│     Result: ipfs://QmXYZ123...                          │
│     ↓                                                    │
│  3. Mint NFTs via OASIS API                             │
│     POST → http://devnet.oasisweb4.one/api/nft/mint-nft │
│     Body: {                                              │
│       ContractAddress: "ABC123..." (from Step 4)        │
│       MintingProfile: "Metaplex Standard",              │
│       MetadataUri: "ipfs://QmXYZ...",                   │
│       Recipient: "wallet-address",                      │
│       Amount: 1000                                      │
│     }                                                    │
│     Response: {                                          │
│       tokenId: "token-123",                             │
│       signature: "tx-789"                               │
│     }                                                    │
│     ↓                                                    │
│  4. Confirm Minting                                     │
│     ✅ NFTs minted and sent to recipient                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Code Implementation

```typescript
// From nft-minting-step.tsx

const handleMintNFTs = async () => {
  setMintingStatus('uploading');
  
  // STEP 1: Create Metadata
  const metadata = {
    name: trustData.tokenName,
    symbol: trustData.tokenSymbol,
    description: `Tokenized property at ${propertyData.propertyAddress}`,
    image: "ipfs://placeholder", // TODO: Use real property images
    attributes: [
      { trait_type: "Property Address", value: propertyData.propertyAddress },
      { trait_type: "Property Value", value: `$${propertyData.propertyValue}` },
      { trait_type: "Annual Distribution", value: `${trustData.annualDistributionRate}%` },
      // ... more attributes
    ]
  };
  
  // STEP 2: Upload Metadata to IPFS
  // Currently simulated:
  const metadataUri = "ipfs://Qm" + Math.random().toString(36);
  
  // TODO: Real upload
  // const { uploadMetadataToIPFS } = await import('@/services/ipfsUpload');
  // const result = await uploadMetadataToIPFS(metadata, trustData.tokenName);
  // const metadataUri = result.url;
  
  setMintingStatus('minting');
  
  // STEP 3: Mint NFTs via OASIS API
  if (deploymentData.blockchain === 'solana') {
    // COMMENTED OUT - Ready to activate:
    // const response = await fetch('http://devnet.oasisweb4.one/api/nft/mint-nft', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${authToken}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     ContractAddress: deploymentData.contractAddress,
    //     MintingProfile: 'Metaplex Standard',
    //     MetadataUri: metadataUri,
    //     Recipient: recipientAddress,
    //     Amount: tokenAmount
    //   })
    // });
    
    // Currently: Simulated minting
    const mockMintData = {
      metadataUri,
      mintedTokens: [{ tokenId: 'token-123', recipient: recipientAddress }],
      totalMinted: tokenAmount
    };
    
    setNftData(mockMintData);
  }
  
  setMintingStatus('complete');
};
```

### What User Sees

```
NFT Configuration:
┌────────────────────────────────┐
│ Token Name: Property Trust     │
│ Symbol: PTT                    │
│ Total Supply: 10,000           │
│                                │
│ Recipient: [wallet address]   │
│ Mint Amount: [1-10000]         │
└────────────────────────────────┘

Minting Progress:
┌──────────────────────────────────┐
│ ✅ Uploading metadata to IPFS... │
│ ⏳ Minting NFTs...               │
└──────────────────────────────────┘

After Success:
┌────────────────────────────────────┐
│ ✅ NFTs Minted Successfully!       │
├────────────────────────────────────┤
│ Metadata URI:                      │
│ ipfs://QmXYZ123...                │
│                                    │
│ Total Minted: 1,000 NFTs          │
│                                    │
│ Collection: ABC123...             │
└────────────────────────────────────┘
```

---

## 📊 API Integration Status

### 1. Smart Contract Generator API

**Status**: ✅ **Integrated, Needs Testing**

**Endpoints Used**:
```typescript
// Generate Contract (Step 3)
POST http://localhost:5000/api/v1/contracts/generate
✅ Integrated in contract-generation-step.tsx (line 136)
✅ Sends JSON specification
✅ Receives generated contract code

// Compile Contract (Step 4)
POST http://localhost:5000/api/v1/contracts/compile
✅ Integrated in deployment-step.tsx (line 54)
✅ Sends source code
✅ Receives compiled bytecode

// Deploy Contract (Step 4)
POST http://localhost:5000/api/v1/contracts/deploy
✅ Integrated in deployment-step.tsx (line 72)
✅ Sends compiled bytecode
✅ Receives contract address + tx hash
```

**What's Working**:
- API calls are implemented
- Error handling in place
- Progress indicators working
- Response parsing ready

**What's Needed**:
- Smart Contract Generator API must be running: `http://localhost:5000`
- Check if API is running with: `curl http://localhost:5000/health`

---

### 2. OASIS API (NFT Minting)

**Status**: ⚠️ **Code Ready, Commented Out**

**Endpoint**:
```typescript
// Mint NFT (Step 5)
POST http://devnet.oasisweb4.one/api/nft/mint-nft
⚠️ Code written but commented out (line 71-84 in nft-minting-step.tsx)
⚠️ Needs authentication token
⚠️ Currently using simulated minting
```

**To Activate**:
1. Uncomment lines 71-84 in `nft-minting-step.tsx`
2. Add OASIS API authentication
3. Test with Solana devnet

**Current Code** (commented out):
```typescript
const response = await fetch('http://devnet.oasisweb4.one/api/nft/mint-nft', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,  // Need this!
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ContractAddress: deploymentData.contractAddress,
    MintingProfile: 'Metaplex Standard',
    MetadataUri: metadataUri,
    Recipient: recipientAddress,
    Amount: tokenAmount
  })
});
```

---

### 3. IPFS Upload Service

**Status**: ✅ **Built, Using Simulation**

**What's Available**:
```typescript
// From ipfsUpload.ts
uploadFileToIPFS(file, oasisBaseUrl?, authToken?)
  ✅ Written and ready
  ⚠️ Currently using uploadFileSimulated()
  
uploadMetadataToIPFS(metadata, name, oasisBaseUrl?, authToken?)
  ✅ Written and ready
  ⚠️ Currently using simulated upload
```

**To Activate**:
Change in `nft-minting-step.tsx` (line 64):
```typescript
// FROM (simulated):
const metadataUri = "ipfs://Qm" + Math.random().toString(36);

// TO (real):
const { uploadMetadataToIPFS } = await import('@/services/ipfsUpload');
const result = await uploadMetadataToIPFS(
  metadata, 
  trustData.tokenName,
  'http://devnet.oasisweb4.one'
);
const metadataUri = result.url;
```

---

## 🔄 Complete Pipeline Flow

### Current Implementation

```
Step 3: Generate Contract
  ↓
User picks: Template or AI
  ↓
API Call: POST /api/v1/contracts/generate
  ↓
✅ Contract Code Generated
  
Step 4: Deploy Contract
  ↓
Select Network (Testnet/Devnet)
  ↓
API Call: POST /api/v1/contracts/compile
  ↓
✅ Compiled Bytecode
  ↓
API Call: POST /api/v1/contracts/deploy
  ↓
✅ Contract Address + Tx Hash
  
Step 5: Mint NFTs
  ↓
Auto-generate metadata from property data
  ↓
⚠️ SIMULATED: Upload metadata to IPFS
  ↓
⚠️ SIMULATED: Mint NFTs via OASIS
  ↓
✅ NFT Data (mocked for now)
  
Step 6: DAT Integration
  ↓
Send tokens to Digital Asset Treasury
  ↓
⚠️ SIMULATED: Stake in DAT for enhanced yields
  ↓
✅ Complete!
```

---

## 🧪 Testing Each Step

### Test Deployment (with real API)

**Prerequisites**:
```bash
# 1. Start Smart Contract Generator API
cd /Volumes/Storage/QS_Asset_Rail/smart-contract-generator/src/SmartContractGen/ScGen.API
dotnet run
# Should see: "Now listening on: http://localhost:5000"

# 2. Verify API is running
curl http://localhost:5000/health
# Should return: 200 OK
```

**Test Flow**:
1. Complete Steps 1-3 (Property → Trust → Contract Generation)
2. Click "Deploy to devnet"
3. Watch console for API calls:
   - `/api/v1/contracts/compile` → Should succeed
   - `/api/v1/contracts/deploy` → Should succeed
4. See contract address and tx hash
5. Continue to NFT minting

---

### Test NFT Minting (simulated)

**Current State**:
- ✅ UI works perfectly
- ✅ Metadata generation working
- ⚠️ IPFS upload simulated
- ⚠️ Minting simulated

**Test Flow**:
1. After successful deployment
2. Enter recipient address (optional)
3. Enter mint amount (1-10000)
4. Click "Mint Property Token NFTs"
5. Watch progress:
   - "Uploading metadata to IPFS..." ✅
   - "Minting NFTs..." ✅
6. See minted NFT data
7. Continue to DAT Integration

---

## 🔌 API Endpoints Reference

### Smart Contract Generator API (localhost:5000)

#### 1. Generate Contract
```bash
curl -X POST http://localhost:5000/api/v1/contracts/generate \
  -F 'Language=Rust' \
  -F 'JsonFile=@contract-spec.json'

Response: "use anchor_lang::prelude::*; ..."
```

#### 2. Compile Contract
```bash
curl -X POST http://localhost:5000/api/v1/contracts/compile \
  -F 'Language=Rust' \
  -F 'Source=@contract.rs'

Response: compiled.zip (contains program.so)
```

#### 3. Deploy Contract
```bash
curl -X POST http://localhost:5000/api/v1/contracts/deploy \
  -F 'Language=Rust' \
  -F 'CompiledContractFile=@program.so'

Response: {
  "contractAddress": "ABC123...",
  "transactionHash": "xyz789...",
  "programId": "..."
}
```

---

### OASIS API (devnet.oasisweb4.one)

#### 1. Upload File to Pinata/IPFS
```bash
curl -X POST http://devnet.oasisweb4.one/api/pinata/upload-file \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "base64": "...",
    "fileName": "property.jpg",
    "contentType": "image/jpeg"
  }'

Response: {
  "result": "https://gateway.pinata.cloud/ipfs/QmXYZ...",
  "isError": false
}
```

#### 2. Upload JSON Metadata
```bash
curl -X POST http://devnet.oasisweb4.one/api/pinata/upload-json \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "content": { "name": "...", "description": "..." },
    "name": "PropertyTokenMetadata"
  }'

Response: {
  "result": "https://gateway.pinata.cloud/ipfs/QmABC...",
  "isError": false
}
```

#### 3. Mint NFT
```bash
curl -X POST http://devnet.oasisweb4.one/api/nft/mint-nft \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "ContractAddress": "ABC123...",
    "MintingProfile": "Metaplex Standard",
    "MetadataUri": "ipfs://QmXYZ...",
    "Recipient": "wallet-address",
    "Amount": 1000
  }'

Response: {
  "tokenId": "token-123",
  "signature": "tx-789",
  "success": true
}
```

---

## 🚀 To Go Live with Real APIs

### Quick Checklist

#### For Deployment:
- [x] Code implemented
- [x] Error handling added
- [ ] Smart Contract Generator API running
- [ ] Test compilation endpoint
- [ ] Test deployment endpoint
- [ ] Verify on blockchain explorer

#### For NFT Minting:
- [x] Metadata generation working
- [x] IPFS upload service built
- [ ] Get OASIS API auth token
- [ ] Uncomment OASIS API calls
- [ ] Test metadata upload
- [ ] Test NFT minting
- [ ] Verify on Solana explorer

---

## 🔧 How to Activate Real APIs

### Step 1: Start Smart Contract Generator API

```bash
# Terminal 1: Run the API
cd /Volumes/Storage/QS_Asset_Rail/smart-contract-generator/src/SmartContractGen/ScGen.API
dotnet run

# Should see:
# ✅ Now listening on: http://localhost:5000
# ✅ Swagger UI: http://localhost:5000/swagger
```

**Verify**:
```bash
curl http://localhost:5000/swagger
# Should return Swagger UI HTML
```

---

### Step 2: Enable OASIS API for NFT Minting

**Option A: Get OASIS Auth Token**
```typescript
// Add to .env.local
NEXT_PUBLIC_OASIS_API_TOKEN=your_token_here
```

**Option B: Use Public Endpoint** (if available)
```typescript
// In nft-minting-step.tsx, remove auth requirement
const response = await fetch('http://devnet.oasisweb4.one/api/nft/mint-nft', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({...})
});
```

**Uncomment Code**:
```typescript
// In nft-minting-step.tsx, lines 71-84
// Remove the // comment markers from:
const response = await fetch('http://devnet.oasisweb4.one/api/nft/mint-nft', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OASIS_API_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ContractAddress: deploymentData.contractAddress,
    MintingProfile: 'Metaplex Standard',
    MetadataUri: metadataUri,
    Recipient: recipientAddress,
    Amount: tokenAmount
  })
});

const result = await response.json();
// Use real result instead of mockMintData
```

---

### Step 3: Enable Real IPFS Uploads

**In nft-minting-step.tsx** (line 62-64):

```typescript
// FROM (simulated):
await new Promise(resolve => setTimeout(resolve, 2000));
const metadataUri = "ipfs://Qm" + Math.random().toString(36).substring(7);

// TO (real):
const { uploadMetadataToIPFS } = await import('@/services/ipfsUpload');
const result = await uploadMetadataToIPFS(
  metadata,
  trustData.tokenName,
  'http://devnet.oasisweb4.one',
  process.env.NEXT_PUBLIC_OASIS_API_TOKEN
);
const metadataUri = result.url;
```

---

## 📈 What's Working vs. What's Simulated

| Feature | Status | API Integration | Next Step |
|---------|--------|-----------------|-----------|
| **Property Details** | ✅ Working | Census API ✅ | None - Live! |
| **AI Valuation** | ✅ Working | Census API ✅ | Add OpenAI for smarter analysis |
| **Trust Optimization** | ✅ Working | Local algorithms ✅ | Optional: Add GPT-4 |
| **Contract Generation (Template)** | ✅ Ready | SC Gen API 📝 | Start API & test |
| **Contract Generation (AI)** | ✅ Ready | AssetRail AI API 📝 | Configure endpoint |
| **Contract Compilation** | ✅ Ready | SC Gen API 📝 | Start API & test |
| **Contract Deployment** | ✅ Ready | SC Gen API 📝 | Start API & test |
| **Document Upload** | ⚠️ Simulated | IPFS ⏸️ | Uncomment real upload |
| **Metadata Upload** | ⚠️ Simulated | IPFS ⏸️ | Uncomment real upload |
| **NFT Minting** | ⚠️ Simulated | OASIS API ⏸️ | Get auth token & uncomment |
| **DAT Integration** | ⚠️ Simulated | Solana DAT ⏸️ | Build integration |

**Legend**:
- ✅ = Fully working with real APIs
- 📝 = Code ready, API needs to be running
- ⚠️ = Using simulation
- ⏸️ = Ready to activate (1-2 line changes)

---

## 💡 Key Takeaways

### Deployment Step:
- **How**: Calls Smart Contract Generator API
- **Status**: Code fully integrated, needs API running
- **API**: `POST /api/v1/contracts/compile` → `POST /api/v1/contracts/deploy`
- **Output**: Contract address, transaction hash, explorer link

### NFT Minting Step:
- **How**: Uploads metadata to IPFS, mints via OASIS API
- **Status**: Code ready but commented out (using simulation)
- **API**: IPFS upload + OASIS mint endpoint
- **Output**: Metadata URI, minted token IDs, collection address

### To Go Live:
1. **Start Smart Contract Generator API** (port 5000)
2. **Get OASIS API auth token**
3. **Uncomment real API calls** in NFT minting
4. **Test on devnet** before mainnet

---

## 🎯 Quick Start Guide

### Test Deployment Now:

```bash
# Terminal 1: Start Smart Contract API
cd smart-contract-generator/src/SmartContractGen/ScGen.API
dotnet run

# Terminal 2: Already running (property wizard)
# http://localhost:3000

# Test:
1. Go to Step 3 (Smart Contract)
2. Choose "Template-Based"
3. Click "Generate from Template"
4. Go to Step 4 (Deploy)
5. Click "Deploy to devnet"
6. Watch it compile and deploy! ✅
```

**Expected Result**:
- Compilation succeeds
- Deployment succeeds  
- Get real contract address
- Get real transaction hash
- Can view on Solana explorer

---

## 📝 Summary

### What's Already Integrated ✅
- Smart Contract Generator API (generate, compile, deploy)
- Census API for property valuation
- IPFS upload service (structure ready)
- OASIS API integration (code written)

### What's Simulated ⚠️
- IPFS metadata uploads (using mock URIs)
- NFT minting (using mock responses)
- DAT integration (using mock staking)

### To Activate (Easy!) 🚀
1. Start Smart Contract Generator API
2. Get OASIS authentication token
3. Uncomment ~10 lines of code
4. Test and go live!

**The hard work is done - just need to flip the switches!** 💡


