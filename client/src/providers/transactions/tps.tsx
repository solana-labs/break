import * as React from "react";
import { useCreatedCount } from "./index";

const TPS_REFRESH_MS = 100;
const TPS_LOOK_BACK = 10;

export const TpsContext = React.createContext<number | undefined>(undefined);
type ProviderProps = { children: React.ReactNode };
export function TpsProvider({ children }: ProviderProps) {
  const recentCounts = React.useRef<number[]>([]);
  const [tps, setTps] = React.useState(0);
  const createdCount = useCreatedCount();
  const createdCountRef = React.useRef(createdCount);

  React.useEffect(() => {
    createdCountRef.current = createdCount;
  }, [createdCount]);

  React.useEffect(() => {
    recentCounts.current = [];
    const timerId = setInterval(() => {
      if (createdCountRef.current === 0) {
        recentCounts.current = [];
        setTps(0);
        return;
      }

      recentCounts.current.push(createdCountRef.current);
      while (recentCounts.current.length - 1 > TPS_LOOK_BACK) {
        recentCounts.current.shift();
      }

      const ticksElapsed = recentCounts.current.length - 1;
      if (ticksElapsed <= 0) return;

      const oldTxCount = recentCounts.current[0];
      const latestTxCount = recentCounts.current[ticksElapsed];
      const tps =
        (latestTxCount - oldTxCount) / ((TPS_REFRESH_MS / 1000) * ticksElapsed);
      setTps(Math.floor(tps));
    }, TPS_REFRESH_MS);
    return () => {
      clearInterval(timerId);
    };
  }, []);

  return <TpsContext.Provider value={tps}>{children}</TpsContext.Provider>;
}
