import * as React from "react";

import { SlotTiming, useLeaderSchedule } from "providers/slot";

interface Props {
  timing?: SlotTiming;
  slot: number;
}

export function timeElapsed(
  sentAt: number | undefined,
  receivedAt: number | undefined
): string | undefined {
  if (sentAt === undefined || receivedAt === undefined) return;
  return (Math.max(0, receivedAt - sentAt) / 1000).toFixed(3) + "s";
}

export function timestamp(sentAt: number | undefined): string | undefined {
  if (sentAt === undefined) return;
  const date = new Date(sentAt);
  const pad = (num: number, length: number) =>
    num.toString().padStart(length, "0");
  return `${pad(date.getHours(), 2)}:${pad(date.getMinutes(), 2)}:${pad(
    date.getSeconds(),
    2
  )}.${pad(date.getMilliseconds(), 3)}`;
}

export function SlotTableRow({ slot, timing }: Props) {
  const schedule = useLeaderSchedule().current;
  function TdTimestamp({ time }: { time: number | undefined }) {
    return (
      <td>
        <div className="d-flex flex-column">
          <span className="text-sm text-muted">
            {timeElapsed(timing?.firstShred, time)}
          </span>
          <div>{timestamp(time) || "-"}</div>
        </div>
      </td>
    );
  }

  const leader = React.useMemo(() => {
    if (schedule) {
      const [offset, leaderSchedule] = schedule;
      for (let [leader, slots] of Object.entries(leaderSchedule)) {
        if (slots.indexOf(slot - offset) >= 0) {
          return leader;
        }
      }
    }
  }, [slot, schedule]);

  let txCount, txSuccessRate, avgTpe;
  if (timing?.stats) {
    txCount =
      timing.stats.numSuccessfulTransactions +
      timing.stats.numFailedTransactions;
    const rawTxRate = timing.stats.numSuccessfulTransactions / txCount;
    txSuccessRate = `${(100 * rawTxRate).toFixed(1)}%`;
    avgTpe = (txCount / timing?.stats.numTransactionEntries).toFixed(1);
  }

  return (
    <tr className="debug-row text-monospace">
      <td>{leader ? leader.slice(0, 7) : "-"}</td>
      <td>
        <div className="d-flex flex-column">
          <span className="text-xs text-muted">
            {timing?.parent + "┐" || "-"}
          </span>
          <div>&emsp;{slot}</div>
        </div>
      </td>
      <td>{txCount || "-"}</td>
      <td>{txSuccessRate || "-"}</td>
      <td>{timing?.stats?.numTransactionEntries || "-"}</td>
      <td>{avgTpe || "-"}</td>
      <td>{timing?.stats?.maxTransactionsPerEntry || "-"}</td>
      <TdTimestamp time={timing?.firstShred} />
      <TdTimestamp time={timing?.fullSlot} />
      <TdTimestamp time={timing?.createdBank} />
      {timing?.err === undefined ? (
        <>
          <TdTimestamp time={timing?.frozen} />
          <TdTimestamp time={timing?.confirmed} />
          <TdTimestamp time={timing?.rooted} />
        </>
      ) : (
        <>
          <TdTimestamp time={timing?.dead} />
          <td colSpan={2}>{timing?.err}</td>
        </>
      )}
    </tr>
  );
}
