# UAT Factory Deployment - Quick Reference Card

## 🎯 What You Need to Do

```bash
# 1. Start the wizard
cd apps/property-tokenization-wizard
npm run dev

# 2. Open in browser
open http://localhost:3000/deploy-factory

# 3. Deploy
- Select "devnet"
- Click "Deploy UAT Factory"
- Wait ~2-3 minutes
- Copy the contract address

# 4. Update your code
# Edit: src/services/uatFactory.ts (line 13)
export const UAT_FACTORY_PROGRAM_ID = new PublicKey('PASTE_ADDRESS_HERE');
```

## 📊 API Flow

```
Your Browser  →  AssetRail API  →  Solana
             
1. Send JSON spec
2. Get Rust code        →  Generate
3. Send Rust code
4. Get bytecode         →  Compile
5. Send bytecode
6. Get contract address →  Deploy
```

## ✅ Files Created

| File | Purpose |
|------|---------|
| `src/services/assetRailApi.ts` | API client (3-step pipeline) |
| `src/services/uatFactorySpec.ts` | Contract specification |
| `src/components/steps/uat-factory-deployment.tsx` | Deployment UI |
| `src/app/deploy-factory/page.tsx` | Deployment page |
| `ASSETRAIL_API_INTEGRATION.md` | Full documentation |
| `QUICK_START_DEPLOYMENT.md` | Quick start guide |

## 🔗 Actual API Endpoints Used

```typescript
POST https://api.assetrail.xyz/api/v1/contracts/generate
POST https://api.assetrail.xyz/api/v1/contracts/compile  
POST https://api.assetrail.xyz/api/v1/contracts/deploy
```

## 🧪 Test It

1. **Deploy factory:**
   ```
   http://localhost:3000/deploy-factory
   ```

2. **Check Solana Explorer:**
   ```
   https://explorer.solana.com/address/YOUR_ADDRESS?cluster=devnet
   ```

3. **Verify it works:**
   - Contract should exist
   - Transaction confirmed
   - Account has data

## 💡 What This Does

Creates a smart contract on Solana that can:
- ✅ Create property tokens
- ✅ Whitelist investors
- ✅ Check KYC/accreditation
- ✅ Mint compliant tokens
- ✅ Enforce 2,000 investor cap
- ✅ Enforce 365-day lock-ups

## 🚨 Troubleshooting

| Error | Solution |
|-------|----------|
| API unreachable | Check internet, verify API URL |
| Compilation failed | Check console logs, retry |
| Deployment failed | Verify network selection |
| No contract address | Check transaction on Explorer |

## 📞 Get Help

- **Full docs:** `ASSETRAIL_API_INTEGRATION.md`
- **Quick start:** `QUICK_START_DEPLOYMENT.md`
- **API docs:** https://api.assetrail.xyz/swagger/index.html

---

**TL;DR:** Run `npm run dev` → Go to `/deploy-factory` → Click deploy → Copy address → Update code


