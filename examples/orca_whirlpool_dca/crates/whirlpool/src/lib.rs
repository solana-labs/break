pub mod utils;

use anchor_lang::solana_program::entrypoint::ProgramResult;

anchor_gen::generate_cpi_interface!(
    idl_path = "idl.json",
    zero_copy(TickArray, Tick),
    packed(TickArray, Tick)
);

impl Default for state::TickArray {
    fn default() -> Self {
        Self {
            start_tick_index: Default::default(),
            ticks: [Default::default(); 88],
            whirlpool: Default::default(),
        }
    }
}

anchor_lang::prelude::declare_id!("whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc");
