import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  FeeCalculator,
} from "@solana/web3.js";
import { sleep } from "./utils";

const ENCODED_PAYER_KEY = process.env.ENCODED_PAYER_KEY;
const AIRDROP_AMOUNT = 10 * LAMPORTS_PER_SOL; // TODO should be determined by cluster

export default class Faucet {
  public free = process.env.FREE_TO_PLAY === "true";
  private checkBalanceCounter = 0;

  constructor(
    private connection: Connection,
    private feeCalculator: FeeCalculator,
    public feeAccount: Account,
    public airdropEnabled: boolean
  ) {}

  address(): PublicKey {
    return this.feeAccount.publicKey;
  }

  static async init(
    connection: Connection,
    feeCalculator: FeeCalculator
  ): Promise<Faucet> {
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

    const faucet = new Faucet(
      connection,
      feeCalculator,
      feeAccount,
      airdropEnabled
    );
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

    const latestBalance = await this.connection.getBalance(
      fromAccount.publicKey,
      "single"
    );

    if (this.feeCalculator.lamportsPerSignature + lamports > latestBalance) {
      throw new Error("Insufficient funds");
    }

    // Intentionally lax to speed up loading time
    await sendAndConfirmTransaction(this.connection, transfer, [fromAccount], {
      commitment: "recent",
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
}
