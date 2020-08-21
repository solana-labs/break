import * as React from "react";
import { TransactionSignature, PublicKey } from "@solana/web3.js";
import { useConfig, useAccounts, useConnection } from "../api";
import { useBlockhash } from "../blockhash";
import { ConfirmedHelper } from "./confirmed";
import { TpsProvider, TpsContext } from "./tps";
import { createTransaction } from "./create";
import { SelectedTxProvider } from "./selected";
import { useSocket } from "../socket";
import { reportError } from "utils";

export type PendingTransaction = {
  sentAt: number;
  targetSlot: number;
  retryId?: number;
  timeoutId?: number;
};

export type TransactionDetails = {
  id: number;
  feeAccount: PublicKey;
  programAccount: PublicKey;
  signature: TransactionSignature;
};

type Timing = {
  sentAt: number;
  recent?: number;
  single?: number;
  singleGossip?: number;
};

type SuccessState = {
  status: "success";
  details: TransactionDetails;
  slot: {
    target: number;
    landed?: number;
    estimated: number;
  };
  timing: Timing;
  pending?: PendingTransaction;
};

export const COMMITMENT_PARAM = ((): TrackedCommitment => {
  const commitment = new URLSearchParams(window.location.search).get(
    "commitment"
  );
  switch (commitment) {
    case "recent":
    case "single": {
      return commitment;
    }
    default: {
      return "singleGossip";
    }
  }
})();

export type TrackedCommitment = "single" | "singleGossip" | "recent";

type TimeoutState = {
  status: "timeout";
  details: TransactionDetails;
};

type PendingState = {
  status: "pending";
  pending: PendingTransaction;
  details: TransactionDetails;
};

export type TransactionStatus = "success" | "timeout" | "pending";

export type TransactionState = SuccessState | TimeoutState | PendingState;

export enum ActionType {
  NewTransaction,
  UpdateIds,
  TimeoutTransaction,
  ResetState,
  RecordRoot,
  LandedTxs,
}

type UpdateIds = {
  type: ActionType.UpdateIds;
  activeIdPartition: {
    ids: Set<number>;
    partition: number;
    partitionCount: number;
  };
  commitment: TrackedCommitment;
  estimatedSlot: number;
};

type LandedTxs = {
  type: ActionType.LandedTxs;
  signatures: TransactionSignature[];
  slots: number[];
};

type NewTransaction = {
  type: ActionType.NewTransaction;
  trackingId: number;
  details: TransactionDetails;
  pendingTransaction: PendingTransaction;
};

type TimeoutTransaction = {
  type: ActionType.TimeoutTransaction;
  trackingId: number;
};

type ResetState = {
  type: ActionType.ResetState;
};

type RecordRoot = {
  type: ActionType.RecordRoot;
  root: number;
};

type Action =
  | NewTransaction
  | UpdateIds
  | TimeoutTransaction
  | ResetState
  | RecordRoot
  | LandedTxs;

type State = TransactionState[];
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case ActionType.NewTransaction: {
      const { details, pendingTransaction } = action;
      return [
        ...state,
        {
          details,
          status: "pending",
          pending: pendingTransaction,
        },
      ];
    }

    case ActionType.TimeoutTransaction: {
      const trackingId = action.trackingId;
      if (trackingId >= state.length) return state;
      const timeout = state[trackingId];
      if (timeout.status !== "pending") return state;
      clearInterval(timeout.pending.retryId);

      return state.map((tx) => {
        if (tx.details.signature === timeout.details.signature) {
          return {
            status: "timeout",
            details: tx.details,
          };
        } else {
          return tx;
        }
      });
    }

    case ActionType.UpdateIds: {
      const { ids, partition, partitionCount } = action.activeIdPartition;
      return state.map((tx, trackingId) => {
        if (trackingId % partitionCount !== partition) return tx;
        const id = Math.floor(trackingId / partitionCount);
        if (tx.status === "pending" && ids.has(id)) {
          // Optimistically confirmed, no need to continue retry
          if (
            action.commitment === "singleGossip" ||
            action.commitment === "single"
          ) {
            clearInterval(tx.pending.retryId);
            clearTimeout(tx.pending.timeoutId);
          }

          return {
            status: "success",
            details: tx.details,
            slot: {
              target: tx.pending.targetSlot,
              estimated: action.estimatedSlot,
            },
            timing: {
              sentAt: tx.pending.sentAt,
              [action.commitment]: timeElapsed(tx.pending.sentAt),
            },
            pending: tx.pending,
          };
        } else if (tx.status === "success") {
          if (ids.has(id)) {
            // Already recorded conf time
            if (tx.timing[action.commitment] !== undefined) {
              return tx;
            }

            // Optimistically confirmed, no need to continue retry
            if (
              tx.pending &&
              (action.commitment === "singleGossip" ||
                action.commitment === "single")
            ) {
              clearInterval(tx.pending.retryId);
              clearTimeout(tx.pending.timeoutId);
            }

            return {
              ...tx,
              timing: {
                ...tx.timing,
                [action.commitment]: timeElapsed(tx.timing.sentAt),
              },
            };
          } else if (tx.pending && !ids.has(id)) {
            return {
              status: "pending",
              details: tx.details,
              pending: { ...tx.pending },
            };
          }
        }
        return tx;
      });
    }

    case ActionType.ResetState: {
      state.forEach((tx) => {
        if (tx.status === "pending") {
          clearTimeout(tx.pending.timeoutId);
          clearInterval(tx.pending.retryId);
        } else if (tx.status === "success" && tx.pending) {
          clearTimeout(tx.pending.timeoutId);
          clearInterval(tx.pending.retryId);
        }
      });
      return [];
    }

    case ActionType.RecordRoot: {
      const foundRooted = state.find((tx) => {
        return (
          tx.status === "success" &&
          tx.pending &&
          tx.slot.landed === action.root
        );
      });
      if (!foundRooted) return state;

      return state.map((tx) => {
        if (
          tx.status === "success" &&
          tx.pending &&
          tx.slot.landed === action.root
        ) {
          clearInterval(tx.pending.retryId);
          clearTimeout(tx.pending.timeoutId);
          return {
            ...tx,
            pending: undefined,
          };
        } else {
          return tx;
        }
      });
    }

    case ActionType.LandedTxs: {
      return state.map((tx) => {
        if (tx.status === "success") {
          const index = action.signatures.findIndex(
            (val) => val === tx.details.signature
          );
          if (index >= 0) {
            return {
              ...tx,
              slot: {
                ...tx.slot,
                landed: action.slots[index],
              },
            };
          }
        }
        return tx;
      });
    }
  }
}

export type Dispatch = (action: Action) => void;
const SlotContext = React.createContext<
  React.MutableRefObject<number | undefined> | undefined
>(undefined);
const StateContext = React.createContext<State | undefined>(undefined);
const DispatchContext = React.createContext<Dispatch | undefined>(undefined);

type ProviderProps = { children: React.ReactNode };
export function TransactionsProvider({ children }: ProviderProps) {
  const [state, dispatch] = React.useReducer(reducer, []);
  const connection = useConnection();
  const targetSlot = React.useRef<number>();
  const stateRef = React.useRef(state);

  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  React.useEffect(() => {
    dispatch({
      type: ActionType.ResetState,
    });

    if (connection === undefined) return;
    const slotSubscription = connection.onSlotChange(({ slot }) => {
      targetSlot.current = slot;
    });
    const rootSubscription = connection.onRootChange((root) => {
      dispatch({ type: ActionType.RecordRoot, root });
    });

    // Poll for signature statuses to determine which slot a tx landed in
    const intervalId = setInterval(async () => {
      const fetchStatuses: string[] = [];
      stateRef.current.forEach((tx) => {
        if (tx.status === "success" && tx.slot.landed === undefined) {
          fetchStatuses.push(tx.details.signature);
        }
      });

      if (fetchStatuses.length === 0) return;

      const slots: number[] = [];
      const signatures: TransactionSignature[] = [];
      const statuses = (await connection.getSignatureStatuses(fetchStatuses))
        .value;
      for (var i = 0; i < statuses.length; i++) {
        const status = statuses[i];
        if (status !== null) {
          slots.push(status.slot);
          signatures.push(fetchStatuses[i]);
        }
      }
      if (slots.length === 0) return;
      dispatch({ type: ActionType.LandedTxs, slots, signatures });
    }, 2000);

    return () => {
      connection.removeSlotChangeListener(slotSubscription);
      connection.removeRootChangeListener(rootSubscription);
      clearInterval(intervalId);
    };
  }, [connection]);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        <SlotContext.Provider value={targetSlot}>
          <SelectedTxProvider>
            <ConfirmedHelper>
              <TpsProvider>{children}</TpsProvider>
            </ConfirmedHelper>
          </SelectedTxProvider>
        </SlotContext.Provider>
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

function timeElapsed(sentAt: number): number {
  const now = performance.now();
  return parseFloat(((now - sentAt) / 1000).toFixed(3));
}

export function useDispatch() {
  const dispatch = React.useContext(DispatchContext);
  if (!dispatch) {
    throw new Error(`useDispatch must be used within a TransactionsProvider`);
  }

  return dispatch;
}

export function useTargetSlotRef() {
  const dispatch = React.useContext(SlotContext);
  if (!dispatch) {
    throw new Error(
      `useTargetSlotRef must be used within a TransactionsProvider`
    );
  }

  return dispatch;
}

export function useTransactions() {
  const state = React.useContext(StateContext);
  if (!state) {
    throw new Error(
      `useTransactions must be used within a TransactionsProvider`
    );
  }

  return state;
}

export function useConfirmedCount() {
  const state = React.useContext(StateContext);
  if (!state) {
    throw new Error(
      `useConfirmedCount must be used within a TransactionsProvider`
    );
  }
  return state.filter(({ status }) => status === "success").length;
}

export function useDroppedCount() {
  const state = React.useContext(StateContext);
  if (!state) {
    throw new Error(
      `useDroppedCount must be used within a TransactionsProvider`
    );
  }
  return state.filter(({ status }) => status === "timeout").length;
}

export function useAvgConfirmationTime() {
  const state = React.useContext(StateContext);
  if (!state) {
    throw new Error(
      `useAvgConfirmationTime must be used within a TransactionsProvider`
    );
  }

  const confirmed = state.reduce((confirmed: number[], tx) => {
    if (tx.status === "success") {
      const confTime = tx.timing[COMMITMENT_PARAM];
      if (confTime !== undefined) confirmed.push(confTime);
    }
    return confirmed;
  }, []);

  const count = confirmed.length;
  if (count === 0) return 0;
  const sum = confirmed.reduce((sum, time) => sum + time, 0);
  return sum / count;
}

export function useCreatedCount() {
  const state = React.useContext(StateContext);
  if (!state) {
    throw new Error(
      `useCreatedCount must be used within a TransactionsProvider`
    );
  }
  return state.length;
}

export function useTps() {
  const tps = React.useContext(TpsContext);
  if (tps === undefined)
    throw new Error(`useTps must be used within a TransactionsProvider`);
  return tps;
}

export function useCreateTx() {
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
  return React.useCallback(() => {
    if (!blockhash || !socket || !config || !accounts || !targetSlotRef.current)
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
  }, [blockhash, socket, config, accounts, dispatch, targetSlotRef]);
}
