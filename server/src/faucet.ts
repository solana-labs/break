import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { sleep } from "./utils";

const ENCODED_PAYER_KEY = process.env.ENCODED_PAYER_KEY;
const AIRDROP_AMOUNT = 10 * LAMPORTS_PER_SOL;

export default class Faucet {
  private checkingBalance = false;

  constructor(
    private connection: Connection,
    public feeAccount: Account,
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
      console.log(`Faucet address: ${feeAccount.publicKey.toBase58()}`);
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
    const transfer = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      })
    );

    await sendAndConfirmTransaction(this.connection, transfer, [fromAccount], {
      commitment: "singleGossip",
      preflightCommitment: "singleGossip",
    });

    this.checkBalance();
  }

  async checkBalance(): Promise<void> {
    if (this.checkingBalance) return;
    this.checkingBalance = true;
    try {
      const balance = await this.connection.getBalance(
        this.feeAccount.publicKey,
        "singleGossip"
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
    } finally {
      this.checkingBalance = false;
    }
  }
}
