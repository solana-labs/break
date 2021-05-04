import React from "react";
import { Config } from "./config";
import { useServer } from "providers/server";
import { fetchWithRetry } from "./request";
import { Connection } from "@solana/web3.js";

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
}

interface Failure {
  status: ConfigStatus.Failure;
  config?: undefined;
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
export function HttpProvider({ children }: ApiProviderProps) {
  const [state, dispatch] = React.useReducer(configReducer, {
    status: ConfigStatus.Fetching,
  });

  const { httpUrl } = useServer();
  const httpUrlRef = React.useRef(httpUrl);
  React.useEffect(() => {
    httpUrlRef.current = httpUrl;
    initConfig(dispatch, httpUrlRef);
  }, [httpUrl]);

  React.useEffect(() => {
    httpUrlRef.current = httpUrl;
  }, [httpUrl]);

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
  return fetchWithRetry(dispatch, httpUrlRef);
}

export function useConfig() {
  const context = React.useContext(StateContext);
  if (!context) {
    throw new Error(`useConfig must be used within a ApiProvider`);
  }
  return context.config;
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
  const cluster = context.config?.cluster;
  const rpcUrl = context.config?.rpcUrl;
  if (!cluster && rpcUrl) {
    return `cluster=custom&customUrl=${rpcUrl}`;
  } else if (cluster && cluster !== "mainnet-beta") {
    return `cluster=${cluster}`;
  } else {
    return "";
  }
}
