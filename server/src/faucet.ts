import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  sendAndConfirmTransaction,
  FeeCalculator
} from "@solana/web3.js";
import bs58 from "bs58";

const ENCODED_PAYER_KEY = process.env.ENCODED_PAYER_KEY;

export default class Faucet {
  private payerAccount?: Account;
  private checkBalanceCounter = 0;

  constructor(
    private connection: Connection,
    private feeCalculator: FeeCalculator
  ) {
    if (ENCODED_PAYER_KEY) {
      console.log("Airdrops disabled");
      this.payerAccount = new Account(bs58.decode(ENCODED_PAYER_KEY));
      this.checkBalance();
    }
  }

  async checkBalance(): Promise<void> {
    this.checkBalanceCounter++;
    if (this.checkBalanceCounter % 10 != 1) {
      return;
    }

    if (this.payerAccount) {
      try {
        const balance = await this.connection.getBalance(
          this.payerAccount.publicKey
        );
        console.log(`Faucet balance: ${balance}`);
      } catch (err) {
        console.error("failed to check faucet balance", err);
      }
    }
  }

  async fundAccount(
    accountPubkey: PublicKey,
    fundAmount: number
  ): Promise<void> {
    if (this.payerAccount) {
      const creationFee = this.feeCalculator.lamportsPerSignature;
      await sendAndConfirmTransaction(
        this.connection,
        SystemProgram.transfer({
          fromPubkey: this.payerAccount.publicKey,
          toPubkey: accountPubkey,
          lamports: fundAmount + creationFee
        }),
        this.payerAccount
      );
      this.checkBalance();
    } else {
      await this.connection.requestAirdrop(accountPubkey, fundAmount);
    }
  }
}
