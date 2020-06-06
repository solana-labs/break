import React from "react";
import { useHistory, useRouteMatch, useLocation } from "react-router-dom";
import { useConfig, useRefreshAccounts, useAccounts } from "providers/api";
import { useSocket } from "providers/socket";
import { useBlockhash } from "providers/blockhash";
import { useDispatch, ActionType } from "providers/transactions";
import { usePaymentAccount } from "./payment";

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
  const location = useLocation();
  const blockhash = useBlockhash();
  const config = useConfig();
  const accounts = useAccounts();
  const socket = useSocket();
  const isResultsRoute = !!useRouteMatch("/results");

  React.useEffect(() => {
    const isLoading = !blockhash || !config || !socket || !accounts;
    if (isLoading) {
      setGameState("loading");
    } else if (gameState === "loading") {
      setGameState(isResultsRoute ? "reset" : "ready");
    }
  }, [isResultsRoute, gameState, blockhash, config, accounts, socket]);

  React.useEffect(() => {
    if (typeof gameState === "number") {
      if (!resultsTimerRef.current) {
        resultsTimerRef.current = setTimeout(() => {
          setGameState("reset");
          history.push({ ...location, pathname: "/results" });
        }, COUNTDOWN_SECS * 1000);
      }
    } else if (resultsTimerRef.current) {
      clearTimeout(resultsTimerRef.current);
      resultsTimerRef.current = undefined;
    }
  }, [gameState, history, location]);

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
  const paymentAccount = usePaymentAccount();
  const refreshAccounts = useRefreshAccounts();
  const history = useHistory();
  const location = useLocation();
  const dispatch = useDispatch();

  return React.useCallback(() => {
    refreshAccounts(paymentAccount);
    dispatch({ type: ActionType.ResetState });
    history.push({ ...location, pathname: "/game" });
  }, [refreshAccounts, history, location, dispatch, paymentAccount]);
}
