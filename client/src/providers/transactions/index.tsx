import * as React from "react";
import { TransactionSignature, TransactionError } from "@solana/web3.js";
import { useConfig } from "../api";
import { useAccountIds } from "../solana";
import { TpsProvider, TpsContext } from "./tps";
import { CreateTxProvider, CreateTxContext } from "./create";

export type PendingTransaction = {
  sentAt: number;
  timeoutId?: number;
  signature: TransactionSignature;
};

export type TransactionStatus =
  | "sent"
  | "success"
  | "timeout"
  | TransactionError;
export type UserTransaction = {
  status: TransactionStatus;
  signature: string;
  confirmationTime: number;
};

type PendingTransactions = { [id: number]: PendingTransaction };
type State = {
  maxId: number;
  idBits: { [id: number]: boolean };
  pendingTransactions: PendingTransactions;
  userTransactions: UserTransaction[];
  createdCount: number;
  confirmedCount: number;
};

const DEFAULT_STATE: State = {
  maxId: 0,
  idBits: {},
  pendingTransactions: {},
  userTransactions: [],
  createdCount: 0,
  confirmedCount: 0
};

export enum ActionType {
  NewProgramAccount,
  NewTransaction,
  UpdateIds,
  SendTimeout
}

type UpdateIds = {
  type: ActionType.UpdateIds;
  activeIds: Set<number>;
};

type NewProgramAccount = {
  type: ActionType.NewProgramAccount;
  maxId: number;
};

type NewTransaction = {
  type: ActionType.NewTransaction;
  trackingId: number;
  pendingTransaction: PendingTransaction;
};

type SendTimeout = {
  type: ActionType.SendTimeout;
  trackingId: number;
};

type Action = NewProgramAccount | NewTransaction | UpdateIds | SendTimeout;
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case ActionType.SendTimeout: {
      const trackingId = action.trackingId;
      const pendingTransaction = state.pendingTransactions[trackingId];
      if (!pendingTransaction) return state;

      const pendingTransactions = Object.assign({}, state.pendingTransactions);
      delete pendingTransactions[trackingId];
      const signature = pendingTransaction.signature;

      const userTransactions = state.userTransactions.map(tx => {
        if (signature === tx.signature) {
          return {
            signature,
            confirmationTime: Number.MAX_VALUE,
            status: "timeout"
          };
        } else {
          return tx;
        }
      });

      return Object.assign({}, state, {
        pendingTransactions,
        userTransactions
      });
    }

    case ActionType.UpdateIds: {
      const ids = action.activeIds;
      const pendingTransactions = Object.assign({}, state.pendingTransactions);
      const updateTransactions: { [signature: string]: UserTransaction } = {};
      let confirmedCount = state.confirmedCount;
      Object.entries(state.pendingTransactions).forEach(
        ([idString, pendingTransaction]) => {
          const id = parseInt(idString);
          const expectedBit = state.idBits[id];
          if ((expectedBit && ids.has(id)) || (!expectedBit && !ids.has(id))) {
            confirmedCount++;
            delete pendingTransactions[id];
            clearTimeout(pendingTransaction.timeoutId);
            const signature = pendingTransaction.signature;
            const confirmationTime = timeElapsed(pendingTransaction.sentAt);
            updateTransactions[signature] = {
              signature,
              confirmationTime,
              status: "success"
            };
          }
        }
      );

      const userTransactions = state.userTransactions.map(tx => {
        const newTransaction = updateTransactions[tx.signature];
        return newTransaction ? newTransaction : tx;
      });

      return Object.assign({}, state, {
        confirmedCount,
        pendingTransactions,
        userTransactions
      });
    }

    case ActionType.NewProgramAccount: {
      return Object.assign({}, state, {
        maxId: action.maxId,
        idBits: {},
        pendingTransactions: {}
      });
    }

    case ActionType.NewTransaction: {
      const { trackingId, pendingTransaction } = action;
      const newBitValue = !state.idBits[trackingId];
      const signature = pendingTransaction.signature;
      let userTransactions;
      if (state.userTransactions.length >= 100) {
        userTransactions = state.userTransactions.slice(10);
      } else {
        userTransactions = state.userTransactions;
      }
      return Object.assign({}, state, {
        createdCount: state.createdCount + 1,
        idBits: Object.assign({}, state.idBits, {
          [trackingId]: newBitValue
        }),
        pendingTransactions: Object.assign({}, state.pendingTransactions, {
          [trackingId]: pendingTransaction
        }),
        userTransactions: [
          ...userTransactions,
          { status: "sent", signature, confirmationTime: 0 }
        ]
      });
    }
  }
}

export type Dispatch = (action: Action) => void;
const StateContext = React.createContext<State | undefined>(undefined);
const DispatchContext = React.createContext<Dispatch | undefined>(undefined);

type ProviderProps = { children: React.ReactNode };
export function TransactionsProvider({ children }: ProviderProps) {
  const [state, dispatch] = React.useReducer(reducer, DEFAULT_STATE);
  const config = useConfig().config;
  const activeIds = useAccountIds();

  React.useEffect(() => {
    if (!config) return;
    dispatch({
      type: ActionType.NewProgramAccount,
      maxId: config.programAccountSpace * 8
    });
  }, [config?.programAccount]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    dispatch({ type: ActionType.UpdateIds, activeIds });
  }, [activeIds]);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        <TpsProvider>
          <CreateTxProvider>{children}</CreateTxProvider>
        </TpsProvider>
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

  return state.userTransactions;
}

export function useConfirmedCount() {
  const state = React.useContext(StateContext);
  if (!state) {
    throw new Error(
      `useConfirmedCount must be used within a TransactionsProvider`
    );
  }
  return state.confirmedCount;
}

export function useCreatedCount() {
  const state = React.useContext(StateContext);
  if (!state) {
    throw new Error(
      `useCreatedCount must be used within a TransactionsProvider`
    );
  }
  return state.createdCount;
}

export function useTps() {
  const tps = React.useContext(TpsContext);
  if (tps === undefined)
    throw new Error(`useTps must be used within a TransactionsProvider`);
  return tps;
}

export function useCreateTx() {
  return React.useContext(CreateTxContext);
}

export function useNextId() {
  const state = React.useContext(StateContext);
  if (state === undefined)
    throw new Error(`useNextId must be used within a TransactionsProvider`);

  const nextId = React.useMemo(() => {
    let nextId = 1;
    while (state.pendingTransactions[nextId]) {
      nextId++;
      if (nextId > state.maxId) return;
    }
    return nextId;
  }, [state.pendingTransactions, state.maxId]);

  return nextId;
}
