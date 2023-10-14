pub mod id;

mod instructions;

pub use id::ID;

use anchor_lang::prelude::*;
use instructions::*;

#[program]
pub mod orca_whirlpool_dca {
    use super::*;

    /*
     * get tick arrays for upcoming swap
     */
    pub fn get_tick_arrays<'info>(
        ctx: Context<GetTickArrays<'info>>,
    ) -> Result<clockwork_sdk::state::ThreadResponse> {
        get_tick_arrays::handler(ctx)
    }

}
