import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { sleep } from "./utils";

const ENCODED_PAYER_KEY = process.env.ENCODED_PAYER_KEY;
const AIRDROP_AMOUNT = 100 * LAMPORTS_PER_SOL;

export default class Faucet {
  public free = process.env.FREE_TO_PLAY === "true";
  private checkBalanceCounter = 0;

  constructor(
    private connection: Connection,
    private feeAccount: Account,
    public airdropEnabled: boolean
  ) {}

  address(): PublicKey {
    return this.feeAccount.publicKey;
  }

  static async init(connection: Connection): Promise<Faucet> {
    let feeAccount = new Account(),
      airdropEnabled = true;
    if (ENCODED_PAYER_KEY) {
      feeAccount = new Account(Buffer.from(ENCODED_PAYER_KEY, "base64"));
      airdropEnabled = false;
    } else {
      console.log("Airdrops enabled");
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          await connection.requestAirdrop(feeAccount.publicKey, AIRDROP_AMOUNT);
          break;
        } catch (err) {
          console.error("Failed to airdrop to faucet", err);
          await sleep(1000);
        }
      }
    }

    const faucet = new Faucet(connection, feeAccount, airdropEnabled);
    faucet.checkBalance();
    return faucet;
  }

  async collectPayment(paymentKey: string, lamports: number): Promise<void> {
    const fromAccount = new Account(Buffer.from(paymentKey, "base64"));
    const fromPubkey = fromAccount.publicKey;
    const toPubkey = this.address();
    const transfer = SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports,
    });

    // Intentionally lax to speed up loading time
    await sendAndConfirmTransaction(this.connection, transfer, [fromAccount], {
      confirmations: 0,
      skipPreflight: true,
    });
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

  async fundAccount(publicKey: PublicKey, fundAmount: number): Promise<void> {
    await sendAndConfirmTransaction(
      this.connection,
      SystemProgram.transfer({
        fromPubkey: this.feeAccount.publicKey,
        toPubkey: publicKey,
        lamports: fundAmount,
      }),
      [this.feeAccount],
      { confirmations: 1, skipPreflight: true }
    );
    this.checkBalance();
  }

  async createProgramDataAccount(
    fundAmount: number,
    programId: PublicKey,
    space: number
  ): Promise<Account> {
    const programDataAccount = new Account();
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
    return programDataAccount;
  }
}
