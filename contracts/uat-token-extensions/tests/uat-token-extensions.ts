import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { UatTokenExtensions } from "../target/types/uat_token_extensions";
import {
  TOKEN_2022_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  getMint,
} from "@solana/spl-token";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("UAT Token Extensions", () => {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.UatTokenExtensions as Program<UatTokenExtensions>;
  const wallet = provider.wallet as anchor.Wallet;

  // PDAs
  let factoryPDA: PublicKey;
  let factoryBump: number;

  // Test data
  let mint: PublicKey;
  let propertyTokenPDA: PublicKey;
  let propertyTokenBump: number;
  let investor: Keypair;
  let investorTokenAccount: PublicKey;
  let investorRecordPDA: PublicKey;
  let investorRecordBump: number;

  const TOKEN_NAME = "Beverly Hills Estate";
  const TOKEN_SYMBOL = "BHE";
  const METADATA_URI = "ipfs://QmTest123456789";
  const TOTAL_SUPPLY = new anchor.BN(3500);
  const DECIMALS = 0;
  const TRANSFER_FEE_BPS = 100; // 1%

  before(async () => {
    // Derive factory PDA
    [factoryPDA, factoryBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("factory")],
      program.programId
    );

    console.log("Factory PDA:", factoryPDA.toString());
    console.log("Program ID:", program.programId.toString());
  });

  it("Initializes the UAT factory", async () => {
    try {
      const tx = await program.methods
        .initializeFactory()
        .accounts({
          factory: factoryPDA,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Initialize factory tx:", tx);

      // Fetch and verify factory
      const factory = await program.account.factory.fetch(factoryPDA);
      assert.equal(factory.authority.toString(), wallet.publicKey.toString());
      assert.equal(factory.totalProperties, 0);
      assert.equal(factory.bump, factoryBump);

      console.log("✅ Factory initialized successfully");
    } catch (err) {
      console.error("Factory initialization error:", err);
      throw err;
    }
  });

  it("Creates a Token-2022 mint", async () => {
    try {
      // Create a new Token-2022 mint
      const mintKeypair = Keypair.generate();
      
      mint = await createMint(
        provider.connection,
        wallet.payer,
        wallet.publicKey,  // mint authority
        wallet.publicKey,  // freeze authority
        DECIMALS,
        mintKeypair,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      console.log("Created Token-2022 mint:", mint.toString());

      // Verify mint was created
      const mintInfo = await getMint(
        provider.connection,
        mint,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      assert.equal(mintInfo.decimals, DECIMALS);
      console.log("✅ Token-2022 mint created successfully");
    } catch (err) {
      console.error("Mint creation error:", err);
      throw err;
    }
  });

  it("Creates a property token", async () => {
    try {
      // Fetch factory to get the counter
      const factory = await program.account.factory.fetch(factoryPDA);
      
      // Derive property token PDA
      const factoryCount = factory.totalProperties;
      [propertyTokenPDA, propertyTokenBump] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("property_token"),
          factoryPDA.toBuffer(),
          Buffer.from(new Uint8Array(new Uint32Array([factoryCount]).buffer))
        ],
        program.programId
      );

      const tx = await program.methods
        .createPropertyToken(
          TOKEN_NAME,
          TOKEN_SYMBOL,
          METADATA_URI,
          TOTAL_SUPPLY,
          DECIMALS,
          TRANSFER_FEE_BPS
        )
        .accounts({
          factory: factoryPDA,
          propertyToken: propertyTokenPDA,
          mint: mint,
          authority: wallet.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Create property token tx:", tx);

      // Fetch and verify property token
      const propertyToken = await program.account.propertyToken.fetch(propertyTokenPDA);
      assert.equal(propertyToken.tokenName, TOKEN_NAME);
      assert.equal(propertyToken.tokenSymbol, TOKEN_SYMBOL);
      assert.equal(propertyToken.metadataUri, METADATA_URI);
      assert.equal(propertyToken.totalSupply.toString(), TOTAL_SUPPLY.toString());
      assert.equal(propertyToken.mintedSupply.toString(), "0");
      assert.equal(propertyToken.decimals, DECIMALS);
      assert.equal(propertyToken.transferFeeBasisPoints, TRANSFER_FEE_BPS);
      assert.equal(propertyToken.isActive, true);
      assert.equal(propertyToken.mint.toString(), mint.toString());

      // Verify factory counter incremented
      const updatedFactory = await program.account.factory.fetch(factoryPDA);
      assert.equal(updatedFactory.totalProperties, 1);

      console.log("✅ Property token created successfully");
      console.log("   Name:", propertyToken.tokenName);
      console.log("   Symbol:", propertyToken.tokenSymbol);
      console.log("   Mint:", propertyToken.mint.toString());
      console.log("   Total supply:", propertyToken.totalSupply.toString());
    } catch (err) {
      console.error("Property token creation error:", err);
      throw err;
    }
  });

  it("Whitelists an investor", async () => {
    try {
      // Create test investor
      investor = Keypair.generate();

      // Derive investor record PDA
      [investorRecordPDA, investorRecordBump] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("investor_record"),
          propertyTokenPDA.toBuffer(),
          investor.publicKey.toBuffer(),
        ],
        program.programId
      );

      // Airdrop SOL to investor for token account rent
      const airdropSig = await provider.connection.requestAirdrop(
        investor.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig);

      const tx = await program.methods
        .whitelistInvestor(true) // is_accredited = true
        .accounts({
          propertyToken: propertyTokenPDA,
          investorRecord: investorRecordPDA,
          investor: investor.publicKey,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Whitelist investor tx:", tx);

      // Fetch and verify investor record
      const record = await program.account.investorRecord.fetch(investorRecordPDA);
      assert.equal(record.investor.toString(), investor.publicKey.toString());
      assert.equal(record.propertyToken.toString(), propertyTokenPDA.toString());
      assert.equal(record.isWhitelisted, true);
      assert.equal(record.isAccredited, true);
      assert.equal(record.tokensHeld.toString(), "0");

      console.log("✅ Investor whitelisted successfully");
      console.log("   Investor:", investor.publicKey.toString());
      console.log("   Accredited:", record.isAccredited);
    } catch (err) {
      console.error("Whitelist error:", err);
      throw err;
    }
  });

  it("Mints tokens to whitelisted investor", async () => {
    try {
      // Create associated token account for investor
      const investorATA = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        investor,
        mint,
        investor.publicKey,
        false,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
      investorTokenAccount = investorATA.address;

      console.log("Investor token account:", investorTokenAccount.toString());

      const mintAmount = new anchor.BN(100);

      const tx = await program.methods
        .mintTokens(mintAmount)
        .accounts({
          propertyToken: propertyTokenPDA,
          mint: mint,
          investorRecord: investorRecordPDA,
          investorTokenAccount: investorTokenAccount,
          investor: investor.publicKey,
          authority: wallet.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      console.log("Mint tokens tx:", tx);

      // Verify property token supply updated
      const propertyToken = await program.account.propertyToken.fetch(propertyTokenPDA);
      assert.equal(propertyToken.mintedSupply.toString(), mintAmount.toString());

      // Verify investor record updated
      const record = await program.account.investorRecord.fetch(investorRecordPDA);
      assert.equal(record.tokensHeld.toString(), mintAmount.toString());

      console.log("✅ Tokens minted successfully");
      console.log("   Amount:", mintAmount.toString());
      console.log("   Minted supply:", propertyToken.mintedSupply.toString());
      console.log("   Total supply:", propertyToken.totalSupply.toString());
    } catch (err) {
      console.error("Minting error:", err);
      throw err;
    }
  });

  it("Fails to mint to non-whitelisted investor", async () => {
    try {
      const nonWhitelistedInvestor = Keypair.generate();

      // Airdrop SOL
      const airdropSig = await provider.connection.requestAirdrop(
        nonWhitelistedInvestor.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig);

      // Create token account
      const ata = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        nonWhitelistedInvestor,
        mint,
        nonWhitelistedInvestor.publicKey,
        false,
        undefined,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      // Derive investor record PDA (doesn't exist yet)
      const [badInvestorRecordPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("investor_record"),
          propertyTokenPDA.toBuffer(),
          nonWhitelistedInvestor.publicKey.toBuffer(),
        ],
        program.programId
      );

      // This should fail
      await program.methods
        .mintTokens(new anchor.BN(50))
        .accounts({
          propertyToken: propertyTokenPDA,
          mint: mint,
          investorRecord: badInvestorRecordPDA,
          investorTokenAccount: ata.address,
          investor: nonWhitelistedInvestor.publicKey,
          authority: wallet.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      // Should not reach here
      assert.fail("Should have failed to mint to non-whitelisted investor");
    } catch (err) {
      // Expected error
      console.log("✅ Correctly prevented minting to non-whitelisted investor");
      assert.include(err.toString(), "AccountNotInitialized");
    }
  });

  it("Records a yield distribution", async () => {
    try {
      const amountPerToken = new anchor.BN(1527); // $15.27 in cents
      const totalAmount = new anchor.BN(53440);
      const distributionDate = new anchor.BN(Math.floor(Date.now() / 1000));

      // Fetch property token to get minted supply for PDA derivation
      const propertyToken = await program.account.propertyToken.fetch(propertyTokenPDA);
      
      const [distributionPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("distribution"),
          propertyTokenPDA.toBuffer(),
          Buffer.from(new Uint8Array(new anchor.BN(propertyToken.mintedSupply).toArrayLike(Buffer, "le", 8))),
        ],
        program.programId
      );

      const tx = await program.methods
        .recordDistribution(
          amountPerToken,
          totalAmount,
          distributionDate
        )
        .accounts({
          propertyToken: propertyTokenPDA,
          distribution: distributionPDA,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Record distribution tx:", tx);

      // Fetch and verify distribution
      const distribution = await program.account.yieldDistribution.fetch(distributionPDA);
      assert.equal(distribution.propertyToken.toString(), propertyTokenPDA.toString());
      assert.equal(distribution.amountPerToken.toString(), amountPerToken.toString());
      assert.equal(distribution.totalAmount.toString(), totalAmount.toString());

      console.log("✅ Distribution recorded successfully");
      console.log("   Amount per token:", distribution.amountPerToken.toString());
      console.log("   Total amount:", distribution.totalAmount.toString());
    } catch (err) {
      console.error("Distribution recording error:", err);
      throw err;
    }
  });

  it("Updates metadata URI", async () => {
    try {
      const newUri = "ipfs://QmNewUpdatedMetadata789";

      const tx = await program.methods
        .updateMetadataUri(newUri)
        .accounts({
          propertyToken: propertyTokenPDA,
          authority: wallet.publicKey,
        })
        .rpc();

      console.log("Update metadata URI tx:", tx);

      // Verify update
      const propertyToken = await program.account.propertyToken.fetch(propertyTokenPDA);
      assert.equal(propertyToken.metadataUri, newUri);

      console.log("✅ Metadata URI updated successfully");
      console.log("   New URI:", newUri);
    } catch (err) {
      console.error("Metadata update error:", err);
      throw err;
    }
  });

  it("Pauses and unpauses the token", async () => {
    try {
      // Pause
      let tx = await program.methods
        .setTokenStatus(false)
        .accounts({
          propertyToken: propertyTokenPDA,
          authority: wallet.publicKey,
        })
        .rpc();

      console.log("Pause token tx:", tx);

      let propertyToken = await program.account.propertyToken.fetch(propertyTokenPDA);
      assert.equal(propertyToken.isActive, false);

      // Unpause
      tx = await program.methods
        .setTokenStatus(true)
        .accounts({
          propertyToken: propertyTokenPDA,
          authority: wallet.publicKey,
        })
        .rpc();

      console.log("Unpause token tx:", tx);

      propertyToken = await program.account.propertyToken.fetch(propertyTokenPDA);
      assert.equal(propertyToken.isActive, true);

      console.log("✅ Token status toggled successfully");
    } catch (err) {
      console.error("Status toggle error:", err);
      throw err;
    }
  });

  it("Removes investor from whitelist", async () => {
    try {
      const tx = await program.methods
        .removeFromWhitelist()
        .accounts({
          propertyToken: propertyTokenPDA,
          investorRecord: investorRecordPDA,
          authority: wallet.publicKey,
        })
        .rpc();

      console.log("Remove from whitelist tx:", tx);

      // Verify removal
      const record = await program.account.investorRecord.fetch(investorRecordPDA);
      assert.equal(record.isWhitelisted, false);

      console.log("✅ Investor removed from whitelist");
    } catch (err) {
      console.error("Whitelist removal error:", err);
      throw err;
    }
  });
});
