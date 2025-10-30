export const API_CONFIG = {
  CONTRACT_API: process.env.NEXT_PUBLIC_CONTRACT_API || 'http://localhost:5000',
  AI_API: process.env.NEXT_PUBLIC_AI_API || 'https://api.assetrail.xyz',
  OASIS_API: process.env.NEXT_PUBLIC_OASIS_API || 'http://devnet.oasisweb4.one',
  
  // IPFS
  IPFS_GATEWAY: process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
  
  // Blockchain RPCs
  ETHEREUM_RPC: process.env.NEXT_PUBLIC_ETHEREUM_RPC || 'https://sepolia.infura.io',
  SOLANA_RPC: process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com',
  RADIX_RPC: process.env.NEXT_PUBLIC_RADIX_RPC || 'https://stokenet.radixdlt.com',
  
  // Data APIs
  CENSUS_API_KEY: '644019d44daee2dc67b0088dfd79ff2a20589d5a', // US Census API
  ATTOM_API_KEY: process.env.NEXT_PUBLIC_ATTOM_API_KEY, // Optional - Attom Data
} as const;

export const EXPLORER_URLS = {
  ethereum: {
    mainnet: 'https://etherscan.io',
    testnet: 'https://sepolia.etherscan.io',
    devnet: 'http://localhost:8545'
  },
  solana: {
    mainnet: 'https://explorer.solana.com',
    testnet: 'https://explorer.solana.com?cluster=testnet',
    devnet: 'https://explorer.solana.com?cluster=devnet'
  },
  radix: {
    mainnet: 'https://dashboard.radixdlt.com',
    testnet: 'https://stokenet-dashboard.radixdlt.com',
    devnet: 'http://localhost'
  }
} as const;

