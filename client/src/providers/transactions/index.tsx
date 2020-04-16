import * as React from "react";
import { TransactionSignature, TransactionError } from "@solana/web3.js";
import { useConfig } from "../api";
import { useAccountIds } from "../solana";
import { TpsProvider, TpsContext } from "./tps";
import { CreateTxHelper } from "./create";
import { SelectedTxProvider } from "./selected";

const CONFIRMATION_TIME_LOOK_BACK = 75;

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
  reservedIds: number[];
  pendingTransactions: PendingTransactions;
  userTransactions: UserTransaction[];
  createdCount: number;
  confirmedCount: number;
};

const DEFAULT_STATE: State = {
  maxId: 0,
  idBits: {},
  reservedIds: [],
  pendingTransactions: {},
  userTransactions: [],
  createdCount: 0,
  confirmedCount: 0
};

export enum ActionType {
  NewProgramAccount,
  NewTransaction,
  UpdateIds,
  SendTimeout,
  ReserveNextId
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

type ReserveNextId = {
  type: ActionType.ReserveNextId;
};

type Action =
  | NewProgramAccount
  | NewTransaction
  | UpdateIds
  | SendTimeout
  | ReserveNextId;
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

      const previousBitValue = !state.idBits[trackingId];
      return Object.assign({}, state, {
        idBits: Object.assign({}, state.idBits, {
          [trackingId]: previousBitValue
        }),
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
        pendingTransactions: {},
        reservedIds: []
      });
    }

    case ActionType.ReserveNextId: {
      let nextId = 1;
      while (
        state.pendingTransactions[nextId] ||
        state.reservedIds.includes(nextId)
      ) {
        nextId++;
        if (nextId > state.maxId) return state;
      }
      return Object.assign({}, state, {
        reservedIds: [...state.reservedIds, nextId]
      });
    }

    case ActionType.NewTransaction: {
      const { trackingId, pendingTransaction } = action;
      const reservedIndex = state.reservedIds.indexOf(trackingId);
      if (reservedIndex < 0) return state;
      const reservedIds = [...state.reservedIds];
      reservedIds.splice(reservedIndex, 1);

      const newBitValue = !state.idBits[trackingId];
      const signature = pendingTransaction.signature;
      const userTransactions = state.userTransactions;
      return Object.assign({}, state, {
        reservedIds,
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
        <SelectedTxProvider>
          <TpsProvider>
            <CreateTxHelper>{children}</CreateTxHelper>
          </TpsProvider>
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

export function useReservedIds() {
  const state = React.useContext(StateContext);
  if (!state) {
    throw new Error(
      `useReservedIds must be used within a TransactionsProvider`
    );
  }

  return state.reservedIds;
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

export function useAvgConfirmationTime() {
  const state = React.useContext(StateContext);
  if (!state) {
    throw new Error(
      `useAvgConfirmationTime must be used within a TransactionsProvider`
    );
  }
  const start = Math.max(
    state.userTransactions.length - CONFIRMATION_TIME_LOOK_BACK,
    0
  );
  const transactions = state.userTransactions
    .filter(
      tx => tx.confirmationTime > 0 && tx.confirmationTime !== Number.MAX_VALUE
    )
    .slice(start);
  const count = transactions.length;
  if (count === 0) return 0;
  const sum = transactions.reduce((sum, tx) => sum + tx.confirmationTime, 0);
  return sum / count;
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
  const dispatch = React.useContext(DispatchContext);
  if (!dispatch) {
    throw new Error(`useCreateTx must be used within a TransactionsProvider`);
  }

  return () => {
    dispatch({ type: ActionType.ReserveNextId });
  };
}
