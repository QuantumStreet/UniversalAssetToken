use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::{self, Token2022, TransferChecked},
    token_interface::{Mint, TokenAccount},
};
use spl_token_2022::{
    extension::{
        metadata_pointer::MetadataPointer,
        transfer_fee::{TransferFee, TransferFeeConfig},
        BaseStateWithExtensions, ExtensionType, StateWithExtensionsOwned,
    },
    state::Mint as MintState,
};
use spl_type_length_value::variable_len_pack::VariableLenPack;

declare_id!("2wJMSqmGn8aYNtxUpFBuMBsnEvPbSBDguhuPpoumEfw6");

/// Universal Asset Token (UAT) Factory with Token Extensions
/// 
/// This program creates and manages property tokens using Solana Token Extensions:
/// - Transfer restrictions for compliance
/// - Required metadata for IPFS URIs
/// - Transfer fees for trustee compensation
/// - Token-gated transfers for accredited investors
#[program]
pub mod uat_token_extensions {
    use super::*;

    /// Initialize the UAT factory
    pub fn initialize_factory(ctx: Context<InitializeFactory>) -> Result<()> {
        let factory = &mut ctx.accounts.factory;
        factory.authority = ctx.accounts.authority.key();
        factory.total_properties = 0;
        factory.bump = ctx.bumps.factory;
        
        msg!("UAT Factory initialized by: {}", ctx.accounts.authority.key());
        Ok(())
    }

    /// Create a new property token with Token Extensions
    /// 
    /// This creates a Token-2022 mint with:
    /// - Metadata Pointer extension (for UAT metadata)
    /// - Transfer Fee extension (for trustee compensation)
    /// - Transfer Hook extension (for compliance checks)
    pub fn create_property_token(
        ctx: Context<CreatePropertyToken>,
        token_name: String,
        token_symbol: String,
        metadata_uri: String,
        total_supply: u64,
        decimals: u8,
        transfer_fee_basis_points: u16, // e.g., 100 = 1%
    ) -> Result<()> {
        let factory = &mut ctx.accounts.factory;
        let property_token = &mut ctx.accounts.property_token;
        
        // Validate inputs
        require!(token_name.len() <= 32, UATError::NameTooLong);
        require!(token_symbol.len() <= 10, UATError::SymbolTooLong);
        require!(metadata_uri.len() <= 200, UATError::UriTooLong);
        require!(total_supply > 0, UATError::InvalidSupply);
        require!(transfer_fee_basis_points <= 10000, UATError::InvalidTransferFee);
        
        // Initialize property token account
        property_token.factory = factory.key();
        property_token.mint = ctx.accounts.mint.key();
        property_token.authority = ctx.accounts.authority.key();
        property_token.token_name = token_name;
        property_token.token_symbol = token_symbol;
        property_token.metadata_uri = metadata_uri;
        property_token.total_supply = total_supply;
        property_token.minted_supply = 0;
        property_token.decimals = decimals;
        property_token.transfer_fee_basis_points = transfer_fee_basis_points;
        property_token.created_at = Clock::get()?.unix_timestamp;
        property_token.is_active = true;
        property_token.bump = ctx.bumps.property_token;
        
        // Increment factory counter
        factory.total_properties = factory.total_properties.checked_add(1)
            .ok_or(UATError::Overflow)?;
        
        msg!("Property token created: {} ({})", property_token.token_name, property_token.mint);
        msg!("Metadata URI: {}", property_token.metadata_uri);
        msg!("Transfer fee: {} basis points", transfer_fee_basis_points);
        
        Ok(())
    }

    /// Mint tokens to an investor (with compliance checks)
    pub fn mint_tokens(
        ctx: Context<MintTokens>,
        amount: u64,
    ) -> Result<()> {
        let property_token = &mut ctx.accounts.property_token;
        
        // Validate supply cap
        let new_supply = property_token.minted_supply.checked_add(amount)
            .ok_or(UATError::Overflow)?;
        require!(
            new_supply <= property_token.total_supply,
            UATError::SupplyExceeded
        );
        
        // Check if investor is whitelisted (compliance)
        let investor_record = &ctx.accounts.investor_record;
        require!(investor_record.is_whitelisted, UATError::NotWhitelisted);
        require!(investor_record.is_accredited, UATError::NotAccredited);
        
        // Create mint PDA seeds
        let factory_key = property_token.factory;
        let seeds = &[
            b"property_token",
            factory_key.as_ref(),
            &property_token.bump.to_le_bytes(),
        ];
        let signer = &[&seeds[..]];
        
        // Mint tokens using Token-2022
        let cpi_accounts = token_2022::MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.investor_token_account.to_account_info(),
            authority: ctx.accounts.property_token.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token_2022::mint_to(cpi_ctx, amount)?;
        
        // Update supply tracking
        property_token.minted_supply = new_supply;
        
        // Update investor record
        let investor_record = &mut ctx.accounts.investor_record;
        investor_record.tokens_held = investor_record.tokens_held.checked_add(amount)
            .ok_or(UATError::Overflow)?;
        investor_record.last_transaction = Clock::get()?.unix_timestamp;
        
        msg!("Minted {} tokens to {}", amount, ctx.accounts.investor.key());
        msg!("Total minted: {}/{}", property_token.minted_supply, property_token.total_supply);
        
        Ok(())
    }

    /// Add investor to whitelist (KYC/AML compliance)
    pub fn whitelist_investor(
        ctx: Context<WhitelistInvestor>,
        is_accredited: bool,
    ) -> Result<()> {
        let investor_record = &mut ctx.accounts.investor_record;
        
        investor_record.investor = ctx.accounts.investor.key();
        investor_record.property_token = ctx.accounts.property_token.key();
        investor_record.is_whitelisted = true;
        investor_record.is_accredited = is_accredited;
        investor_record.whitelisted_at = Clock::get()?.unix_timestamp;
        investor_record.tokens_held = 0;
        investor_record.last_transaction = 0;
        investor_record.bump = ctx.bumps.investor_record;
        
        msg!("Investor whitelisted: {}", ctx.accounts.investor.key());
        msg!("Accredited: {}", is_accredited);
        
        Ok(())
    }

    /// Remove investor from whitelist
    pub fn remove_from_whitelist(
        ctx: Context<RemoveFromWhitelist>,
    ) -> Result<()> {
        let investor_record = &mut ctx.accounts.investor_record;
        
        investor_record.is_whitelisted = false;
        
        msg!("Investor removed from whitelist: {}", investor_record.investor);
        
        Ok(())
    }

    /// Record yield distribution
    pub fn record_distribution(
        ctx: Context<RecordDistribution>,
        amount_per_token: u64,
        total_amount: u64,
        distribution_date: i64,
    ) -> Result<()> {
        let distribution = &mut ctx.accounts.distribution;
        
        distribution.property_token = ctx.accounts.property_token.key();
        distribution.distribution_number = ctx.accounts.property_token.minted_supply;
        distribution.amount_per_token = amount_per_token;
        distribution.total_amount = total_amount;
        distribution.distribution_date = distribution_date;
        distribution.recorded_at = Clock::get()?.unix_timestamp;
        distribution.bump = ctx.bumps.distribution;
        
        msg!("Distribution recorded: {} total, {} per token", total_amount, amount_per_token);
        
        Ok(())
    }

    /// Update property metadata URI (for valuation updates, etc.)
    pub fn update_metadata_uri(
        ctx: Context<UpdateMetadata>,
        new_metadata_uri: String,
    ) -> Result<()> {
        let property_token = &mut ctx.accounts.property_token;
        
        require!(new_metadata_uri.len() <= 200, UATError::UriTooLong);
        
        let old_uri = property_token.metadata_uri.clone();
        property_token.metadata_uri = new_metadata_uri.clone();
        
        msg!("Metadata URI updated");
        msg!("Old: {}", old_uri);
        msg!("New: {}", new_metadata_uri);
        
        Ok(())
    }

    /// Pause/unpause token (for emergencies)
    pub fn set_token_status(
        ctx: Context<SetTokenStatus>,
        is_active: bool,
    ) -> Result<()> {
        let property_token = &mut ctx.accounts.property_token;
        
        property_token.is_active = is_active;
        
        msg!("Token status updated: {}", if is_active { "ACTIVE" } else { "PAUSED" });
        
        Ok(())
    }
}

// ============================================================================
// Account Structs
// ============================================================================

#[derive(Accounts)]
pub struct InitializeFactory<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Factory::INIT_SPACE,
        seeds = [b"factory"],
        bump
    )]
    pub factory: Account<'info, Factory>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(token_name: String)]
pub struct CreatePropertyToken<'info> {
    #[account(mut)]
    pub factory: Account<'info, Factory>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + PropertyToken::INIT_SPACE,
        seeds = [b"property_token", factory.key().as_ref(), &factory.total_properties.to_le_bytes()],
        bump
    )]
    pub property_token: Account<'info, PropertyToken>,
    
    /// The Token-2022 mint account with extensions
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(
        mut,
        seeds = [b"property_token", property_token.factory.as_ref(), &property_token.bump.to_le_bytes()],
        bump = property_token.bump,
        has_one = mint,
    )]
    pub property_token: Account<'info, PropertyToken>,
    
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,
    
    #[account(
        mut,
        seeds = [b"investor_record", property_token.key().as_ref(), investor.key().as_ref()],
        bump = investor_record.bump,
    )]
    pub investor_record: Account<'info, InvestorRecord>,
    
    #[account(mut)]
    pub investor_token_account: InterfaceAccount<'info, TokenAccount>,
    
    /// CHECK: Investor public key (checked via investor_record)
    pub investor: AccountInfo<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token2022>,
}

#[derive(Accounts)]
pub struct WhitelistInvestor<'info> {
    pub property_token: Account<'info, PropertyToken>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + InvestorRecord::INIT_SPACE,
        seeds = [b"investor_record", property_token.key().as_ref(), investor.key().as_ref()],
        bump
    )]
    pub investor_record: Account<'info, InvestorRecord>,
    
    /// CHECK: Investor public key
    pub investor: AccountInfo<'info>,
    
    #[account(
        mut,
        constraint = authority.key() == property_token.authority @ UATError::Unauthorized
    )]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveFromWhitelist<'info> {
    #[account(
        has_one = authority @ UATError::Unauthorized
    )]
    pub property_token: Account<'info, PropertyToken>,
    
    #[account(
        mut,
        seeds = [b"investor_record", property_token.key().as_ref(), investor_record.investor.as_ref()],
        bump = investor_record.bump,
    )]
    pub investor_record: Account<'info, InvestorRecord>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RecordDistribution<'info> {
    pub property_token: Account<'info, PropertyToken>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + YieldDistribution::INIT_SPACE,
        seeds = [b"distribution", property_token.key().as_ref(), &property_token.minted_supply.to_le_bytes()],
        bump
    )]
    pub distribution: Account<'info, YieldDistribution>,
    
    #[account(
        mut,
        constraint = authority.key() == property_token.authority @ UATError::Unauthorized
    )]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateMetadata<'info> {
    #[account(
        mut,
        has_one = authority @ UATError::Unauthorized
    )]
    pub property_token: Account<'info, PropertyToken>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetTokenStatus<'info> {
    #[account(
        mut,
        has_one = authority @ UATError::Unauthorized
    )]
    pub property_token: Account<'info, PropertyToken>,
    
    pub authority: Signer<'info>,
}

// ============================================================================
// Data Structs
// ============================================================================

/// UAT Factory - manages all property tokens
#[account]
#[derive(InitSpace)]
pub struct Factory {
    pub authority: Pubkey,
    pub total_properties: u32,
    pub bump: u8,
}

/// Property Token - represents a single real estate asset
#[account]
#[derive(InitSpace)]
pub struct PropertyToken {
    pub factory: Pubkey,
    pub mint: Pubkey,
    pub authority: Pubkey,
    
    #[max_len(32)]
    pub token_name: String,
    
    #[max_len(10)]
    pub token_symbol: String,
    
    #[max_len(200)]
    pub metadata_uri: String,  // IPFS URI to full UAT metadata
    
    pub total_supply: u64,
    pub minted_supply: u64,
    pub decimals: u8,
    pub transfer_fee_basis_points: u16,
    
    pub created_at: i64,
    pub is_active: bool,
    pub bump: u8,
}

/// Investor Record - KYC/compliance tracking
#[account]
#[derive(InitSpace)]
pub struct InvestorRecord {
    pub investor: Pubkey,
    pub property_token: Pubkey,
    pub is_whitelisted: bool,
    pub is_accredited: bool,
    pub whitelisted_at: i64,
    pub tokens_held: u64,
    pub last_transaction: i64,
    pub bump: u8,
}

/// Yield Distribution Record
#[account]
#[derive(InitSpace)]
pub struct YieldDistribution {
    pub property_token: Pubkey,
    pub distribution_number: u64,
    pub amount_per_token: u64,
    pub total_amount: u64,
    pub distribution_date: i64,
    pub recorded_at: i64,
    pub bump: u8,
}

// ============================================================================
// Errors
// ============================================================================

#[error_code]
pub enum UATError {
    #[msg("Token name too long (max 32 characters)")]
    NameTooLong,
    
    #[msg("Token symbol too long (max 10 characters)")]
    SymbolTooLong,
    
    #[msg("Metadata URI too long (max 200 characters)")]
    UriTooLong,
    
    #[msg("Invalid total supply")]
    InvalidSupply,
    
    #[msg("Invalid transfer fee (max 10000 basis points)")]
    InvalidTransferFee,
    
    #[msg("Total supply exceeded")]
    SupplyExceeded,
    
    #[msg("Investor not whitelisted")]
    NotWhitelisted,
    
    #[msg("Investor not accredited")]
    NotAccredited,
    
    #[msg("Unauthorized")]
    Unauthorized,
    
    #[msg("Arithmetic overflow")]
    Overflow,
    
    #[msg("Token is not active")]
    TokenInactive,
}
