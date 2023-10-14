use {
    anchor_lang::{
        prelude::*,
        solana_program::{system_program, instruction::Instruction},
    },
    clockwork_sdk::state::{Thread, ThreadAccount, ThreadResponse},
};

#[derive(Accounts)]
pub struct GetTickArrays<'info> {
    #[account(
        signer,
        address = dca_thread.pubkey(),
    )]
    pub dca_thread: Box<Account<'info, Thread>>,

}

pub fn handler<'a, 'info>(ctx: Context<GetTickArrays<'info>>) -> Result<ThreadResponse> {
    msg!("pay your security researchers well <3 stacc");
    Ok(
      ThreadResponse { 
        kickoff_instruction: None, 
        next_instruction: Some(Instruction {
            program_id: crate::ID,
            accounts: [
                crate::accounts::GetTickArrays { 
                    dca_thread: ctx.accounts.dca_thread.key(),
                }.to_account_metas(Some(true))].concat(),
            data: clockwork_sdk::utils::anchor_sighash("get_tick_arrays").to_vec(),
        }.into())
      }
    )
}   