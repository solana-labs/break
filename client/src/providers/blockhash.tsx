import * as React from "react";
import { Blockhash, Connection } from "@solana/web3.js";
import { useConfig } from "./api";
import { sleep } from "utils";

const POLL_INTERVAL_MS = 20000;

export enum ActionType {
  Start,
  Stop,
  Update,
}

interface Stop {
  type: ActionType.Stop;
}

interface Update {
  type: ActionType.Update;
  blockhash: Blockhash;
}

interface State {
  blockhash?: Blockhash;
}

type Action = Stop | Update;
type Dispatch = (action: Action) => void;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case ActionType.Stop: {
      return {};
    }
    case ActionType.Update: {
      return Object.assign({}, state, {
        blockhash: action.blockhash,
      });
    }
  }
}

const StateContext = React.createContext<State | undefined>(undefined);
const DispatchContext = React.createContext<Dispatch | undefined>(undefined);

type BlockhashProviderProps = { children: React.ReactNode };
export function BlockhashProvider({ children }: BlockhashProviderProps) {
  const [state, dispatch] = React.useReducer(reducer, {});
  const clusterUrl = useConfig()?.clusterUrl;
  const clusterUrlRef = React.useRef(clusterUrl || "");

  React.useEffect(() => {
    if (!clusterUrl) return;

    clusterUrlRef.current = clusterUrl;
    refresh(dispatch, clusterUrlRef);
    const timerId = window.setInterval(
      () => refresh(dispatch, clusterUrlRef),
      POLL_INTERVAL_MS
    );

    return () => {
      clearInterval(timerId);
      dispatch({ type: ActionType.Stop });
    };
  }, [clusterUrl]);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useBlockhash() {
  const state = React.useContext(StateContext);
  if (!state) {
    throw new Error(`useBlockhash must be used within a BlockhashProvider`);
  }

  return state.blockhash;
}

async function refresh(
  dispatch: Dispatch,
  clusterUrlRef: React.MutableRefObject<string>
) {
  let blockhash = undefined;
  const clusterUrl = clusterUrlRef.current;
  const connection = new Connection(clusterUrl);
  while (blockhash === undefined && clusterUrl === clusterUrlRef.current) {
    try {
      blockhash = (await connection.getRecentBlockhash()).blockhash;
      dispatch({ type: ActionType.Update, blockhash });
    } catch (err) {
      console.error("Failed to refresh blockhash", err);
      await sleep(1000);
    }
  }
}
