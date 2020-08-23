import * as React from "react";
import {
  Blockhash,
  Transaction,
  TransactionInstruction,
  PublicKey,
} from "@solana/web3.js";
import bs58 from "bs58";
import * as Bytes from "utils/bytes";
import {
  Dispatch,
  PendingTransaction,
  TransactionDetails,
  useTargetSlotRef,
  useDispatch,
} from "./index";
import { AccountsConfig } from "../api/config";
import { useConfig, useAccounts } from "providers/api";
import { useBlockhash } from "providers/blockhash";
import { useSocket } from "providers/socket";
import { reportError } from "utils";

const SEND_TIMEOUT_MS = 45000;
const RETRY_INTERVAL_MS = 500;

export const CreateTxContext = React.createContext<
  React.MutableRefObject<() => void | undefined> | undefined
>(undefined);

type ProviderProps = { children: React.ReactNode };
export function CreateTxProvider({ children }: ProviderProps) {
  const createTx = React.useRef(() => {});
  const config = useConfig();
  const accounts = useAccounts();
  const idCounter = React.useRef<number>(0);
  const targetSlotRef = useTargetSlotRef();
  const programDataAccount = accounts?.programAccounts[0].toBase58();

  // Reset counter when program data accounts are refreshed
  React.useEffect(() => {
    idCounter.current = 0;
  }, [programDataAccount]);

  const blockhash = useBlockhash();
  const dispatch = useDispatch();
  const socket = useSocket();
  React.useEffect(() => {
    createTx.current = () => {
      if (
        !blockhash ||
        !socket ||
        !config ||
        !accounts ||
        !targetSlotRef.current
      )
        return;
      const id = idCounter.current;
      if (id < accounts.accountCapacity * accounts.programAccounts.length) {
        idCounter.current++;
        createTransaction(
          blockhash,
          targetSlotRef.current,
          config.programId,
          accounts,
          id,
          dispatch,
          socket
        );
      } else {
        reportError(
          new Error("Account capacity exceeded"),
          "failed to create transaction"
        );
      }
    };
  }, [blockhash, socket, config, accounts, dispatch, targetSlotRef]);

  return (
    <CreateTxContext.Provider value={createTx}>
      {children}
    </CreateTxContext.Provider>
  );
}

export function createTransaction(
  blockhash: Blockhash,
  targetSlot: number,
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
  const instruction = new TransactionInstruction({
    keys: [{ pubkey: programDataAccount, isWritable: true, isSigner: false }],
    programId,
    data: Buffer.from(Bytes.instructionDataFromId(bitId)),
  });

  const transaction = new Transaction();
  transaction.add(instruction);
  transaction.recentBlockhash = blockhash;
  transaction.sign(feeAccount);
  const serializedTx = transaction.serialize();
  socket.send(serializedTx);
  const sentAt = performance.now();

  const pendingTransaction: PendingTransaction = { sentAt, targetSlot };
  pendingTransaction.timeoutId = window.setTimeout(() => {
    dispatch({ type: "timeout", trackingId });
  }, SEND_TIMEOUT_MS);

  const signatureBuffer = transaction.signature;
  if (!signatureBuffer) throw new Error("Failed to sign transaction");
  const signature = bs58.encode(signatureBuffer);
  const details: TransactionDetails = {
    id: bitId,
    feeAccount: feeAccount.publicKey,
    programAccount: programDataAccount,
    signature,
  };

  const retryUntil = new URLSearchParams(window.location.search).get(
    "retry_until"
  );
  if (retryUntil === null || retryUntil !== "disabled") {
    pendingTransaction.retryId = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(serializedTx);
      }
    }, RETRY_INTERVAL_MS);
  }

  dispatch({
    type: "new",
    details,
    trackingId,
    pendingTransaction,
  });
}
