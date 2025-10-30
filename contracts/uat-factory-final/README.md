# UAT Factory Smart Contract

**Production-Ready Solana Smart Contract for Real Estate Tokenization**

> Factory pattern for creating compliant property tokens with KYC, accreditation, and investor caps.

**Program ID:** `UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm`  
**Network:** Solana Devnet  
**[View on Explorer](https://explorer.solana.com/address/UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm?cluster=devnet)**

---

## Overview

A Solana smart contract (Anchor program) that implements a factory pattern for creating property tokens with built-in compliance features:

- Create property tokens with metadata URIs
- Whitelist investors with KYC/AML tracking
- Verify accreditation for SEC Reg D 506(c)
- Enforce investor caps (2000 max per property)
- Mint tokens to compliant investors
- Track metadata via IPFS URIs

---

## Architecture

### Factory Pattern
```
┌─────────────┐
│   Factory   │  (Singleton)
└──────┬──────┘
       │ creates
       ├──────────────┐
       ▼              ▼
┌──────────────┐ ┌──────────────┐
│  Property 1  │ │  Property 2  │
│  (3500 tkn)  │ │  (5000 tkn)  │
└──────┬───────┘ └──────┬───────┘
       │                 │
       ├──────┐          ├──────┐
       ▼      ▼          ▼      ▼
   Investor Investor Investor Investor
   Whitelist Whitelist Whitelist Whitelist
```

### Account Structure

**Factory Account (PDA)**
- Tracks total properties created
- Authority (admin)
- Bump seed

**PropertyToken Account (PDA)**
- Mint address (SPL Token)
- Metadata URI (IPFS)
- Token details (name, symbol, supply)
- Minted supply tracking
- Investor count
- Lock-up period
- Active status

**InvestorWhitelist Account (PDA)**
- Investor public key
- KYC hash (verification)
- Accreditation status
- Timestamp
- Active status

---

## Instructions

### 1. `initialize_factory`
Creates the factory singleton (one-time setup).

**Accounts:**
- `factory` (writable, PDA)
- `authority` (signer, payer)
- `system_program`

**Parameters:** None

**Example:**
```rust
program.methods.initialize_factory()
  .accounts({
    factory: factoryPDA,
    authority: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

---

### 2. `create_property_token`
Creates a new property token collection.

**Accounts:**
- `factory` (writable)
- `property` (writable, PDA)
- `mint` (writable, PDA)
- `authority` (signer, payer)
- `token_program` (SPL Token)
- `system_program`
- `rent`

**Parameters:**
- `metadata_uri: String` - IPFS URI (max 200 chars)
- `token_name: String` - Token name (max 64 chars)
- `token_symbol: String` - Token symbol (max 10 chars)
- `total_supply: u64` - Maximum supply

**Example:**
```rust
program.methods.createPropertyToken(
  "ipfs://QmUATMetadata123...",  // metadata_uri
  "Beverly Hills Estate",         // token_name
  "BHE",                          // token_symbol
  new BN(3500)                    // total_supply
)
.accounts({ /* ... */ })
.rpc()
```

---

### 3. `add_to_whitelist`
Adds an investor to the property's whitelist.

**Accounts:**
- `property` (read-only)
- `whitelist` (writable, PDA)
- `investor` (target investor)
- `authority` (signer, must be property authority)
- `system_program`

**Parameters:**
- `investor: Pubkey` - Investor's wallet
- `kyc_hash: [u8; 32]` - KYC document hash
- `is_accredited: bool` - Accreditation status

**Example:**
```rust
program.methods.addToWhitelist(
    investorPubkey,
  kycHashArray,
  true  // is_accredited
)
.accounts({ /* ... */ })
.rpc()
```

---

### 4. `mint_property_tokens`
Mints tokens to a whitelisted, accredited investor.

**Accounts:**
- `property` (writable)
- `mint` (writable)
- `whitelist` (read-only)
- `recipient_token_account` (writable)
- `recipient` (target investor)
- `authority` (signer, must be property authority)
- `token_program`
- `associated_token_program`
- `system_program`
- `rent`

**Parameters:**
- `amount: u64` - Number of tokens to mint

**Checks Performed:**
- ✅ Recipient is whitelisted
- ✅ Recipient is accredited
- ✅ Investor cap not exceeded (2000)
- ✅ Supply cap not exceeded
- ✅ Property is active

**Example:**
```rust
program.methods.mintPropertyTokens(new BN(100))
  .accounts({ /* ... */ })
  .rpc()
```

---

### 5. `update_metadata`
Updates the metadata URI (for revaluations, document updates).

**Accounts:**
- `property` (writable)
- `authority` (signer, must be property authority)

**Parameters:**
- `new_metadata_uri: String` - New IPFS URI

---

## Account Data Structures

### Factory
```rust
pub struct Factory {
    pub authority: Pubkey,        // 32 bytes
    pub total_properties: u32,    // 4 bytes
    pub bump: u8,                 // 1 byte
    // Total: 37 bytes + 8 byte discriminator = 45 bytes
}
```

### PropertyToken
```rust
pub struct PropertyToken {
    pub factory: Pubkey,              // 32 bytes
    pub mint: Pubkey,                 // 32 bytes
    pub authority: Pubkey,            // 32 bytes
    pub metadata_uri: String,         // 4 + 200 = 204 bytes
    pub token_name: String,           // 4 + 64 = 68 bytes
    pub token_symbol: String,         // 4 + 10 = 14 bytes
    pub total_supply: u64,            // 8 bytes
    pub minted_supply: u64,           // 8 bytes
    pub unique_investors: u16,        // 2 bytes
    pub created_at: i64,              // 8 bytes
    pub lock_up_end_date: i64,        // 8 bytes
    pub is_active: bool,              // 1 byte
    pub bump: u8,                     // 1 byte
    // Total: ~418 bytes + 8 byte discriminator = 426 bytes
}
```

### InvestorWhitelist
```rust
pub struct InvestorWhitelist {
    pub property: Pubkey,             // 32 bytes
    pub investor: Pubkey,             // 32 bytes
    pub kyc_hash: [u8; 32],          // 32 bytes
    pub is_accredited: bool,          // 1 byte
    pub is_active: bool,              // 1 byte
    pub added_at: i64,                // 8 bytes
    pub bump: u8,                     // 1 byte
    // Total: 107 bytes + 8 byte discriminator = 115 bytes
}
```

---

## Security Features

### PDA-Based Accounts
All program accounts use Program Derived Addresses:
```rust
// Factory PDA
seeds = [b"factory"]

// Property PDA
seeds = [b"property", factory.key, mint.key]

// Whitelist PDA
seeds = [b"whitelist", property.key, investor.key]
```

### Authority Checks
```rust
// Only property authority can whitelist
require!(authority.key() == property.authority);

// Only property authority can mint
require!(authority.key() == property.authority);
```

### Supply Caps
```rust
// Check supply limit
require!(
    property.minted_supply + amount <= property.total_supply,
    ErrorCode::ExceedsSupply
);
```

### Investor Caps
```rust
// Check investor limit (Reg D 506(c))
require!(
    property.unique_investors < 2000,
    ErrorCode::InvestorCapReached
);
```

### Compliance Checks
```rust
// Verify whitelist
require!(whitelist.is_active, ErrorCode::NotWhitelisted);

// Verify accreditation
require!(whitelist.is_accredited, ErrorCode::NotAccredited);
```

---

## Testing

### Run Tests
```bash
anchor test
```

### Test Coverage
- Factory initialization
- Property token creation
- Investor whitelisting
- Token minting (success cases)
- Token minting (failure cases)
  - Non-whitelisted investor
  - Non-accredited investor
  - Supply cap exceeded
  - Investor cap exceeded
- Metadata updates

### Example Test
```typescript
it("Creates a property token", async () => {
  const tx = await program.methods
    .createPropertyToken(
      "ipfs://QmTest123",
      "Test Property",
      "TEST",
      new BN(1000)
    )
    .accounts({ /* ... */ })
    .rpc();
    
  const property = await program.account.propertyToken.fetch(propertyPDA);
  assert.equal(property.tokenName, "Test Property");
  assert.equal(property.totalSupply.toString(), "1000");
});
```

---

## Deployment

### Deploy to Devnet
```bash
anchor build
anchor deploy --provider.cluster devnet
```

### Deploy to Mainnet
```bash
anchor build --verifiable
anchor deploy --provider.cluster mainnet
```

### Verify Deployment
```bash
solana program show UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm \
  --url devnet
```

---

## Gas Costs (Approximate)

| Operation | SOL Cost | Notes |
|-----------|----------|-------|
| Initialize Factory | 0.002 | One-time |
| Create Property Token | 0.005 | Per property |
| Add to Whitelist | 0.002 | Per investor |
| Mint Tokens | 0.003 | Per mint operation |
| Update Metadata | 0.001 | Per update |

*Costs are approximate and vary based on network congestion*

---

## Upgrade Path

### Current Version: 1.0
- Factory pattern
- Basic compliance
- SPL Token minting

### Planned: 2.0 (Token Extensions)
- Token-2022 integration
- Confidential transfers
- Transfer hooks
- Native transfer fees
- Metadata pointer extension

---

## Integration Examples

### TypeScript/JavaScript
```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

// Load program
const idl = await Program.fetchIdl(programId, provider);
const program = new Program(idl, programId, provider);

// Create property token
const tx = await program.methods
  .createPropertyToken(metadataUri, name, symbol, supply)
  .accounts({ /* ... */ })
  .rpc();
```

### Rust (CPI)
```rust
use anchor_lang::prelude::*;

// Cross-program invocation
let cpi_accounts = CreatePropertyToken {
    factory: ctx.accounts.factory.to_account_info(),
    property: ctx.accounts.property.to_account_info(),
    // ...
};

let cpi_ctx = CpiContext::new(
    ctx.accounts.uat_program.to_account_info(),
    cpi_accounts
);

uat_factory::cpi::create_property_token(
    cpi_ctx,
    metadata_uri,
    token_name,
    token_symbol,
    total_supply
)?;
```

---

## Error Codes

```rust
#[error_code]
pub enum ErrorCode {
    #[msg("Metadata URI must start with ipfs:// or https://")]
    InvalidMetadataUri = 6000,
    
    #[msg("Token symbol cannot exceed 10 characters")]
    SymbolTooLong = 6001,
    
    #[msg("Token name cannot exceed 64 characters")]
    NameTooLong = 6002,
    
    #[msg("Total supply must be greater than 0")]
    InvalidSupply = 6003,
    
    #[msg("Minting would exceed total supply")]
    ExceedsSupply = 6004,
    
    #[msg("Property token is not active")]
    PropertyInactive = 6005,
    
    #[msg("Investor is not whitelisted")]
    NotWhitelisted = 6006,
    
    #[msg("Investor is not accredited")]
    NotAccredited = 6007,
    
    #[msg("Maximum number of investors reached (2000)")]
    InvestorCapReached = 6008,
    
    #[msg("Unauthorized access")]
    Unauthorized = 6009,
}
```

---

## Additional Documentation

- [Deployment Guide](../../DEPLOY-UAT-FACTORY.md)
- [Wizard Integration](../../apps/property-tokenization-wizard/UAT_FACTORY_INTEGRATION.md)
- [UAT Specification](../../apps/UAT/UNIVERSAL_ASSET_TOKEN_SPECIFICATION.md)

---

## Contributing

Security improvements and bug fixes welcome!

1. Fork the repo
2. Create feature branch
3. Add tests
4. Submit pull request

---

## License

MIT License

---

## Acknowledgments

- Solana Foundation
- Anchor framework team
- SPL Token program

---

**Built with Anchor on Solana**
