import * as React from "react";
import { Blockhash, PublicKey, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import {
  Dispatch,
  getCommitmentName,
  PendingTransaction,
  TransactionDetails,
  useDispatch,
} from "./index";
import {
  CreateTransactionRPC,
  CreateTransactionResponseMessage,
} from "../../workers/create-transaction-rpc";
import { useConfig } from "providers/server/http";
import { useBlockhash } from "providers/rpc/blockhash";
import { useSocket } from "providers/server/socket";
import { reportError } from "utils";
import { useConnection } from "providers/rpc";
import { DEBUG_MODE, subscribedCommitments } from "./confirmed";
import { useLatestTimestamp, useTargetSlotRef } from "providers/slot";
import { useAccountsState, AccountsConfig } from "providers/accounts";

const SEND_TIMEOUT_MS = 45000;
const RETRY_INTERVAL_MS = 500;

const workerRPC = new CreateTransactionRPC();
export const CreateTxContext = React.createContext<
  React.MutableRefObject<() => void | undefined> | undefined
>(undefined);

type ProviderProps = { children: React.ReactNode };
export function CreateTxProvider({ children }: ProviderProps) {
  const createTx = React.useRef(() => {});
  const config = useConfig();
  const accounts = useAccountsState().accounts;
  const idCounter = React.useRef<number>(0);
  const targetSlotRef = useTargetSlotRef();
  const programDataAccount = accounts?.programAccounts[0].toBase58();
  const latestTimestamp = useLatestTimestamp();

  // Reset counter when program data accounts are refreshed
  React.useEffect(() => {
    idCounter.current = 0;
  }, [programDataAccount]);

  const connection = useConnection();
  const blockhash = useBlockhash();
  const dispatch = useDispatch();
  const socket = useSocket();
  React.useEffect(() => {
    createTx.current = () => {
      if (
        !connection ||
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
          connection,
          blockhash,
          targetSlotRef.current,
          config.programId,
          accounts,
          id,
          dispatch,
          socket,
          latestTimestamp
        );
      } else {
        reportError(
          new Error("Account capacity exceeded"),
          "failed to create transaction"
        );
      }
    };
  }, [
    blockhash,
    connection,
    socket,
    config,
    accounts,
    dispatch,
    targetSlotRef,
    latestTimestamp,
  ]);

  return (
    <CreateTxContext.Provider value={createTx}>
      {children}
    </CreateTxContext.Provider>
  );
}

export function createTransaction(
  connection: Connection,
  blockhash: Blockhash,
  targetSlot: number,
  programId: PublicKey,
  accounts: AccountsConfig,
  trackingId: number,
  dispatch: Dispatch,
  socket: WebSocket,
  latestTimestamp: React.MutableRefObject<number | undefined>
) {
  const { feeAccounts, programAccounts } = accounts;

  const bitId = Math.floor(trackingId / feeAccounts.length);
  const accountIndex = trackingId % feeAccounts.length;
  const programDataAccount = programAccounts[accountIndex];
  const feeAccount = feeAccounts[accountIndex];

  workerRPC
    .createTransaction({
      trackingId: trackingId,
      blockhash: blockhash,
      programId: programId.toBase58(),
      programDataAccount: programDataAccount.toBase58(),
      bitId: bitId,
      feeAccountSecretKey: feeAccount.secretKey,
    })
    .then(
      (response: CreateTransactionResponseMessage) => {
        const { signature, serializedTransaction } = response;

        socket.send(serializedTransaction);

        const pendingTransaction: PendingTransaction = { targetSlot };
        pendingTransaction.timeoutId = window.setTimeout(() => {
          dispatch({ type: "timeout", trackingId });
        }, SEND_TIMEOUT_MS);

        const encodedSignature = bs58.encode(signature);
        const details: TransactionDetails = {
          id: bitId,
          feeAccount: feeAccount.publicKey,
          programAccount: programDataAccount,
          signature: encodedSignature,
        };

        dispatch({
          type: "new",
          details,
          trackingId,
          pendingTransaction,
        });

        if (DEBUG_MODE) {
          const timestamp = latestTimestamp.current;
          if (timestamp) {
            dispatch({
              type: "subscribed",
              timestamp,
              trackingId,
            });
          }

          connection.onSignatureWithOptions(
            encodedSignature,
            (notification, context) => {
              const timestamp = latestTimestamp.current;
              if (timestamp && notification.type === "received") {
                dispatch({
                  type: "received",
                  timestamp,
                  trackingId,
                  slot: context.slot,
                });
              }
            },
            {
              commitment: "max",
              enableReceivedNotification: true,
            }
          );

          const commitments = subscribedCommitments();
          commitments.forEach((commitment) => {
            connection.onSignatureWithOptions(
              encodedSignature,
              (notification, context) => {
                const timestamp = latestTimestamp.current;
                if (timestamp && notification.type === "status") {
                  const commitmentName = getCommitmentName(commitment);
                  dispatch({
                    type: "track",
                    commitmentName,
                    trackingId,
                    slot: context.slot,
                    timestamp,
                  });
                }
              },
              { commitment }
            );
          });
        }

        const retry = new URLSearchParams(window.location.search).get("retry");
        if (retry === null || retry !== "disabled") {
          pendingTransaction.retryId = window.setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(serializedTransaction);
            }
          }, RETRY_INTERVAL_MS);
        }
      },
      (error: any) => {
        console.error(error);
      }
    );
}
