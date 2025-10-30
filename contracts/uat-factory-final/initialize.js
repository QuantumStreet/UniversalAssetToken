const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { Program, AnchorProvider, BN } = require('@coral-xyz/anchor');
const fs = require('fs');

const PROGRAM_ID = new PublicKey('5sjHgtEMp6vzu3UhxBMMfcwRSc3mR2JoTJH8mA8JkiDH');
const connection = new Connection('https://api.devnet.solana.com');

async function initializeFactory() {
  try {
    // Get authority keypair
    const authority = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync('/Users/maxgershfield/.config/solana/id.json', 'utf8')))
    );

    const provider = new AnchorProvider(connection, { publicKey: authority.publicKey, signTransaction: async (tx) => tx, signAllTransactions: async (txs) => txs }, {});
    const program = new Program(require('./target/idl/uat_factory.json'), PROGRAM_ID, provider);

    // Derive factory PDA
    const [factoryPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('factory')],
      PROGRAM_ID
    );

    console.log('Factory PDA:', factoryPDA.toString());

    // Initialize factory
    const tx = await program.methods
      .initializeFactory()
      .accounts({
        factory: factoryPDA,
        authority: authority.publicKey,
        systemProgram: PublicKey.default,
      })
      .rpc();

    console.log('Factory initialized!');
    console.log('Transaction signature:', tx);
    console.log('Factory address:', factoryPDA.toString());

  } catch (error) {
    console.error('Error initializing factory:', error);
  }
}

initializeFactory();
