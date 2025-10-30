# UAT Factory - Deployment Options

**Contract:** Ready ✅  
**API:** Running ✅  
**Issue:** Build tools needed for local compilation  

---

## 🎯 **3 Deployment Paths**

### **Path 1: Install Build Tools Locally (Recommended)**

**Pros:** Full control, can iterate quickly, standard Anchor workflow  
**Cons:** One-time 5-10 min setup  
**Best for:** Development and testing

#### Steps:
```bash
# 1. Install Solana platform tools (includes BPF compiler)
sh -c "$(curl -sSfL https://release.solana.com/v1.18.20/install)"

# 2. Add to PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# 3. Verify
cargo-build-sbf --version  # or cargo-build-bpf

# 4. Build & Deploy
cd /Volumes/Storage/QS_Asset_Rail/contracts/uat-factory-final
anchor build
anchor deploy --provider.cluster devnet

# ✅ Done!
```

---

### **Path 2: Use Smart Contract Generator API**

**Pros:** API has build tools in Docker, no local install  
**Cons:** API compile endpoint needs specific format  
**Best for:** Production deployments  
**Status:** API running ✅, endpoint needs investigation

#### Current Issue:
The API's `/api/v1/contracts/compile` endpoint expects a specific file format we need to identify.

#### Investigation Needed:
```bash
# Check what format the API expects
curl -X POST http://localhost:5001/api/v1/contracts/compile \
  -F "Language=Rust" \
  -F "Source=@???" \
  -v
```

We need to find out if it expects:
- Single .rs file ❓
- .zip of Anchor project ❓
- .tar.gz ❓
- Specific directory structure ❓

---

### **Path 3: Use Verifiable Build (Anchor)**

**Pros:** Deterministic, reproducible builds  
**Cons:** Still needs Anchor 0.29.0  
**Best for:** Mainnet, audited contracts

#### Steps:
```bash
# 1. Upgrade Anchor to 0.29.0
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.29.0
avm use 0.29.0

# 2. Build verifiable
anchor build --verifiable

# 3. Deploy
anchor deploy --provider.cluster devnet
```

---

## 🚀 **Recommended: Path 1 (Quick & Reliable)**

Since you already have:
- ✅ Solana CLI 1.18.20
- ✅ Anchor CLI 0.24.2
- ✅ 1.87 SOL on devnet
- ✅ Contract code ready

You just need the BPF compiler:

```bash
# Run this in your terminal:
sh -c "$(curl -sSfL https://release.solana.com/v1.18.20/install)"
```

Then:
```bash
cd /Volumes/Storage/QS_Asset_Rail/contracts/uat-factory-final
anchor build
anchor deploy --provider.cluster devnet
```

**Estimated time:** 2-3 minutes for install, 30 seconds for build, 30 seconds for deploy

---

## 🔧 **Alternative: Path 2 (Using Your API)**

Since the API is running, let me investigate the compile endpoint format:

**Can you check the API source to see what file format it expects?**

The endpoint signature is:
```csharp
[HttpPost("compile")]
public async Task<IActionResult> ContractCompileAsync([FromForm] CompileContractRequest request)
```

We need to know what `CompileContractRequest.Source` expects.

---

## 📊 **Quick Decision Matrix**

| Path | Time | Complexity | Pros |
|------|------|------------|------|
| Path 1 (Local) | 5 min | Easy | Standard, fast iteration |
| Path 2 (API) | Unknown | Medium | No local install |
| Path 3 (Verifiable) | 10 min | Medium | Mainnet-ready |

**My Recommendation:** Path 1 - Install platform tools locally. It's the standard Anchor workflow and will work reliably.

---

## 🎯 What Would You Like To Do?

1. **Install platform tools locally** (Path 1) - I can guide you
2. **Investigate API compile format** (Path 2) - I can check the API source
3. **Upgrade Anchor to 0.29.0** (Path 3) - I can help with that too

All three will work! Path 1 is fastest and most reliable.

What's your preference?
