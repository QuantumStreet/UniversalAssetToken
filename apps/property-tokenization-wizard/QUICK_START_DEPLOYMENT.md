# Quick Start: Deploy UAT Factory

## 🚀 Deploy in 3 Minutes

### Step 1: Start the Dev Server

```bash
cd /Volumes/Storage/QS_Asset_Rail/apps/property-tokenization-wizard
npm run dev
```

### Step 2: Open the Deployment Page

Navigate to: **http://localhost:3000/deploy-factory**

### Step 3: Deploy!

1. **Select Network:** Choose `devnet` (recommended for testing)
2. **Click:** "Deploy UAT Factory to devnet"
3. **Wait:** The API will generate, compile, and deploy (2-3 minutes)
4. **Copy:** The contract address when complete

### Step 4: Update Your Wizard

Edit `src/services/uatFactory.ts`:

```typescript
// Line 13 - Replace with your deployed address
export const UAT_FACTORY_PROGRAM_ID = new PublicKey('YOUR_ADDRESS_HERE');
```

### Step 5: Start Tokenizing!

Your wizard can now create property tokens using the deployed factory! 🎉

---

## What Gets Deployed?

### UAT Factory Contract Features:
- ✅ Create property token collections
- ✅ Whitelist investors with KYC
- ✅ Accreditation verification
- ✅ Compliance checks (Reg D 506(c))
- ✅ 2,000 investor cap enforcement
- ✅ 365-day lock-up periods

### Network Costs:
- **Devnet:** FREE (test SOL)
- **Testnet:** FREE (test SOL)
- **Mainnet:** ~0.1-0.5 SOL (~$10-50)

---

## Troubleshooting

### "API Error 500"
The API might be temporarily down. Wait a minute and retry.

### "Compilation Failed"
Check the console for details. The contract specification might need adjustment.

### "Network Error"
Verify you're connected to the internet and the API is reachable:
```bash
curl https://api.assetrail.xyz/health
```

---

## Verify Deployment

After deployment, verify on Solana Explorer:

```
https://explorer.solana.com/address/YOUR_ADDRESS?cluster=devnet
```

You should see:
- ✅ Program deployed
- ✅ Transaction confirmed
- ✅ Account data present

---

## Next Steps

Once deployed, you can:

1. **Test the factory** with a sample property
2. **Create property tokens** through the wizard
3. **Mint tokens** to investors
4. **Verify compliance** checks are working

---

**Need Help?** Check the full documentation in `ASSETRAIL_API_INTEGRATION.md`


