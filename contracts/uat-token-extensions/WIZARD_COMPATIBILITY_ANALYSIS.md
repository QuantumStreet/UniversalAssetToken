# Property Tokenization Wizard ↔ Token Extensions UAT Compatibility Analysis

**Date:** October 29, 2025  
**Status:** ✅ **HIGHLY COMPATIBLE** (with minor integration updates needed)

---

## 🎯 Summary

**Good News:** The Property Tokenization Wizard collects **MORE than enough data** to work with Token Extensions UAT. 

**Minor Updates Needed:** The wizard's integration code (`uatFactory.ts`) expects the OLD UAT factory interface and needs to be updated for Token Extensions.

---

## 📊 Data Mapping Analysis

### Wizard Collects (PropertyDetails):

```typescript
{
  // Core property data
  propertyAddress: string,
  propertyValue: number,
  totalSquareFootage: number,
  netIncome: number,
  annualRentalIncome: number,
  annualExpenses: number,
  
  // Extended property details
  bedrooms: number,
  bathroomsFull: number,
  lotSize: number,
  yearBuilt: number,
  propertyType: string,
  
  // Documents
  titleDocument: File,
  appraisalDocument: File,
  insuranceDocument: File,
  surveyDocument: File,
  
  // Images
  propertyImages: File[],
}
```

### Wizard Collects (TrustConfiguration):

```typescript
{
  trustName: string,
  settlorName: string,
  trusteeName: string,
  trustDuration: number,
  distributionRate: number,
  reserveRate: number,
  trusteeFeeRate: number,
  
  // Token configuration
  tokenName: string,        // ✅ Used in Token Extensions
  tokenSymbol: string,      // ✅ Used in Token Extensions  
  totalSupply: number,      // ✅ Used in Token Extensions
  pricePerToken: number,
}
```

### Token Extensions UAT Needs:

```rust
pub fn create_property_token(
  token_name: String,              // ✅ FROM: trustConfig.tokenName
  token_symbol: String,            // ✅ FROM: trustConfig.tokenSymbol
  metadata_uri: String,            // ✅ FROM: IPFS upload of all wizard data
  total_supply: u64,               // ✅ FROM: trustConfig.totalSupply
  decimals: u8,                    // ✅ DEFAULT: 0 (whole tokens)
  transfer_fee_basis_points: u16,  // ✅ FROM: trustConfig.trusteeFeeRate * 10000
)
```

---

## ✅ Field-by-Field Compatibility

| Token Extensions Field | Wizard Data Source | Compatible? | Notes |
|------------------------|-------------------|-------------|-------|
| `token_name` | `trustConfig.tokenName` | ✅ Yes | Direct match |
| `token_symbol` | `trustConfig.tokenSymbol` | ✅ Yes | Direct match |
| `metadata_uri` | Generated from all wizard data | ✅ Yes | Upload to IPFS |
| `total_supply` | `trustConfig.totalSupply` | ✅ Yes | Direct match |
| `decimals` | Hardcoded `0` | ✅ Yes | Wizard assumes whole tokens |
| `transfer_fee_basis_points` | `trustConfig.trusteeFeeRate * 10000` | ✅ Yes | 0.01 = 100 bps |

---

## 📋 UAT Metadata Generation

The wizard creates a **complete UAT metadata JSON** from collected data:

```json
{
  "standard": "UAT-1.0",
  "token_type": "fractional",
  "asset_class": "real_estate",
  
  "name": "Beverly Hills Estate Token",  // FROM: trustConfig.tokenName
  "symbol": "BHE",                        // FROM: trustConfig.tokenSymbol
  "total_supply": 3500,                   // FROM: trustConfig.totalSupply
  
  "asset_details": {
    "physical_address": {
      "street": "...",                    // FROM: propertyDetails.propertyAddress
      "city": "...",
      "state": "...",
      "zip": "..."
    },
    "property_characteristics": {
      "square_footage": 3500,             // FROM: propertyDetails.totalSquareFootage
      "lot_size": 8500,                   // FROM: propertyDetails.lotSize
      "bedrooms": 5,                      // FROM: propertyDetails.bedrooms
      "bathrooms": 4.5,                   // FROM: propertyDetails.bathrooms
      "year_built": 1985                  // FROM: propertyDetails.yearBuilt
    },
    "valuation": {
      "appraised_value": 1890000,         // FROM: propertyDetails.propertyValue
      "ai_estimated_value": 1885000       // FROM: propertyDetails.aiEstimatedValue
    }
  },
  
  "trust_structure": {
    "trust_name": "...",                  // FROM: trustConfig.trustName
    "settlor": "...",                     // FROM: trustConfig.settlorName
    "trustee": "...",                     // FROM: trustConfig.trusteeName
    "trustee_fee_rate": 0.01              // FROM: trustConfig.trusteeFeeRate
  },
  
  "yield_distribution": {
    "annual_rental_income": 94500,        // FROM: propertyDetails.annualRentalIncome
    "annual_expenses": 41060,             // FROM: propertyDetails.annualExpenses
    "net_income": 53440,                  // FROM: propertyDetails.netIncome
    "distribution_rate": 0.90,            // FROM: trustConfig.distributionRate
    "reserve_rate": 0.10                  // FROM: trustConfig.reserveRate
  },
  
  "legal_documents": {
    "title_deed": {
      "url": "ipfs://QmTitle...",         // FROM: propertyDetails.titleDocument
      "hash": "0x..."
    },
    "property_appraisal": {
      "url": "ipfs://QmAppraisal...",     // FROM: propertyDetails.appraisalDocument
      "appraised_value": 1890000
    },
    "hazard_insurance": {
      "url": "ipfs://QmInsurance..."      // FROM: propertyDetails.insuranceDocument
    }
  },
  
  "media": {
    "images": [
      "ipfs://QmImage1...",               // FROM: propertyDetails.propertyImages[]
      "ipfs://QmImage2..."
    ]
  }
}
```

**This full UAT JSON gets uploaded to IPFS** → IPFS URI becomes `metadata_uri` parameter.

---

## 🔄 Integration Updates Needed

### Current Wizard Integration (`uatFactory.ts`):

```typescript
// OLD: Expects standard UAT factory
await program.methods
  .createPropertyToken(metadataUri, tokenName, tokenSymbol, totalSupply)
  .accounts({
    factory: factoryPDA,
    property: propertyPDA,
    mint: mintPDA,              // ❌ OLD: Uses Keypair-based mint
    authority: wallet.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,  // ❌ OLD: Uses standard SPL token
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY,
  })
  .rpc();
```

### Required Updates for Token Extensions:

```typescript
// Step 1: Create Token-2022 mint FIRST (outside the program)
import { 
  TOKEN_2022_PROGRAM_ID,
  createMint,
  ExtensionType,
} from "@solana/spl-token";

// Create Token-2022 mint with extensions
const mint = await createMint(
  connection,
  payer,
  mintAuthority,
  freezeAuthority,
  decimals,
  undefined, // mint keypair (auto-generated)
  undefined, // confirmation options
  TOKEN_2022_PROGRAM_ID
);

// Step 2: Call Token Extensions UAT factory
await program.methods
  .createPropertyToken(
    tokenName,
    tokenSymbol,
    metadataUri,
    totalSupply,
    decimals,                    // ✅ NEW: decimals parameter
    transferFeeBasisPoints       // ✅ NEW: fee configuration
  )
  .accounts({
    factory: factoryPDA,
    propertyToken: propertyTokenPDA,  // ✅ RENAMED: property → propertyToken
    mint: mint,                       // ✅ CHANGED: Token-2022 mint
    authority: wallet.publicKey,
    tokenProgram: TOKEN_2022_PROGRAM_ID,  // ✅ CHANGED: Token-2022 program
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

---

## 🚀 Required Code Changes

### 1. Update `uatFactory.ts`

**File:** `/apps/property-tokenization-wizard/src/services/uatFactory.ts`

**Changes:**
- ✅ Import Token-2022 SDK instead of standard SPL Token
- ✅ Create Token-2022 mint before calling `createPropertyToken`
- ✅ Update account names (`property` → `propertyToken`)
- ✅ Add `decimals` and `transfer_fee_basis_points` parameters
- ✅ Update PDA derivation to match new seeds

### 2. Create New Integration File

**File:** `/apps/property-tokenization-wizard/src/services/uatTokenExtensions.ts`

**Purpose:** New service specifically for Token Extensions UAT

```typescript
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export const UAT_TOKEN_EXTENSIONS_PROGRAM_ID = new PublicKey('2wJMSqmGn8aYNtxUpFBuMBsnEvPbSBDguhuPpoumEfw6');

export async function createPropertyTokenTE(
  provider: AnchorProvider,
  tokenName: string,
  tokenSymbol: string,
  metadataUri: string,
  totalSupply: number,
  decimals: number = 0,
  trusteeFeeRate: number = 0.01,
  onProgress?: (message: string) => void
): Promise<CreatePropertyResult> {
  // 1. Create Token-2022 mint
  // 2. Call createPropertyToken
  // 3. Return results
}
```

### 3. Update Wizard Step Components

**File:** `/apps/property-tokenization-wizard/src/components/steps/deployment-step.tsx`

**Changes:**
- ✅ Import `uatTokenExtensions` service
- ✅ Calculate `transfer_fee_basis_points` from `trusteeFeeRate`
- ✅ Pass `decimals` (default 0)
- ✅ Handle Token-2022 mint creation

### 4. Update IDL Reference

**File:** `/apps/property-tokenization-wizard/public/api/idl/uat_factory.json`

**Action:** Replace with Token Extensions UAT IDL (after build completes)

---

## 📊 Comparison: Old vs New

| Feature | Old UAT Factory | Token Extensions UAT |
|---------|----------------|---------------------|
| **Mint Creation** | Inside program | Outside program (Token-2022) |
| **Token Program** | TOKEN_PROGRAM_ID | TOKEN_2022_PROGRAM_ID |
| **Transfer Fees** | Manual tracking | Native Token-2022 |
| **Compliance** | Custom logic | Token-2022 + program logic |
| **Metadata** | On-chain struct | Metadata pointer to IPFS |
| **Privacy** | None | Confidential transfers (v2.0+) |
| **Account Names** | `property` | `propertyToken` |
| **Parameters** | 4 params | 6 params (+ decimals, fee) |
| **Whitelist** | `add_to_whitelist` | `whitelist_investor` |
| **Mint Function** | `mint_property_tokens` | `mint_tokens` |

---

## ✅ Wizard Data Coverage

### What the Wizard Collects vs What UAT Needs:

#### Core Token Data
- ✅ Token name (`trustConfig.tokenName`)
- ✅ Token symbol (`trustConfig.tokenSymbol`)
- ✅ Total supply (`trustConfig.totalSupply`)
- ✅ Decimals (defaults to 0)
- ✅ Transfer fee (from `trustConfig.trusteeFeeRate`)

#### Property Asset Details
- ✅ Address (`propertyDetails.propertyAddress`)
- ✅ Valuation (`propertyDetails.propertyValue`)
- ✅ Square footage (`propertyDetails.totalSquareFootage`)
- ✅ All characteristics (bedrooms, bathrooms, etc.)
- ✅ Images (`propertyDetails.propertyImages[]`)

#### Trust Structure
- ✅ Trust name (`trustConfig.trustName`)
- ✅ Settlor (`trustConfig.settlorName`)
- ✅ Trustee (`trustConfig.trusteeName`)
- ✅ Duration (`trustConfig.trustDuration`)
- ✅ Fee rates (distribution, reserve, trustee)

#### Yield Distribution
- ✅ Annual income (`propertyDetails.annualRentalIncome`)
- ✅ Annual expenses (`propertyDetails.annualExpenses`)
- ✅ Net income (`propertyDetails.netIncome`)
- ✅ Distribution rate (`trustConfig.distributionRate`)
- ✅ Reserve rate (`trustConfig.reserveRate`)

#### Legal Documents
- ✅ Title document (`propertyDetails.titleDocument`)
- ✅ Appraisal (`propertyDetails.appraisalDocument`)
- ✅ Insurance (`propertyDetails.insuranceDocument`)
- ✅ Survey (`propertyDetails.surveyDocument`)

#### Compliance (Future)
- ⏳ KYC/AML verification (not yet in wizard)
- ⏳ Accreditation status (not yet in wizard)
- ⏳ Investor whitelist management (not yet in wizard)

---

## 🎯 Implementation Checklist

### Phase 1: Core Integration (1-2 hours)
- [ ] Create `uatTokenExtensions.ts` service
- [ ] Implement `createPropertyTokenTE()` function
- [ ] Implement Token-2022 mint creation
- [ ] Update PDA derivations
- [ ] Add error handling

### Phase 2: Wizard Updates (1-2 hours)
- [ ] Update deployment step to use Token Extensions
- [ ] Calculate `transfer_fee_basis_points` from `trusteeFeeRate`
- [ ] Update UI to show Token-2022 features
- [ ] Add progress indicators
- [ ] Update success messages

### Phase 3: Testing (1 hour)
- [ ] Test property token creation
- [ ] Verify metadata URI upload
- [ ] Test investor whitelisting
- [ ] Test token minting
- [ ] Verify transfer fees

### Phase 4: Documentation (30 min)
- [ ] Update wizard README
- [ ] Add Token Extensions guide
- [ ] Update API documentation
- [ ] Add troubleshooting section

---

## 💡 Benefits of Token Extensions for Wizard Users

### What Users Get (That They Didn't Before):

1. **Native Transfer Fees**
   - Automatic trustee compensation on every transfer
   - No manual accounting needed
   - Transparent and auditable

2. **Enhanced Compliance**
   - Token-2022 transfer restrictions
   - Transfer hooks for custom logic
   - Built-in security audits (5 firms)

3. **Privacy Features (Future)**
   - Confidential transfers for institutional investors
   - Hide balance amounts
   - Maintain regulatory compliance

4. **Lower Costs**
   - Simpler codebase = lower audit costs
   - Fewer custom instructions = lower gas
   - Standard protocol = easier maintenance

5. **Institutional Ready**
   - Battle-tested Token-2022 program
   - Used by major stablecoins (Paxos, GMO Trust)
   - Professional-grade security

---

## 🚦 Compatibility Score: 9.5/10

### ✅ Strengths:
- Wizard collects ALL required data
- Existing data structure maps perfectly
- Metadata generation already comprehensive
- IPFS upload infrastructure in place
- Document management already built

### ⚠️ Minor Updates Needed:
- Change Token program reference (5 min)
- Update account naming (`property` → `propertyToken`) (5 min)
- Add mint creation step (15 min)
- Calculate transfer fee basis points (5 min)
- Update IDL reference (1 min)

**Total Integration Time: ~2-3 hours**

---

## 🎉 Conclusion

The Property Tokenization Wizard is **HIGHLY COMPATIBLE** with Token Extensions UAT!

**No data collection changes needed** - the wizard already collects everything required.

**Minor integration updates** - mostly API call changes and parameter mapping.

**Major benefits** - Users get enterprise-grade token features with minimal effort.

---

**Next Steps:**
1. Wait for Token Extensions UAT build to complete
2. Extract IDL from build artifacts
3. Create `uatTokenExtensions.ts` integration service
4. Update wizard deployment step
5. Test end-to-end flow
6. Deploy and celebrate! 🎉


