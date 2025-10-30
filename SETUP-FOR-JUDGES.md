# Setup Instructions for Judges

This guide helps you get AssetRail running locally with your own API keys.

---

## Quick Setup (5 minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/QuantumStreet/UniversalAssetToken.git
cd UniversalAssetToken
```

### 2. Configure API Keys

#### For Property Tokenization Wizard:

```bash
cd apps/property-tokenization-wizard

# Create .env.local file
cat > .env.local << 'EOF'
# OpenAI (for property extraction)
OPENAI_API_KEY=your-openai-key-here

# Firecrawl (for web scraping)
FIRECRAWL_API_KEY=your-firecrawl-key-here

# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_UAT_PROGRAM_ID=UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm

# Smart Contract Generator API (optional)
NEXT_PUBLIC_CONTRACT_API_URL=http://localhost:5000
EOF

# Install and run
npm install
npm run dev
# Open http://localhost:3000
```

#### For Smart Contract Generator API:

```bash
cd smart-contract-generator/src/SmartContractGen/ScGen.API

# Copy example config
cp appsettings.example.json appsettings.json

# Edit appsettings.json and add your OpenAI key (optional)
# Or leave as-is to test without AI features

# Run API
dotnet run
# API available at http://localhost:5000
```

---

## Testing Without API Keys

You can test the full platform **without any API keys**:

### Property Tokenization Wizard
- Works in **simulation mode**
- Manual data entry instead of AI extraction
- All features demonstrable
- No keys required

### Smart Contract Generator
- Template-based generation works without keys
- AI-enhanced generation requires OpenAI key

---

## API Keys (Optional)

### OpenAI API Key
- **Get it:** https://platform.openai.com/api-keys
- **Used for:** Property extraction, contract generation enhancement
- **Cost:** ~$0.10 per property extraction
- **Required:** No (can use manual entry)

### Firecrawl API Key
- **Get it:** https://www.firecrawl.dev/
- **Used for:** Web scraping property listings
- **Cost:** Free tier available
- **Required:** No (can use manual entry)

---

## Quick Test Without Setup

### Property Tokenization Wizard
```bash
cd apps/property-tokenization-wizard
npm install
npm run dev
# Open http://localhost:3000
# Skip AI extraction, enter data manually
```

### Contract Generator UI
```bash
cd apps/contract-generator-ui
npm install
npm run dev
# Open http://localhost:3001
# Use template-based generation (no API key needed)
```

### Smart Contract (Already Deployed)
- **View on Solana Explorer:** https://explorer.solana.com/address/UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm?cluster=devnet
- **No setup needed** - already live on devnet

---

## Full Feature Testing

To test all features including AI:

1. Get OpenAI API key (optional)
2. Add to `.env.local` files
3. Restart applications
4. Test AI property extraction
5. Test AI-enhanced contract generation

---

## Need Help?

Check the main [README.md](./README.md) or component-specific READMEs:
- [Property Wizard](./apps/property-tokenization-wizard/README.md)
- [Contract Generator UI](./apps/contract-generator-ui/README.md)
- [UAT Factory Contract](./contracts/uat-factory-final/README.md)
- [Smart Contract Generator API](./smart-contract-generator/README.md)

---

**Most features work without any API keys - just install and run!**

