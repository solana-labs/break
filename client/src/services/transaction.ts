import { Account, PublicKey, Connection, SystemProgram } from "@solana/web3.js";
import { sendAndConfirmRecentTransaction } from "@solana/web3.js";
import Path from "@/api/paths";
import fetcher from "@/api/fetcher";
import { Buffer } from "buffer";

export interface ITransactionService {
  makeTransaction(id: number): Promise<TransactionServiceInfo>;
  initialize(): Promise<void>;
}

export interface TransactionServiceInfo {
  signature: string;
  confirmationTime: number;
  lamportsCount: number;
}

export class TransactionService implements ITransactionService {
  account?: Account;
  programId?: PublicKey;
  connection = new Connection("http://testnet.solana.com:8899/", "recent");

  async initialize(): Promise<void> {
    let response;
    try {
      response = await fetcher.get(Path.Init);
      if (!response.programId || !response.accountKey) {
        throw new Error("Invalid response");
      }
    } catch (err) {
      console.error("Init failed", err);
      return;
    }

    this.programId = new PublicKey(response.programId);
    this.account = new Account(Buffer.from(response.accountKey, "hex"));
    const balance = await this.connection.getBalance(this.account.publicKey);
    console.log("balance - ", balance);
  }

  makeTransaction = async (id: number): Promise<TransactionServiceInfo> => {
    if (!this.account) {
      throw new Error("Account not initialized");
    }

    const keypair = new Account();
    const lamportsCount = id + 1;
    const transaction = SystemProgram.transfer(
      this.account.publicKey,
      keypair.publicKey,
      lamportsCount
    );

    const t1 = performance.now();
    const signature = await sendAndConfirmRecentTransaction(
      this.connection,
      transaction,
      this.account
    );
    const t2 = performance.now();
    const confirmationTime = parseFloat(((t2 - t1) / 1000).toFixed(3));

    return {
      signature,
      confirmationTime,
      lamportsCount
    };
  };
}
