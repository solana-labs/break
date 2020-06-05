import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

const ENCODED_PAYER_KEY = process.env.ENCODED_PAYER_KEY;
const AIRDROP_AMOUNT = 100 * LAMPORTS_PER_SOL;

export default class Faucet {
  private checkBalanceCounter = 0;

  constructor(
    private connection: Connection,
    private feeAccount: Account,
    public airdropEnabled: boolean
  ) {}

  static async init(connection: Connection): Promise<Faucet> {
    let feeAccount = new Account(),
      airdropEnabled = true;
    if (ENCODED_PAYER_KEY) {
      feeAccount = new Account(Buffer.from(ENCODED_PAYER_KEY, "base64"));
      airdropEnabled = false;
    } else {
      await connection.requestAirdrop(feeAccount.publicKey, AIRDROP_AMOUNT);
    }

    const faucet = new Faucet(connection, feeAccount, airdropEnabled);
    await faucet.checkBalance();
    return faucet;
  }

  async checkBalance(): Promise<void> {
    this.checkBalanceCounter++;
    if (this.checkBalanceCounter % 50 != 1) {
      return;
    }

    try {
      const balance = await this.connection.getBalance(
        this.feeAccount.publicKey
      );
      console.log(`Faucet balance: ${balance}`);
      if (this.airdropEnabled && balance <= LAMPORTS_PER_SOL) {
        await this.connection.requestAirdrop(
          this.feeAccount.publicKey,
          AIRDROP_AMOUNT
        );
      }
    } catch (err) {
      console.error("failed to check faucet balance", err);
    }
  }

  async fundAccount(
    accountPubkey: PublicKey,
    fundAmount: number
  ): Promise<void> {
    await sendAndConfirmTransaction(
      this.connection,
      SystemProgram.transfer({
        fromPubkey: this.feeAccount.publicKey,
        toPubkey: accountPubkey,
        lamports: fundAmount,
      }),
      [this.feeAccount],
      { confirmations: 1, skipPreflight: true }
    );
    this.checkBalance();
  }

  async createProgramDataAccount(
    programDataAccount: Account,
    fundAmount: number,
    programId: PublicKey,
    space: number
  ): Promise<void> {
    await sendAndConfirmTransaction(
      this.connection,
      SystemProgram.createAccount({
        fromPubkey: this.feeAccount.publicKey,
        newAccountPubkey: programDataAccount.publicKey,
        lamports: fundAmount,
        space,
        programId,
      }),
      [this.feeAccount, programDataAccount],
      { confirmations: 1, skipPreflight: true }
    );
    this.checkBalance();
  }
}
