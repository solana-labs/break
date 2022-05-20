import * as React from "react";
import { Blockhash, PublicKey, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import {
  Dispatch,
  PendingTransaction,
  TrackedCommitment,
  TransactionDetails,
  useDispatch,
} from "./index";
import {
  CreateTransactionRPC,
  CreateTransactionResponseMessage,
} from "../../workers/create-transaction-rpc";
import { useServerConfig } from "providers/server/http";
import { useBlockhash } from "providers/rpc/blockhash";
import { useSocket } from "providers/server/socket";
import { reportError } from "utils";
import { useConnection } from "providers/rpc";
import { subscribedCommitments } from "./confirmed";
import { useLatestTimestamp, useTargetSlotRef } from "providers/slot";
import { useAccountsState, AccountsConfig } from "providers/accounts";
import { useClientConfig } from "providers/config";

const SEND_TIMEOUT_MS = 90000;
const RETRY_INTERVAL_MS = 500;

const workerRPC = new CreateTransactionRPC();
export const CreateTxContext = React.createContext<
  React.MutableRefObject<() => void | undefined> | undefined
>(undefined);

type ProviderProps = { children: React.ReactNode };
export function CreateTxProvider({ children }: ProviderProps) {
  const createTx = React.useRef(() => {});
  const [
    {
      trackedCommitment,
      showDebugTable,
      retryTransactionEnabled,
      computeUnitPrice,
      extraWriteAccount,
    },
  ] = useClientConfig();
  const serverConfig = useServerConfig();
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
        !serverConfig ||
        !accounts ||
        !targetSlotRef.current
      ) {
        console.error("failed to send tx", {
          connection,
          blockhash,
          socket,
          serverConfig,
          accounts,
          targetSlot: targetSlotRef.current,
        });
        return;
      }

      const id = idCounter.current;
      if (id < accounts.accountCapacity * accounts.programAccounts.length) {
        idCounter.current++;

        const params: CreateTransactionParams = {
          blockhash,
          confirmationCommitment: trackedCommitment,
          targetSlot: targetSlotRef.current,
          programId: serverConfig.programId,
          accounts,
          trackingId: id,
          computeUnitPrice,
          extraWriteAccount,
        };

        createTransaction(
          connection,
          params,
          showDebugTable,
          retryTransactionEnabled,
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
    serverConfig,
    accounts,
    dispatch,
    targetSlotRef,
    latestTimestamp,
    showDebugTable,
    trackedCommitment,
    retryTransactionEnabled,
    computeUnitPrice,
    extraWriteAccount,
  ]);

  return (
    <CreateTxContext.Provider value={createTx}>
      {children}
    </CreateTxContext.Provider>
  );
}

type CreateTransactionParams = {
  blockhash: Blockhash;
  confirmationCommitment: TrackedCommitment;
  targetSlot: number;
  programId: PublicKey;
  accounts: AccountsConfig;
  trackingId: number;
  computeUnitPrice?: number;
  extraWriteAccount?: string;
};

export function createTransaction(
  connection: Connection,
  params: CreateTransactionParams,
  debugMode: boolean,
  retryEnabled: boolean,
  dispatch: Dispatch,
  socket: WebSocket,
  latestTimestamp: React.MutableRefObject<number | undefined>
) {
  const {
    blockhash,
    confirmationCommitment,
    targetSlot,
    programId,
    accounts,
    trackingId,
    computeUnitPrice,
    extraWriteAccount,
  } = params;
  const { feePayerKeypairs, programAccounts } = accounts;

  const bitId = Math.floor(trackingId / feePayerKeypairs.length);
  const accountIndex = trackingId % feePayerKeypairs.length;
  const programDataAccount = programAccounts[accountIndex];
  const feePayerKeypair = feePayerKeypairs[accountIndex];

  workerRPC
    .createTransaction({
      trackingId,
      blockhash,
      programId: programId.toBase58(),
      programDataAccount: programDataAccount.toBase58(),
      bitId,
      feeAccountSecretKey: feePayerKeypair.secretKey,
      computeUnitPrice,
      extraWriteAccount,
    })
    .then(
      (response: CreateTransactionResponseMessage) => {
        const { signature, serializedTransaction } = response;

        console.log("send transaction using blockhash", blockhash);
        socket.send(serializedTransaction);

        const pendingTransaction: PendingTransaction = { targetSlot };
        pendingTransaction.timeoutId = window.setTimeout(() => {
          dispatch({ type: "timeout", trackingId });
        }, SEND_TIMEOUT_MS);

        const encodedSignature = bs58.encode(signature);
        const details: TransactionDetails = {
          id: bitId,
          feeAccount: feePayerKeypair.publicKey,
          programAccount: programDataAccount,
          signature: encodedSignature,
        };

        let subscribed: number | undefined;
        if (!debugMode) {
          subscribed = performance.now();
        }

        dispatch({
          type: "new",
          details,
          trackingId,
          pendingTransaction,
          subscribed,
        });

        if (debugMode) {
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

          const commitments = subscribedCommitments(
            confirmationCommitment,
            debugMode
          );
          commitments.forEach((commitment) => {
            connection.onSignatureWithOptions(
              encodedSignature,
              (notification, context) => {
                const timestamp = latestTimestamp.current;
                if (timestamp && notification.type === "status") {
                  dispatch({
                    type: "track",
                    commitment,
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

        if (retryEnabled) {
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
