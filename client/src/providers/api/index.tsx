import React from "react";
import { Config, AccountsConfig } from "./config";
import { useServer } from "providers/server";
import { useBalance } from "providers/balance";
import { fetchWithRetry } from "./request";
import { Account, Connection } from "@solana/web3.js";
import { useAccountState } from "providers/account";

export enum ConfigStatus {
  Initialized,
  Fetching,
  Ready,
  Failure,
}

interface State {
  status: ConfigStatus;
  config?: Config;
  connection?: Connection;
  accounts?: AccountsConfig;
}

interface Initialized {
  status: ConfigStatus.Initialized;
  config: Config;
}

interface Fetching {
  status: ConfigStatus.Fetching;
}

interface Ready {
  status: ConfigStatus.Ready;
  accounts: AccountsConfig;
}

interface Failure {
  status: ConfigStatus.Failure;
  config?: undefined;
  accounts?: undefined;
}

export type Action = Initialized | Fetching | Ready | Failure;
export type Dispatch = (action: Action) => void;

function configReducer(state: State, action: Action): State {
  switch (action.status) {
    case ConfigStatus.Ready:
    case ConfigStatus.Initialized: {
      return { ...state, ...action };
    }
    case ConfigStatus.Failure: {
      if (state.status === ConfigStatus.Fetching) {
        return { ...state, ...action };
      } else {
        return state;
      }
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
const RefContext = React.createContext<
  React.MutableRefObject<string> | undefined
>(undefined);
const DispatchContext = React.createContext<Dispatch | undefined>(undefined);

type ApiProviderProps = { children: React.ReactNode };
export function ApiProvider({ children }: ApiProviderProps) {
  const [state, dispatch] = React.useReducer(configReducer, {
    status: ConfigStatus.Fetching,
  });

  const { httpUrl } = useServer();
  const httpUrlRef = React.useRef(httpUrl);
  React.useEffect(() => {
    httpUrlRef.current = httpUrl;
    initConfig(dispatch, httpUrlRef);
  }, [httpUrl]);

  const config = state.config;
  const paymentRequired = config?.paymentRequired;
  React.useEffect(() => {
    httpUrlRef.current = httpUrl;
    if (paymentRequired !== false) return;
    refreshAccounts(dispatch, httpUrlRef, undefined);
  }, [httpUrl, paymentRequired]);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        <RefContext.Provider value={httpUrlRef}>{children}</RefContext.Provider>
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

async function initConfig(
  dispatch: Dispatch,
  httpUrlRef: React.MutableRefObject<string>
): Promise<void> {
  return fetchWithRetry(dispatch, httpUrlRef, { route: "init" });
}

async function refreshAccounts(
  dispatch: Dispatch,
  httpUrlRef: React.MutableRefObject<string>,
  paymentAccount: Account | undefined
): Promise<void> {
  return fetchWithRetry(dispatch, httpUrlRef, {
    route: "accounts",
    paymentAccount,
  });
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

export function useConnection() {
  const config = useConfig();
  return config?.connection;
}

export function useIsFetching() {
  const context = React.useContext(StateContext);
  if (!context) {
    throw new Error(`useIsFetching must be used within a ApiProvider`);
  }
  return context.status === ConfigStatus.Fetching;
}

export function useClusterParam(): string {
  const context = React.useContext(StateContext);
  if (!context) {
    throw new Error(`useClusterParam must be used within a ApiProvider`);
  }
  const cluster = context?.config?.cluster;
  if (cluster && cluster !== "mainnet-beta") {
    return `cluster=${cluster}`;
  } else {
    return "";
  }
}

export function useClearAccounts() {
  const dispatch = React.useContext(DispatchContext);
  if (!dispatch) {
    throw new Error(`useClearAccounts must be used within a ApiProvider`);
  }

  return React.useCallback(() => {
    dispatch({ status: ConfigStatus.Fetching });
    dispatch({ status: ConfigStatus.Failure });
  }, [dispatch]);
}

export function useRefreshAccounts() {
  const dispatch = React.useContext(DispatchContext);
  if (!dispatch) {
    throw new Error(`useRefreshAccounts must be used within a ApiProvider`);
  }
  const httpUrlRef = React.useContext(RefContext);
  if (!httpUrlRef) {
    throw new Error(`useRefreshAccounts must be used within a ApiProvider`);
  }
  const config = useConfig();
  const [paymentAccount] = useAccountState();
  const paymentRequired = config?.paymentRequired;
  const balance = useBalance();
  const cost = config?.gameCost;
  return React.useCallback(() => {
    if (paymentRequired === undefined || cost === undefined) return;
    if (paymentRequired) {
      if (!paymentAccount || balance === "loading" || balance < cost) {
        dispatch({ status: ConfigStatus.Fetching });
        dispatch({ status: ConfigStatus.Failure });
        return;
      }
      refreshAccounts(dispatch, httpUrlRef, paymentAccount);
    } else {
      refreshAccounts(dispatch, httpUrlRef, undefined);
    }
  }, [httpUrlRef, dispatch, paymentAccount, paymentRequired, balance, cost]);
}
