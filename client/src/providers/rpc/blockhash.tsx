import * as React from "react";
import { Blockhash, Connection } from "@solana/web3.js";
import { sleep, reportError } from "utils";
import { useConnection } from ".";

const POLL_INTERVAL_MS = 5000;

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
  const connection = useConnection();
  const connectionRef = React.useRef(connection);
  const refreshingRef = React.useRef(false);

  React.useEffect(() => {
    if (connection === undefined) return;

    connectionRef.current = connection;
    refresh(dispatch, connectionRef, refreshingRef);
    const timerId = window.setInterval(
      () => refresh(dispatch, connectionRef, refreshingRef),
      POLL_INTERVAL_MS
    );

    return () => {
      clearInterval(timerId);
      dispatch({ type: ActionType.Stop });
    };
  }, [connection]);

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
  connectionRef: React.MutableRefObject<Connection | undefined>,
  refreshingRef: React.MutableRefObject<boolean>
) {
  let blockhash = undefined;
  const connection = connectionRef.current;
  if (connection === undefined) return;

  if (refreshingRef.current) return;
  refreshingRef.current = true;

  let reported = false;
  while (blockhash === undefined && connection === connectionRef.current) {
    try {
      blockhash = (await connection.getRecentBlockhash()).blockhash;
      dispatch({ type: ActionType.Update, blockhash });
    } catch (err) {
      if (!reported) reportError(err, "Failed to refresh blockhash");
      reported = true;
      await sleep(1000);
    }
  }

  refreshingRef.current = false;
}
