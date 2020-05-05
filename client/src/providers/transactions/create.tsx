import {
  Blockhash,
  Transaction,
  TransactionInstruction,
  Account
} from "@solana/web3.js";
import bs58 from "bs58";
import * as Bytes from "utils/bytes";
import { Dispatch, PendingTransaction, ActionType } from "./index";
import { Config } from "../api/config";

const SEND_TIMEOUT_MS = 45000;
const RETRY_INTERVAL_MS = 500;

export function createTransaction(
  blockhash: Blockhash,
  config: Config,
  trackingId: number,
  dispatch: Dispatch,
  socket: WebSocket
) {
  const {
    payerAccount,
    programAccount,
    programId,
    programAccountSpace
  } = config;

  const nonce = new Account().publicKey;
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: programAccount, isWritable: true, isSigner: false },
      { pubkey: nonce, isWritable: false, isSigner: false }
    ],
    programId,
    data: Buffer.from(Bytes.fromId(trackingId, programAccountSpace))
  });

  const transaction = new Transaction();
  transaction.add(instruction);

  const sentAt = performance.now();
  transaction.recentBlockhash = blockhash;
  transaction.sign(payerAccount);
  const signatureBuffer = transaction.signature;
  if (!signatureBuffer) throw new Error("Failed to sign transaction");
  const signature = bs58.encode(signatureBuffer);
  const pendingTransaction: PendingTransaction = { sentAt };
  pendingTransaction.timeoutId = window.setTimeout(() => {
    dispatch({ type: ActionType.TimeoutTransaction, trackingId });
  }, SEND_TIMEOUT_MS);

  dispatch({
    type: ActionType.NewTransaction,
    signature,
    trackingId,
    pendingTransaction
  });

  setTimeout(() => {
    const serialized = transaction.serialize();
    socket.send(serialized);
    pendingTransaction.retryId = window.setInterval(() => {
      socket.send(serialized);
    }, RETRY_INTERVAL_MS);
  }, 1);
}
