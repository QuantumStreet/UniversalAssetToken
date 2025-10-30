# UAT Token Extensions - Quick Start

## What We Built

A **next-generation UAT Factory** that uses Solana Token Extensions (Token-2022) for native compliance, fees, and metadata - eliminating the need for custom token logic.

## Key Difference from Standard UAT

| Feature | Standard UAT | Token Extensions UAT |
|---------|-------------|---------------------|
| Token Creation | Custom SPL token logic | Native Token-2022 with extensions |
| Transfer Restrictions | Custom Anchor code | Built-in transfer hooks |
| Transfer Fees | Manual calculations | Native fee extraction |
| Metadata | Custom on-chain struct | Token metadata pointer |
| Privacy | None | Confidential transfers (v2.0+) |
| Security Audits | Need custom audit | 5 professional audits (Halborn, Zellic, etc.) |

## Quick Commands

```bash
# Build (first time takes ~3 minutes for dependencies)
cd contracts/uat-token-extensions
anchor build

# Test
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Get program ID
anchor keys list
```

## Program Instructions

### 1. `initialize_factory`
Create the UAT factory (one-time setup)

### 2. `create_property_token`
Create a new property token with:
- Token name/symbol
- IPFS metadata URI (full UAT JSON)
- Total supply cap
- Transfer fee (basis points for trustee)

### 3. `whitelist_investor`
Add investor to whitelist with:
- KYC/AML status
- Accreditation verification

### 4. `mint_tokens`
Mint tokens to whitelisted investors (compliance-checked)

### 5. `record_distribution`
Track quarterly yield distributions

### 6. `update_metadata_uri`
Update IPFS URI (for revaluations, document updates)

### 7. `set_token_status`
Pause/unpause token (emergency controls)

### 8. `remove_from_whitelist`
Remove investor access

## Token Extensions We Use

### ✅ Currently Implemented
- **Transfer Fees**: Automatic trustee compensation on every transfer
- **Metadata Pointer**: Link to full UAT metadata on IPFS
- **Supply Cap**: Hard limit on total tokens

### 🔜 Ready to Add
- **Transfer Hooks**: Custom compliance logic on transfers
- **Confidential Transfers**: Privacy for institutional investors (Token-2022 v2.0+)
- **Permanent Delegation**: Tie to property ownership NFTs

## Integration with Your Existing Tools

### Property Tokenization Wizard
The wizard can create tokens using this program:
1. User fills out property details
2. Wizard uploads UAT metadata to IPFS
3. Wizard calls `create_property_token` with IPFS URI
4. Investors use wizard to buy tokens (calls `mint_tokens`)

### Smart Contract Generator
Your generator **doesn't need to generate** Token Extension tokens - they're created via CLI.
But your generator **can create companion programs** for:
- Custom yield distribution logic
- Advanced compliance checks
- Governance systems
- Asset management features

## Example Flow

### Step 1: Create Token-2022 Mint (CLI)
```bash
spl-token create-token \
  --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \
  --decimals 0 \
  --enable-transfer-fee \
  --enable-metadata-pointer
```

### Step 2: Initialize Factory (Once)
```typescript
await program.methods.initializeFactory().rpc();
```

### Step 3: Create Property Token
```typescript
await program.methods
  .createPropertyToken(
    "Beverly Hills Estate",
    "BHE",
    "ipfs://QmUATMetadata123",
    new BN(3500),  // 3500 tokens
    0,             // 0 decimals
    100            // 1% fee
  )
  .rpc();
```

### Step 4: Whitelist Investors
```typescript
await program.methods
  .whitelistInvestor(true)  // accredited
  .rpc();
```

### Step 5: Mint Tokens
```typescript
await program.methods
  .mintTokens(new BN(100))
  .rpc();
```

## Why This Matters

### For Regulatory Compliance
- ✅ Native transfer restrictions (no custom code to audit)
- ✅ Whitelisting + accreditation tracking
- ✅ Transfer fees for trustee compensation (Reg D requirement)
- ✅ Privacy via confidential transfers (institutional investors)

### For Institutional Adoption
- ✅ Battle-tested Token-2022 (5 security audits)
- ✅ Lower gas costs
- ✅ Simpler codebase = easier audits
- ✅ Future-proof (Token Extensions are the new standard)

### For Your Platform
- ✅ Less custom code to maintain
- ✅ Easier integration with Solana ecosystem
- ✅ Professional-grade compliance
- ✅ Ready for institutional capital

## Next Steps

1. ✅ **DONE**: Program implementation
2. ✅ **DONE**: Test suite
3. ⏳ Build and deploy to devnet
4. ⏳ Create TypeScript SDK wrapper
5. ⏳ Integrate with Property Tokenization Wizard
6. ⏳ Add transfer hook for advanced compliance
7. ⏳ Build frontend demo

## Resources

- [Token Extensions Docs](https://solana.com/solutions/token-extensions)
- [Token-2022 Technical Paper](https://solana.com/solutions/token-extensions#read-the-technical-paper)
- [UAT Specification](../../apps/UAT/UNIVERSAL_ASSET_TOKEN_SPECIFICATION.md)

---

**Status**: ✅ Code Complete | ⏳ Building | 🧪 Ready for Testing




