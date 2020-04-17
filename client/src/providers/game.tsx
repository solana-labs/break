import React from "react";
import { useHistory } from "react-router-dom";

export const COUNTDOWN_SECS = 15;

type GameState = number | "ready" | "paused" | "reset";
type SetGameState = React.Dispatch<React.SetStateAction<GameState>>;
const GameStateContext = React.createContext<
  [GameState, SetGameState] | undefined
>(undefined);

type Props = { children: React.ReactNode };
export function GameStateProvider({ children }: Props) {
  const [gameState, setGameState] = React.useState<GameState>("ready");
  const resultsTimerRef = React.useRef<NodeJS.Timer | undefined>(undefined);
  const history = useHistory();

  React.useEffect(() => {
    if (typeof gameState === "number") {
      if (!resultsTimerRef.current) {
        resultsTimerRef.current = setTimeout(() => {
          history.push("/results");
        }, COUNTDOWN_SECS * 1000);
      }
    } else if (resultsTimerRef.current) {
      clearTimeout(resultsTimerRef.current);
      resultsTimerRef.current = undefined;
    }
  }, [gameState, setGameState, history]);

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
