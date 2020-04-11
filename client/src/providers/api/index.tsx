import React from "react";
import fetcher from "api/fetcher";
import Path from "api/paths";
import { Buffer } from "buffer";
import { Account } from "@solana/web3.js";
import { Config, configFromResponse } from "./config";
import { sleep } from "utils";

export enum ConfigStatus {
  Initialized,
  Fetching,
  Refreshing,
  Refreshed,
  Failure
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
  payerAccount: Account;
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
            payerAccount: action.payerAccount
          })
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
    status: ConfigStatus.Fetching
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
    status: ConfigStatus.Fetching
  });

  let initialized = false;
  while (!initialized) {
    try {
      const response = await fetcher.get(Path.Init);
      dispatch({
        status: ConfigStatus.Initialized,
        config: configFromResponse(response)
      });
      initialized = true;
    } catch (err) {
      console.error("Failed to initialize", err);
      dispatch({ status: ConfigStatus.Failure });
      await sleep(2000);
    }
  }
}

export async function refreshPayer(dispatch: Dispatch) {
  dispatch({
    status: ConfigStatus.Refreshing
  });

  let refreshed = false;
  while (!refreshed) {
    try {
      const response = await fetcher.get(Path.Refresh);
      if (!("accountKey" in response) || !("accountCapacity" in response)) {
        throw new Error("Failed to refresh payer");
      }
      refreshed = true;
      dispatch({
        status: ConfigStatus.Refreshed,
        accountCapacity: response.accountCapacity,
        payerAccount: new Account(Buffer.from(response.accountKey, "hex"))
      });
    } catch (err) {
      console.error("Failed to refresh payer", err);
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
  return { ...context, clusterParam: getClusterParam(context.config) };
}

function getClusterParam(config?: Config): string {
  if (!config) return `cluster=devnet`;
  const { cluster, clusterUrl } = config;
  if (cluster) {
    return `cluster=${cluster}`;
  } else {
    return `clusterUrl=${clusterUrl}`;
  }
}

export function useRefreshPayer() {
  const dispatch = React.useContext(DispatchContext);
  if (!dispatch) {
    throw new Error(`useRefreshPayer must be used within a ApiProvider`);
  }
  return () => {
    refreshPayer(dispatch);
  };
}
