import { ITransactionsService, TransactionServiceInfo } from "./model";
import { Account, PublicKey, Connection, SystemProgram } from "@solana/web3.js";
import { sendAndConfirmRecentTransaction } from "@solana/web3.js";
import Path from "@/api/paths";
import fetcher from "@/api/fetcher";
import { Buffer } from "buffer";

export default class TransactionsService implements ITransactionsService {
  account?: Account;
  programId?: PublicKey;
  connection = new Connection("http://testnet.solana.com:8899/", "recent");

  async initialize(): Promise<void> {
    const response = await fetcher.get(Path.Init);
    if (!response.programId || !response.accountKey) {
      console.error("Init failed");
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
