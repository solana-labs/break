// eslint-disable-next-line import/no-webpack-loader-syntax
import CreateTransactionWorker from "worker-loader!./create-transaction-worker-script";

import { Blockhash, Keypair } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";

export interface CreateTransactionMessage {
  wallet: Keypair,
  trackingId: number;
  blockhash: Blockhash;
  programId: string;
  bitId: number;
  feeAccountSecretKey: Uint8Array;
  programDataAccount: string;
  computeUnitPrice?: number;
  extraWriteAccount?: string;
  program?: Program,
  threadProgram?: Program
  threadName?: string
}

export interface CreateTransactionResponseMessage {
  trackingId: number;
  signature: Buffer;
  serializedTransaction: Buffer;
}

export interface CreateTransactionErrorMessage {
  trackingId: string;
  error: Error;
}

export class CreateTransactionRPC {
  private worker: CreateTransactionWorker;

  private callbacks: { [trackingId: string]: Function[] } = {};

  constructor() {
    this.worker = new CreateTransactionWorker();
    this.worker.onmessage = this.handleMessages.bind(this);
  }

  handleMessages(event: MessageEvent) {
    let message = event.data;

    if (message.trackingId in this.callbacks) {
      let callbacks = this.callbacks[message.trackingId];
      delete this.callbacks[message.trackingId];

      if ("error" in message) {
        callbacks[1](message.error);
        return;
      }

      callbacks[0](message);
    }
  }

  createTransaction(
    message: CreateTransactionMessage
  ): Promise<CreateTransactionResponseMessage> {
    return new Promise((resolve, reject) => {
      this.callbacks[message.trackingId] = [resolve, reject];
      this.worker.postMessage(message);
    });
  }
}
