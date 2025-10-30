# AssetRail - Real Estate Tokenization Platform

**Solana Colosseum Hackathon 2025**

Automate property tokenization from listing URL to on-chain tokens in 7 steps using Solana smart contracts and Wyoming Trust compliance.

[![Solana](https://img.shields.io/badge/Solana-Devnet-14F195?logo=solana)](https://explorer.solana.com/address/UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm?cluster=devnet)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Anchor](https://img.shields.io/badge/Anchor-0.32.1-coral)](https://www.anchor-lang.com/)

---

## Overview

AssetRail is a complete platform for tokenizing real-world assets (starting with real estate) on Solana. Paste a property listing URL, and the system extracts details, configures a Wyoming Statutory Trust, generates a compliant smart contract, and mints tokens automatically.

**Live Demo:** Property Tokenization Wizard at http://localhost:3000 (when running locally)

**Deployed Smart Contract:**
- Program ID: `UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm`
- [View on Solana Explorer](https://explorer.solana.com/address/UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm?cluster=devnet)

---

## Key Features

### 1. Automated Property Data Extraction
Uses Firecrawl and GPT-4 to extract 20+ fields from property listing sites (Sotheby's, Zillow, Redfin). Automates data entry and property analysis.

### 2. Wyoming Trust Automation
Pre-configured Wyoming Statutory Trust templates with SEC Reg D 506(c) compliance. Automatic token economics calculations and distribution waterfall setup.

### 3. Universal Asset Token (UAT) Standard
Modular metadata standard for real-world assets with 9 optional modules including Asset Details, Trust Structure, Yield Distribution, Compliance, and more.

### 4. Multi-Chain Support
Supports Solana (live), with Ethereum and Radix compatibility in development.

---

## Project Structure

```
QS_Asset_Rail/
│
├── apps/
│   ├── property-tokenization-wizard/     Main Application
│   ├── contract-generator-ui/            Developer Tool - Contract Generator UI  
│   └── smart-trust-frontend/             Trust Configuration UI
│
├── contracts/
│   ├── uat-factory-final/                UAT Factory Smart Contract (DEPLOYED)
│   └── uat-token-extensions/             Token Extensions Version
│
├── smart-contract-generator/             Smart Contract Generator API
│   └── src/SmartContractGen/             Template-based generation engine
│
├── apps/UAT/                             Universal Asset Token Specification
│
└── docs/                                 Complete Documentation
```

---

## Core Components

### 1. Property Tokenization Wizard

The main application - complete 7-step wizard for tokenizing real estate.

- **Tech Stack:** Next.js 14, TypeScript, Solana Web3.js, Anchor, Tailwind CSS
- **Location:** `/apps/property-tokenization-wizard/`
- **Features:**
  - Automated property data extraction (Firecrawl + GPT-4)
  - Wyoming Statutory Trust configuration with presets
  - Smart contract generation (template or enhanced)
  - Automatic token minting with compliance checks
  - Terminal-style UI with real-time logging

**Quick Start:**
```bash
cd apps/property-tokenization-wizard
npm install
npm run dev
# Open http://localhost:3000
```

**[Full Documentation](./apps/property-tokenization-wizard/README.md)**

---

### 2. UAT Factory Smart Contract

Production-ready Solana smart contract ready for deployment on Devnet.

- **Tech Stack:** Rust, Anchor Framework 0.32.1, SPL Token
- **Location:** `/contracts/uat-factory-final/`
- **Program ID:** `UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm`
- **Lines of Code:** 387 (production Rust)
- **Features:**
  - Factory pattern for property token creation
  - KYC/AML whitelist enforcement
  - Accreditation verification (Reg D 506(c))
  - Investor cap (2000 max per SEC rules)
  - Real SPL token minting via CPI
  - Lock-up period enforcement

**Quick Start:**
```bash
cd contracts/uat-factory-final
anchor build
anchor test
```

**[Full Documentation](./contracts/uat-factory-final/README.md)**

---

### 3. Smart Contract Generator API

Template-based contract generation engine with multi-chain support.

- **Tech Stack:** .NET 9.0, ASP.NET Core, Handlebars.Net, Docker
- **Location:** `/smart-contract-generator/`
- **Features:**
  - Generate Solidity (Ethereum), Rust (Solana), Scrypto (Radix)
  - JSON specification to complete smart contract
  - Automated compilation and deployment
  - Docker-based isolated build environments

**Quick Start:**
```bash
cd smart-contract-generator/src/SmartContractGen/ScGen.API
dotnet run
# API available at http://localhost:5000
```

**[Full Documentation](./smart-contract-generator/README.md)**

---

### 4. Contract Generator UI

Developer-friendly interface for the Smart Contract Generator API.

- **Tech Stack:** Next.js 14, TypeScript, Tailwind CSS
- **Location:** `/apps/contract-generator-ui/`
- **Features:**
  - Visual contract builder
  - JSON spec editor with validation
  - Enhanced generation with GPT-4
  - Code preview with syntax highlighting
  - Multi-blockchain deployment

**Quick Start:**
```bash
cd apps/contract-generator-ui
npm install
npm run dev
# Open http://localhost:3001
```

**[Full Documentation](./apps/contract-generator-ui/README.md)**

---

## Key Innovations

### Automated Property Extraction
Complete property data extraction from listing sites using Firecrawl and GPT-4. Extracts 20+ structured fields, downloads images automatically, and analyzes comparable properties.

### Universal Asset Token (UAT) Standard
Modular metadata standard for real-world asset tokenization with 9 optional modules, IPFS-based storage with on-chain verification, and cross-chain compatibility (Solana, Ethereum, Radix). [View UAT Specification](./apps/UAT/UNIVERSAL_ASSET_TOKEN_SPECIFICATION.md)

### Wyoming Trust Automation
One-click compliance for tokenized securities with Wyoming Statutory Trust templates, SEC Reg D 506(c) compliance built-in, automatic token economics calculation, and trustee fee automation.

### End-to-End Automation
Property URL to on-chain tokens in 7 automated steps: paste URL, extract data, configure trust, generate contract, deploy to Solana, whitelist investors, and mint tokens.

---

## Getting Started

### Prerequisites
- Node.js 18+
- Solana CLI (for smart contract deployment)
- Phantom Wallet (for testing)

### Quick Setup

```bash
# 1. Clone the repo
git clone https://github.com/[your-username]/QS_Asset_Rail.git
cd QS_Asset_Rail

# 2. Start Property Tokenization Wizard
cd apps/property-tokenization-wizard
npm install
npm run dev
# Open http://localhost:3000

# 3. (Optional) Start Contract Generator UI
cd ../../apps/contract-generator-ui
npm install
npm run dev
# Open http://localhost:3001

# 4. (Optional) Test Smart Contract
cd ../../contracts/uat-factory-final
anchor test
```

---

## Technical Highlights

### Smart Contract (Solana/Anchor)
- **387 lines** of production-ready Rust
- **5 core instructions:** initialize_factory, create_property_token, add_to_whitelist, mint_property_tokens, update_metadata
- **3 account types:** Factory, PropertyToken, InvestorWhitelist
- **Security:** PDA-based accounts, authority checks, supply caps, compliance enforcement

### Property Tokenization Wizard (Next.js)
- 7-step guided workflow with terminal-style UI
- Integration: Firecrawl (web scraping) + GPT-4 (extraction)
- Real-time logging with mini-console component
- Multi-chain ready: Solana (live), Ethereum, Radix (coming)

### Smart Contract Generator (.NET API)
- **Multi-language:** Solidity, Rust, Scrypto
- **Template engine:** Handlebars.Net for flexible code generation
- **Docker integration:** Isolated compilation environments
- **RESTful API:** OpenAPI/Swagger documentation

---

## Use Cases

### Real Estate Tokenization
$1.8M property tokenized into 3,500 tokens at $540 each. 7.48% annual yield from rental income with Wyoming Trust structure for legal compliance and quarterly distributions to token holders.

### Commercial Property
Office buildings with tenant leases, automated rent distribution, and professional property management integration.

### Art & Collectibles
High-value artwork fractional ownership with provenance tracking on-chain and insurance and valuation records.

---

## Documentation

### Quick Guides
- [Property Tokenization Wizard Guide](./apps/property-tokenization-wizard/QUICK_START.md)
- [Smart Contract Deployment Guide](./DEPLOY-UAT-FACTORY.md)
- [UAT Specification](./apps/UAT/UNIVERSAL_ASSET_TOKEN_SPECIFICATION.md)
- [API Documentation](./docs/API_QUICK_START.md)

### Architecture Docs
- [Platform Architecture](./ASSETRAIL_PLATFORM_LANDSCAPE.md)
- [Smart Contract Comparison](./docs/technical/SMART_CONTRACT_COMPARISON_ANALYSIS.md)
- [Token Extensions Analysis](./contracts/uat-token-extensions/WIZARD_COMPATIBILITY_ANALYSIS.md)

---

## Security

### Smart Contract Security Features
- PDA (Program Derived Address) for all accounts
- Authority checks on all privileged operations
- CPI (Cross-Program Invocation) to SPL Token program
- Account validation and ownership checks
- Proper error handling with custom error codes

### Compliance Features
- KYC/AML whitelist enforcement
- Accredited investor verification
- SEC Reg D 506(c) investor cap (2000 max)
- 12-month lock-up period enforcement
- Transfer restriction checks

---

## Built With

### Frontend
- [Next.js 14](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/) - Blockchain integration

### Smart Contracts
- [Anchor](https://www.anchor-lang.com/) - Solana framework
- [Rust](https://www.rust-lang.org/) - Smart contract language
- [SPL Token](https://spl.solana.com/token) - Token standard

### Backend
- [.NET 9.0](https://dotnet.microsoft.com/) - Smart contract generator API
- [Handlebars.Net](https://github.com/Handlebars-Net/Handlebars.Net) - Template engine
- [Docker](https://www.docker.com/) - Containerization

### External Services
- [OpenAI GPT-4](https://openai.com/) - Property data extraction
- [Firecrawl](https://www.firecrawl.dev/) - Web scraping

---

## Project Stats

- **Total Lines of Code:** ~15,000+
- **Smart Contract:** 387 lines (Rust/Anchor)
- **Frontend:** ~8,000 lines (TypeScript/React)
- **Backend API:** ~5,000 lines (C#/.NET)
- **Components:** 40+ React components
- **API Endpoints:** 15+ RESTful endpoints
- **Blockchains Supported:** 3 (Solana, Ethereum, Radix)

---

## Roadmap

### Phase 1: MVP (Current - Hackathon)
- Property tokenization wizard
- UAT Factory smart contract
- Automated property extraction
- Solana devnet deployment

### Phase 2: Token Extensions (In Progress)
- Token-2022 integration
- Confidential transfers
- Transfer hooks for compliance
- Native transfer fees

### Phase 3: Production Launch
- Security audit
- Mainnet deployment
- KYC/AML provider integration
- Institutional partnerships

### Phase 4: Multi-Chain Expansion
- Ethereum deployment
- Radix deployment
- Cross-chain bridges
- Universal asset registry

---

## Team

Built by the AssetRail team for Solana Colosseum Hackathon 2025.

---

## Contact

- **Email:** dev@quantumsecurities.com
- **Website:** https://assetrail.xyz
- **GitHub:** https://github.com/[your-username]/QS_Asset_Rail

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Solana Foundation for Colosseum Hackathon
- Anchor framework team
- OpenAI for GPT-4 API
- Firecrawl for web scraping capabilities
- Wyoming Legislature for progressive blockchain legislation

---

Built on Solana
