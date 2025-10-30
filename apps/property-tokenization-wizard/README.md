# Property Tokenization Wizard

**7-Step Wizard for Real Estate Tokenization on Solana**

Transform property listings into tokenized securities with complete SEC compliance.

---

## Overview

Paste a Sotheby's, Zillow, or Redfin URL, and the system extracts property data, configures a Wyoming Statutory Trust, generates a Solana smart contract, and mints compliant tokens automatically.

**Live Application:** http://localhost:3000 (when running)

---

## Key Features

### 1. Property Data Extraction
- Paste any property listing URL (Sotheby's, Zillow, Redfin, Realtor.com)
- GPT-4 extracts 20+ fields
- Downloads property images
- Finds comparable properties
- Estimates property value

### 2. Wyoming Trust Automation
- One-click "Use Preset" for instant configuration
- SEC Reg D 506(c) compliance built-in
- Automatic token economics calculation
- Trustee fee automation (1%)
- Distribution waterfall (75% investors, 20% reserve, 5% fees)

### 3. Smart Contract Generation
- **Template-Based:** Fast, reliable generation
- **Enhanced:** Custom logic with GPT-4
- Preview generated Rust/Anchor code
- Download for manual deployment
- Or auto-deploy to Solana

### 4. Token Minting
- Whitelist investors with KYC tracking
- Verify accreditation status
- Enforce investor caps (2000 max)
- Mint to Phantom wallet
- View on Solana Explorer

### 5. User Interface
- Terminal-style design
- Real-time logging in mini-console
- Progress tracking through 7 steps
- Responsive and mobile-friendly
- Professional presentation

---

## Quick Start

### Prerequisites
```bash
Node.js 18+
npm or yarn
Phantom Wallet (for testing)
```

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

### Environment Variables

Create `.env.local`:
```bash
# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_UAT_PROGRAM_ID=UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm

# AI Services (Optional - for property extraction)
OPENAI_API_KEY=your_openai_key
FIRECRAWL_API_KEY=your_firecrawl_key

# Smart Contract Generator API (Optional)
NEXT_PUBLIC_CONTRACT_API_URL=http://localhost:5000
```

---

## The 7-Step Workflow

### Step 1: Property Details
- Upload property images (drag & drop)
- Enter address or paste listing URL
- AI extracts all property data
- Add financial information (income, expenses)
- Upload supporting documents (title, appraisal, insurance)

### Step 2: Trust Configuration
- Configure Wyoming Statutory Trust
- Or click "Use Preset" for instant setup
- Auto-calculates token supply & price
- Sets distribution rates and fees
- Defines governance rules

### Step 3: Smart Contract Generation
- Choose generation method (Template or AI)
- Preview generated Rust/Anchor code
- See compliance features highlighted
- Download or proceed to deployment

### Step 4: Deployment
- Deploy to Solana Devnet/Mainnet
- Automatic factory initialization
- Property token creation
- Get program ID and explorer links

### Step 5: Metadata Configuration
- Generate UAT-compliant JSON
- Upload to IPFS (Pinata)
- Store metadata URI on-chain
- Preview full asset details

### Step 6: NFT Minting
- Whitelist investors
- Verify accreditation
- Mint tokens to wallets
- Track minted supply

### Step 7: Summary
- View complete transaction history
- Get Solana Explorer links
- See token economics summary
- Export data for records

---

## Technical Architecture

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Blockchain:** Solana Web3.js, Anchor
- **AI:** OpenAI GPT-4, Firecrawl
- **Storage:** IPFS (Pinata)

### Key Components

```
src/
├── app/                    # Next.js app router pages
├── components/
│   ├── steps/             # 7 wizard step components
│   ├── ui/                # Reusable UI components
│   ├── wizard/            # Wizard shell & navigation
│   └── wallet/            # Wallet integration
├── services/
│   ├── uatFactory.ts      # Smart contract interaction
│   ├── propertyExtractor.ts  # AI property extraction
│   ├── ipfsUpload.ts      # IPFS/Pinata integration
│   └── contractMinting.ts # Token minting logic
├── contexts/              # React contexts (wallet, blockchain)
└── types/                 # TypeScript types
```

### Smart Contract Integration

The wizard integrates with the UAT Factory smart contract:

```typescript
// Initialize factory
await program.methods.initializeFactory().rpc();

// Create property token
await program.methods.createPropertyToken(
  metadataUri,
  tokenName,
  tokenSymbol,
  totalSupply
).rpc();

// Whitelist investor
await program.methods.addToWhitelist(
  investorPubkey,
  kycHash,
  isAccredited
).rpc();

// Mint tokens
await program.methods.mintPropertyTokens(amount).rpc();
```

---

## UI/UX Features

### Retro Terminal Design
- Glowing green text on dark background
- ASCII art and box-drawing characters
- Typewriter-style animations
- Nostalgic computing aesthetic

### Real-Time Logging
- Mini-console component
- Step-by-step progress updates
- Transaction signatures displayed
- Error messages with context

### User Experience
- Guided workflow with clear steps
- Progress indicators
- Validation and error handling
- Loading states
- Success confirmations

---

## Compliance Features

### SEC Reg D 506(c)
- Accredited investor only
- 2000 investor cap enforcement
- 12-month lock-up period
- Transfer restrictions
- Proper documentation

### KYC/AML
- Investor whitelist
- KYC hash storage
- Accreditation verification
- Compliance tracking
- Audit trail

### Wyoming Statutory Trust
- Legal entity wrapper
- Trustee designation
- Beneficiary rights
- Governance rules
- Distribution policies

---

## Property Data Extraction

### Supported Platforms
- Sotheby's International Realty
- Zillow
- Redfin
- Realtor.com
- Direct property URLs

### Extracted Fields (20+)
- Address, city, state, zip
- Property value (appraised)
- Square footage, lot size
- Bedrooms, bathrooms
- Year built, renovation year
- Property type, architectural style
- Premium amenities
- Annual income, expenses
- And more...

### How It Works
1. **Firecrawl** scrapes the listing page
2. **GPT-4** extracts structured data
3. **Image downloader** fetches property photos
4. **Validation** ensures data quality
5. **Auto-fill** populates wizard fields

---

## Testing

### Run Tests
```bash
npm test
```

### Test with Local Network
```bash
# Start local Solana validator
solana-test-validator

# Run wizard against localhost
npm run dev
```

### Test with Phantom Wallet
1. Install Phantom browser extension
2. Switch to Devnet
3. Get test SOL from faucet
4. Connect wallet in wizard
5. Test full tokenization flow

---

## Troubleshooting

### Wallet Not Connecting
- Make sure Phantom is installed
- Switch to Devnet in Phantom settings
- Refresh the page
- Check browser console for errors

### Data Extraction Fails
- Verify OpenAI API key is set
- Check Firecrawl API key
- Try a different property URL
- Use manual entry as fallback

### Deployment Fails
- Check Solana RPC is responsive
- Verify wallet has sufficient SOL
- Try alternative RPC endpoint
- Check smart contract is deployed

### IPFS Upload Fails
- Verify Pinata API keys
- Check file size limits
- Try alternative IPFS provider
- Use simulation mode

---

## Additional Documentation

- [Quick Start Visual Guide](./QUICK_START_VISUAL_GUIDE.md)
- [Business Tokenization Guide](./BUSINESS_TOKENIZATION_COMPLETE.md)
- [AI Property Extraction Details](./AI_PROPERTY_EXTRACTION.md)
- [Deployment Reference](./DEPLOYMENT_REFERENCE.md)
- [Wyoming Trust Requirements](./WYOMING_TRUST_REQUIREMENTS.md)

---

## Testing Guide

### Property Extraction
1. Open wizard
2. Paste Sotheby's URL
3. Click "Extract with AI"
4. Show extracted data

### Trust Configuration
1. Click "Use Preset"
2. Show auto-filled trust details
3. Highlight token economics
4. Click "Continue"

### Contract Generation
1. Select "Template-Based"
2. Click "Generate"
3. Preview Rust code
4. Show compliance features

### Token Minting
1. Click "Deploy"
2. Show transaction processing
3. View on Solana Explorer
4. Show final summary

---

## Contributing

This is a hackathon project, but contributions are welcome!

1. Fork the repo
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

---

## License

MIT License - see LICENSE file for details

---

## Acknowledgments

- Solana Foundation
- Anchor framework team
- OpenAI for GPT-4
- Firecrawl team
- Pinata for IPFS

---

**Built for Solana Colosseum Hackathon 2025**
