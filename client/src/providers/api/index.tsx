import React from "react";
import fetcher from "api/fetcher";
import Path from "api/paths";
import { Buffer } from "buffer";
import { Account, PublicKey } from "@solana/web3.js";
import { Config, configFromResponse } from "./config";
import { sleep } from "utils";

export enum ConfigStatus {
  Initialized,
  Fetching,
  Refreshing,
  Refreshed,
  Failure,
}

interface State {
  status: ConfigStatus;
  config?: Config;
}

interface Initialized {
  status: ConfigStatus.Initialized;
  config: Config;
}

interface Fetching {
  status: ConfigStatus.Fetching;
}

interface Refreshing {
  status: ConfigStatus.Refreshing;
}

interface Refreshed {
  status: ConfigStatus.Refreshed;
  accountCapacity: number;
  feeAccounts: Account[];
  programDataAccounts: PublicKey[];
  programDataAccountSpace: number;
}

interface Failure {
  status: ConfigStatus.Failure;
}

type Action = Initialized | Fetching | Refreshing | Refreshed | Failure;
type Dispatch = (action: Action) => void;

function configReducer(state: State, action: Action): State {
  switch (action.status) {
    case ConfigStatus.Fetching:
    case ConfigStatus.Failure:
    case ConfigStatus.Refreshing:
    case ConfigStatus.Initialized: {
      return Object.assign({}, state, action);
    }
    case ConfigStatus.Refreshed: {
      if (state.config) {
        return Object.assign({}, state, {
          status: action.status,
          config: Object.assign({}, state.config, {
            accountCapacity: action.accountCapacity,
            feeAccounts: action.feeAccounts,
            programDataAccounts: action.programDataAccounts,
            programDataAccountSpace: action.programDataAccountSpace,
          }),
        });
      }
    }
  }
  return state;
}

const StateContext = React.createContext<State | undefined>(undefined);
const DispatchContext = React.createContext<Dispatch | undefined>(undefined);

type ApiProviderProps = { children: React.ReactNode };
export function ApiProvider({ children }: ApiProviderProps) {
  const [state, dispatch] = React.useReducer(configReducer, {
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
      const response = await fetcher.get(Path.Init);
      dispatch({
        status: ConfigStatus.Initialized,
        config: configFromResponse(response),
      });
      initialized = true;
    } catch (err) {
      console.error("Failed to initialize", err);
      dispatch({ status: ConfigStatus.Failure });
      await sleep(2000);
    }
  }
}

async function refreshAccounts(dispatch: Dispatch) {
  dispatch({
    status: ConfigStatus.Refreshing,
  });

  let refreshed = false;
  while (!refreshed) {
    try {
      const response = await fetcher.get(Path.Refresh);
      if (!("accountKeys" in response) || !("accountCapacity" in response)) {
        throw new Error("Received invalid response");
      }
      refreshed = true;
      dispatch({
        status: ConfigStatus.Refreshed,
        programDataAccounts: response.programDataAccounts.map(
          (account: string) => new PublicKey(account)
        ),
        programDataAccountSpace: response.programDataAccountSpace,
        accountCapacity: response.accountCapacity,
        feeAccounts: response.accountKeys.map(
          (key: string) => new Account(Buffer.from(key, "hex"))
        ),
      });
    } catch (err) {
      console.error("Failed to refresh fee accounts", err);
      dispatch({ status: ConfigStatus.Failure });
      await sleep(2000);
    }
  }
}

export function useConfig() {
  const context = React.useContext(StateContext);
  if (!context) {
    throw new Error(`useConfig must be used within a ApiProvider`);
  }
  if (
    context.config &&
    (context.status === ConfigStatus.Refreshed ||
      context.status === ConfigStatus.Initialized)
  ) {
    return context.config;
  }
  return undefined;
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
  return () => {
    refreshAccounts(dispatch);
  };
}
