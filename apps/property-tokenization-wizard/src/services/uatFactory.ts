/**
 * UAT Factory Smart Contract Integration
 * 
 * Handles interactions with the deployed UAT Factory contract on Solana
 * Program ID: UATb2B3qRaX8VaKGL4sTgwJkJ98goAGr2itBYrANARm
 */

import { Connection, PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN, Idl } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

// UAT Factory Program ID (deployed on Solana Devnet)
// Program ID: 69nVV8kMbkz8i2qKMPYeMxdwNdZDdFpUGjADLh3oahsB
// Deploy via Solana Playground: https://beta.solpg.io/
export const UAT_FACTORY_PROGRAM_ID = new PublicKey('69nVV8kMbkz8i2qKMPYeMxdwNdZDdFpUGjADLh3oahsB');

// Factory PDA seeds
const FACTORY_SEED = Buffer.from('factory');
const PROPERTY_SEED = Buffer.from('property');
const WHITELIST_SEED = Buffer.from('whitelist');

/**
 * Derive the factory PDA address
 */
export function getFactoryPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [FACTORY_SEED],
    UAT_FACTORY_PROGRAM_ID
  );
}

/**
 * Derive the property PDA address for a specific mint
 */
export function getPropertyPDA(factoryPDA: PublicKey, mintPDA: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [PROPERTY_SEED, factoryPDA.toBuffer(), mintPDA.toBuffer()],
    UAT_FACTORY_PROGRAM_ID
  );
}

/**
 * Derive the mint PDA address for a property
 */
export function getMintPDA(factoryPDA: PublicKey): PublicKey {
  const [mintPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('mint'), factoryPDA.toBuffer()],
    UAT_FACTORY_PROGRAM_ID
  );
  return mintPDA;
}

/**
 * Derive the whitelist PDA for an investor
 */
export function getWhitelistPDA(propertyPDA: PublicKey, investorPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [WHITELIST_SEED, propertyPDA.toBuffer(), investorPubkey.toBuffer()],
    UAT_FACTORY_PROGRAM_ID
  );
}

/**
 * Create a new property token collection
 */
export async function createPropertyToken(
  provider: AnchorProvider,
  metadataUri: string,
  tokenName: string,
  tokenSymbol: string,
  totalSupply: number,
  onProgress?: (message: string) => void
): Promise<{ propertyPDA: PublicKey; mintPDA: PublicKey; signature: string }> {
  try {
    // First check if the contract is actually deployed
    onProgress?.('🔍 Checking contract deployment...');
    try {
      const programAccount = await provider.connection.getAccountInfo(UAT_FACTORY_PROGRAM_ID);
      if (!programAccount) {
        onProgress?.('❌ UAT Factory contract not found at the specified address');
        throw new Error('Contract not deployed');
      }
      onProgress?.('✅ UAT Factory contract verified as deployed');
    } catch (error) {
      onProgress?.('❌ Failed to verify contract deployment');
      throw error;
    }
    
    onProgress?.('🔍 Deriving PDAs...');
    
    // Get factory PDA
    const [factoryPDA] = getFactoryPDA();
    
    // Generate mint PDA (no keypair needed for PDA-based mints)
    const mintPDA = getMintPDA(factoryPDA);
    
    // Get property PDA
    const [propertyPDA] = getPropertyPDA(factoryPDA, mintPDA);
    
    onProgress?.(`📍 Factory: ${factoryPDA.toBase58().slice(0, 20)}...`);
    onProgress?.(`📍 Property: ${propertyPDA.toBase58().slice(0, 20)}...`);
    onProgress?.(`📍 Mint: ${mintPDA.toBase58().slice(0, 20)}...`);
    
    onProgress?.('📝 Building transaction...');
    
    // Create the transaction instruction
    // Note: Since we don't have the IDL, we'll use a raw instruction builder
    // In production, you'd import the generated IDL from anchor build
    
    const instruction = web3.SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: provider.wallet.publicKey,
      lamports: 0, // Placeholder - replace with actual instruction
    });
    
    // Load the program IDL
    onProgress?.('📝 Loading contract IDL...');
    let idl: Idl;
    
    // Use local IDL file to ensure correct program ID
    onProgress?.('📝 Loading local IDL file...');
    try {
      const localIdlResponse = await fetch('/api/idl/uat_factory.json');
      if (!localIdlResponse.ok) {
        throw new Error('Failed to fetch local IDL');
      }
      idl = await localIdlResponse.json();
      onProgress?.('✅ IDL loaded from local file');
    } catch (localError) {
      throw new Error('Failed to load local IDL file');
    }
    
    // Debug: Check if IDL has program ID
    if ((idl as any).address) {
      onProgress?.(`🔍 IDL Program ID: ${(idl as any).address}`);
    }
    onProgress?.(`🔍 Expected Program ID: ${UAT_FACTORY_PROGRAM_ID.toBase58()}`);
    
    // Add program ID to IDL if it doesn't exist
    const idlWithProgramId = {
      ...idl,
      address: UAT_FACTORY_PROGRAM_ID.toBase58()
    };
    
    const program = new Program(idlWithProgramId as Idl, UAT_FACTORY_PROGRAM_ID, provider);
    
    onProgress?.('📝 Building transaction...');
    
    // Check wallet balance
    const walletBalance = await provider.connection.getBalance(provider.wallet.publicKey);
    onProgress?.(`💰 Wallet balance: ${(walletBalance / 1e9).toFixed(4)} SOL`);
    
    if (walletBalance < 0.0001 * 1e9) { // Less than 0.0001 SOL (very low threshold for testing)
      throw new Error(`Insufficient SOL balance: ${(walletBalance / 1e9).toFixed(6)} SOL. Please use the Solana faucet to get more SOL: https://faucet.solana.com/`);
    }
    
    // Check if factory needs to be initialized first
    onProgress?.('🔍 Checking factory initialization...');
    const factoryAccount = await provider.connection.getAccountInfo(factoryPDA);
    if (!factoryAccount) {
      onProgress?.('⚠️ Factory not initialized, initializing first...');
      
      // Initialize factory first
      const initTx = await program.methods
        .initializeFactory()
        .accounts({
          factory: factoryPDA,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      onProgress?.('✅ Factory initialized');
    } else {
      onProgress?.('✅ Factory already initialized');
    }
    
    // Create the actual transaction
    const tx = await program.methods
      .createPropertyToken(metadataUri, tokenName, tokenSymbol, new BN(totalSupply))
      .accounts({
        factory: factoryPDA,
        property: propertyPDA,
        mint: mintPDA,
        authority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    
    onProgress?.('✅ Property token created successfully');
    
    return {
      propertyPDA,
      mintPDA,
      signature: tx
    };
  } catch (error: any) {
    console.error('❌ Create property token error:', error);
    
    // Try to get more detailed error information
    if (error.logs) {
      console.error('Transaction logs:', error.logs);
    }
    
    // Check wallet balance
    try {
      const balance = await provider.connection.getBalance(provider.wallet.publicKey);
      console.error(`Wallet balance: ${balance / 1e9} SOL`);
    } catch (balanceError) {
      console.error('Could not check wallet balance:', balanceError);
    }
    
    throw new Error(`Failed to create property token: ${error.message}`);
  }
}

/**
 * Add an investor to the whitelist
 */
export async function addToWhitelist(
  provider: AnchorProvider,
  propertyPDA: PublicKey,
  investorPubkey: PublicKey,
  kycHash: Buffer,
  isAccredited: boolean,
  onProgress?: (message: string) => void
): Promise<{ whitelistPDA: PublicKey; signature: string }> {
  try {
    onProgress?.('🔍 Deriving whitelist PDA...');
    
    const [whitelistPDA] = getWhitelistPDA(propertyPDA, investorPubkey);
    
    onProgress?.(`📍 Whitelist: ${whitelistPDA.toBase58().slice(0, 20)}...`);
    onProgress?.(`👤 Investor: ${investorPubkey.toBase58().slice(0, 20)}...`);
    onProgress?.(`✅ Accredited: ${isAccredited}`);
    
    onProgress?.('📝 Adding to whitelist...');
    
    // Load the program IDL
    let idl: Idl;
    
    // Use local IDL file to ensure correct program ID
    try {
      const localIdlResponse = await fetch('/api/idl/uat_factory.json');
      if (!localIdlResponse.ok) {
        throw new Error('Failed to fetch local IDL');
      }
      idl = await localIdlResponse.json();
    } catch (localError) {
      throw new Error('Failed to load local IDL file');
    }
    
    // Add program ID to IDL if it doesn't exist
    const idlWithProgramId = {
      ...idl,
      address: UAT_FACTORY_PROGRAM_ID.toBase58()
    };
    
    const program = new Program(idlWithProgramId as Idl, UAT_FACTORY_PROGRAM_ID, provider);
    
    // Create the actual transaction
    const tx = await program.methods
      .addToWhitelist(investorPubkey, Array.from(kycHash), isAccredited)
      .accounts({
        property: propertyPDA,
        whitelist: whitelistPDA,
        investor: investorPubkey,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    onProgress?.('✅ Investor whitelisted successfully');
    
    return {
      whitelistPDA,
      signature: tx
    };
  } catch (error: any) {
    throw new Error(`Failed to whitelist investor: ${error.message}`);
  }
}

/**
 * Mint tokens to a whitelisted investor
 */
export async function mintPropertyTokens(
  provider: AnchorProvider,
  propertyPDA: PublicKey,
  mintPDA: PublicKey,
  recipientPubkey: PublicKey,
  amount: number,
  onProgress?: (message: string) => void
): Promise<{ signature: string; tokenAccount: PublicKey }> {
  try {
    onProgress?.('🔍 Getting recipient token account...');
    
    // Get recipient's associated token account
    const recipientTokenAccount = await getAssociatedTokenAddress(
      mintPDA,
      recipientPubkey
    );
    
    // Get whitelist PDA
    const [whitelistPDA] = getWhitelistPDA(propertyPDA, recipientPubkey);
    
    onProgress?.(`📍 Token Account: ${recipientTokenAccount.toBase58().slice(0, 20)}...`);
    onProgress?.(`💰 Amount: ${amount.toLocaleString()} tokens`);
    
    onProgress?.('📝 Minting tokens...');
    
    // Load the program IDL
    let idl: Idl;
    
    // Use local IDL file to ensure correct program ID
    try {
      const localIdlResponse = await fetch('/api/idl/uat_factory.json');
      if (!localIdlResponse.ok) {
        throw new Error('Failed to fetch local IDL');
      }
      idl = await localIdlResponse.json();
    } catch (localError) {
      throw new Error('Failed to load local IDL file');
    }
    
    // Add program ID to IDL if it doesn't exist
    const idlWithProgramId = {
      ...idl,
      address: UAT_FACTORY_PROGRAM_ID.toBase58()
    };
    
    const program = new Program(idlWithProgramId as Idl, UAT_FACTORY_PROGRAM_ID, provider);
    
    // Create the actual transaction
    const tx = await program.methods
      .mintPropertyTokens(new BN(amount))
      .accounts({
        property: propertyPDA,
        mint: mintPDA,
        whitelist: whitelistPDA,
        recipientTokenAccount: recipientTokenAccount,
        recipient: recipientPubkey,
        authority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    
    onProgress?.('✅ Tokens minted successfully');
    
    return {
      signature: tx,
      tokenAccount: recipientTokenAccount
    };
  } catch (error: any) {
    throw new Error(`Failed to mint tokens: ${error.message}`);
  }
}

/**
 * Get property token info
 */
export async function getPropertyInfo(
  connection: Connection,
  propertyPDA: PublicKey
): Promise<any> {
  try {
    const accountInfo = await connection.getAccountInfo(propertyPDA);
    
    if (!accountInfo) {
      throw new Error('Property account not found');
    }
    
    // TODO: Deserialize the account data using the IDL
    // For now, return basic info
    return {
      exists: true,
      owner: accountInfo.owner.toBase58(),
      lamports: accountInfo.lamports,
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch property info: ${error.message}`);
  }
}

/**
 * Initialize a provider from a wallet
 */
export function createProvider(connection: Connection, wallet: any): AnchorProvider {
  return new AnchorProvider(
    connection,
    wallet,
    AnchorProvider.defaultOptions()
  );
}

/**
 * Check if wallet is connected
 */
export function isWalletConnected(wallet: any): boolean {
  return wallet && wallet.publicKey && wallet.connected;
}

/**
 * Generate a KYC hash (in production, this would hash actual KYC documents)
 */
export function generateKYCHash(investorAddress: string): Buffer {
  // In production, this would be a hash of the actual KYC documents
  // For now, create a deterministic hash from the address
  const hash = Buffer.alloc(32);
  const addressBytes = Buffer.from(investorAddress);
  
  for (let i = 0; i < 32; i++) {
    hash[i] = addressBytes[i % addressBytes.length] ^ (i * 7);
  }
  
  return hash;
}

/**
 * Complete workflow: Create property, whitelist investor, mint tokens
 */
export async function completeUATWorkflow(
  provider: AnchorProvider,
  metadataUri: string,
  tokenName: string,
  tokenSymbol: string,
  totalSupply: number,
  recipientPubkey: PublicKey,
  mintAmount: number,
  isAccredited: boolean = true,
  onProgress?: (message: string) => void
): Promise<{
  propertyPDA: PublicKey;
  mintPDA: PublicKey;
  whitelistPDA: PublicKey;
  tokenAccount: PublicKey;
  signatures: {
    createProperty: string;
    whitelist: string;
    mint: string;
  };
}> {
  try {
    onProgress?.('🚀 Starting UAT property tokenization workflow...');
    onProgress?.('');
    
    // Step 1: Create property token
    onProgress?.('📋 Step 1/3: Creating property token collection...');
    const { propertyPDA, mintPDA, signature: createSig } = await createPropertyToken(
      provider,
      metadataUri,
      tokenName,
      tokenSymbol,
      totalSupply,
      onProgress
    );
    onProgress?.('');
    
    // Step 2: Whitelist investor
    onProgress?.('📋 Step 2/3: Whitelisting investor...');
    const kycHash = generateKYCHash(recipientPubkey.toBase58());
    const { whitelistPDA, signature: whitelistSig } = await addToWhitelist(
      provider,
      propertyPDA,
      recipientPubkey,
      kycHash,
      isAccredited,
      onProgress
    );
    onProgress?.('');
    
    // Step 3: Mint tokens
    onProgress?.('📋 Step 3/3: Minting tokens to investor...');
    const { signature: mintSig, tokenAccount } = await mintPropertyTokens(
      provider,
      propertyPDA,
      mintPDA,
      recipientPubkey,
      mintAmount,
      onProgress
    );
    onProgress?.('');
    
    onProgress?.('✅ UAT workflow complete!');
    onProgress?.('');
    onProgress?.(`📍 Property: ${propertyPDA.toBase58()}`);
    onProgress?.(`📍 Mint: ${mintPDA.toBase58()}`);
    onProgress?.(`📍 Token Account: ${tokenAccount.toBase58()}`);
    
    return {
      propertyPDA,
      mintPDA,
      whitelistPDA,
      tokenAccount,
      signatures: {
        createProperty: createSig,
        whitelist: whitelistSig,
        mint: mintSig,
      },
    };
  } catch (error: any) {
    throw new Error(`UAT workflow failed: ${error.message}`);
  }
}

