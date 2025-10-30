# UAT Factory - Solana Playground Deployment Guide

## 📦 Files Ready for Deployment

### Program Binary
- **File**: `target/deploy/uat_factory.so`
- **Size**: 334 KB
- **Location**: `/Volumes/Storage/QS_Asset_Rail/contracts/uat-factory-final/target/deploy/uat_factory.so`

### Program Keypair
- **File**: `target/deploy/uat_factory-keypair.json`
- **Program ID**: `69nVV8kMbkz8i2qKMPYeMxdwNdZDdFpUGjADLh3oahsB`
- **Location**: `/Volumes/Storage/QS_Asset_Rail/contracts/uat-factory-final/target/deploy/uat_factory-keypair.json`

---

## 🚀 Step-by-Step Deployment via Solana Playground

### Step 1: Access Solana Playground
1. Open your browser and go to: **https://beta.solpg.io/**
2. The playground will load in your browser

### Step 2: Connect Your Wallet
1. Click **"Connect"** in the top right corner
2. Select **"Playground Wallet"** or connect your Phantom wallet
3. Make sure you're on **Devnet** (check the network dropdown)

### Step 3: Import the Program Keypair
1. In the left sidebar, click on the **"⚙️ Settings"** icon
2. Scroll to **"Import Program Keypair"**
3. Click **"Import"**
4. Paste the following keypair JSON array:
```json
[4,62,16,3,234,46,15,65,254,113,77,185,1,183,93,26,135,138,105,67,194,145,26,243,220,219,41,232,118,59,201,163,76,138,132,160,223,60,233,47,38,196,116,177,98,232,65,48,35,23,181,180,11,66,236,24,205,80,152,248,57,37,35,198]
```
5. This will set your program ID to: `69nVV8kMbkz8i2qKMPYeMxdwNdZDdFpUGjADLh3oahsB`

### Step 4: Upload the Program Binary
1. Click on **"🔧 Build & Deploy"** tab in the left sidebar
2. Click **"Import Program"**
3. Select your local file: `target/deploy/uat_factory.so`
4. The 334KB binary will be uploaded

### Step 5: Get Devnet SOL (if needed)
1. Make sure your connected wallet has at least **3 SOL** for deployment
2. If you need SOL, click **"Airdrop"** in Solana Playground
3. Or use: https://faucet.solana.com/

### Step 6: Deploy the Program
1. In the **"Build & Deploy"** section, click **"Deploy"**
2. Confirm the transaction in your wallet
3. Wait for deployment to complete (may take 1-2 minutes for 334KB)
4. You'll see a success message with the program ID

### Step 7: Verify Deployment
Run this command in your terminal to verify:
```bash
solana program show 69nVV8kMbkz8i2qKMPYeMxdwNdZDdFpUGjADLh3oahsB -u devnet
```

---

## 🔄 Update Frontend After Deployment

Once deployed, update the frontend program ID if it's different:

```typescript
// File: apps/property-tokenization-wizard/src/services/uatFactory.ts
export const UAT_FACTORY_PROGRAM_ID = new PublicKey('69nVV8kMbkz8i2qKMPYeMxdwNdZDdFpUGjADLh3oahsB');
```

---

## 📝 Alternative: Manual Upload Method

If the playground import doesn't work:

1. **Base64 encode your binary**:
```bash
base64 target/deploy/uat_factory.so > program.base64
```

2. Use the Solana Playground's **"Custom Program"** upload feature
3. Paste the base64 content

---

## ⚠️ Important Notes

1. **Network**: Make sure you're on **Devnet** in Solana Playground
2. **Program ID is hardcoded**: The contract expects program ID `69nVV8kMbkz8i2qKMPYeMxdwNdZDdFpUGjADLh3oahsB`
3. **Anchor Version**: Contract was built with Anchor 0.32.1
4. **Size**: 334KB is a large program, deployment may take 1-2 minutes

---

## 🐛 Troubleshooting

### "Insufficient funds"
- Airdrop more SOL to your wallet
- Need ~3 SOL for deployment

### "Program ID mismatch"
- Make sure you imported the exact keypair JSON above
- The program ID MUST be `69nVV8kMbkz8i2qKMPYeMxdwNdZDdFpUGjADLh3oahsB`

### "Upload failed"
- Try refreshing Solana Playground
- Check your internet connection
- Try a different browser (Chrome/Brave recommended)

---

## ✅ Post-Deployment Checklist

- [ ] Program deployed to devnet
- [ ] Program ID verified: `69nVV8kMbkz8i2qKMPYeMxdwNdZDdFpUGjADLh3oahsB`
- [ ] Frontend updated with correct program ID
- [ ] Test minting functionality in wizard
- [ ] Update TODOs to mark deployment as complete

---

## 📞 Support

If deployment via Solana Playground fails, alternative options:
1. Use QuickNode/Alchemy RPC with API key
2. Deploy from a Linux machine
3. Try Solana Playground's Discord for support: https://discord.gg/solana

---

**Good luck with your deployment! 🚀**



