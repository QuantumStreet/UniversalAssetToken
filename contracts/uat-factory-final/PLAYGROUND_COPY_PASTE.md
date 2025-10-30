# Solana Playground - Copy/Paste Guide

## 📋 Follow These Steps Exactly

### ✅ STEP 1: Import Program Keypair

In the "Build" section where it says "Import/Export program keypair":

1. Click **"Import"**
2. Paste this entire array:

```
[4,62,16,3,234,46,15,65,254,113,77,185,1,183,93,26,135,138,105,67,194,145,26,243,220,219,41,232,118,59,201,163,76,138,132,160,223,60,233,47,38,196,116,177,98,232,65,48,35,23,181,180,11,66,236,24,205,80,152,248,57,37,35,198]
```

3. **Verify** it shows: `Program ID: 69nVV8kMbkz8i2qKMPYeMxdwNdZDdFpUGjADLh3oahsB`

---

### ✅ STEP 2: Update Cargo.toml

In the file explorer, find `src/Cargo.toml` (or `programs/uat_factory/Cargo.toml`)

**Replace ALL contents with:**

```toml
[package]
name = "uat_factory"
version = "1.0.0"
description = "Universal Asset Token Factory for Property Tokenization with Reg D 506(c) Compliance"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "uat_factory"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = { version = "0.32.1", features = ["init-if-needed"] }
anchor-spl = { version = "0.32.1", features = ["token", "associated_token"] }

[dev-dependencies]
anchor-client = "0.32.1"
```

---

### ✅ STEP 3: Update lib.rs

In the file explorer, find `src/lib.rs` (or `programs/uat_factory/src/lib.rs`)

**Replace ALL contents with:**

**[See the complete lib.rs file below - 426 lines]**

---

### ✅ STEP 4: Update Anchor.toml (Optional)

If you see an `Anchor.toml` file in the root:

```toml
[toolchain]

[features]
resolution = true
skip-lint = false

[programs.devnet]
uat_factory = "69nVV8kMbkz8i2qKMPYeMxdwNdZDdFpUGjADLh3oahsB"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

---

### ✅ STEP 5: Build

1. Click the **Build** button (🔨 hammer icon)
2. Wait 1-2 minutes for compilation
3. Look for "Build successful" message

---

### ✅ STEP 6: Deploy to Devnet

1. **Verify** bottom-right shows "**Devnet**" (not Mainnet!)
2. Click the **Deploy** button (🚀 rocket icon)
3. **Approve transaction** in Phantom wallet (will cost ~0.5-1 SOL)
4. Wait for deployment confirmation
5. **Copy the Program ID** from success message and send it to me!

---

## 🆘 If You Get Stuck

**"Build failed"**: Share the error message  
**"Insufficient funds"**: Let me know, I'll send more SOL  
**"Program ID mismatch"**: Make sure you imported the keypair correctly in Step 1  
**Can't find files**: Tell me what files you see in the explorer  

---

## 📝 The Full lib.rs Code

Here's the complete UAT Factory smart contract code to paste into `lib.rs`:


