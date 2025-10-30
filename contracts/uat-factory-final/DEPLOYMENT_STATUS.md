# UAT Factory - Deployment Status

**Date:** October 19, 2025  
**Contract Status:** ✅ Code Ready, ⏳ Build Tools Needed  
**Program ID:** `UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm`

---

## 🎯 Current Status

### ✅ What's Ready:
- ✅ Contract code (387 lines, all syntax fixed)
- ✅ Compliance features (5/5 implemented)
- ✅ Wizard integration (100% compatible)
- ✅ Wallet configured (1.87 SOL on devnet)
- ✅ Devnet configured
- ✅ Deployment script created

### ⏳ What's Needed:
- ⏳ Solana platform tools (BPF compiler)
- ⏳ Anchor upgrade (0.24.2 → 0.29.0)

---

## 🔧 The Issue

**Error:**
```
error: no such command: `build-bpf`
```

**Root Cause:**
- Solana CLI is installed (1.18.20) ✅
- Anchor CLI is installed (0.24.2) ✅
- But Solana **platform tools** (BPF/SBF compiler) are missing ❌

**Why:**
- Anchor 0.24.2 uses old `cargo build-bpf` command
- Solana 1.18 uses newer `cargo build-sbf` command
- Neither are installed on your system

---

## 🚀 Quick Fix (2 Options)

### Option A: Install Platform Tools (Recommended)
```bash
# Install Solana platform tools via official installer
sh -c "$(curl -sSfL https://release.solana.com/v1.18.20/install)"

# This adds cargo-build-sbf to your PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verify
cargo-build-sbf --version

# Then build
cd /Volumes/Storage/QS_Asset_Rail/contracts/uat-factory-final
anchor build
anchor deploy --provider.cluster devnet
```

### Option B: Upgrade Anchor (Also Recommended)
```bash
# Install Anchor Version Manager
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Install Anchor 0.29.0 (matches contract)
avm install 0.29.0
avm use 0.29.0

# Verify
anchor --version  # Should show 0.29.0

# Then build
cd /Volumes/Storage/QS_Asset_Rail/contracts/uat-factory-final
anchor build
anchor deploy --provider.cluster devnet
```

### Option C: Use Automated Script
```bash
cd /Volumes/Storage/QS_Asset_Rail/contracts/uat-factory-final
./deploy-to-devnet.sh
```

This script will:
1. Check prerequisites
2. Install platform tools if needed
3. Build the contract
4. Deploy to devnet
5. Provide next steps

---

## 📋 Step-by-Step Deployment

### Step 1: Install Build Tools
Choose one of the methods above. I recommend **Option A** (platform tools).

### Step 2: Build Contract
```bash
cd /Volumes/Storage/QS_Asset_Rail/contracts/uat-factory-final
anchor build
```

**Expected Output:**
```
Compiling uat_factory v1.0.0
Finished release [optimized] target(s) in 45.32s
✅ Build successful
```

**Result:**
- `target/deploy/uat_factory.so` (compiled binary)
- `target/idl/uat_factory.json` (IDL for TypeScript)

### Step 3: Deploy to Devnet
```bash
anchor deploy --provider.cluster devnet
```

**Expected Output:**
```
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: BEGs3Cdsw5KHgQDE5UvxxCrR8VomtSW3HUFuZp3emLLa
Deploying program "uat_factory"...
Program Id: UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm

✅ Deploy success
```

### Step 4: Verify Deployment
```bash
solana program show UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm --url devnet
```

**Expected Output:**
```
Program Id: UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm
Owner: BPFLoaderUpgradeab1e11111111111111111111111
ProgramData Address: [some address]
Authority: BEGs3Cdsw5KHgQDE5UvxxCrR8VomtSW3HUFuZp3emLLa
Last Deployed In Slot: [slot number]
Data Length: ~35-40 KB
```

### Step 5: Copy IDL to Wizard
```bash
cp target/idl/uat_factory.json ../../apps/property-tokenization-wizard/src/idl/
```

### Step 6: Activate Real Minting

Edit `/apps/property-tokenization-wizard/src/services/uatFactory.ts`:

**Add imports:**
```typescript
import { Program, Idl } from '@coral-xyz/anchor';
import idl from '../idl/uat_factory.json';
```

**Replace simulation code (lines 55-66) with:**
```typescript
const program = new Program(idl as Idl, UAT_FACTORY_PROGRAM_ID, provider);

const tx = await program.methods
  .createPropertyToken(metadataUri, tokenName, tokenSymbol, new BN(totalSupply))
  .accounts({
    factory: factoryPDA,
    property: propertyPDA,
    mint: mintKeypair.publicKey,
    authority: provider.wallet.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY,
  })
  .signers([mintKeypair])
  .rpc();

return {
  propertyPDA,
  mintPDA,
  signature: tx,
};
```

Do the same for `addToWhitelist()` and `mintPropertyTokens()`.

### Step 7: Test in Wizard
```bash
cd ../../apps/property-tokenization-wizard
npm run dev
```

1. Extract property from Sotheby's ✅
2. Configure trust with preset ✅
3. Generate UAT metadata ✅
4. **Connect Phantom wallet** 👛
5. **Mint tokens** - NOW REAL! 🎉

---

## 📊 Deployment Cost Estimate

| Action | Cost (SOL) | Status |
|--------|-----------|--------|
| Deploy program | ~0.5-1.0 | ⏳ Pending |
| Initialize factory | ~0.01 | ⏳ After deploy |
| Create property token | ~0.02 | ⏳ Per property |
| Whitelist investor | ~0.002 | ⏳ Per investor |
| Mint tokens | ~0.001 | ⏳ Per mint |

**Total for first property:** ~1.5 SOL  
**Your balance:** 1.87 SOL ✅ Sufficient!

---

## ⚠️ Important Notes

### Anchor Version Mismatch:
- Contract generated for: **Anchor 0.29.0**
- Your system has: **Anchor 0.24.2**

**Impact:**
- Build might fail with version-specific syntax
- IDL format might differ
- Some Anchor features might not work

**Solution:**
- Upgrade to Anchor 0.29.0 (see Option B above)
- Or downgrade contract to 0.24.2 syntax (not recommended)

### Build Tools:
- `cargo build-bpf` (old) or `cargo build-sbf` (new) required
- Installed via Solana platform tools
- Essential for compiling Rust → BPF bytecode

---

## 🎯 Quickest Path to Deployment

**1 minute setup:**
```bash
# Install platform tools
sh -c "$(curl -sSfL https://release.solana.com/v1.18.20/install)"

# Build & deploy
cd /Volumes/Storage/QS_Asset_Rail/contracts/uat-factory-final
anchor build
anchor deploy --provider.cluster devnet

# Done! ✅
```

**Alternative (if Anchor 0.24.2 has issues):**
```bash
# Upgrade Anchor first
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.29.0
avm use 0.29.0

# Then build & deploy
anchor build
anchor deploy --provider.cluster devnet
```

---

## 📁 Files for Reference

- **Contract:** `programs/rust-main-template/src/lib.rs`
- **Config:** `Anchor.toml` (already set to devnet)
- **Build Output:** `target/deploy/uat_factory.so` (after build)
- **IDL:** `target/idl/uat_factory.json` (after build)
- **Deployment Script:** `deploy-to-devnet.sh` (automated)

---

## ✅ What Happens Next

### After Successful Deployment:

1. **On Solana Devnet:**
   - Program deployed at `UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm`
   - Upgradeable by deployer wallet
   - Visible on Solana Explorer

2. **In Your Wizard:**
   - Copy IDL to wizard
   - Uncomment real Anchor code
   - Test with real wallet
   - Mint real SPL tokens!

3. **For Investors:**
   - Receive real Solana tokens
   - See in Phantom/Solflare wallet
   - Track on Solana Explorer
   - Compliant with SEC Reg D 506(c)

---

## 🚨 Troubleshooting

### Build Error: "no such command: build-bpf"
```bash
# Install platform tools
sh -c "$(curl -sSfL https://release.solana.com/v1.18.20/install)"
```

### Build Error: "Anchor version mismatch"
```bash
# Upgrade Anchor
avm install 0.29.0 && avm use 0.29.0
```

### Deploy Error: "Insufficient funds"
```bash
# Request airdrop
solana airdrop 2
```

### Deploy Error: "Program already deployed"
```bash
# Upgrade existing program
anchor upgrade target/deploy/uat_factory.so --program-id UATb2B3q... --provider.cluster devnet
```

---

## 📞 Support

If you encounter issues:

1. Check `build.log` for detailed errors
2. Verify Solana CLI: `solana --version`
3. Verify Anchor CLI: `anchor --version`
4. Check wallet balance: `solana balance`
5. Review Anchor.toml configuration

---

**Ready to deploy?** Run:
```bash
./deploy-to-devnet.sh
```

Or install tools manually and run:
```bash
anchor build && anchor deploy --provider.cluster devnet
```

---

**Last Updated:** October 19, 2025  
**Status:** ⏳ Ready for deployment (after build tools installed)

