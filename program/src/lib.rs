use solana_program::{
    account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, pubkey::Pubkey,
};

entrypoint!(process_instruction);
fn process_instruction<'a>(
    _program_id: &Pubkey,
    accounts: &'a [AccountInfo<'a>],
    instruction_data: &[u8],
) -> ProgramResult {
    // Assume a writable account is at index 0
    let mut account_data = accounts[0].try_borrow_mut_data()?;

    // xor with the account data using byte and bit from ix data
    let index = u16::from_be_bytes([instruction_data[0], instruction_data[1]]);
    let byte = index >> 3;
    let bit = (index & 0x7) as u8;
    account_data[byte as usize] ^= 1 << (7 - bit);

    Ok(())
}

// Sanity tests
#[cfg(test)]
mod test {
    use super::*;
    use solana_program::clock::Epoch;

    #[test]
    fn test_xor() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0; 4];
        let owner = Pubkey::default();
        let account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut data,
            &owner,
            false,
            Epoch::default(),
        );

        let accounts = vec![account];

        process_instruction(&program_id, &accounts, &[1, 1, 1, 1]).unwrap();
        assert_eq!(*accounts[0].data.borrow(), &[1, 1, 1, 1]);

        process_instruction(&program_id, &accounts, &[1, 1, 1, 1]).unwrap();
        assert_eq!(*accounts[0].data.borrow(), &[0, 0, 0, 0]);
    }

    #[test]
    #[should_panic]
    fn test_bad_instruction_data() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0; 2];
        let owner = Pubkey::default();
        let account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut data,
            &owner,
            false,
            Epoch::default(),
        );

        let accounts = vec![account];
        process_instruction(&program_id, &accounts, &[0, 1, 2]).unwrap();
    }

    #[test]
    #[should_panic]
    fn test_bad_account() {
        let program_id = Pubkey::default();
        let accounts = vec![];
        process_instruction(&program_id, &accounts, &[0, 1, 2, 4]).unwrap();
    }
    #[test]
    #[should_panic]
    fn test_bad_account_data() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0; 3];
        let owner = Pubkey::default();
        let account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut data,
            &owner,
            false,
            Epoch::default(),
        );

        let accounts = vec![account];
        process_instruction(&program_id, &accounts, &[0, 1, 2, 4]).unwrap();
    }
}
