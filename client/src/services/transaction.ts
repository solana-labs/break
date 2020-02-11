import {
  Account,
  AccountInfo,
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

export interface ITransactionService {
  sendTransaction(): SentTransaction;
  connect(
    onConnect: () => void,
    onDisconnect: () => void,
    onTransaction: OnTransaction
  ): void;
  disconnect(): void;
}

type InitResponse = {
  programId: string;
  accountKey: string;
  minAccountBalance: number;
  creationFee: number;
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
  onConnect?: () => void;
  onDisconnect?: () => void;
  onTransaction?: OnTransaction;
  connection?: Connection;
  programId?: PublicKey;
  programSubscriptionId?: number;
  payerAccount?: Account;
  payerSubscriptionId?: number;
  minAccountBalance?: number;
  creationFee?: number;
  blockhash?: Blockhash;
  blockhashTimer?: number;
  pendingTransactions: Map<string, PendingTransaction> = new Map();

  connect = (
    onConnect: () => void,
    onDisconnect: () => void,
    onTransaction: OnTransaction
  ) => {
    this.disconnect();
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.onTransaction = onTransaction;
    this.connectLoop();
  };

  disconnect = () => {
    this.onConnect = undefined;
    this.onTransaction = undefined;
    clearInterval(this.blockhashTimer);

    if (this.connection) {
      if (this.programSubscriptionId) {
        this.connection.removeProgramAccountChangeListener(
          this.programSubscriptionId
        );
        this.programSubscriptionId = undefined;
      }
      if (this.payerSubscriptionId) {
        this.connection.removeAccountChangeListener(this.payerSubscriptionId);
        this.payerSubscriptionId = undefined;
      }
    }

    this.pendingTransactions.forEach(value => {
      if (value.timeoutId) {
        clearTimeout(value.timeoutId);
      }
      if (this.connection && value.subscriptionId) {
        this.connection.removeSignatureListener(value.subscriptionId);
      }
    }, this);
    this.pendingTransactions.clear();
    this.connection = undefined;
  };

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

  private connectLoop = async () => {
    while (this.onConnect) {
      try {
        this.reconnect();
        return;
      } catch (err) {
        console.error("Failed to initialize app", err);
        this.onDisconnect && this.onDisconnect();
        await sleep(1000);
      }
    }
  };

  private updatePayerAccount = (account: Account) => {
    if (!this.connection) return;

    this.payerAccount = account;
    if (this.payerSubscriptionId) {
      this.connection.removeAccountChangeListener(this.payerSubscriptionId);
    }
    this.payerSubscriptionId = this.connection.onAccountChange(
      this.payerAccount.publicKey,
      this.onPayerAccount
    );
  };

  private updateProgramId = (programId: PublicKey) => {
    if (!this.connection) return;
    if (this.programId?.equals(programId)) return;

    this.programId = programId;
    if (this.programSubscriptionId) {
      this.connection.removeProgramAccountChangeListener(
        this.programSubscriptionId
      );
    }
    this.programSubscriptionId = this.connection.onProgramAccountChange(
      this.programId,
      (keyedAccountInfo: KeyedAccountInfo) => {
        this.onAccount(keyedAccountInfo.accountId.toString());
      }
    );
  };

  private reconnect = async () => {
    const {
      programId,
      accountKey,
      minAccountBalance,
      creationFee,
      rpcUrl,
      rpcUrlTls
    } = await this.fetchInit();

    if (!this.onConnect) return;

    this.minAccountBalance = minAccountBalance;
    this.creationFee = creationFee;

    if (!this.connection) {
      if (location.protocol !== "https:") {
        this.connection = new Connection(rpcUrl, "recent");
      } else {
        this.connection = new Connection(rpcUrlTls, "recent");
      }
    }

    this.refreshBlockhash();
    clearInterval(this.blockhashTimer);
    this.blockhashTimer = window.setInterval(
      this.refreshBlockhash,
      BLOCKHASH_INTERVAL_MS
    );

    const newPayer = new Account(Buffer.from(accountKey, "hex"));
    this.updatePayerAccount(newPayer);

    const newProgramId = new PublicKey(programId);
    this.updateProgramId(newProgramId);

    this.onConnect();
  };

  private refreshBlockhash = async () => {
    if (!this.connection) return;
    try {
      this.blockhash = (await this.connection.getRecentBlockhash()).blockhash;
    } catch (err) {
      console.error("Failed to refresh blockhash", err);
    }
  };

  private fetchInit = async (): Promise<InitResponse> => {
    let response;
    let invalidResponse = true;
    while (invalidResponse) {
      response = await fetcher.get(Path.Init);
      invalidResponse =
        !("programId" in response) ||
        !("accountKey" in response) ||
        !("minAccountBalance" in response) ||
        !("creationFee" in response) ||
        !("rpcUrl" in response) ||
        !("rpcUrlTls" in response);
      if (invalidResponse) {
        throw new Error("Failed server init request");
      }
    }
    return response;
  };

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

  private onPayerAccount = async (accountInfo: AccountInfo) => {
    if (this.minAccountBalance && this.creationFee) {
      const totalCreationCost = this.minAccountBalance + this.creationFee;
      if (accountInfo.lamports < 10 * totalCreationCost) {
        const subscriptionId = this.payerSubscriptionId;
        if (subscriptionId) {
          this.payerSubscriptionId = undefined;
          if (this.connection) {
            await this.connection.removeAccountChangeListener(subscriptionId);
          }
          this.connectLoop();
        }
      }
    }
  };

  private onAccount = (accountId: string) => {
    // Info defaults
    let userSent = false;
    let signature = "";
    let confirmationTime = 0;

    // Check if the user sent the transaction that created this account
    const pendingTransaction = this.pendingTransactions.get(accountId);
    if (pendingTransaction) {
      userSent = true;
      confirmationTime = this.confirmationTime(pendingTransaction.sentAt);
      signature = pendingTransaction.signature;
      this.pendingTransactions.delete(accountId);
      clearTimeout(pendingTransaction.timeoutId);
      if (this.connection && pendingTransaction.subscriptionId) {
        this.connection.removeSignatureListener(
          pendingTransaction.subscriptionId
        );
      }
    }

    if (this.onTransaction) {
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
