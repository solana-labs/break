import React from "react";
import { useHistory, useLocation } from "react-router-dom";

import { useConfig } from "providers/server/http";
import { useSocket } from "providers/server/socket";
import { useBlockhash } from "providers/rpc/blockhash";
import { useDispatch as useTransactionsDispatch } from "providers/transactions";
import { DEBUG_MODE } from "providers/transactions/confirmed";
import { useAccountsState } from "./accounts";
import { useConnection } from "./rpc";

export const COUNTDOWN_SECS = DEBUG_MODE ? 1500 : 15;

type GameStatus = "loading" | "setup" | "play" | "finished";
export type LoadingPhase =
  | "blockhash"
  | "socket"
  | "config"
  | "costs"
  | "creating-accounts"
  | "complete";

export interface GameState {
  status: GameStatus;
  loadingPhase: LoadingPhase;
  countdownStartTime: number | undefined;
  prepareGame: () => void;
  resetGame: () => void;
  startGame: () => void;
}

const GameStateContext = React.createContext<GameState | undefined>(undefined);

type Props = { children: React.ReactNode };
export function GameStateProvider({ children }: Props) {
  const [status, setGameStatus] = React.useState<GameStatus>("loading");
  const connection = useConnection();
  const blockhash = useBlockhash();
  const config = useConfig();
  const socket = useSocket();
  const accountsState = useAccountsState();
  const loadingPhase: LoadingPhase = React.useMemo(() => {
    if (!config) return "config";
    if (!blockhash) return "blockhash";
    if (!accountsState.creationCost) return "costs";
    if (!socket) return "socket";
    if (accountsState.status === "creating") return "creating-accounts";
    return "complete";
  }, [blockhash, config, socket, accountsState]);

  React.useEffect(() => {
    setGameStatus("loading");
  }, [connection]);

  React.useEffect(() => {
    if (status === "loading" && loadingPhase === "complete") {
      setGameStatus("setup");
    }
  }, [status, loadingPhase]);

  const history = useHistory();
  const location = useLocation();
  const resultsTimerRef = React.useRef<NodeJS.Timer>();
  const [countdownStartTime, setCountdownStart] = React.useState<number>();
  React.useEffect(() => {
    if (countdownStartTime !== undefined) {
      if (!resultsTimerRef.current) {
        resultsTimerRef.current = setTimeout(() => {
          setGameStatus("finished");
          history.push({ ...location, pathname: "/results" });
        }, COUNTDOWN_SECS * 1000);
      }
    } else if (resultsTimerRef.current) {
      clearTimeout(resultsTimerRef.current);
      resultsTimerRef.current = undefined;
    }
  }, [countdownStartTime, history, location]);

  const startGame = React.useCallback(() => {
    setCountdownStart(performance.now());
  }, []);

  const transactionsDispatch = useTransactionsDispatch();
  const resetGame = React.useCallback(() => {
    setGameStatus("setup");
    setCountdownStart(undefined);
    transactionsDispatch({ type: "reset" });
    accountsState.deactivate();
    history.push({ ...location, pathname: "/start" });
  }, [accountsState, history, location, transactionsDispatch]);

  const prepareGame = React.useCallback(() => {
    setGameStatus("play");
    accountsState.createAccounts();
    history.push({ ...location, pathname: "/game" });
  }, [accountsState, history, location]);

  const gameState: GameState = React.useMemo(
    () => ({
      status,
      loadingPhase,
      countdownStartTime,
      resetGame,
      prepareGame,
      startGame,
    }),
    [
      status,
      loadingPhase,
      countdownStartTime,
      prepareGame,
      startGame,
      resetGame,
    ]
  );

  return (
    <GameStateContext.Provider value={gameState}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = React.useContext(GameStateContext);
  if (!context) {
    throw new Error(`useGameState must be used within a GameStateProvider`);
  }
  return context;
}
