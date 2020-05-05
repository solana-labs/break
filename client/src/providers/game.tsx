import React from "react";
import { useHistory, useRouteMatch } from "react-router-dom";
import { useConfig, useRefreshAccounts } from "providers/api";
import { useSocket } from "providers/socket";
import { useBlockhash } from "providers/blockhash";
import { useDispatch, ActionType } from "providers/transactions";

export const COUNTDOWN_SECS = 15;

type GameState = "loading" | "ready" | number | "reset";
type SetGameState = React.Dispatch<React.SetStateAction<GameState>>;
const GameStateContext = React.createContext<
  [GameState, SetGameState] | undefined
>(undefined);

type Props = { children: React.ReactNode };
export function GameStateProvider({ children }: Props) {
  const [gameState, setGameState] = React.useState<GameState>("loading");
  const resultsTimerRef = React.useRef<NodeJS.Timer | undefined>(undefined);
  const history = useHistory();
  const blockhash = useBlockhash();
  const config = useConfig();
  const socket = useSocket();
  const isResultsRoute = !!useRouteMatch("/results");

  React.useEffect(() => {
    const isLoading = !blockhash || !config || !socket;
    if (isLoading) {
      setGameState("loading");
    } else if (gameState === "loading") {
      setGameState(isResultsRoute ? "reset" : "ready");
    }
  }, [isResultsRoute, gameState, blockhash, config, socket]);

  React.useEffect(() => {
    if (typeof gameState === "number") {
      if (!resultsTimerRef.current) {
        resultsTimerRef.current = setTimeout(() => {
          setGameState("reset");
          history.push("/results");
        }, COUNTDOWN_SECS * 1000);
      }
    } else if (resultsTimerRef.current) {
      clearTimeout(resultsTimerRef.current);
      resultsTimerRef.current = undefined;
    }
  }, [gameState, history]);

  return (
    <GameStateContext.Provider value={[gameState, setGameState]}>
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

export function useResetGame() {
  const refreshAccounts = useRefreshAccounts();
  const history = useHistory();
  const dispatch = useDispatch();

  return () => {
    refreshAccounts();
    dispatch({ type: ActionType.ResetState });
    history.push("/game");
  };
}
