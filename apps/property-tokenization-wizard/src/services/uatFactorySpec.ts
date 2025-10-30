/**
 * UAT Factory Contract Specification
 * 
 * This defines the JSON specification that will be sent to the AssetRail API
 * to generate the UAT Factory smart contract
 */

import { ContractGenerationSpec } from './assetRailApi';

/**
 * Get the UAT Factory contract specification for Solana
 */
export function getUATFactorySpec(network: 'mainnet' | 'testnet' | 'devnet' = 'devnet'): ContractGenerationSpec {
  return {
    contractType: 'UAT_FACTORY',
    blockchain: 'solana',
    network: network,
    parameters: {
      // Contract metadata
      name: 'UAT Property Token Factory',
      description: 'Universal Asset Token factory for property tokenization with Wyoming Trust compliance',
      version: '1.0.0',
      
      // Factory features
      features: {
        propertyTokenCreation: true,
        investorWhitelisting: true,
        kycCompliance: true,
        accreditationChecks: true,
        supplyManagement: true,
        investorCapEnforcement: true,
      },
      
      // Compliance settings
      compliance: {
        maxInvestors: 2000, // Reg D 506(c) limit
        lockUpPeriod: 365, // days
        accreditedOnly: true,
        kycRequired: true,
      },
      
      // Contract functions
      instructions: [
        {
          name: 'initialize_factory',
          description: 'Initialize the UAT factory',
          accounts: ['factory', 'authority', 'system_program'],
          parameters: [],
        },
        {
          name: 'create_property_token',
          description: 'Create a new property token collection',
          accounts: [
            'factory',
            'property',
            'mint',
            'authority',
            'token_program',
            'system_program',
            'rent'
          ],
          parameters: [
            { name: 'metadata_uri', type: 'String', maxLength: 200 },
            { name: 'token_name', type: 'String', maxLength: 64 },
            { name: 'token_symbol', type: 'String', maxLength: 10 },
            { name: 'total_supply', type: 'u64' },
          ],
        },
        {
          name: 'add_to_whitelist',
          description: 'Add an investor to the whitelist',
          accounts: [
            'property',
            'whitelist',
            'investor',
            'authority',
            'system_program'
          ],
          parameters: [
            { name: 'investor', type: 'Pubkey' },
            { name: 'kyc_hash', type: '[u8; 32]' },
            { name: 'is_accredited', type: 'bool' },
          ],
        },
        {
          name: 'mint_property_tokens',
          description: 'Mint tokens to a whitelisted investor',
          accounts: [
            'property',
            'mint',
            'whitelist',
            'recipient_token_account',
            'recipient',
            'authority',
            'token_program',
            'associated_token_program',
            'system_program',
            'rent'
          ],
          parameters: [
            { name: 'amount', type: 'u64' },
          ],
        },
      ],
      
      // Account structures
      accounts: [
        {
          name: 'Factory',
          description: 'Global factory state',
          fields: [
            { name: 'authority', type: 'Pubkey' },
            { name: 'total_properties', type: 'u32' },
            { name: 'bump', type: 'u8' },
          ],
          seeds: ['factory'],
        },
        {
          name: 'PropertyToken',
          description: 'Individual property token state',
          fields: [
            { name: 'factory', type: 'Pubkey' },
            { name: 'mint', type: 'Pubkey' },
            { name: 'authority', type: 'Pubkey' },
            { name: 'metadata_uri', type: 'String', maxLength: 200 },
            { name: 'token_name', type: 'String', maxLength: 64 },
            { name: 'token_symbol', type: 'String', maxLength: 10 },
            { name: 'total_supply', type: 'u64' },
            { name: 'minted_supply', type: 'u64' },
            { name: 'unique_investors', type: 'u16' },
            { name: 'created_at', type: 'i64' },
            { name: 'lock_up_end_date', type: 'i64' },
            { name: 'is_active', type: 'bool' },
            { name: 'bump', type: 'u8' },
          ],
          seeds: ['property', 'factory', 'mint'],
        },
        {
          name: 'InvestorWhitelist',
          description: 'Investor KYC and accreditation status',
          fields: [
            { name: 'property', type: 'Pubkey' },
            { name: 'investor', type: 'Pubkey' },
            { name: 'kyc_hash', type: '[u8; 32]' },
            { name: 'is_accredited', type: 'bool' },
            { name: 'is_active', type: 'bool' },
            { name: 'added_at', type: 'i64' },
            { name: 'bump', type: 'u8' },
          ],
          seeds: ['whitelist', 'property', 'investor'],
        },
      ],
      
      // Error codes
      errors: [
        { code: 6000, name: 'InvalidMetadataUri', message: 'Metadata URI must start with ipfs:// or https://' },
        { code: 6001, name: 'SymbolTooLong', message: 'Token symbol cannot exceed 10 characters' },
        { code: 6002, name: 'NameTooLong', message: 'Token name cannot exceed 64 characters' },
        { code: 6003, name: 'InvalidSupply', message: 'Total supply must be greater than 0' },
        { code: 6004, name: 'ExceedsSupply', message: 'Minting would exceed total supply' },
        { code: 6005, name: 'PropertyInactive', message: 'Property token is not active' },
        { code: 6006, name: 'NotWhitelisted', message: 'Investor is not whitelisted' },
        { code: 6007, name: 'NotAccredited', message: 'Investor is not accredited' },
        { code: 6008, name: 'InvestorCapReached', message: 'Maximum number of investors reached (2000)' },
        { code: 6009, name: 'Unauthorized', message: 'Unauthorized access' },
      ],
    },
  };
}

/**
 * Get specification for a standalone property token contract
 */
export function getPropertyTokenSpec(
  tokenName: string,
  tokenSymbol: string,
  totalSupply: number,
  metadataUri: string,
  network: 'mainnet' | 'testnet' | 'devnet' = 'devnet'
): ContractGenerationSpec {
  return {
    contractType: 'PROPERTY_TOKEN',
    blockchain: 'solana',
    network: network,
    parameters: {
      tokenName,
      tokenSymbol,
      totalSupply,
      metadataUri,
      
      // Token features
      features: {
        mintable: true,
        burnable: false,
        pausable: true,
        whitelist: true,
        compliance: true,
      },
      
      // Compliance
      compliance: {
        maxInvestors: 2000,
        lockUpPeriod: 365,
        accreditedOnly: true,
        kycRequired: true,
      },
    },
  };
}











