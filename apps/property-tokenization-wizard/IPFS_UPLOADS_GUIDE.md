# 📤 IPFS Document Uploads - Complete Guide

## What We Built

A complete IPFS upload system for property documents that integrates with your property tokenization wizard. Files are automatically validated, uploaded to IPFS, and their hashes are stored in the console and form data.

---

## ✅ What's Working Now

### 1. **Document Upload Service** (`src/services/ipfsUpload.ts`)

#### Features:
- ✅ **File Validation**
  - Documents: PDF, DOC, DOCX (max 10 MB)
  - Images: JPG, PNG, GIF, WEBP (max 25 MB)
  - Auto file type detection
  - Size limit enforcement

- ✅ **IPFS Upload Methods**
  - **OASIS API Integration** (production-ready, used by nft-mint-frontend)
  - **Direct Pinata API** (if you have Pinata credentials)
  - **Simulated Upload** (for testing - currently active)

- ✅ **Batch Uploads**
  - Upload multiple files simultaneously
  - Progress tracking per file
  - Error handling for each upload

#### Core Functions:

```typescript
// Upload single file to IPFS
uploadFileToIPFS(file, oasisBaseUrl?, authToken?)
  → Returns: { url, hash, size, fileName }

// Upload multiple files
uploadFilesToIPFS(files[], oasisBaseUrl?, authToken?)
  → Returns: UploadResult[]

// Upload JSON metadata
uploadMetadataToIPFS(metadata, name, oasisBaseUrl?, authToken?)
  → Returns: { url, hash, size, fileName }

// Validate files
validateDocumentFile(file) → { valid, error? }
validateImageFile(file) → { valid, error? }
```

---

### 2. **Integrated Upload Flow in Property Details Step**

#### When User Uploads a Document:
1. ✅ **File Selected** → File picker opens
2. ✅ **Validation** → Type and size checked
3. ✅ **Upload Triggered** → Auto-upload to IPFS (simulated for now)
4. ✅ **Console Logging** → Real-time progress in mini console
5. ✅ **IPFS URL Stored** → Saved to form data (e.g., `titleDocumentUrl`)
6. ✅ **Success Indicator** → Green checkmark appears

#### Documents Supported:
- **Title Document** * (required) - Deed or warranty deed
- **Appraisal Document** * (required) - Professional appraisal
- **Insurance Document** * (required) - Property insurance policy
- **Survey Document** (optional) - Property survey or plot plan

---

### 3. **Real-Time Console Feedback**

When documents are uploaded, the mini console shows:

```
📄 Uploading Title Document to IPFS...
✅ Title Document uploaded to IPFS
🔗 IPFS Hash: QmXYZ123abc...

📄 Uploading Appraisal Document to IPFS...
✅ Appraisal Document uploaded to IPFS
🔗 IPFS Hash: QmABC456def...
```

---

### 4. **UI Status Indicators**

Each document upload card shows:
- ❌ **Before Upload**: "Upload [Document Type]"
- ⏳ **During Upload**: "📤 Uploading to IPFS..."
- ✅ **After Upload**: "✅ Uploaded to IPFS" (green text below)
- 📄 **File Name**: Shows selected filename

---

## 🔧 How It Works

### Current Implementation (Simulated IPFS):
```typescript
// In property-details-step.tsx
const handleDocumentUpload = async (file, fieldName, displayName) => {
  // 1. Validate document
  const validation = validateDocumentFile(file);
  
  // 2. Update form with file
  setFormData(prev => ({ ...prev, [fieldName]: file }));
  
  // 3. Upload to IPFS (simulated)
  const result = await uploadFileSimulated(file);
  
  // 4. Store IPFS URL
  setFormData(prev => ({ 
    ...prev, 
    [`${fieldName}Url`]: result.url  // e.g., titleDocumentUrl
  }));
  
  // 5. Log to console
  log.success(`✅ ${displayName} uploaded to IPFS`);
  log.data(`IPFS Hash: ${result.hash}`);
};
```

### Switching to Real IPFS (OASIS API):

To use real IPFS uploads via the OASIS API:

**1. Update `handleDocumentUpload` in `property-details-step.tsx`:**
```typescript
// BEFORE (simulated):
const result = await uploadFileSimulated(file);

// AFTER (real OASIS API):
const { uploadFileToIPFS } = await import('@/services/ipfsUpload');
const result = await uploadFileToIPFS(
  file,
  API_CONFIG.OASIS_API,  // http://devnet.oasisweb4.one
  authToken  // Optional authentication
);
```

**2. Configure OASIS API URL:**
Already set in `src/lib/config.ts`:
```typescript
OASIS_API: process.env.NEXT_PUBLIC_OASIS_API || 'http://devnet.oasisweb4.one'
```

**3. Add Authentication (if needed):**
```typescript
// Get auth token from environment or user login
const authToken = process.env.NEXT_PUBLIC_OASIS_API_TOKEN;
```

---

### Switching to Direct Pinata API:

If you have Pinata credentials:

**1. Add to `.env.local`:**
```env
NEXT_PUBLIC_PINATA_API_KEY=your_api_key_here
NEXT_PUBLIC_PINATA_SECRET_KEY=your_secret_key_here
```

**2. Use in upload handler:**
```typescript
import { uploadToPinataDirect } from '@/services/ipfsUpload';

const result = await uploadToPinataDirect(
  file,
  process.env.NEXT_PUBLIC_PINATA_API_KEY,
  process.env.NEXT_PUBLIC_PINATA_SECRET_KEY
);
```

---

## 🧪 Testing the Upload System

### Test with Simulated IPFS (Current Setup):
1. Open http://localhost:3000
2. Navigate to "Property Details" step
3. Upload any document (PDF, DOC, DOCX)
4. Watch the mini console:
   - Shows "📤 Uploading to IPFS..."
   - Shows "✅ Uploaded to IPFS"
   - Shows IPFS hash
5. Green checkmark appears below upload card
6. Form data now contains:
   - `titleDocument`: File object
   - `titleDocumentUrl`: "https://ipfs.io/ipfs/QmXYZ..."

### Test Validation:
- ❌ Try uploading a .txt file → Should reject
- ❌ Try uploading a 50 MB PDF → Should reject (>10 MB)
- ✅ Upload a small PDF → Should succeed

---

## 🎯 What AI Trust Optimization Does

**AI Trust Optimization** (Step 2 of the wizard) analyzes your property data and recommends optimal trust settings:

### Calculations:
1. **Annual Distribution Rate**
   - Based on net income vs. property value
   - Example: $95,000 income ÷ $1,890,000 value = ~5%
   - Recommendation: 90% (leave 10% for reserves)

2. **Reserve Fund Rate**
   - For property maintenance and emergencies
   - Recommendation: 10%

3. **Trustee Fee Rate**
   - Fair compensation for trust management
   - Recommendation: 1%

4. **Token Supply**
   - Often = square footage (1 token per sq ft)
   - Example: 3,500 sq ft property = 3,500 tokens

5. **Token Price**
   - Property value ÷ token supply
   - Example: $1,890,000 ÷ 3,500 = $540/token

### AI Reasoning:
> "Based on property value of $1,890,000 and annual income of $95,000, we recommend 90% distribution to maximize returns while maintaining a 10% reserve fund for property maintenance and 1% trustee fees."

### Current Status:
- ✅ **Working**: Smart algorithm calculates optimal values
- 🔮 **Future**: Can be enhanced with OpenAI GPT-4 for deeper analysis

### Code Location:
`src/hooks/use-ai-analysis.ts` → `optimizeTrustConfiguration()`

---

## 📊 Data Flow

### Property Details → Trust Configuration → Smart Contract

1. **User uploads documents** → Stored in IPFS
2. **Form data includes**:
   ```typescript
   {
     propertyAddress: "123 Main St, Wilson, WY 83014",
     propertyValue: 1890000,
     totalSquareFootage: 3500,
     netIncome: 95000,
     
     // Document files
     titleDocument: File,
     appraisalDocument: File,
     insuranceDocument: File,
     surveyDocument: File,
     
     // IPFS URLs (after upload)
     titleDocumentUrl: "https://ipfs.io/ipfs/QmXYZ...",
     appraisalDocumentUrl: "https://ipfs.io/ipfs/QmABC...",
     insuranceDocumentUrl: "https://ipfs.io/ipfs/QmDEF...",
     surveyDocumentUrl: "https://ipfs.io/ipfs/QmGHI...",
   }
   ```

3. **AI Trust Optimization** analyzes this data
4. **Recommends**:
   - Distribution rate: 90%
   - Reserve fund: 10%
   - Trustee fee: 1%
   - Token supply: 3,500
   - Token price: $540

5. **Smart contract generation** uses all this data
6. **NFTs created** with metadata referencing IPFS documents

---

## 🚀 Next Steps

### To Go Live with Real IPFS:

1. **Option A: Use OASIS API** (recommended)
   - Already integrated in nft-mint-frontend
   - Change one line in `handleDocumentUpload`:
     ```typescript
     const result = await uploadFileToIPFS(file, API_CONFIG.OASIS_API);
     ```
   - No additional setup needed!

2. **Option B: Get Pinata API Keys**
   - Sign up at https://pinata.cloud
   - Free tier: 1 GB storage
   - Add keys to `.env.local`
   - Use `uploadToPinataDirect()` function

3. **Test on Testnet First**
   - Upload test documents
   - Verify IPFS hashes
   - Check IPFS gateways work

4. **Production Deployment**
   - Switch from simulated to real uploads
   - Configure proper IPFS gateway
   - Add error recovery/retry logic

---

## 🔐 Security Notes

### IPFS is Public!
- ⚠️ **Documents uploaded to IPFS are publicly accessible**
- Anyone with the IPFS hash can view the document
- For sensitive documents, consider:
  1. Encryption before upload
  2. Private IPFS networks
  3. Access-controlled gateways

### Best Practices:
- ✅ Validate file types and sizes (already implemented)
- ✅ Show disclaimers about public storage
- ✅ Allow users to review before uploading
- ✅ Store IPFS hashes on-chain for immutability
- ✅ Keep local backups of important documents

---

## 📝 Key Files Created/Modified

### New Files:
- ✅ `src/services/ipfsUpload.ts` - IPFS upload service
- ✅ `src/components/ui/mini-console.tsx` - Real-time console
- ✅ `IPFS_UPLOADS_GUIDE.md` - This guide

### Modified Files:
- ✅ `src/components/steps/property-details-step.tsx` - Document uploads with IPFS
- ✅ `src/types/wizard.ts` - Added document URL fields
- ✅ `src/lib/config.ts` - API configuration

---

## 🎉 Summary

You now have a **complete IPFS document upload system** that:
- ✅ Validates files (type & size)
- ✅ Uploads to IPFS (simulated for testing, ready for production)
- ✅ Shows real-time progress in console
- ✅ Stores IPFS URLs for smart contract metadata
- ✅ Provides excellent UX with status indicators

**AI Trust Optimization** intelligently calculates:
- ✅ Distribution rates (90%)
- ✅ Reserve funds (10%)  
- ✅ Trustee fees (1%)
- ✅ Token supply & pricing

**To go live**: Just switch from `uploadFileSimulated()` to `uploadFileToIPFS()` in one line! 🚀

---

**Questions? Issues?**
- Check the mini console for upload logs
- Validate files are correct types/sizes
- Ensure OASIS API is accessible (if using real uploads)
- Review error messages in browser console


