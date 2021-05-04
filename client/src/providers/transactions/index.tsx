import * as React from "react";
import { useThrottle } from "@react-hook/throttle";
import { TransactionSignature, PublicKey } from "@solana/web3.js";
import { ConfirmedHelper, DEBUG_MODE } from "./confirmed";
import { TpsProvider, TpsContext } from "./tps";
import { CreateTxContext, CreateTxProvider } from "./create";
import { SelectedTxProvider } from "./selected";
import { useConnection } from "providers/rpc";
import { useSlotTiming } from "providers/slot";

export type ReceivedRecord = {
  timestamp: number;
  slot: number;
};

export type PendingTransaction = {
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
  subscribed?: number;
  processed?: number;
  confirmed?: number;
};

type TimeoutState = {
  status: "timeout";
  details: TransactionDetails;
};

type PendingState = {
  status: "pending";
  details: TransactionDetails;
  received: Array<ReceivedRecord>;
  pending: PendingTransaction;
  timing: Timing;
};

type SuccessState = {
  status: "success";
  details: TransactionDetails;
  received: Array<ReceivedRecord>;
  slot: {
    target: number;
    landed?: number;
  };
  timing: Timing;
  pending?: PendingTransaction;
};

export const COMMITMENT_PARAM = ((): TrackedCommitment => {
  const commitment = new URLSearchParams(window.location.search).get(
    "commitment"
  );
  switch (commitment) {
    case "recent": {
      return "processed";
    }
    case "processed": {
      return commitment;
    }
    default: {
      return "confirmed";
    }
  }
})();

export type TrackedCommitment = "processed" | "confirmed";

export type TransactionStatus = "success" | "timeout" | "pending";

export type TransactionState = SuccessState | TimeoutState | PendingState;

type NewTransaction = {
  type: "new";
  trackingId: number;
  details: TransactionDetails;
  pendingTransaction: PendingTransaction;
};

type UpdateIds = {
  type: "update";
  activeIdPartition: {
    ids: Set<number>;
    partition: number;
    partitionCount: number;
  };
  commitment: TrackedCommitment;
  receivedAt: number;
  estimatedSlot: number;
};

type TrackTransaction = {
  type: "track";
  commitment: TrackedCommitment;
  trackingId: number;
  slot: number;
  timestamp: number;
};

type TimeoutTransaction = {
  type: "timeout";
  trackingId: number;
};

type ResetState = {
  type: "reset";
};

type RecordRoot = {
  type: "root";
  root: number;
};

type SignatureReceived = {
  type: "received";
  timestamp: number;
  trackingId: number;
  slot: number;
};

type SignatureSubscribed = {
  type: "subscribed";
  timestamp: number;
  trackingId: number;
};

type SignatureLanded = {
  type: "landed";
  signatures: TransactionSignature[];
  slots: number[];
};

type Action =
  | NewTransaction
  | UpdateIds
  | TimeoutTransaction
  | ResetState
  | RecordRoot
  | TrackTransaction
  | SignatureReceived
  | SignatureSubscribed
  | SignatureLanded;

type State = TransactionState[];
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "new": {
      const { details, pendingTransaction } = action;
      let subscribed: number | undefined;
      if (!DEBUG_MODE) {
        subscribed = performance.now();
      }
      return [
        ...state,
        {
          details,
          status: "pending",
          received: [],
          pending: pendingTransaction,
          timing: {
            subscribed,
          },
        },
      ];
    }

    case "subscribed": {
      const trackingId = action.trackingId;
      if (trackingId >= state.length) return state;
      const transaction = state[trackingId];
      return state.map((tx) => {
        if (tx.details.signature === transaction.details.signature) {
          if (tx.status !== "timeout") {
            return {
              ...tx,
              timing: {
                ...tx.timing,
                subscribed: action.timestamp,
              },
            };
          }
        }
        return tx;
      });
    }

    case "received": {
      const trackingId = action.trackingId;
      if (trackingId >= state.length) return state;
      const transaction = state[trackingId];
      return state.map((tx) => {
        if (tx.details.signature === transaction.details.signature) {
          if (tx.status !== "timeout") {
            return {
              ...tx,
              received: [
                ...tx.received,
                {
                  slot: action.slot,
                  timestamp: action.timestamp,
                },
              ],
            };
          }
        }
        return tx;
      });
    }

    case "landed": {
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

    case "track": {
      const trackingId = action.trackingId;
      if (trackingId >= state.length) return state;
      const transaction = state[trackingId];

      return state.map((tx) => {
        if (tx.details.signature === transaction.details.signature) {
          if (tx.status === "pending") {
            return {
              status: "success",
              details: tx.details,
              received: tx.received,
              slot: {
                target: tx.pending.targetSlot,
              },
              timing: {
                ...tx.timing,
                [action.commitment]: action.timestamp,
              },
              pending: tx.pending,
            };
          } else if (tx.status === "success") {
            return {
              ...tx,
              timing: {
                ...tx.timing,
                [action.commitment]: action.timestamp,
              },
            };
          }
        }
        return tx;
      });
    }

    case "timeout": {
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

    case "update": {
      const { ids, partition, partitionCount } = action.activeIdPartition;
      return state.map((tx, trackingId) => {
        if (trackingId % partitionCount !== partition) return tx;
        const id = Math.floor(trackingId / partitionCount);
        if (tx.status === "pending" && ids.has(id)) {
          // Optimistically confirmed, no need to continue retry
          if (action.commitment === "confirmed") {
            clearInterval(tx.pending.retryId);
            clearTimeout(tx.pending.timeoutId);
          }

          return {
            status: "success",
            details: tx.details,
            received: tx.received,
            slot: {
              target: tx.pending.targetSlot,
              landed: action.estimatedSlot,
            },
            timing: {
              ...tx.timing,
              [action.commitment]: timeElapsed(
                tx.timing.subscribed,
                action.receivedAt
              ),
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
            if (tx.pending && action.commitment === "confirmed") {
              clearInterval(tx.pending.retryId);
              clearTimeout(tx.pending.timeoutId);
            }

            return {
              ...tx,
              timing: {
                ...tx.timing,
                [action.commitment]: timeElapsed(
                  tx.timing.subscribed,
                  action.receivedAt
                ),
              },
            };
          } else if (
            action.commitment === "processed" &&
            tx.pending &&
            !ids.has(id)
          ) {
            // Don't revert to pending state if we already received timing info for other commitments
            if (tx.timing["confirmed"] !== undefined) {
              return {
                ...tx,
                timing: {
                  ...tx.timing,
                  processed: undefined,
                },
              };
            }

            // Revert to pending state because the previous notification likely came from a fork
            return {
              status: "pending",
              details: tx.details,
              received: tx.received,
              pending: { ...tx.pending },
              timing: tx.timing,
            };
          }
        }
        return tx;
      });
    }

    case "reset": {
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

    case "root": {
      const foundRooted = state.find((tx) => {
        if (tx.status === "success" && tx.pending) {
          return tx.slot.landed === action.root;
        } else {
          return false;
        }
      });

      // Avoid re-allocating state map
      if (!foundRooted) return state;

      return state.map((tx) => {
        if (tx.status === "success" && tx.pending) {
          if (tx.slot.landed === action.root) {
            clearInterval(tx.pending.retryId);
            clearTimeout(tx.pending.timeoutId);
            return {
              ...tx,
              pending: undefined,
            };
          }
        }
        return tx;
      });
    }
  }
}

export type Dispatch = (action: Action) => void;
const StateContext = React.createContext<State | undefined>(undefined);
const DispatchContext = React.createContext<Dispatch | undefined>(undefined);

type ProviderProps = { children: React.ReactNode };
export function TransactionsProvider({ children }: ProviderProps) {
  const [state, dispatch] = React.useReducer(reducer, []);
  const connection = useConnection();
  const stateRef = React.useRef(state);

  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  React.useEffect(() => {
    dispatch({
      type: "reset",
    });

    if (connection === undefined) return;
    const rootSubscription = connection.onRootChange((root) => {
      dispatch({ type: "root", root });
    });

    // Poll for signature statuses to determine which slot a tx landed in
    const intervalId = DEBUG_MODE
      ? setInterval(async () => {
          const fetchStatuses: string[] = [];
          stateRef.current.forEach((tx) => {
            if (tx.status === "success" && tx.slot.landed === undefined) {
              fetchStatuses.push(tx.details.signature);
            }
          });

          if (fetchStatuses.length === 0) return;

          const slots: number[] = [];
          const signatures: TransactionSignature[] = [];
          const statuses = (
            await connection.getSignatureStatuses(fetchStatuses)
          ).value;
          for (var i = 0; i < statuses.length; i++) {
            const status = statuses[i];
            if (status !== null) {
              slots.push(status.slot);
              signatures.push(fetchStatuses[i]);
            }
          }
          if (slots.length === 0) return;
          dispatch({ type: "landed", slots, signatures });
        }, 2000)
      : undefined;

    return () => {
      connection.removeRootChangeListener(rootSubscription);
      intervalId !== undefined && clearInterval(intervalId);
    };
  }, [connection]);

  const [throttledState, setThrottledState] = useThrottle(state, 10);
  React.useEffect(() => {
    setThrottledState(state);
  }, [state, setThrottledState]);

  return (
    <StateContext.Provider value={throttledState}>
      <DispatchContext.Provider value={dispatch}>
        <SelectedTxProvider>
          <CreateTxProvider>
            <ConfirmedHelper>
              <TpsProvider>{children}</TpsProvider>
            </ConfirmedHelper>
          </CreateTxProvider>
        </SelectedTxProvider>
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

function timeElapsed(
  sentAt: number | undefined,
  receivedAt: number | undefined
): number | undefined {
  if (sentAt === undefined || receivedAt === undefined) return;
  return parseFloat(((receivedAt - sentAt) / 1000).toFixed(3));
}

export function useDispatch() {
  const dispatch = React.useContext(DispatchContext);
  if (!dispatch) {
    throw new Error(`useDispatch must be used within a TransactionsProvider`);
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
  const slotMetrics = useSlotTiming();
  const state = React.useContext(StateContext);
  if (!state) {
    throw new Error(
      `useAvgConfirmationTime must be used within a TransactionsProvider`
    );
  }

  const confirmedTimes = state.reduce((confirmedTimes: number[], tx) => {
    if (tx.status === "success") {
      const subscribed = tx.timing.subscribed;
      if (subscribed !== undefined) {
        let confTime: number | undefined;
        if (!DEBUG_MODE && tx.timing.confirmed !== undefined) {
          confTime = tx.timing.confirmed;
        } else if (tx.slot.landed !== undefined) {
          const slotTiming = slotMetrics.current.get(tx.slot.landed);
          const confirmed = slotTiming?.confirmed;
          confTime = timeElapsed(subscribed, confirmed);
        }
        if (confTime) confirmedTimes.push(confTime);
      }
    }
    return confirmedTimes;
  }, []);

  const count = confirmedTimes.length;
  if (count === 0) return 0;
  const sum = confirmedTimes.reduce((sum, time) => sum + time, 0);
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

export function useCreateTxRef() {
  const createTxRef = React.useContext(CreateTxContext);
  if (createTxRef === undefined)
    throw new Error(
      `useCreateTxRef must be used within a TransactionsProvider`
    );
  return createTxRef;
}
