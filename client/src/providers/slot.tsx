import { LeaderSchedule } from "@solana/web3.js";
import React from "react";
import { useRouteMatch } from "react-router";
import { useConnection } from "./rpc";
import { DEBUG_MODE } from "./transactions/confirmed";

const SlotContext = React.createContext<
  React.MutableRefObject<number | undefined> | undefined
>(undefined);

const LeaderScheduleContext = React.createContext<
  React.MutableRefObject<[number, LeaderSchedule] | undefined> | undefined
>(undefined);

const SlotMetricsContext = React.createContext<
  React.MutableRefObject<Map<number, SlotTiming>> | undefined
>(undefined);

const LatestTimestampContext = React.createContext<
  React.MutableRefObject<number | undefined> | undefined
>(undefined);

const SlotMetricsCounter = React.createContext<number | undefined>(undefined);

export type SlotStats = {
  numTransactionEntries: number;
  numSuccessfulTransactions: number;
  numFailedTransactions: number;
  maxTransactionsPerEntry: number;
};

export type SlotTiming = {
  firstShred: number;
  parent?: number;
  fullSlot?: number;
  createdBank?: number;
  frozen?: number;
  dead?: number;
  err?: string;
  confirmed?: number;
  rooted?: number;
  stats?: SlotStats;
};

export function useTargetSlotRef() {
  const slotRef = React.useContext(SlotContext);
  if (!slotRef) {
    throw new Error(`useTargetSlotRef must be used within a SlotProvider`);
  }

  return slotRef;
}

export function useLeaderSchedule() {
  const res = React.useContext(LeaderScheduleContext);
  if (!res) {
    throw new Error(`useLeaderSchedule must be used within a SlotProvider`);
  }

  return res;
}

export function useSlotTiming() {
  React.useContext(SlotMetricsCounter);
  const ref = React.useContext(SlotMetricsContext);
  if (!ref) {
    throw new Error(`useSlotMetricsRef must be used within a SlotProvider`);
  }

  return ref;
}

export function useLatestTimestamp() {
  const latest = React.useContext(LatestTimestampContext);
  if (!latest) {
    throw new Error(`useLatestTimestamp must be used within a SlotProvider`);
  }

  return latest;
}

type ProviderProps = { children: React.ReactNode };
export function SlotProvider({ children }: ProviderProps) {
  const connection = useConnection();
  const targetSlot = React.useRef<number>();
  const slotMetrics = React.useRef(new Map<number, SlotTiming>());
  const [metricsCounter, setCounter] = React.useState(0);
  const leaderSchedule = React.useRef<[number, LeaderSchedule]>();
  const latestTimestamp = React.useRef<number>();
  const isSlotsPage = !!useRouteMatch("/slots")?.isExact;

  React.useEffect(() => {
    if (connection) {
      (async () => {
        try {
          const epochInfo = await connection.getEpochInfo();
          const slotOffset = epochInfo.absoluteSlot - epochInfo.slotIndex;
          const schedule = await connection.getLeaderSchedule();
          leaderSchedule.current = [slotOffset, schedule];
        } catch (err) {
          console.error("failed to get leader schedule", err);
        }
      })();
    }
  }, [connection]);

  React.useEffect(() => {
    if (connection === undefined) {
      return;
    } else {
      slotMetrics.current.clear();
    }

    let slotSubscription: number | undefined;
    let slotUpdateSubscription: number | undefined;

    slotSubscription = connection.onSlotChange(({ slot }) => {
      if (!DEBUG_MODE && !isSlotsPage) {
        targetSlot.current = slot;
      }
    });

    const interval = setInterval(() => {
      setCounter((c) => c + 1);
    }, 1000);

    if (DEBUG_MODE || isSlotsPage) {
      slotUpdateSubscription = connection.onSlotUpdate((notification) => {
        // Remove if slot update api is active
        if (slotSubscription !== undefined) {
          connection.removeSlotChangeListener(slotSubscription);
          slotSubscription = undefined;
        }

        const { slot, timestamp } = notification;
        latestTimestamp.current = timestamp;
        if (notification.type === "firstShredReceived") {
          targetSlot.current = Math.max(slot, targetSlot.current || 0);
          slotMetrics.current.set(slot, {
            firstShred: timestamp,
          });
          return;
        }

        const slotTiming = slotMetrics.current.get(slot);
        if (!slotTiming) {
          return;
        }

        switch (notification.type) {
          case "completed": {
            slotTiming.fullSlot = timestamp;
            break;
          }
          case "createdBank": {
            slotTiming.parent = notification.parent;
            slotTiming.createdBank = timestamp;
            break;
          }
          case "dead": {
            slotTiming.dead = timestamp;
            slotTiming.err = notification.err;
            break;
          }
          case "frozen": {
            slotTiming.frozen = timestamp;
            slotTiming.stats = notification.stats;
            break;
          }
          case "optimisticConfirmation": {
            slotTiming.confirmed = timestamp;
            break;
          }
          case "root": {
            // Root notification may be sent twice
            if (!slotTiming.rooted) {
              slotTiming.rooted = timestamp;
            }
            break;
          }
        }
      });
    }

    return () => {
      clearInterval(interval);
      if (slotSubscription !== undefined) {
        connection.removeSlotChangeListener(slotSubscription);
      }
      if (slotUpdateSubscription !== undefined) {
        connection.removeSlotUpdateListener(slotUpdateSubscription);
      }
    };
  }, [connection, isSlotsPage]);

  return (
    <SlotContext.Provider value={targetSlot}>
      <SlotMetricsContext.Provider value={slotMetrics}>
        <SlotMetricsCounter.Provider value={metricsCounter}>
          <LeaderScheduleContext.Provider value={leaderSchedule}>
            <LatestTimestampContext.Provider value={latestTimestamp}>
              {children}
            </LatestTimestampContext.Provider>
          </LeaderScheduleContext.Provider>
        </SlotMetricsCounter.Provider>
      </SlotMetricsContext.Provider>
    </SlotContext.Provider>
  );
}
