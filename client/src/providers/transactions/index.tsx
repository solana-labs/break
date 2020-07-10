import * as React from "react";
import { TransactionSignature, PublicKey } from "@solana/web3.js";
import { useConfig, useAccounts, useConnection } from "../api";
import { useBlockhash } from "../blockhash";
import { ConfirmedHelper } from "./confirmed";
import { TpsProvider, TpsContext } from "./tps";
import { createTransaction } from "./create";
import { SelectedTxProvider } from "./selected";
import { useSocket } from "../socket";

export type PendingTransaction = {
  sentAt: number;
  retryId?: number;
  timeoutId?: number;
};

export type TransactionDetails = {
  id: number;
  feeAccount: PublicKey;
  programAccount: PublicKey;
  signature: TransactionSignature;
};

type SuccessState = {
  status: "success";
  details: TransactionDetails;
  slot: number;
  confirmationTime: number;
  pending?: PendingTransaction;
};

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
}

type UpdateIds = {
  type: ActionType.UpdateIds;
  activeIdPartition: {
    ids: Set<number>;
    partition: number;
    partitionCount: number;
  };
  slot: number;
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
  | RecordRoot;

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
          const confirmationTime = timeElapsed(tx.pending.sentAt);
          const retryUntil = new URLSearchParams(window.location.search).get(
            "retry_until"
          );
          if (retryUntil === "confirmed") clearInterval(tx.pending.retryId);
          return {
            status: "success",
            details: tx.details,
            slot: action.slot,
            confirmationTime,
            pending: { ...tx.pending },
          };
        } else if (tx.status === "success" && tx.pending && !ids.has(id)) {
          return {
            status: "pending",
            details: tx.details,
            pending: { ...tx.pending },
          };
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
        return tx.status === "success" && tx.pending && tx.slot === action.root;
      });
      if (!foundRooted) return state;

      return state.map((tx) => {
        if (tx.status === "success" && tx.pending && tx.slot === action.root) {
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
  }
}

export type Dispatch = (action: Action) => void;
const StateContext = React.createContext<State | undefined>(undefined);
const DispatchContext = React.createContext<Dispatch | undefined>(undefined);

type ProviderProps = { children: React.ReactNode };
export function TransactionsProvider({ children }: ProviderProps) {
  const [state, dispatch] = React.useReducer(reducer, []);
  const connection = useConnection();

  React.useEffect(() => {
    dispatch({
      type: ActionType.ResetState,
    });

    if (connection === undefined) return;
    const rootSubscription = connection.onRootChange((root: number) =>
      dispatch({ type: ActionType.RecordRoot, root })
    );

    return () => {
      connection.removeRootChangeListener(rootSubscription);
    };
  }, [connection]);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        <SelectedTxProvider>
          <ConfirmedHelper>
            <TpsProvider>{children}</TpsProvider>
          </ConfirmedHelper>
        </SelectedTxProvider>
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
      confirmed.push(tx.confirmationTime);
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
  const programDataAccount = accounts?.programAccounts[0];

  // Reset counter when program data accounts are refreshed
  React.useEffect(() => {
    idCounter.current = 0;
  }, [programDataAccount]);

  const blockhash = useBlockhash();
  const dispatch = useDispatch();
  const socket = useSocket();
  return React.useCallback(() => {
    if (!blockhash || !socket || !config || !accounts) return;
    const id = idCounter.current;
    if (id < accounts.accountCapacity * accounts.programAccounts.length) {
      idCounter.current++;
      createTransaction(
        blockhash,
        config.programId,
        accounts,
        id,
        dispatch,
        socket
      );
    } else {
      console.error("Exceeded account capacity");
    }
  }, [blockhash, socket, config, accounts, dispatch]);
}
