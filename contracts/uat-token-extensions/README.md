# UAT Token Extensions Factory

**Universal Asset Token (UAT) Factory using Solana Token Extensions (Token-2022)**

This program creates and manages real-world asset tokens (like property tokens) using Solana's native Token Extensions, eliminating the need for custom smart contract logic for compliance, fees, and metadata.

## 🎯 What This Does Differently

### Traditional UAT (uat-factory-final)
- Custom Anchor program handles EVERYTHING
- Manual compliance checks
- Custom transfer logic
- Complex codebase

### Token Extensions UAT (this project)
- Leverages **Token-2022** native features
- Companion program for business logic only
- Token Extensions handle: compliance, fees, metadata
- Simpler, more secure

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│         Token-2022 (SPL Token Extensions)            │
│  ✓ Transfer restrictions (compliance)                │
│  ✓ Transfer fees (trustee compensation)              │
│  ✓ Metadata pointer (IPFS URIs)                     │
│  ✓ Confidential transfers (privacy)                  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│         UAT Factory (This Program)                   │
│  ✓ Property token creation                           │
│  ✓ KYC/Whitelist management                         │
│  ✓ Investor accreditation tracking                   │
│  ✓ Yield distribution records                        │
│  ✓ Metadata URI updates (valuations)                │
└─────────────────────────────────────────────────────┘
```

## 📦 Features

### 1. Factory Management
- **initialize_factory**: Create UAT factory instance
- Track all property tokens created

### 2. Property Token Creation
- **create_property_token**: Create new Token-2022 mint with:
  - Metadata URI (IPFS link to full UAT JSON)
  - Supply cap (total tokens)
  - Transfer fee configuration (basis points)
  - Decimals configuration

### 3. Compliance System
- **whitelist_investor**: Add investor to whitelist
  - KYC/AML verification flag
  - Accreditation status
  - Per-property token whitelisting
  
- **remove_from_whitelist**: Remove investor access

### 4. Token Minting
- **mint_tokens**: Mint to whitelisted investors
  - Checks whitelist status
  - Checks accreditation
  - Respects supply cap
  - Updates tracking

### 5. Yield Distribution
- **record_distribution**: Record quarterly/annual distributions
  - Amount per token
  - Total distribution
  - Distribution date
  - Historical tracking

### 6. Asset Management
- **update_metadata_uri**: Update IPFS URI
  - Property revaluations
  - Document updates
  - Metadata versioning
  
- **set_token_status**: Pause/unpause token
  - Emergency controls
  - Compliance holds

## 🚀 How to Use Token Extensions

### Step 1: Create Token-2022 Mint (Outside This Program)

```bash
# Create mint with transfer fees and metadata
spl-token create-token \
  --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb \
  --decimals 0 \
  --enable-transfer-fee \
  --enable-metadata-pointer

# Configure transfer fee (1% for trustee)
spl-token set-transfer-fee YOUR_MINT_ADDRESS 100 1000000000
```

### Step 2: Initialize Factory

```typescript
await program.methods
  .initializeFactory()
  .accounts({
    factory: factoryPDA,
    authority: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### Step 3: Create Property Token

```typescript
await program.methods
  .createPropertyToken(
    "Beverly Hills Estate",      // token_name
    "BHE",                        // token_symbol
    "ipfs://QmUATMetadata...",    // metadata_uri
    new BN(3500),                 // total_supply
    0,                            // decimals
    100                           // transfer_fee_basis_points (1%)
  )
  .accounts({
    factory: factoryPDA,
    propertyToken: propertyTokenPDA,
    mint: mintPublicKey,
    authority: wallet.publicKey,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### Step 4: Whitelist Investors

```typescript
await program.methods
  .whitelistInvestor(
    true  // is_accredited
  )
  .accounts({
    propertyToken: propertyTokenPDA,
    investorRecord: investorRecordPDA,
    investor: investorPublicKey,
    authority: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### Step 5: Mint Tokens

```typescript
await program.methods
  .mintTokens(new BN(100))  // amount
  .accounts({
    propertyToken: propertyTokenPDA,
    mint: mintPublicKey,
    investorRecord: investorRecordPDA,
    investorTokenAccount: investorATA,
    investor: investorPublicKey,
    authority: wallet.publicKey,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
  })
  .rpc();
```

## 🔐 Security Features

### Compliance Checks
- ✅ Whitelist verification before minting
- ✅ Accreditation status check (Reg D 506(c))
- ✅ Supply cap enforcement
- ✅ Authority validation on all admin functions

### Token Extensions Benefits
- ✅ **Transfer fees**: Automatic trustee compensation
- ✅ **Transfer restrictions**: Can add transfer hooks for additional compliance
- ✅ **Confidential transfers**: Privacy for institutional investors (Token-2022 v2.0+)
- ✅ **Metadata pointer**: Immutable link to UAT metadata

## 📊 Data Structures

### Factory
```rust
pub struct Factory {
    pub authority: Pubkey,        // Factory owner
    pub total_properties: u32,    // Counter for all properties
    pub bump: u8,                 // PDA bump
}
```

### PropertyToken
```rust
pub struct PropertyToken {
    pub factory: Pubkey,
    pub mint: Pubkey,             // Token-2022 mint
    pub authority: Pubkey,
    pub token_name: String,       // "Beverly Hills Estate"
    pub token_symbol: String,     // "BHE"
    pub metadata_uri: String,     // IPFS URI to full UAT JSON
    pub total_supply: u64,
    pub minted_supply: u64,
    pub decimals: u8,
    pub transfer_fee_basis_points: u16,
    pub created_at: i64,
    pub is_active: bool,
    pub bump: u8,
}
```

### InvestorRecord
```rust
pub struct InvestorRecord {
    pub investor: Pubkey,
    pub property_token: Pubkey,
    pub is_whitelisted: bool,
    pub is_accredited: bool,
    pub whitelisted_at: i64,
    pub tokens_held: u64,
    pub last_transaction: i64,
    pub bump: u8,
}
```

### YieldDistribution
```rust
pub struct YieldDistribution {
    pub property_token: Pubkey,
    pub distribution_number: u64,
    pub amount_per_token: u64,
    pub total_amount: u64,
    pub distribution_date: i64,
    pub recorded_at: i64,
    pub bump: u8,
}
```

## 🧪 Testing

```bash
# Build
anchor build

# Test
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## 📝 Integration with UAT Metadata

The `metadata_uri` field points to IPFS where the full UAT metadata lives:

```json
{
  "standard": "UAT-1.0",
  "token_type": "fractional",
  "asset_class": "real_estate",
  "name": "Beverly Hills Estate Token",
  "symbol": "BHE",
  "modules": {
    "asset_details": true,
    "trust_structure": true,
    "yield_distribution": true,
    "compliance": true,
    "valuation": true
  },
  "asset_details": { /* ... */ },
  "trust_structure": { /* ... */ },
  "yield_distribution": { /* ... */ }
}
```

## 🔄 Comparison with Standard UAT Factory

| Feature | Standard UAT | Token Extensions UAT |
|---------|--------------|---------------------|
| Transfer restrictions | Custom logic | Token-2022 native |
| Transfer fees | Manual accounting | Token-2022 native |
| Metadata storage | On-chain struct | Token-2022 metadata pointer |
| Privacy | None | Confidential transfers |
| Security audits | Required | Token-2022 audited (5 firms) |
| Complexity | High | Medium |
| Gas costs | Higher | Lower |
| Institutional ready | Partial | Full |

## 🎯 Next Steps

1. ✅ Complete program implementation
2. ⏳ Write TypeScript tests
3. ⏳ Create CLI tool for property token creation
4. ⏳ Build frontend integration
5. ⏳ Add transfer hook for advanced compliance
6. ⏳ Integrate confidential transfers (when available)
7. ⏳ Connect to Property Tokenization Wizard

## 📚 Resources

- [Token Extensions Docs](https://solana.com/solutions/token-extensions)
- [SPL Token-2022 Program](https://spl.solana.com/token-2022)
- [UAT Specification](../../apps/UAT/UNIVERSAL_ASSET_TOKEN_SPECIFICATION.md)

## 🤝 Contributing

This is part of the AssetRail Quantum Securities Platform.

---

**Built with Anchor 0.32.1 | Token-2022 | Solana**


