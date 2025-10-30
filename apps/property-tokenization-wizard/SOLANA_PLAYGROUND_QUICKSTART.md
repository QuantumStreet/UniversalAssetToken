# Solana Playground Integration - Quick Start

**Goal:** Add "Open in Solana Playground" button to your Property Tokenization Wizard in 1-2 days

---

## 🎯 What We're Building

```
User completes wizard → Contract generated → Preview modal opens
                                                     ↓
                                    ┌───────────────────────────────┐
                                    │  Contract Preview             │
                                    │                               │
                                    │  [Monaco Editor with code]    │
                                    │                               │
                                    │  [🚀 Open in Solana PG]       │
                                    │  [💾 Download ZIP]            │
                                    │  [⚡ Deploy Now]              │
                                    └───────────────────────────────┘
```

---

## 📦 Step 1: Install Dependencies

```bash
cd /Volumes/Storage/QS_Asset_Rail/apps/property-tokenization-wizard

npm install @monaco-editor/react jszip
```

---

## 📝 Step 2: Create Utility to Extract Code from ZIP

```typescript
// src/lib/zip-utils.ts

import JSZip from 'jszip';

export async function extractFileFromZip(
  zipBlob: Blob,
  filePath: string
): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(zipBlob);
    const file = zip.file(filePath);
    
    if (!file) {
      throw new Error(`File not found in zip: ${filePath}`);
    }
    
    return await file.async('string');
  } catch (error) {
    console.error('Error extracting file from zip:', error);
    throw error;
  }
}

export async function extractAllRustFiles(zipBlob: Blob): Promise<Record<string, string>> {
  try {
    const zip = await JSZip.loadAsync(zipBlob);
    const files: Record<string, string> = {};
    
    // Extract all .rs files
    const promises = Object.keys(zip.files).map(async (filename) => {
      if (filename.endsWith('.rs') || filename.endsWith('.toml')) {
        const file = zip.files[filename];
        if (!file.dir) {
          files[filename] = await file.async('string');
        }
      }
    });
    
    await Promise.all(promises);
    return files;
  } catch (error) {
    console.error('Error extracting rust files:', error);
    throw error;
  }
}
```

---

## 🎨 Step 3: Create Contract Preview Modal Component

```typescript
// src/components/contract-preview-modal.tsx

'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { extractFileFromZip } from '@/lib/zip-utils';

interface ContractPreviewModalProps {
  open: boolean;
  onClose: () => void;
  contractZip: Blob | null;
  contractSpec: any;
  onDeploy: () => void;
}

export function ContractPreviewModal({
  open,
  onClose,
  contractZip,
  contractSpec,
  onDeploy,
}: ContractPreviewModalProps) {
  const [contractCode, setContractCode] = useState<string>('');
  const [cargoToml, setCargoToml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contractZip && open) {
      loadContractCode();
    }
  }, [contractZip, open]);

  async function loadContractCode() {
    try {
      setLoading(true);
      setError(null);
      
      // Extract main contract file
      const libRs = await extractFileFromZip(
        contractZip!,
        'programs/rust-main-template/src/lib.rs'
      );
      setContractCode(libRs);
      
      // Extract Cargo.toml
      const cargo = await extractFileFromZip(
        contractZip!,
        'Cargo.toml'
      );
      setCargoToml(cargo);
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading contract:', err);
      setError('Failed to load contract code');
      setLoading(false);
    }
  }

  function openInSolanaPlayground() {
    try {
      // Create a shareable project
      const projectData = {
        files: {
          'src/lib.rs': contractCode,
          'Cargo.toml': cargoToml,
          'README.md': generateReadme(),
        }
      };
      
      // Encode project data
      const encoded = btoa(JSON.stringify(projectData));
      
      // Create Solana Playground URL
      const playgroundUrl = `https://beta.solpg.io/?code=${encoded}`;
      
      // Open in new tab
      window.open(playgroundUrl, '_blank');
      
      // Note: This is a simplified approach. You may need to adjust
      // based on Solana Playground's actual API
    } catch (error) {
      console.error('Error opening in Solana Playground:', error);
      
      // Fallback: Just open Solana Playground
      // User can copy/paste code manually
      window.open('https://beta.solpg.io/', '_blank');
      
      // Show instructions
      alert(
        'Solana Playground opened in a new tab.\n\n' +
        'To use your contract:\n' +
        '1. Create a new Anchor project\n' +
        '2. Replace lib.rs with your generated code\n' +
        '3. Update Cargo.toml dependencies if needed\n' +
        '4. Click "Build" to compile\n' +
        '5. Click "Deploy" to deploy to devnet'
      );
    }
  }

  function generateReadme() {
    return `# ${contractSpec?.programName || 'Property Trust'} Contract

## Generated by AssetRail

This Solana smart contract was automatically generated using AssetRail's Property Tokenization Wizard.

### Program Details
- **Program Name:** ${contractSpec?.programName || 'property_trust'}
- **Program ID:** ${contractSpec?.programId || 'TBD'}
- **Network:** Devnet

### How to Deploy

1. Make sure you're connected to Devnet
2. Click the "Build" button to compile
3. Click "Deploy" to deploy to Solana
4. Save your Program ID

### Instructions

${contractSpec?.instructions?.map((inst: any) => `- **${inst.name}:** ${inst.description || 'No description'}`).join('\n') || 'See code for available instructions'}

### Learn More

- [AssetRail Documentation](https://docs.assetrail.xyz)
- [Solana Documentation](https://docs.solana.com)
- [Anchor Framework](https://www.anchor-lang.com)
`;
  }

  function downloadZip() {
    if (!contractZip) return;
    
    const url = URL.createObjectURL(contractZip);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contractSpec?.programName || 'contract'}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Review Generated Contract</DialogTitle>
          <DialogDescription>
            Your Solana smart contract has been generated. Review the code below,
            edit it in Solana Playground, or deploy directly.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="flex-1 border rounded-lg overflow-hidden">
                <Editor
                  height="100%"
                  language="rust"
                  theme="vs-dark"
                  value={contractCode}
                  options={{
                    readOnly: true,
                    minimap: { enabled: true },
                    fontSize: 13,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: 'on',
                  }}
                />
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-3">
                  <strong>Next Steps:</strong>
                </p>
                <ul className="text-sm text-gray-600 space-y-1 mb-4 list-disc list-inside">
                  <li>Click <strong>"Open in Solana Playground"</strong> to edit and test your contract</li>
                  <li>Click <strong>"Download ZIP"</strong> to save the full project</li>
                  <li>Click <strong>"Deploy Now"</strong> to deploy automatically via AssetRail</li>
                </ul>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    Program: <code className="bg-gray-100 px-2 py-1 rounded">
                      {contractSpec?.programName || 'property_trust'}
                    </code>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={downloadZip}
                  >
                    📥 Download ZIP
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={openInSolanaPlayground}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
                  >
                    🚀 Open in Solana Playground
                  </Button>

                  <Button
                    onClick={() => {
                      onClose();
                      onDeploy();
                    }}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
                  >
                    ⚡ Deploy Now
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🔌 Step 4: Integrate into Contract Generation Step

```typescript
// src/components/steps/contract-generation-step.tsx

'use client';

import { useState } from 'react';
import { useContractApi } from '@/hooks/use-contract-api';
import { ContractPreviewModal } from '@/components/contract-preview-modal';
import { Button } from '@/components/ui/button';

export function ContractGenerationStep({ onNext }: { onNext: () => void }) {
  const [generating, setGenerating] = useState(false);
  const [contractZip, setContractZip] = useState<Blob | null>(null);
  const [contractSpec, setContractSpec] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const { generateContract } = useContractApi();

  async function handleGenerate() {
    try {
      setGenerating(true);

      // Create contract specification from wizard data
      const spec = {
        programName: 'property_trust',
        programId: 'TBD', // Will be set after deployment
        // ... rest of your spec
      };

      setContractSpec(spec);

      // Generate contract via your API
      const zip = await generateContract(spec, 'Rust');
      setContractZip(zip);

      // Show preview modal
      setShowPreview(true);
    } catch (error) {
      console.error('Contract generation failed:', error);
      alert('Failed to generate contract. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  function handleDeploy() {
    // Proceed to deployment step
    onNext();
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Generate Smart Contract</h2>
        <p className="text-muted-foreground">
          Generate a Solana smart contract for your property tokenization
        </p>

        <Button
          onClick={handleGenerate}
          disabled={generating}
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-purple-600"
        >
          {generating ? (
            <>
              <span className="animate-spin mr-2">⚙️</span>
              Generating Contract...
            </>
          ) : (
            <>🔨 Generate Contract</>
          )}
        </Button>

        {contractZip && (
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
          >
            👁️ View Generated Contract
          </Button>
        )}
      </div>

      {/* Preview Modal */}
      <ContractPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        contractZip={contractZip}
        contractSpec={contractSpec}
        onDeploy={handleDeploy}
      />
    </div>
  );
}
```

---

## 🎨 Step 5: Add Shadcn Dialog Component (if not already added)

```bash
npx shadcn@latest add dialog
```

---

## 🧪 Step 6: Test It!

```bash
cd /Volumes/Storage/QS_Asset_Rail/apps/property-tokenization-wizard
npm run dev
```

### Test Flow:
1. Open http://localhost:3000
2. Complete property details
3. Click "Generate Contract"
4. Preview modal opens with Monaco editor
5. Click "🚀 Open in Solana Playground"
6. New tab opens with Solana Playground
7. Manually import the contract (or it auto-imports if we implement full API)

---

## 🔧 Alternative: Simple Link (Even Faster)

If you want something even simpler to start:

```typescript
// Just add a simple button to open Solana Playground

function SimplePlaygroundButton() {
  return (
    <Button
      onClick={() => window.open('https://beta.solpg.io/', '_blank')}
      variant="outline"
    >
      🚀 Open Solana Playground
    </Button>
  );
}
```

Then add instructions for users to:
1. Download the ZIP
2. Open Solana Playground
3. Import the project
4. Compile and deploy

---

## 📋 Checklist

- [ ] Install dependencies (`@monaco-editor/react`, `jszip`)
- [ ] Create `zip-utils.ts`
- [ ] Create `contract-preview-modal.tsx`
- [ ] Update `contract-generation-step.tsx`
- [ ] Add Shadcn dialog component
- [ ] Test the flow end-to-end
- [ ] Deploy to production

---

## 🚀 Next Enhancements

Once this is working, you can add:

1. **Better Playground integration**
   - Research Solana Playground's import API
   - Auto-populate project structure
   - Pre-configure for deployment

2. **Test generation**
   - Auto-generate test files
   - Include in Playground project

3. **Deployment tracking**
   - Save program ID from Playground
   - Link back to your wizard

4. **Monaco enhancements**
   - Add Rust syntax validation
   - Enable editing (not just preview)
   - Show diff when changes made

---

## 💡 Pro Tips

### Solana Playground URL Parameters

Test these in your browser to see what works:

```
https://beta.solpg.io/?code=BASE64_ENCODED_CODE
https://beta.solpg.io/?import=URL_TO_ZIP
https://beta.solpg.io/?project=PROJECT_ID
```

### Monaco Editor Configuration

```typescript
// For better Rust support
<Editor
  language="rust"
  options={{
    // Enable Rust-specific features
    'bracketPairColorization.enabled': true,
    'folding': true,
    'foldingStrategy': 'indentation',
    
    // Improve readability
    'fontSize': 14,
    'lineHeight': 22,
    'fontFamily': 'JetBrains Mono, Monaco, Courier New',
    
    // Better UX
    'minimap': { enabled: true },
    'scrollBeyondLastLine': false,
    'automaticLayout': true,
    'wordWrap': 'on',
    'cursorBlinking': 'smooth',
  }}
/>
```

---

## 🎯 Success Metrics

After implementing, track:
- ✅ How many users click "Open in Playground"?
- ✅ How many successfully deploy from Playground?
- ✅ Any error reports about the integration?
- ✅ User feedback on the feature

---

## 📞 Questions?

If you run into issues:

1. Check Solana Playground's GitHub issues
2. Test manually to understand their URL patterns
3. Consider reaching out to Solana Playground maintainers
4. Or implement the simple version first (just open blank Playground)

---

**Estimated Time:** 1-2 days for full implementation

**Value:** High - Users can verify and customize generated contracts

**Risk:** Low - Non-breaking addition to existing flow

**Let's build it!** 🚀


