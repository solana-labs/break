import React from "react";
import { useHistory } from "react-router-dom";

export const COUNTDOWN_SECS = 15;
export const PAUSE_COUNTDOWN = -5;

type SetCountdown = React.Dispatch<React.SetStateAction<number | undefined>>;
const CountdownContext = React.createContext<
  [number | undefined, SetCountdown] | undefined
>(undefined);

type Props = { children: React.ReactNode };
export function CountdownProvider({ children }: Props) {
  const [countdown, setCountdown] = React.useState<number | undefined>(
    undefined
  );
  const timerRef = React.useRef<NodeJS.Timer | undefined>(undefined);
  const history = useHistory();

  React.useEffect(() => {
    if (countdown !== undefined) {
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          history.push("/results");
          timerRef.current = undefined;
        }, countdown * 1000);
      }
      if (countdown > PAUSE_COUNTDOWN) {
        setTimeout(() => {
          setCountdown(countdown - 1);
        }, 1000);
      }
    }
  }, [countdown, setCountdown]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <CountdownContext.Provider value={[countdown, setCountdown]}>
      {children}
    </CountdownContext.Provider>
  );
}

export function useCountdown() {
  const context = React.useContext(CountdownContext);
  if (!context) {
    throw new Error(`useCountdown must be used within a CountdownProvider`);
  }
  return context;
}
