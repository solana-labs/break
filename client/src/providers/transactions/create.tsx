import * as React from "react";
import {
  Blockhash,
  Transaction,
  TransactionInstruction,
  Account
} from "@solana/web3.js";
import bs58 from "bs58";
import * as Bytes from "utils/bytes";
import { Config } from "../api/config";
import { useBlockhash } from "../blockhash";
import {
  useReservedIds,
  useDispatch,
  Dispatch,
  PendingTransaction,
  ActionType
} from "./index";
import { useConfig } from "../api";
import { useSocket } from "../socket";
import { useSpendFees } from "providers/solana";

const SEND_TIMEOUT_MS = 45000;
const RETRY_INTERVAL_MS = 500;

type Props = { children: React.ReactNode };
export function CreateTxHelper({ children }: Props) {
  const blockhash = useBlockhash();
  const dispatch = useDispatch();
  const config = useConfig().config;
  const socket = useSocket();
  const spendFees = useSpendFees();
  const reservedIds = useReservedIds();

  // Use state to track ids that are being used to create transactions
  const [creating, setCreating] = React.useState<number[]>([]);
  const stillCreating = creating.filter(id => reservedIds.includes(id));
  const toCreate = reservedIds.filter(id => !stillCreating.includes(id));
  if (blockhash && config && socket && toCreate.length > 0) {
    setCreating(stillCreating.concat(toCreate));

    // Create on next tick
    setTimeout(() => {
      toCreate.forEach(id => {
        createTransaction(blockhash, config, id, dispatch, socket, spendFees);
      });
    }, 1);
  } else if (creating.length > stillCreating.length) {
    setCreating(stillCreating);
  }

  return <>{children}</>;
}

function createTransaction(
  blockhash: Blockhash,
  config: Config,
  trackingId: number,
  dispatch: Dispatch,
  socket: WebSocket,
  spendFees: () => void
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
  const pendingTransaction: PendingTransaction = { sentAt, signature };
  pendingTransaction.timeoutId = window.setTimeout(() => {
    dispatch({ type: ActionType.TimeoutTransaction, trackingId });
  }, SEND_TIMEOUT_MS);

  spendFees();
  dispatch({
    type: ActionType.NewTransaction,
    pendingTransaction,
    trackingId
  });

  setTimeout(() => {
    const serialized = transaction.serialize();
    socket.send(serialized);
    pendingTransaction.retryId = window.setInterval(() => {
      socket.send(serialized);
    }, RETRY_INTERVAL_MS);
  }, 1);
}
