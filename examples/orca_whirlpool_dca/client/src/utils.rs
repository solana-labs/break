use {
    anchor_lang::prelude::*,
    clockwork_client::{Client, ClientResult},
    solana_sdk::{
        instruction::Instruction,
        signature::{read_keypair_file, Keypair},
        transaction::Transaction,
    },
};

pub fn sign_send_and_confirm_tx(
    client: &Client,
    ix: Vec<Instruction>,
    signers: Option<Vec<&Keypair>>,
    label: String,
) -> ClientResult<()> {
    let mut tx;

    match signers {
        Some(signer_keypairs) => {
            tx = Transaction::new_signed_with_payer(
                &ix,
                Some(&client.payer_pubkey()),
                &signer_keypairs,
                client.get_latest_blockhash().unwrap(),
            );
        }
        None => {
            tx = Transaction::new_with_payer(&ix, Some(&client.payer_pubkey()));
        }
    }

    tx.sign(&[client.payer()], client.latest_blockhash().unwrap());

    // Send and confirm initialize tx
    match client.send_and_confirm_transaction(&tx) {
        Ok(sig) => println!("{} tx: ✅ https://explorer.solana.com/tx/{}", label, sig),
        Err(err) => println!("{} tx: ❌ {:#?}", label, err),
    }
    Ok(())
}

pub fn default_client() -> Client {
    #[cfg(not(feature = "localnet"))]
    let host = "https://api.mainnet-beta.solana.com";
    #[cfg(feature = "localnet")]
    let host = "https://rpc.helius.xyz/?api-key=174bd3e2-d17b-492f-902b-710feb5d18bc";

    let config_file = solana_cli_config::CONFIG_FILE.as_ref().unwrap().as_str();
    let config = solana_cli_config::Config::load(config_file).unwrap();
    let payer = read_keypair_file(&config.keypair_path).unwrap();
    Client::new(payer, host.into())
}

pub fn print_explorer_link(address: Pubkey, label: String) -> ClientResult<()> {
    println!(
        "{}: https://explorer.solana.com/address/{}",
        label.to_string(),
        address,
    );

    Ok(())
}

#[derive(Debug)]
pub struct WhirlpoolParams {
    pub whirlpool: Pubkey,
    pub token_mint_a: Pubkey,
    pub token_mint_b: Pubkey,
    pub oracle: Pubkey,
}
