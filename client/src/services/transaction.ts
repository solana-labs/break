import {
  Connection,
  TransactionSignature,
  AccountInfo,
  Transaction,
  TransactionInstruction,
  Account
} from "@solana/web3.js";
import bs58 from "bs58";
import * as ITransaction from "@/reducers/transactions/model";
import { WebSocketService } from "./websocket";
import { BlockhashService } from "./blockhash";
import { SolanaService } from "./solana";
import * as Bytes from "../utils/bytes";

export type SentTransaction = {
  signature: string;
};

export type OnTransaction = (tx: ITransaction.Model) => void;

type PendingTransaction = {
  sentAt: number;
  timeoutId?: number;
  signature: TransactionSignature;
};

const ACCOUNT_TIMEOUT_MS = 5000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class TransactionService {
  onConnect?: (clusterParam: string) => void;
  onDisconnect?: () => void;
  onTransaction?: OnTransaction;
  connection?: Connection;

  idCounter = 0;
  idBits: Map<number, boolean> = new Map();
  pendingTransactions: Map<number, PendingTransaction> = new Map();
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
    }, this);
    this.pendingTransactions.clear();
    this.connection = undefined;
  };

  private nextId = () => {
    const maxId = this.solanaService.programAccountSpace * 8;
    if (this.pendingTransactions.size >= maxId) return;
    while (this.pendingTransactions.has(this.idCounter + 1)) {
      this.idCounter = (this.idCounter + 1) % maxId;
    }
    const id = this.idCounter + 1;
    this.idCounter = (this.idCounter + 1) % maxId;
    return id;
  };

  sendTransaction = () => {
    const {
      payerAccount,
      programAccount,
      programId,
      programAccountSpace
    } = this.solanaService;
    const nextId = this.nextId();
    if (!nextId) throw new Error("no ids available");

    const nonce = new Account().publicKey;
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: programAccount, isWritable: true, isSigner: false },
        { pubkey: nonce, isWritable: false, isSigner: false }
      ],
      programId,
      data: Buffer.from(Bytes.fromId(nextId, programAccountSpace))
    });

    const transaction = new Transaction();
    transaction.add(instruction);

    const sentAt = performance.now();
    transaction.recentBlockhash = this.blockhashPoller.current;
    transaction.sign(payerAccount);
    const signatureBuffer = transaction.signature;
    if (!signatureBuffer) throw new Error("Failed to sign transaction");
    const signature = bs58.encode(signatureBuffer);

    const wireTransaction = transaction.serialize();
    const pendingTransaction: PendingTransaction = { sentAt, signature };
    this.idBits.set(nextId, !this.idBits.get(nextId));
    this.pendingTransactions.set(nextId, pendingTransaction);
    this.webSocket.send(wireTransaction);
    // enable if TPU is not accessible (i.e. local docker setup)
    // this.connection?.sendRawTransaction(wireTransaction);

    pendingTransaction.timeoutId = window.setTimeout(() => {
      this.onTimeout(nextId, signature);
    }, ACCOUNT_TIMEOUT_MS);

    return { signature };
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

  private onTimeout = (id: number, signature: string) => {
    const pendingTransaction = this.pendingTransactions.get(id);
    if (!pendingTransaction) return;
    this.pendingTransactions.delete(id);
    if (this.onTransaction) {
      const userSent = true;
      const confirmationTime = Number.MAX_VALUE;
      this.onTransaction({
        status: "timeout",
        info: { signature, confirmationTime, userSent }
      });
    }
  };

  private onProgramAccountChange = (accountInfo: AccountInfo) => {
    const ids = new Set(Bytes.toIds(accountInfo.data));
    this.pendingTransactions.forEach((pendingTransaction, id) => {
      const expectedBit = this.idBits.get(id);
      if ((expectedBit && ids.has(id)) || (!expectedBit && !ids.has(id))) {
        const confirmationTime = this.confirmationTime(
          pendingTransaction.sentAt
        );
        const signature = pendingTransaction.signature;
        this.pendingTransactions.delete(id);
        clearTimeout(pendingTransaction.timeoutId);

        if (this.onTransaction) {
          this.onTransaction({
            status: "success",
            info: { signature, confirmationTime, userSent: true }
          });
        }
      }
    });
  };

  private confirmationTime = (sentAt: number): number => {
    const now = performance.now();
    return parseFloat(((now - sentAt) / 1000).toFixed(3));
  };
}
