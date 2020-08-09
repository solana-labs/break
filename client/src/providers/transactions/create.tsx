import {
  Blockhash,
  PublicKey
} from "@solana/web3.js";
import bs58 from "bs58";
import {
  Dispatch,
  PendingTransaction,
  ActionType,
  TransactionDetails,
} from "./index";
import { AccountsConfig } from "../api/config";
import { CreateTransactionRPC, CreateTransactionResponseMessage } from "../../workers/create-transaction-rpc";

const SEND_TIMEOUT_MS = 45000;
const RETRY_INTERVAL_MS = 500;

const workerRPC = new CreateTransactionRPC();

export function createTransaction(
  blockhash: Blockhash,
  programId: PublicKey,
  accounts: AccountsConfig,
  trackingId: number,
  dispatch: Dispatch,
  socket: WebSocket
) {
  const { feeAccounts, programAccounts } = accounts;

  const bitId = Math.floor(trackingId / feeAccounts.length);
  const accountIndex = trackingId % feeAccounts.length;
  const programDataAccount = programAccounts[accountIndex];
  const feeAccount = feeAccounts[accountIndex];

  workerRPC.createTransaction({
    trackingId: trackingId,
    blockhash: blockhash,
    programId: programId.toBase58(),
    programDataAccount: programDataAccount.toBase58(),
    bitId: bitId,
    feeAccountSecretKey: feeAccount.secretKey
  })
  .then((response: CreateTransactionResponseMessage) => {
    const {
      signature,
      serializedTransaction
    } = response;

    const sentAt = performance.now();

    const pendingTransaction: PendingTransaction = { sentAt };
    pendingTransaction.timeoutId = window.setTimeout(() => {
      dispatch({ type: ActionType.TimeoutTransaction, trackingId });
    }, SEND_TIMEOUT_MS);

    const details: TransactionDetails = {
      id: bitId,
      feeAccount: feeAccount.publicKey,
      programAccount: programDataAccount,
      signature: bs58.encode(signature),
    };

    dispatch({
      type: ActionType.NewTransaction,
      details,
      trackingId,
      pendingTransaction,
    });

    setTimeout(() => {
      const retryUntil = new URLSearchParams(window.location.search).get(
        "retry_until"
      );
      if (retryUntil === null || retryUntil !== "disabled") {
        pendingTransaction.retryId = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(serializedTransaction);
          }
        }, RETRY_INTERVAL_MS);
      }
    }, 1);
  }, (error: any) => {
    console.error(error);
  });
}
