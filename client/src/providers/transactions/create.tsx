import {
  Blockhash,
  Transaction,
  TransactionInstruction,
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
    feeAccounts,
    programDataAccounts,
    programId,
    programDataAccountSpace,
  } = config;

  const bitId = Math.floor(trackingId / feeAccounts.length);
  const accountIndex = trackingId % feeAccounts.length;
  const programDataAccount = programDataAccounts[accountIndex];
  const feeAccount = feeAccounts[accountIndex];
  const instruction = new TransactionInstruction({
    keys: [{ pubkey: programDataAccount, isWritable: true, isSigner: false }],
    programId,
    data: Buffer.from(Bytes.fromId(bitId, programDataAccountSpace)),
  });

  const transaction = new Transaction();
  transaction.add(instruction);

  const sentAt = performance.now();
  transaction.recentBlockhash = blockhash;
  transaction.sign(feeAccount);
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
    pendingTransaction,
  });

  setTimeout(() => {
    const serialized = transaction.serialize();
    socket.send(serialized);

    const retryUntil = new URLSearchParams(window.location.search).get(
      "retry_until"
    );
    if (retryUntil === null || retryUntil !== "disabled") {
      pendingTransaction.retryId = window.setInterval(() => {
        socket.send(serialized);
      }, RETRY_INTERVAL_MS);
    }
  }, 1);
}
