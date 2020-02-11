import {
  Account,
  PublicKey,
  Connection,
  SystemProgram,
  TransactionSignature,
  KeyedAccountInfo,
  SignatureStatusResult,
  Blockhash
} from "@solana/web3.js";
import Path from "@/api/paths";
import fetcher from "@/api/fetcher";
import { Buffer } from "buffer";
import bs58 from "bs58";
import * as ITransaction from "@/reducers/transactions/model";

export type SentTransaction = {
  accountId: string;
  signature: string;
};

export type OnTransaction = (tx: ITransaction.Model) => void;
export type OnConnect = () => void;

export interface ITransactionService {
  sendTransaction(): SentTransaction;
  connect(onConnect: OnConnect, onTransaction: OnTransaction): void;
  disconnect(): void;
}

type InitResponse = {
  programId: string;
  accountKey: string;
  minAccountBalance: number;
  rpcUrl: string;
  rpcUrlTls: string;
};

type PendingTransaction = {
  sentAt: number;
  timeoutId?: number;
  subscriptionId?: number;
  signature: TransactionSignature;
};

const ACCOUNT_TIMEOUT_MS = 5000;
const SIGNATURE_TIMEOUT_MS = 15000;
const BLOCKHASH_INTERVAL_MS = 30000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class TransactionService implements ITransactionService {
  onConnect?: OnConnect;
  onTransaction?: OnTransaction;
  connection?: Connection;
  programId?: PublicKey;
  payerAccount?: Account;
  minAccountBalance?: number;
  blockhash?: Blockhash;
  blockhashTimer?: number;

  pendingTransactions: Map<string, PendingTransaction> = new Map();

  connect(onConnect: OnConnect, onTransaction: OnTransaction) {
    this.disconnect();
    this.onConnect = onConnect;
    this.onTransaction = onTransaction;
    this.connectLoop();
  }

  disconnect() {
    this.onConnect = undefined;
    this.onTransaction = undefined;
    clearInterval(this.blockhashTimer);
    this.pendingTransactions.forEach(value => {
      if (value.timeoutId) {
        clearTimeout(value.timeoutId);
      }
      if (this.connection && value.subscriptionId) {
        this.connection.removeSignatureListener(value.subscriptionId);
      }
    }, this);
    this.pendingTransactions.clear();
  }

  sendTransaction = () => {
    if (
      this.connection === undefined ||
      this.payerAccount === undefined ||
      this.programId === undefined ||
      this.minAccountBalance === undefined ||
      this.blockhash === undefined
    ) {
      throw new Error("Not initialized");
    }

    const newAccount = new Account();
    const transaction = SystemProgram.createAccount(
      this.payerAccount.publicKey,
      newAccount.publicKey,
      this.minAccountBalance,
      0,
      this.programId
    );

    const sentAt = performance.now();
    const payerAccount = this.payerAccount;
    const accountId = newAccount.publicKey.toBase58();
    const connection = this.connection;
    const pendingTransactions = this.pendingTransactions;
    const onSignature = this.onSignature.bind(this);
    const onTimeout = this.onTimeout.bind(this);
    transaction.recentBlockhash = this.blockhash;
    transaction.sign(payerAccount, newAccount);
    const signatureBuffer = transaction.signature;
    if (!signatureBuffer) throw new Error("Failed to sign transaction");
    const signature = bs58.encode(signatureBuffer);

    (async () => {
      const wireTransaction = transaction.serialize();
      const pendingTransaction: PendingTransaction = { sentAt, signature };
      pendingTransaction.timeoutId = window.setTimeout(() => {
        pendingTransaction.timeoutId = window.setTimeout(
          () => onTimeout(signature),
          SIGNATURE_TIMEOUT_MS - ACCOUNT_TIMEOUT_MS
        );
        pendingTransaction.subscriptionId = connection.onSignature(
          signature,
          result => onSignature(signature, result)
        );
      }, ACCOUNT_TIMEOUT_MS);
      pendingTransactions.set(accountId, pendingTransaction);
      await connection.sendRawTransaction(wireTransaction);
    })();

    return { accountId, signature };
  };

  private async connectLoop() {
    while (this.onConnect) {
      try {
        this._connect();
        return;
      } catch (err) {
        console.log("Failed to initialize app", err);
        await sleep(1000);
      }
    }
  }

  private async _connect() {
    const {
      programId,
      accountKey,
      minAccountBalance,
      rpcUrl,
      rpcUrlTls
    } = await this.fetchInit();

    if (location.protocol !== "https:") {
      this.connection = new Connection(rpcUrl, "recent");
    } else {
      this.connection = new Connection(rpcUrlTls, "recent");
    }

    this.refreshBlockhash();
    this.blockhashTimer = window.setInterval(
      this.refreshBlockhash,
      BLOCKHASH_INTERVAL_MS
    );
    this.programId = new PublicKey(programId);
    this.payerAccount = new Account(Buffer.from(accountKey, "hex"));
    this.minAccountBalance = minAccountBalance;
    this.connection.onProgramAccountChange(
      this.programId,
      (keyedAccountInfo: KeyedAccountInfo) => {
        this.onAccount(keyedAccountInfo.accountId.toString());
      }
    );

    if (this.onConnect) {
      this.onConnect();
    }
  }

  private async refreshBlockhash() {
    if (!this.connection) return;
    try {
      this.blockhash = (await this.connection.getRecentBlockhash()).blockhash;
    } catch (err) {
      console.error("Failed to refresh blockhash", err);
    }
  }

  private async fetchInit(): Promise<InitResponse> {
    let response;
    let invalidResponse = true;
    while (invalidResponse) {
      response = await fetcher.get(Path.Init);
      invalidResponse =
        !("programId" in response) ||
        !("accountKey" in response) ||
        !("minAccountBalance" in response) ||
        !("rpcUrl" in response) ||
        !("rpcUrlTls" in response);
      if (invalidResponse) {
        throw new Error("Failed server init request");
      }
    }
    return response;
  }

  private onTimeout = (signature: string) => {
    this.pendingTransactions.forEach(
      (pendingTransaction: PendingTransaction, accountId: string) => {
        if (pendingTransaction.signature === signature) {
          this.pendingTransactions.delete(accountId);
          pendingTransaction.timeoutId = undefined;
          if (this.connection && pendingTransaction.subscriptionId) {
            this.connection.removeSignatureListener(
              pendingTransaction.subscriptionId
            );
          }
          if (this.onTransaction) {
            const userSent = true;
            const confirmationTime = Number.MAX_VALUE;
            this.onTransaction({
              status: "timeout",
              info: { accountId, signature, confirmationTime, userSent }
            });
          }
        }
      },
      this
    );
  };

  private onAccount = (accountId: string) => {
    const pendingTransaction = this.pendingTransactions.get(accountId);
    this.pendingTransactions.delete(accountId);
    clearTimeout(pendingTransaction?.timeoutId);
    if (this.onTransaction) {
      const userSent = !!pendingTransaction;
      const confirmationTime = pendingTransaction
        ? this.confirmationTime(pendingTransaction.sentAt)
        : 0;
      const signature = pendingTransaction ? pendingTransaction.signature : "";
      this.onTransaction({
        status: "success",
        info: { accountId, signature, confirmationTime, userSent }
      });
    }
  };

  private confirmationTime = (sentAt: number): number => {
    const now = performance.now();
    return parseFloat(((now - sentAt) / 1000).toFixed(3));
  };

  private onSignature = (
    signature: string,
    statusResult: SignatureStatusResult
  ) => {
    this.pendingTransactions.forEach(
      (pendingTransaction: PendingTransaction, accountId: string) => {
        if (pendingTransaction.signature === signature) {
          this.pendingTransactions.delete(accountId);
          // RPC Service auto unsubscribes signature subscriptions
          pendingTransaction.subscriptionId = undefined;

          const confirmationTime = this.confirmationTime(
            pendingTransaction.sentAt
          );
          const userSent = true;
          let status: ITransaction.Status = "success";
          if ("Err" in statusResult) {
            status = {
              msg: JSON.stringify(statusResult.Err) || "Unknown Error"
            };
          }

          if (this.onTransaction) {
            this.onTransaction({
              status,
              info: { accountId, signature, confirmationTime, userSent }
            });
          }
        }
      },
      this
    );
  };
}
