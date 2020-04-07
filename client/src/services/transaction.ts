import {
  Account,
  Connection,
  SystemProgram,
  TransactionSignature,
  KeyedAccountInfo,
  SignatureResult
} from "@solana/web3.js";
import bs58 from "bs58";
import * as ITransaction from "@/reducers/transactions/model";
import { WebSocketService } from "./websocket";
import { BlockhashService } from "./blockhash";
import { SolanaService } from "./solana";

export type SentTransaction = {
  accountId: string;
  signature: string;
};

export type OnTransaction = (tx: ITransaction.Model) => void;

type PendingTransaction = {
  sentAt: number;
  timeoutId?: number;
  subscriptionId?: number;
  signature: TransactionSignature;
};

const ACCOUNT_TIMEOUT_MS = 5000;
const SIGNATURE_TIMEOUT_MS = 15000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class TransactionService {
  onConnect?: (clusterParam: string) => void;
  onDisconnect?: () => void;
  onTransaction?: OnTransaction;
  connection?: Connection;

  pendingTransactions: Map<string, PendingTransaction> = new Map();
  reconnecting = false;
  webSocket = new WebSocketService();
  blockhashPoller = new BlockhashService();
  solanaService = new SolanaService();

  connect = (
    onConnect: (clusterParam: string) => void,
    onDisconnect: () => void,
    onTransaction: OnTransaction
  ) => {
    this.disconnect();
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.onTransaction = onTransaction;
    this.reconnect();
  };

  disconnected = (): boolean => {
    return this.onConnect === undefined;
  };

  disconnect = () => {
    this.onConnect = undefined;
    this.onTransaction = undefined;
    this.blockhashPoller.stop();
    this.webSocket.close();
    this.solanaService.uninit();

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
    const newAccount = new Account();
    const payerAccount = this.solanaService.payerAccount;
    const transaction = SystemProgram.createAccount({
      fromPubkey: payerAccount.publicKey,
      newAccountPubkey: newAccount.publicKey,
      lamports: this.solanaService.minAccountBalance,
      space: 4, // Each account holds 4 bytes
      programId: this.solanaService.programId
    });

    const sentAt = performance.now();
    const accountId = newAccount.publicKey.toBase58();
    transaction.recentBlockhash = this.blockhashPoller.current;
    transaction.sign(payerAccount, newAccount);
    const signatureBuffer = transaction.signature;
    if (!signatureBuffer) throw new Error("Failed to sign transaction");
    const signature = bs58.encode(signatureBuffer);

    const wireTransaction = transaction.serialize();
    const pendingTransaction: PendingTransaction = { sentAt, signature };
    this.pendingTransactions.set(accountId, pendingTransaction);
    this.webSocket.send(wireTransaction);

    pendingTransaction.timeoutId = window.setTimeout(() => {
      pendingTransaction.timeoutId = window.setTimeout(
        () => this.onTimeout(signature),
        SIGNATURE_TIMEOUT_MS - ACCOUNT_TIMEOUT_MS
      );
      if (this.connection) {
        pendingTransaction.subscriptionId = this.connection.onSignature(
          signature,
          result => this.onSignature(signature, result)
        );
      }
    }, ACCOUNT_TIMEOUT_MS);

    return { accountId, signature };
  };

  public reconnect = () => {
    if (this.reconnecting) return;
    this.reconnecting = true;
    this._reconnectLoop();
  };

  private _reconnectLoop = async () => {
    while (!this.disconnected()) {
      try {
        await this._reconnect();
        this.reconnecting = false;
        return;
      } catch (err) {
        console.error("Failed to initialize app", err);
        this.onDisconnect && this.onDisconnect();
        await sleep(1000);
      }
    }
  };

  private _reconnect = async () => {
    console.debug("Connecting...");
    await this.solanaService.init(this.onProgramAccountChange);
    await this.blockhashPoller.start(this.solanaService.connection);
    await this.webSocket.connect();
    if (this.disconnected()) {
      this.disconnect();
      return;
    }
    this.connection = this.solanaService.connection;
    this.onConnect && this.onConnect(this.solanaService.getClusterParam());
    console.debug("Connected");
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

  private onProgramAccountChange = (accountInfo: KeyedAccountInfo) => {
    const accountId = accountInfo.accountId.toString();

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

  private onSignature = (signature: string, statusResult: SignatureResult) => {
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
          if (statusResult.err) {
            status = {
              msg: JSON.stringify(statusResult.err) || "Unknown Error"
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
