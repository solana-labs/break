mod utils;

use {
    anchor_lang::{prelude::*, system_program, InstructionData},
    anchor_spl::{
        associated_token::{self, get_associated_token_address},
        token,
    },
    clockwork_client::{
        thread::{
            state::Thread,
            {
                instruction::{thread_create, thread_delete},
                state::Trigger,
            },
        },
        Client, ClientResult,
    },
    solana_sdk::{instruction::Instruction, system_instruction::transfer},
    std::str::FromStr,
    utils::*,
};

fn main() -> ClientResult<()> {
    let client = default_client();

    let bonk_usdc_whirlpool = WhirlpoolParams {
        whirlpool: Pubkey::from_str("8QaXeHBrShJTdtN1rWCccBxpSVvKksQ2PCu5nufb2zbk").unwrap(),
        token_mint_a: Pubkey::from_str("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263").unwrap(), // BONK
        token_mint_b: Pubkey::from_str("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v").unwrap(), // USDC
        oracle: Pubkey::from_str("4QqfXtmcMfHAQstgVuhDqY1UyHzyiBfwMrz7Jbgt8aQL").unwrap(), // USDC
    };

    #[cfg(not(feature = "delete"))]
    dca_create(&client, &bonk_usdc_whirlpool, "BONK_USDC_WP_DCA".into())?;

    #[cfg(feature = "delete")]
    dca_delete(&client, &bonk_usdc_whirlpool, "BONK_USDC_WP_DCA".into())?;

    Ok(())
}

fn dca_create(
    client: &Client,
    whirlpool_params: &WhirlpoolParams,
    dca_thread_id: String,
) -> ClientResult<()> {
    let dca_pubkey = orca_whirlpool_dca::state::Dca::pubkey(
        client.payer_pubkey(),
        whirlpool_params.token_mint_a,
        whirlpool_params.token_mint_b,
    );

    let dca_thread_pubkey = Thread::pubkey(client.payer_pubkey(), dca_thread_id.clone());

    // USDC vaults
    let authority_a_vault_pubkey =
        get_associated_token_address(&client.payer_pubkey(), &whirlpool_params.token_mint_a);

    let dca_a_vault_pubkey =
        get_associated_token_address(&dca_pubkey, &whirlpool_params.token_mint_a);

    // BONK vaults
    let authority_b_vault_pubkey =
        get_associated_token_address(&client.payer_pubkey(), &whirlpool_params.token_mint_b);

    let dca_b_vault_pubkey =
        get_associated_token_address(&dca_pubkey, &whirlpool_params.token_mint_b);

    let mut whirlpool_data: &[u8] = &client
        .get_account_data(&whirlpool_params.whirlpool)
        .unwrap();
    let whirlpool_state =
        whirlpool::state::Whirlpool::try_deserialize(&mut whirlpool_data).unwrap();

    let dca_create_ix = Instruction {
        program_id: orca_whirlpool_dca::ID,
        accounts: orca_whirlpool_dca::accounts::DcaCreate {
            associated_token_program: associated_token::ID,
            authority: client.payer_pubkey(),
            authority_a_vault: authority_a_vault_pubkey,
            a_mint: whirlpool_params.token_mint_a,
            authority_b_vault: authority_b_vault_pubkey,
            b_mint: whirlpool_params.token_mint_b,
            dca: dca_pubkey,
            dca_a_vault: dca_a_vault_pubkey,
            dca_b_vault: dca_b_vault_pubkey,
            system_program: system_program::ID,
            token_program: token::ID,
            whirlpool: whirlpool_params.whirlpool,
        }
        .to_account_metas(Some(true)),
        data: orca_whirlpool_dca::instruction::DcaCreate {
            amount: 100000, // 10_000_000_000
            other_amount_threshold: 0,
            sqrt_price_limit: whirlpool_state.sqrt_price,
            amount_specified_is_input: false,
            a_to_b: false,
        }
        .data(),
    };

    // create thread to transfer & swap
    let thread_create_swap_ix = thread_create(
        client.payer_pubkey(),
        dca_thread_id,
        Instruction {
            program_id: orca_whirlpool_dca::ID,
            accounts: orca_whirlpool_dca::accounts::GetTickArrays {
                authority_a_vault: authority_a_vault_pubkey,
                authority_b_vault: authority_b_vault_pubkey,
                dca: dca_pubkey,
                dca_a_vault: dca_a_vault_pubkey,
                dca_b_vault: dca_b_vault_pubkey,
                dca_thread: dca_thread_pubkey,
                oracle: whirlpool_params.oracle,
                system_program: system_program::ID,
                token_program: token::ID,
                whirlpool: whirlpool_params.whirlpool,
            }
            .to_account_metas(Some(true)),
            data: orca_whirlpool_dca::instruction::GetTickArrays {}.data(),
        }
        .into(),
        client.payer_pubkey(),
        dca_thread_pubkey,
        Trigger::Cron {
            schedule: "*/15 * * * * *".into(),
            skippable: true,
        },
    );

    let fund_swap_thread_ix = transfer(&client.payer_pubkey(), &dca_thread_pubkey, 100000000);

    {
        print_explorer_link(dca_pubkey, "dca account 📂".into())?;
        print_explorer_link(dca_thread_pubkey, "dca thread 📂".into())?;
        print_explorer_link(dca_a_vault_pubkey, "dca mint A vault 💰".into())?;
        print_explorer_link(authority_a_vault_pubkey, "authority mint A vault 💰".into())?;
        print_explorer_link(dca_b_vault_pubkey, "dca mint B vault 💰".into())?;
        print_explorer_link(authority_b_vault_pubkey, "authority mint B vault 💰".into())?;
        print_explorer_link(
            whirlpool_params.token_mint_a,
            "whirlpool token A mint 🪙 ".into(),
        )?;
        print_explorer_link(
            whirlpool_params.token_mint_b,
            "whirlpool token B mint 🪙 ".into(),
        )?;
    }

    sign_send_and_confirm_tx(
        &client,
        [
            dca_create_ix, // initialize dca acc and approve token account authority
        ]
        .to_vec(),
        None,
        "dca create".to_string(),
    )?;

    sign_send_and_confirm_tx(
        &client,
        [
            thread_create_swap_ix, // on schedule: transfer & swap; transfer & swap; ...
            fund_swap_thread_ix,
        ]
        .to_vec(),
        Some(vec![client.payer()]),
        "swap thread create".to_string(),
    )?;

    Ok(())
}

pub fn dca_delete(
    client: &Client,
    whirlpool_params: &WhirlpoolParams,
    dca_thread_id: String,
) -> ClientResult<()> {
    let dca_pubkey = orca_whirlpool_dca::state::Dca::pubkey(
        client.payer_pubkey(),
        whirlpool_params.token_mint_a,
        whirlpool_params.token_mint_b,
    );

    let dca_thread_pubkey = Thread::pubkey(client.payer_pubkey(), dca_thread_id.clone());

    let dca_thread_delete_ix = thread_delete(
        client.payer_pubkey(),
        client.payer_pubkey(),
        dca_thread_pubkey,
    );

    let dca_delete_ix = Instruction {
        program_id: orca_whirlpool_dca::ID,
        accounts: orca_whirlpool_dca::accounts::DcaDelete {
            authority: client.payer_pubkey(),
            close_to: client.payer_pubkey(),
            dca: dca_pubkey,
        }
        .to_account_metas(Some(true)),
        data: orca_whirlpool_dca::instruction::DcaDelete {}.data(),
    };

    sign_send_and_confirm_tx(
        &client,
        [dca_delete_ix, dca_thread_delete_ix].to_vec(),
        None,
        "dca delete".to_string(),
    )?;

    Ok(())
}
