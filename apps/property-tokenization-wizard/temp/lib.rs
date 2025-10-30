
    // ================ Imports ================
            use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo, Transfer};
            use anchor_spl::associated_token::AssociatedToken;

use anchor_lang::prelude::*;


declare_id!("5sjHgtEMp6vzu3UhxBMMfcwRSc3mR2JoTJH8mA8JkiDH");

#[program]
pub mod uat_factory {
    use super::*;

    // ================ Constants ================
    /// Maximum length for metadata URI
    pub const MAX_URI_LENGTH: usize = 200;
    /// Maximum length for token name
    pub const MAX_NAME_LENGTH: usize = 64;
    /// Maximum length for token symbol
    pub const MAX_SYMBOL_LENGTH: usize = 10;
    /// Maximum investors per Reg D 506(c)
    pub const MAX_INVESTORS: u16 = 2000;

    // ================ Instructions ================
    /// Initialize the UAT Factory (one-time setup)
    pub fn initialize_factory(
        ctx: Context<InitializeFactory>,
    ) -> Result<()> {
        // ================ Instruction Logic ================
        let factory = &mut ctx.accounts.factory;
        factory.authority = ctx.accounts.authority.key();
        factory.total_properties = 0;
        factory.bump = ctx.bumps.factory;
        msg!("UAT Factory initialized with authority: {}", factory.authority);
        Ok(())
    }

    /// Create a new property token collection with UAT metadata
    /// * `metadata_uri` - IPFS URI to UAT JSON metadata
    /// * `token_name` - Token name (e.g., Beverly Hills Estate Token)
    /// * `token_symbol` - Token symbol (e.g., BHE)
    /// * `total_supply` - Total number of tokens
    pub fn create_property_token(
        ctx: Context<CreatePropertyToken>,
        metadata_uri: String,
        token_name: String,
        token_symbol: String,
        total_supply: u64
    ) -> Result<()> {
        // ================ Validations ================
        require!(metadata_uri.starts_with("ipfs://"), ErrorCode::InvalidMetadataUri);
        require!(token_symbol.len() <= MAX_SYMBOL_LENGTH, ErrorCode::SymbolTooLong);
        require!(total_supply > 0, ErrorCode::InvalidSupply);

        // ================ Instruction Logic ================
        let factory = &mut ctx.accounts.factory;
        let property = &mut ctx.accounts.property;
        property.factory = factory.key();
        property.mint = ctx.accounts.mint.key();
        property.authority = ctx.accounts.authority.key();
        property.metadata_uri = metadata_uri.clone();
        property.token_name = token_name.clone();
        property.token_symbol = token_symbol.clone();
        property.total_supply = total_supply;
        property.minted_supply = 0;
        property.unique_investors = 0;
        property.created_at = Clock::get()?.unix_timestamp;
        property.lock_up_end_date = Clock::get()?.unix_timestamp + (365 * 24 * 60 * 60);
        property.is_active = true;
        property.bump = ctx.bumps.property;
        factory.total_properties += 1;
        msg!("Property token created: {} ({})", token_name, token_symbol);
        msg!("Metadata URI: {}", metadata_uri);
        msg!("Total supply: {} tokens", total_supply);
        Ok(())
    }

    /// Add investor to whitelist (trustee only, after KYC)
    /// * `investor` - Investor address to whitelist
    /// * `kyc_hash` - Hash of KYC verification document
    /// * `is_accredited` - Whether investor is accredited
    pub fn add_to_whitelist(
        ctx: Context<UpdateWhitelist>,
        investor: Pubkey,
        kyc_hash: [u8; 32],
        is_accredited: bool
    ) -> Result<()> {
        // ================ Validations ================
        require!(ctx.accounts.authority.key() == ctx.accounts.property.authority, ErrorCode::Unauthorized);

        // ================ Instruction Logic ================
        let property = &mut ctx.accounts.property;
        let whitelist = &mut ctx.accounts.whitelist;
        whitelist.investor = investor;
        whitelist.kyc_hash = kyc_hash;
        whitelist.is_accredited = is_accredited;
        whitelist.whitelisted_at = Clock::get()?.unix_timestamp;
        whitelist.is_active = true;
        msg!("Investor whitelisted: {}", investor);
        msg!("Accredited: {}", is_accredited);
        Ok(())
    }

    /// Mint tokens to whitelisted, accredited investor
    /// * `amount` - Number of tokens to mint
    pub fn mint_property_tokens(
        ctx: Context<MintPropertyTokens>,
        amount: u64
    ) -> Result<()> {
        // ================ Instruction Logic ================
        let property = &mut ctx.accounts.property;
        let whitelist = &ctx.accounts.whitelist;

        // ================ Validations ================
        require!(property.is_active, ErrorCode::PropertyInactive);
        require!(property.minted_supply + amount <= property.total_supply, ErrorCode::ExceedsSupply);
        require!(whitelist.is_active, ErrorCode::NotWhitelisted);
        require!(whitelist.is_accredited, ErrorCode::NotAccredited);
        require!(property.unique_investors < MAX_INVESTORS, ErrorCode::InvestorCapReached);

        // ================ Minting Logic ================
        let factory_key = property.factory;
        let mint_key = property.mint;
        let seeds = &[b"property", factory_key.as_ref(), mint_key.as_ref(), &[property.bump]];
        let signer = &[&seeds[..]];
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: property.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::mint_to(cpi_ctx, amount)?;
        if ctx.accounts.recipient_token_account.amount == amount {
            property.unique_investors += 1;
        }
        property.minted_supply += amount;
        msg!("Minted {} tokens to {}", amount, ctx.accounts.recipient.key());
        msg!("Total minted: {}/{}", property.minted_supply, property.total_supply);
        msg!("Unique investors: {}", property.unique_investors);
        Ok(())
    }

    /// Update property metadata URI (trustee only)
    /// * `new_metadata_uri` - New IPFS URI for updated metadata
    pub fn update_metadata_uri(
        ctx: Context<UpdateMetadata>,
        new_metadata_uri: String
    ) -> Result<()> {
        // ================ Validations ================
        require!(new_metadata_uri.starts_with("ipfs://"), ErrorCode::InvalidMetadataUri);
        require!(ctx.accounts.authority.key() == ctx.accounts.property.authority, ErrorCode::Unauthorized);

        // ================ Instruction Logic ================
        let property = &mut ctx.accounts.property;
        let old_uri = property.metadata_uri.clone();
        property.metadata_uri = new_metadata_uri.clone();
        msg!("Metadata URI updated");
        msg!("Old: {}", old_uri);
        msg!("New: {}", new_metadata_uri);
        Ok(())
    }

}

// ================ Account Structs ================
/// Initialize factory context
#[derive(Accounts)]
pub struct InitializeFactory<'info> {
    /// Factory state account
    #[account(
        init,
        payer = authority,
        space = Factory::LEN,
        seeds = [b"factory"],
        bump
    )]
    pub factory: Account<'info, Factory>,
    /// Factory authority
    #[account(mut)]
    pub authority: Signer<'info>,
    /// System program
    pub system_program: Program<'info, System>,
}

/// Create property token context
#[derive(Accounts)]
#[instruction(metadata_uri: String, token_name: String, token_symbol: String, total_supply: u64)]
pub struct CreatePropertyToken<'info> {
    /// Factory account
    #[account(
        mut,
        seeds = [b"factory"],
        bump = factory.bump
    )]
    pub factory: Account<'info, Factory>,
    /// Property token account
    #[account(
        init,
        payer = authority,
        space = PropertyToken::LEN,
        seeds = [b"property", factory.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub property: Account<'info, PropertyToken>,
    /// Token mint
    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = property
    )]
    pub mint: Account<'info, Mint>,
    /// Property authority (trustee)
    #[account(mut)]
    pub authority: Signer<'info>,
    /// SPL Token program
    pub token_program: Program<'info, Token>,
    /// System program
    pub system_program: Program<'info, System>,
    /// Rent sysvar
    pub rent: Sysvar<'info, Rent>,
}

/// Add investor to whitelist context
#[derive(Accounts)]
#[instruction(investor: Pubkey, kyc_hash: [u8; 32], is_accredited: bool)]
pub struct UpdateWhitelist<'info> {
    /// Property token account
    #[account(
        seeds = [b"property", property.factory.as_ref(), property.mint.as_ref()],
        bump = property.bump
    )]
    pub property: Account<'info, PropertyToken>,
    /// Investor whitelist account
    #[account(
        init,
        payer = authority,
        space = InvestorWhitelist::LEN,
        seeds = [b"whitelist", property.key().as_ref(), investor.key().as_ref()],
        bump
    )]
    pub whitelist: Account<'info, InvestorWhitelist>,
    /// Investor to whitelist
    /// CHECK: Can be any account
    pub investor: AccountInfo<'info>,
    /// Property authority
    #[account(mut)]
    pub authority: Signer<'info>,
    /// System program
    pub system_program: Program<'info, System>,
}

/// Mint property tokens context
#[derive(Accounts)]
pub struct MintPropertyTokens<'info> {
    /// Property token account
    #[account(
        mut,
        seeds = [b"property", property.factory.as_ref(), property.mint.as_ref()],
        bump = property.bump,
        has_one = mint,
        has_one = authority
    )]
    pub property: Account<'info, PropertyToken>,
    /// Token mint
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    /// Recipient whitelist status
    #[account(
        seeds = [b"whitelist", property.key().as_ref(), recipient.key().as_ref()],
        bump
    )]
    pub whitelist: Account<'info, InvestorWhitelist>,
    /// Recipient token account
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = recipient
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,
    /// Token recipient
    /// CHECK: Can be any account
    pub recipient: AccountInfo<'info>,
    /// Property authority
    #[account(mut)]
    pub authority: Signer<'info>,
    /// SPL Token program
    pub token_program: Program<'info, Token>,
    /// Associated Token program
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// System program
    pub system_program: Program<'info, System>,
    /// Rent sysvar
    pub rent: Sysvar<'info, Rent>,
}

/// Update metadata URI context
#[derive(Accounts)]
pub struct UpdateMetadata<'info> {
    /// Property token account
    #[account(
        mut,
        seeds = [b"property", property.factory.as_ref(), property.mint.as_ref()],
        bump = property.bump,
        has_one = authority
    )]
    pub property: Account<'info, PropertyToken>,
    /// Property authority
    pub authority: Signer<'info>,
}

// ================ Data Structures ================
/// UAT Factory state
#[account]
#[derive(Default)]
pub struct Factory {
    /// Factory owner
    pub authority: Pubkey,
    /// Number of properties created
    pub total_properties: u64,
    /// PDA bump seed
    pub bump: u8,
}

impl Factory {
    pub const LEN: usize = 8 + 32 + 8 + 1; // discriminator + pubkey + u64 + u8
}

/// Property token collection state
#[account]
pub struct PropertyToken {
    /// Parent factory
    pub factory: Pubkey,
    /// Token mint address
    pub mint: Pubkey,
    /// Property authority (trustee)
    pub authority: Pubkey,
    /// IPFS URI to UAT JSON (max 200 chars)
    #[max_len(200)]
    pub metadata_uri: String,
    /// Token name (max 64 chars)
    #[max_len(64)]
    pub token_name: String,
    /// Token symbol (max 10 chars)
    #[max_len(10)]
    pub token_symbol: String,
    /// Maximum tokens
    pub total_supply: u64,
    /// Currently minted
    pub minted_supply: u64,
    /// Count of unique investors (max 2000)
    pub unique_investors: u16,
    /// Unix timestamp
    pub created_at: i64,
    /// Lock-up period end (12 months)
    pub lock_up_end_date: i64,
    /// Can mint tokens?
    pub is_active: bool,
    /// PDA bump seed
    pub bump: u8,
}

impl PropertyToken {
    // 8 (discriminator) + 32*3 (pubkeys) + 4+200 (uri) + 4+64 (name) + 4+10 (symbol) + 8+8 (supply) + 2 (u16) + 8+8 (timestamps) + 1+1 (bools)
    pub const LEN: usize = 8 + 96 + 204 + 68 + 14 + 16 + 2 + 16 + 2;
}

/// KYC/Accreditation whitelist entry
#[account]
#[derive(Default)]
pub struct InvestorWhitelist {
    /// Property this whitelist is for
    pub property: Pubkey,
    /// Investor address
    pub investor: Pubkey,
    /// Hash of KYC verification
    pub kyc_hash: [u8; 32],
    /// Accredited investor status
    pub is_accredited: bool,
    /// Whitelist timestamp
    pub whitelisted_at: i64,
    /// Active whitelist status
    pub is_active: bool,
}

impl InvestorWhitelist {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 1 + 8 + 1; // discriminator + 2 pubkeys + hash + bool + i64 + bool
}



// ================ Custom Errors ================
#[error_code]
pub enum ErrorCode {
    #[msg("Metadata URI must start with 'ipfs://'")]
    InvalidMetadataUri = 6000,
    #[msg("Token symbol must be 10 characters or less")]
    SymbolTooLong = 6001,
    #[msg("Total supply must be greater than 0")]
    InvalidSupply = 6002,
    #[msg("Property token is inactive")]
    PropertyInactive = 6003,
    #[msg("Minting would exceed total supply")]
    ExceedsSupply = 6004,
    #[msg("Investor not whitelisted (KYC required)")]
    NotWhitelisted = 6005,
    #[msg("Investor not accredited (Reg D 506(c) requirement)")]
    NotAccredited = 6006,
    #[msg("Maximum 2,000 investors reached (Reg D limit)")]
    InvestorCapReached = 6007,
    #[msg("Only property authority can perform this action")]
    Unauthorized = 6008,
}













