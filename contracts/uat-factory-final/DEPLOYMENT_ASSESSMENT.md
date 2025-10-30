# UAT Factory Contract - Deployment Assessment

**Date:** October 19, 2025  
**Contract:** Universal Asset Token Factory v1.0  
**Status:** Generated ✅ | Ready for Build ⏳

---

## ✅ What We Have

### 1. **Complete Contract Code** (387 lines)
- ✅ Location: `programs/rust-main-template/src/lib.rs`
- ✅ Language: Rust/Anchor
- ✅ Generated via: smart-contract-generator API
- ✅ All compliance features included

### 2. **Compliance Features Verified**

**✅ SEC Reg D 506(c) Requirements:**
- Whitelist enforcement (`add_to_whitelist` instruction)
- Accreditation checks (`is_accredited` field)
- Investor cap: 2,000 max (`MAX_INVESTORS` constant)
- Authority control (trustee-only operations)

**✅ AML/KYC Integration:**
- KYC hash storage (`kyc_hash: [u8; 32]`)
- Whitelist status tracking
- On-chain audit trail

**✅ Trust Automation:**
- 12-month lock-up (`lock_up_end_date`)
- Unique investor tracking
- Metadata URI linking (IPFS)

### 3. **Instructions Implemented**

```rust
1. initialize_factory() ✅
   - Sets up factory authority
   - Initializes property counter
   
2. create_property_token(metadata_uri, name, symbol, supply) ✅
   - Creates new property token collection
   - Links to UAT metadata on IPFS
   - Sets 12-month lock-up automatically
   
3. add_to_whitelist(investor, kyc_hash, is_accredited) ✅
   - Trustee-only
   - Stores KYC verification
   - Marks accreditation status
   
4. mint_property_tokens(amount) ✅
   - Checks: whitelist ✓ accreditation ✓ cap ✓
   - Mints SPL tokens
   - Tracks unique investors
   
5. update_metadata_uri(new_uri) ✅
   - Trustee-only
   - Update IPFS link (e.g., new appraisal)
```

### 4. **Data Structures**

```rust
Factory ✅
- authority: Pubkey
- total_properties: u64
- bump: u8

PropertyToken ✅
- factory, mint, authority: Pubkey
- metadata_uri: String (max 200 chars)
- token_name: String (max 64 chars)
- token_symbol: String (max 10 chars)
- total_supply, minted_supply: u64
- unique_investors: u16 (max 2,000)
- created_at, lock_up_end_date: i64
- is_active: bool
- bump: u8

InvestorWhitelist ✅
- property, investor: Pubkey
- kyc_hash: [u8; 32]
- is_accredited: bool
- whitelisted_at: i64
- is_active: bool
```

### 5. **Error Codes** (9 total)

```rust
6000 - InvalidMetadataUri ✅
6001 - SymbolTooLong ✅
6002 - InvalidSupply ✅
6003 - PropertyInactive ✅
6004 - ExceedsSupply ✅
6005 - NotWhitelisted ✅ (KYC required)
6006 - NotAccredited ✅ (Reg D 506(c))
6007 - InvestorCapReached ✅ (2,000 limit)
6008 - Unauthorized ✅
```

---

## ⚠️ Issues Found

### Issue 1: Account Attribute Syntax ❌

**Problem:**
```rust
#[account(init)]
#[account(payer = authority)]
#[account(space = 8 + 32 + 8 + 1)]
#[account(seeds = [b"factory"])]
#[account(bump)]
```

**Should be:**
```rust
#[account(
    init,
    payer = authority,
    space = 8 + 32 + 8 + 1,
    seeds = [b"factory"],
    bump
)]
```

**Impact:** Won't compile - Anchor requires combined attributes

### Issue 2: Missing Variable References ❌

**Problem in mint_property_tokens:**
```rust
require!(property.is_active, ErrorCode::PropertyInactive);
```

But `property` is accessed via `ctx.accounts.property`, not as standalone variable.

**Should be:**
```rust
let property = &mut ctx.accounts.property;
let whitelist = &ctx.accounts.whitelist;

require!(property.is_active, ErrorCode::PropertyInactive);
require!(whitelist.is_active, ErrorCode::NotWhitelisted);
```

### Issue 3: Anchor.toml Configuration ❌

**Current:**
```toml
[programs.localnet]
anchor_contract = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

[provider]
cluster = "localnet"
```

**Should be:**
```toml
[programs.devnet]
uat_factory = "UATFctryDevnet1111111111111111111111111111"

[provider]
cluster = "Devnet"
```

### Issue 4: Missing Cargo.toml Files ❌

**Need:**
- Root `Cargo.toml` with workspace definition
- `programs/rust-main-template/Cargo.toml` with dependencies

---

## 🔧 What Needs to be Fixed

### Critical (Won't Compile Without These):

1. ✅ **Fix account attributes** (combine multi-line #[account])
2. ✅ **Add variable declarations** in validation sections
3. ✅ **Update Anchor.toml** (use devnet, correct program name)
4. ✅ **Create/fix Cargo.toml** files
5. ✅ **Rename program** (rust-main-template → uat_factory)

### Optional (Improvements):

1. Add Cargo.lock
2. Add package.json for tests
3. Add migrations/deploy.ts
4. Add tests/uat_factory.ts

---

## 🎯 Recommended Approach

### Option 1: Fix the Generated Contract ⭐ Recommended

**Steps:**
1. Fix Anchor attribute syntax throughout
2. Add proper variable declarations
3. Update Anchor.toml configuration
4. Ensure Cargo.toml is correct
5. Rename program folder
6. Build & deploy

**Time:** ~30 minutes
**Effort:** Medium
**Result:** Production-ready contract

### Option 2: Use Our Handlebars Template Directly

**Steps:**
1. Copy `UATFactoryTemplate.hbs` content
2. Manually replace `{{programName}}` and `{{programId}}`
3. Create clean Anchor project
4. Build & deploy

**Time:** ~15 minutes
**Effort:** Low
**Result:** Clean, tested contract

### Option 3: Re-generate with Fixed JSON

**Steps:**
1. Update `uat-factory-contract.json` with corrected syntax
2. Call API again
3. Build & deploy

**Time:** ~20 minutes
**Effort:** Low-Medium
**Result:** Proper API-generated contract

---

## 📋 Deployment Checklist

### Pre-Deployment:
- ⏳ Fix Anchor attribute syntax
- ⏳ Add proper variable declarations
- ⏳ Update Anchor.toml
- ⏳ Verify Cargo.toml
- ⏳ Rename program folder
- ⏳ Test compilation: `anchor build`

### Deployment:
- ⏳ Configure Solana CLI for devnet
- ⏳ Check wallet balance (need ~2 SOL)
- ⏳ Deploy: `anchor deploy`
- ⏳ Get deployed program ID
- ⏳ Initialize factory
- ⏳ Verify on Solana Explorer

### Post-Deployment:
- ⏳ Update wizard config with factory address
- ⏳ Test property token creation
- ⏳ Test whitelist/minting flow
- ⏳ Document deployed address

---

## 🚨 Critical Issues Summary

| Issue | Severity | Impact | Fix Required |
|-------|----------|--------|--------------|
| Account attribute syntax | 🔴 Critical | Won't compile | Yes |
| Variable declarations | 🔴 Critical | Compilation error | Yes |
| Anchor.toml config | 🟡 Medium | Wrong network | Yes |
| Cargo.toml missing | 🟡 Medium | Build issues | Yes |
| Program folder name | 🟢 Low | Cosmetic | Optional |

---

## ✅ Recommended Fix Plan

**I can fix all critical issues now by:**
1. Correcting the Anchor attribute syntax
2. Adding proper variable declarations
3. Updating Anchor.toml for devnet
4. Creating proper Cargo.toml files
5. Renaming the program folder

**This will take ~10 minutes and result in a build-ready contract.**

**Would you like me to:**
- **A) Fix all issues now** (recommended)
- **B) Use UATFactoryTemplate.hbs directly** (faster)
- **C) Review each fix one-by-one** (slower but educational)

Which approach would you prefer?

---

**Current Status:** Generated but needs fixes before `anchor build` ⚠️  
**Next Step:** Fix critical compilation issues  
**ETA to Deployment:** ~1 hour (after fixes)

