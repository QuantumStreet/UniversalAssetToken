# AssetRail API Integration Guide

## Overview

This wizard now integrates with the **AssetRail API** at `https://api.assetrail.xyz` to deploy the UAT Factory smart contract without requiring local Rust/Anchor development environment.

## API Architecture

The AssetRail API provides a **3-step deployment pipeline**:

```
1. Generate  → POST /api/v1/contracts/generate
   Input: JSON specification + Language (Rust/Solidity/Scrypto)
   Output: Source code

2. Compile   → POST /api/v1/contracts/compile
   Input: Source code + Language
   Output: Bytecode + ABI

3. Deploy    → POST /api/v1/contracts/deploy
   Input: ABI + Bytecode + Language
   Output: Contract address + Transaction hash
```

## UAT Factory Deployment

### Option 1: Using the Deployment Page

1. **Start the dev server:**
   ```bash
   cd apps/property-tokenization-wizard
   npm run dev
   ```

2. **Navigate to the deployment page:**
   ```
   http://localhost:3000/deploy-factory
   ```

3. **Select network:**
   - **Devnet** - Development and testing (recommended)
   - **Testnet** - Pre-production testing
   - **Mainnet** - Production (requires real SOL)

4. **Click "Deploy UAT Factory"**
   - The API will generate the contract from the specification
   - Compile it to Solana bytecode
   - Deploy it to the selected network

5. **Copy the contract address**
   - Use this in your wizard configuration
   - Save the downloadable config file

### Option 2: Using the API Service Directly

```typescript
import { deployUATFactory } from '@/services/assetRailApi';

const result = await deployUATFactory('devnet', (message) => {
  console.log(message);
});

console.log('Contract Address:', result.contractAddress);
console.log('Transaction Hash:', result.transactionHash);
```

## Integration with Property Tokenization Wizard

Once the UAT Factory is deployed, update your wizard:

### 1. Update the Factory Address

Edit `src/services/uatFactory.ts`:

```typescript
// Replace with your deployed factory address
export const UAT_FACTORY_PROGRAM_ID = new PublicKey('YOUR_FACTORY_ADDRESS_HERE');
```

### 2. Use in Wizard

The wizard will now use your deployed factory to:
- Create property token collections
- Whitelist investors
- Mint tokens with compliance checks

## API Service Features

### `AssetRailApiClient`

Main class for interacting with the AssetRail API:

```typescript
import { AssetRailApiClient } from '@/services/assetRailApi';

const client = new AssetRailApiClient(
  'https://api.assetrail.xyz',
  (message) => console.log(message) // Progress callback
);

// Deploy UAT Factory
const factoryResult = await client.deployUATFactory('devnet');

// Deploy standalone property token
const tokenResult = await client.deployPropertyToken(
  'Beverly Hills Estate Token',
  'BHE',
  3500,
  'ipfs://QmMetadataUri...',
  'devnet'
);
```

### Available Methods

#### `generateContract(spec, language)`
Generates smart contract source code from JSON specification.

#### `compileContract(sourceCode, language, filename)`
Compiles source code to bytecode and ABI.

#### `deployContract(compiledBlob, language)`
Deploys compiled contract to blockchain.

#### `deployUATFactory(network)`
Complete workflow: generates, compiles, and deploys the UAT Factory.

#### `deployPropertyToken(name, symbol, supply, metadataUri, network)`
Deploys a standalone property token contract.

## Contract Specification

The UAT Factory specification is defined in `src/services/uatFactorySpec.ts`:

### Features
- ✅ Property token creation
- ✅ Investor whitelisting with KYC
- ✅ Accreditation checks
- ✅ Supply management
- ✅ Reg D 506(c) compliance (2,000 max investors)
- ✅ 365-day lock-up period enforcement

### Instructions
1. `initialize_factory` - One-time factory setup
2. `create_property_token` - Create new property token collection
3. `add_to_whitelist` - Whitelist investor after KYC
4. `mint_property_tokens` - Mint tokens to whitelisted investor

### Accounts
- `Factory` - Global factory state
- `PropertyToken` - Individual property token state
- `InvestorWhitelist` - KYC and accreditation status

## Configuration

### Environment Variables

Create `.env.local` in the wizard root:

```env
# AssetRail API
NEXT_PUBLIC_AI_API=https://api.assetrail.xyz

# Optional: Override if using self-hosted instance
# NEXT_PUBLIC_CONTRACT_API=http://localhost:5000

# Blockchain RPCs
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_ETHEREUM_RPC=https://sepolia.infura.io
NEXT_PUBLIC_RADIX_RPC=https://stokenet.radixdlt.com
```

## Troubleshooting

### API Errors

**"Generation failed (400)"**
- Check that the contract specification is valid JSON
- Ensure all required parameters are provided

**"Compilation failed (500)"**
- The generated code may have syntax errors
- Check the API logs for details
- Contact AssetRail support

**"Deployment failed (400)"**
- Ensure you have sufficient SOL for deployment
- Check network connectivity
- Verify the network parameter is correct

### Network Issues

If the API is unreachable:
1. Check your internet connection
2. Verify the API URL: `https://api.assetrail.xyz`
3. Check if the API is down: `https://api.assetrail.xyz/health`

### Contract Issues

If the deployed contract doesn't work:
1. Verify the contract address on Solana Explorer
2. Check that you're using the correct network (devnet/testnet/mainnet)
3. Ensure the IDL matches the deployed program

## API Response Examples

### Successful Deployment

```json
{
  "contractAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "success": true,
  "transactionHash": "5j7s8K9uJkL3mN4oP2qR1tU..."
}
```

### Error Response

```json
{
  "error": "Compilation failed: syntax error at line 42",
  "code": 500
}
```

## Testing

To test the API integration:

1. **Deploy to devnet:**
   ```bash
   npm run dev
   # Navigate to http://localhost:3000/deploy-factory
   ```

2. **Verify deployment:**
   - Check the transaction on Solana Explorer
   - Copy the contract address
   - Test creating a property token

3. **Integration test:**
   ```bash
   npm run test
   ```

## Support

- **API Documentation:** https://api.assetrail.xyz/swagger/index.html
- **AssetRail Platform:** https://assetrail.xyz
- **Issues:** Create an issue in the repository

## Next Steps

1. ✅ Deploy UAT Factory to devnet
2. ✅ Update wizard configuration with factory address
3. ⏭️ Test property tokenization end-to-end
4. ⏭️ Deploy to testnet for pre-production testing
5. ⏭️ Deploy to mainnet for production use

---

**Last Updated:** October 21, 2025  
**API Version:** 1.0  
**Wizard Version:** 2.0











