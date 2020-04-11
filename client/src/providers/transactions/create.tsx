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
  useNextId,
  useDispatch,
  Dispatch,
  PendingTransaction,
  ActionType
} from "./index";
import { useConfig } from "../api";
import { useSocket } from "../socket";
import { useSpendFees } from "providers/solana";

const SEND_TIMEOUT_MS = 10000;

type CreateTx = () => void;
export const CreateTxContext = React.createContext<CreateTx | undefined>(
  undefined
);

type ProviderProps = { children: React.ReactNode };
export function CreateTxProvider({ children }: ProviderProps) {
  const blockhash = useBlockhash();
  const dispatch = useDispatch();
  const config = useConfig().config;
  const socket = useSocket();
  const nextTrackingId = useNextId();
  const spendFees = useSpendFees();

  let createTx;
  if (blockhash && config && nextTrackingId && socket) {
    createTx = () =>
      createTransaction(
        blockhash,
        config,
        nextTrackingId,
        dispatch,
        socket,
        spendFees
      );
  }

  return (
    <CreateTxContext.Provider value={createTx}>
      {children}
    </CreateTxContext.Provider>
  );
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
    dispatch({ type: ActionType.SendTimeout, trackingId });
  }, SEND_TIMEOUT_MS);

  spendFees();
  dispatch({
    type: ActionType.NewTransaction,
    pendingTransaction,
    trackingId
  });
  socket.send(transaction.serialize());
}
