import React from "react";
import Path from "api/paths";
import {
  Config,
  configFromInit,
  configFromAccounts,
  AccountsConfig,
} from "./config";
import { sleep } from "utils";
import { Account } from "@solana/web3.js";

export enum ConfigStatus {
  Initialized,
  Fetching,
  PaymentRequired,
  ReadyToPlay,
  Failure,
}

interface State {
  status: ConfigStatus;
  gameCost: number;
  config?: Config;
  accounts?: AccountsConfig;
}

interface Initialized {
  status: ConfigStatus.Initialized;
  config: Config;
}

interface PaymentRequired {
  status: ConfigStatus.PaymentRequired;
  gameCost: number;
}

interface Fetching {
  status: ConfigStatus.Fetching;
}

interface Ready {
  status: ConfigStatus.ReadyToPlay;
  accounts: AccountsConfig;
}

interface Failure {
  status: ConfigStatus.Failure;
}

type Action = Initialized | Fetching | PaymentRequired | Ready | Failure;
type Dispatch = (action: Action) => void;

function configReducer(state: State, action: Action): State {
  switch (action.status) {
    case ConfigStatus.Failure:
    case ConfigStatus.PaymentRequired:
    case ConfigStatus.ReadyToPlay:
    case ConfigStatus.Initialized: {
      return { ...state, ...action };
    }
    case ConfigStatus.Fetching: {
      return {
        ...state,
        ...action,
        accounts: undefined,
      };
    }
  }
}

const StateContext = React.createContext<State | undefined>(undefined);
const DispatchContext = React.createContext<Dispatch | undefined>(undefined);

type ApiProviderProps = { children: React.ReactNode };
export function ApiProvider({ children }: ApiProviderProps) {
  const [state, dispatch] = React.useReducer(configReducer, {
    gameCost: 0,
    status: ConfigStatus.Fetching,
  });

  React.useEffect(() => {
    initConfig(dispatch);
  }, [dispatch]);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

async function initConfig(dispatch: Dispatch): Promise<void> {
  dispatch({
    status: ConfigStatus.Fetching,
  });

  let initialized = false;
  while (!initialized) {
    try {
      const body = JSON.stringify({ split: splitParam });
      const response = await fetch(
        new Request(Path.Init, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        })
      );
      const data = await response.json();
      dispatch({
        status: ConfigStatus.Initialized,
        config: configFromInit(data),
      });
      initialized = true;
    } catch (err) {
      console.error("Failed to initialize", err);
      dispatch({ status: ConfigStatus.Failure });
      await sleep(2000);
    }
  }

  refreshAccounts(dispatch);
}

const splitParam = ((): number | undefined => {
  const split = parseInt(
    new URLSearchParams(window.location.search).get("split") || ""
  );
  if (!isNaN(split)) {
    return split;
  }
})();

type RefreshData = {
  split?: number;
  paymentKey?: string;
};

async function refreshAccounts(dispatch: Dispatch, paymentAccount?: Account) {
  dispatch({
    status: ConfigStatus.Fetching,
  });

  let refreshed = false;
  while (!refreshed) {
    try {
      const postData: RefreshData = {};
      if (splitParam) {
        postData.split = splitParam;
      }
      if (paymentAccount) {
        postData.paymentKey = Buffer.from(paymentAccount.secretKey).toString(
          "base64"
        );
      }

      const body = JSON.stringify(postData);
      const response = await fetch(
        new Request(Path.Accounts, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        })
      );
      const data = await response.json();
      if (data.message === "Payment required") {
        dispatch({
          status: ConfigStatus.PaymentRequired,
          gameCost: data.amount + 1, // Leave 1 lamport so that the account doesn't get deleted
        });
      } else {
        if (!("accountKeys" in data) || !("accountCapacity" in data)) {
          throw new Error("Received invalid response");
        }

        dispatch({
          status: ConfigStatus.ReadyToPlay,
          accounts: configFromAccounts(data),
        });
      }
      refreshed = true;
    } catch (err) {
      console.error("Failed to refresh fee accounts", err);
      dispatch({ status: ConfigStatus.Failure });
      await sleep(2000);
    }
  }
}

export function useGameCost() {
  const context = React.useContext(StateContext);
  if (!context) {
    throw new Error(`useGameCost must be used within a ApiProvider`);
  }
  return context.gameCost;
}

export function usePaymentRequired() {
  const context = React.useContext(StateContext);
  if (!context) {
    throw new Error(`usePaymentRequired must be used within a ApiProvider`);
  }
  return context.status === ConfigStatus.PaymentRequired;
}

export function useAccounts() {
  const context = React.useContext(StateContext);
  if (!context) {
    throw new Error(`useAccounts must be used within a ApiProvider`);
  }
  return context.accounts;
}

export function useConfig() {
  const context = React.useContext(StateContext);
  if (!context) {
    throw new Error(`useConfig must be used within a ApiProvider`);
  }
  return context.config;
}

export function useClusterParam(): string {
  const context = React.useContext(StateContext);
  if (!context) {
    throw new Error(`useClusterParam must be used within a ApiProvider`);
  }
  const config = context?.config;
  if (!config) return `cluster=devnet`;
  const { cluster, clusterUrl } = config;
  if (cluster) {
    return `cluster=${cluster}`;
  } else {
    return `clusterUrl=${clusterUrl}`;
  }
}

export function useRefreshAccounts() {
  const dispatch = React.useContext(DispatchContext);
  if (!dispatch) {
    throw new Error(`useRefreshAccounts must be used within a ApiProvider`);
  }
  return React.useCallback(
    (paymentAccount?: Account) => {
      refreshAccounts(dispatch, paymentAccount);
    },
    [dispatch]
  );
}
