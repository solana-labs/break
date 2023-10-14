use anchor_lang::prelude::Pubkey;

pub const MAX_TICK_INDEX: i32 = 443636;
pub const MIN_TICK_INDEX: i32 = -443636;
pub const TICK_ARRAY_SIZE: i32 = 88;

pub fn get_tick_array_pubkeys(
    tick_current_index: i32,
    tick_spacing: u16,
    a_to_b: bool,
    program_id: &Pubkey,
    whirlpool_pubkey: &Pubkey,
) -> [Pubkey; 3] {
    let mut offset = 0;
    let mut pubkeys: [Pubkey; 3] = Default::default();

    for i in 0..pubkeys.len() {
        let start_tick_index = get_start_tick_index(tick_current_index, tick_spacing, offset);
        let tick_array_pubkey =
            get_tick_array_pubkey(program_id, whirlpool_pubkey, start_tick_index);
        pubkeys[i] = tick_array_pubkey;
        offset = if a_to_b { offset - 1 } else { offset + 1 };
    }

    pubkeys
}

fn get_start_tick_index(tick_current_index: i32, tick_spacing: u16, offset: i32) -> i32 {
    let ticks_in_array = TICK_ARRAY_SIZE * tick_spacing as i32;
    let real_index = div_floor(tick_current_index, ticks_in_array);
    let start_tick_index = (real_index + offset) * ticks_in_array;

    assert!(MIN_TICK_INDEX <= start_tick_index);
    assert!(start_tick_index + ticks_in_array <= MAX_TICK_INDEX);
    start_tick_index
}

fn get_tick_array_pubkey(
    program_id: &Pubkey,
    whirlpool_pubkey: &Pubkey,
    start_tick_index: i32,
) -> Pubkey {
    Pubkey::find_program_address(
        &[
            b"tick_array",
            whirlpool_pubkey.as_ref(),
            start_tick_index.to_string().as_bytes(),
        ],
        program_id,
    )
    .0
}

fn div_floor(a: i32, b: i32) -> i32 {
    if a < 0 && a % b != 0 {
        a / b - 1
    } else {
        a / b
    }
}
