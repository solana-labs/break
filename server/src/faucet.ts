import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import bs58 from "bs58";

const ENCODED_PAYER_KEY = process.env.ENCODED_PAYER_KEY;
const AIRDROP_AMOUNT = 100 * LAMPORTS_PER_SOL;

export default class Faucet {
  private checkBalanceCounter = 0;

  constructor(
    private connection: Connection,
    private payerAccount: Account,
    public airdropEnabled: boolean
  ) {}

  static async init(connection: Connection): Promise<Faucet> {
    let payerAccount = new Account(),
      airdropEnabled = true;
    if (ENCODED_PAYER_KEY) {
      payerAccount = new Account(bs58.decode(ENCODED_PAYER_KEY));
      airdropEnabled = false;
    } else {
      await connection.requestAirdrop(payerAccount.publicKey, AIRDROP_AMOUNT);
    }

    const faucet = new Faucet(connection, payerAccount, airdropEnabled);
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
        this.payerAccount.publicKey
      );
      console.log(`Faucet balance: ${balance}`);
      if (this.airdropEnabled && balance <= LAMPORTS_PER_SOL) {
        await this.connection.requestAirdrop(
          this.payerAccount.publicKey,
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
        fromPubkey: this.payerAccount.publicKey,
        toPubkey: accountPubkey,
        lamports: fundAmount
      }),
      this.payerAccount
    );
    this.checkBalance();
  }

  async createProgramAccount(
    programAccount: Account,
    fundAmount: number,
    programId: PublicKey,
    space: number
  ): Promise<void> {
    await sendAndConfirmTransaction(
      this.connection,
      SystemProgram.createAccount({
        fromPubkey: this.payerAccount.publicKey,
        newAccountPubkey: programAccount.publicKey,
        lamports: fundAmount,
        space,
        programId
      }),
      this.payerAccount,
      programAccount
    );
    this.checkBalance();
  }
}
