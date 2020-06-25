import React from "react";
import {
  Config,
  configFromInit,
  configFromAccounts,
  AccountsConfig,
} from "./config";
import { sleep, PAYMENT_ACCOUNT } from "utils";
import { useServer } from "providers/server";
import { useBalance } from "providers/payment";

export enum ConfigStatus {
  Initialized,
  Fetching,
  Ready,
  Failure,
}

interface State {
  status: ConfigStatus;
  config?: Config;
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
}

type Action = Initialized | Fetching | Ready | Failure;
type Dispatch = (action: Action) => void;

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
const DispatchContext = React.createContext<
  [React.MutableRefObject<string>, Dispatch] | undefined
>(undefined);

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
    refreshAccounts(dispatch, httpUrlRef, paymentRequired);
  }, [httpUrl, paymentRequired]);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={[httpUrlRef, dispatch]}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

async function initConfig(
  dispatch: Dispatch,
  httpUrlRef: React.MutableRefObject<string>
): Promise<void> {
  dispatch({
    status: ConfigStatus.Fetching,
  });

  const httpUrl = httpUrlRef.current;

  let retries = 3;
  while (retries > 0 && httpUrl === httpUrlRef.current) {
    retries--;

    try {
      const body = JSON.stringify({ split: splitParam });
      const response = await fetch(
        new Request(httpUrl + "/init", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        })
      );
      const data = await response.json();
      if (!("cluster" in data) || !("programId" in data)) {
        throw new Error("Received invalid response");
      }

      if (httpUrl === httpUrlRef.current) {
        dispatch({
          status: ConfigStatus.Initialized,
          config: configFromInit(data),
        });
      }

      break;
    } catch (err) {
      console.error("Failed to initialize", err);
      if (httpUrl === httpUrlRef.current) {
        dispatch({ status: ConfigStatus.Failure });
        await sleep(2000);
      }
    }
  }
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

async function refreshAccounts(
  dispatch: Dispatch,
  httpUrlRef: React.MutableRefObject<string>,
  paymentRequired: boolean
) {
  dispatch({
    status: ConfigStatus.Fetching,
  });

  const httpUrl = httpUrlRef.current;
  let retries = 3;
  while (retries > 0 && httpUrl === httpUrlRef.current) {
    retries--;
    try {
      const postData: RefreshData = {};
      if (splitParam) {
        postData.split = splitParam;
      }
      if (paymentRequired) {
        postData.paymentKey = Buffer.from(PAYMENT_ACCOUNT.secretKey).toString(
          "base64"
        );
      }

      const body = JSON.stringify(postData);
      const response = await fetch(
        new Request(httpUrl + "/accounts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        })
      );

      if (response.status === 400) {
        const error = await response.text();
        console.error("Failed to refresh fee accounts", error);
        if (httpUrl === httpUrlRef.current) {
          dispatch({ status: ConfigStatus.Failure });
        }
      } else if (response.status === 500) {
        const error = await response.text();
        throw new Error(error);
      } else {
        const data = await response.json();
        if (
          !("programAccounts" in data) ||
          !("feeAccounts" in data) ||
          !("accountCapacity" in data)
        ) {
          throw new Error("Received invalid response");
        }

        if (httpUrl === httpUrlRef.current) {
          dispatch({
            status: ConfigStatus.Ready,
            accounts: configFromAccounts(data),
          });
        }
      }
      break;
    } catch (err) {
      console.error("Failed to refresh fee accounts", err);
      await sleep(2000);
    }
  }
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
  const context = React.useContext(DispatchContext);
  if (!context) {
    throw new Error(`useRefreshAccounts must be used within a ApiProvider`);
  }
  const [httpUrlRef, dispatch] = context;
  const paymentRequired = useConfig()?.paymentRequired;
  const balance = useBalance();
  const cost = useConfig()?.gameCost;
  return React.useCallback(() => {
    if (paymentRequired === undefined || cost === undefined) return;
    if (paymentRequired && balance < cost) {
      dispatch({ status: ConfigStatus.Fetching });
      dispatch({ status: ConfigStatus.Failure });
      return;
    }
    refreshAccounts(dispatch, httpUrlRef, paymentRequired);
  }, [httpUrlRef, dispatch, paymentRequired, balance, cost]);
}
