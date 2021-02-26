import * as React from "react";

import "styles/animate.scss";
import { TransactionState } from "providers/transactions";
import { useSelectTransaction } from "providers/transactions/selected";
import { useSlotTiming } from "providers/slot";
import type { SlotTiming } from "providers/slot";

interface Props {
  transaction: TransactionState;
}

export function timeElapsed(
  sentAt: number | undefined,
  receivedAt: number | undefined
): string | undefined {
  if (sentAt === undefined || receivedAt === undefined) return;
  return (Math.max(0, receivedAt - sentAt) / 1000).toFixed(3) + "s";
}

export function TxTableRow({ transaction }: Props) {
  const signature = transaction.details.signature;
  const selectTransaction = useSelectTransaction();
  const slotMetrics = useSlotTiming();

  let targetSlot;
  let landedSlot: number | undefined;
  let timing;
  let received;
  if (transaction.status === "success") {
    targetSlot = transaction.slot.target;
    landedSlot = transaction.slot.landed;
    timing = transaction.timing;
    received = transaction.received;
  } else if (transaction.status === "timeout") {
  } else {
    targetSlot = transaction.pending.targetSlot;
    timing = transaction.timing;
    received = transaction.received;
  }

  let slotTiming: SlotTiming | undefined;
  let landedTime: number | undefined;
  if (landedSlot !== undefined) {
    landedTime = received?.find((r) => r.slot === landedSlot)?.timestamp;
    slotTiming = slotMetrics.current.get(landedSlot);
  }

  let txCount, txSuccessRate, avgTpe;
  if (slotTiming?.stats) {
    txCount =
      slotTiming.stats.numSuccessfulTransactions +
      slotTiming.stats.numFailedTransactions;
    const rawTxRate = slotTiming.stats.numSuccessfulTransactions / txCount;
    txSuccessRate = `${(100 * rawTxRate).toFixed(1)}%`;
    avgTpe = (txCount / slotTiming?.stats.numTransactionEntries).toFixed(1);
  }

  return (
    <tr
      className="debug-row text-monospace"
      onClick={() => selectTransaction(signature)}
    >
      <td>{signature.slice(0, 7)}…</td>
      <td>{targetSlot || "-"}</td>
      <td>{landedSlot || "-"}</td>
      <td>{txCount || "-"}</td>
      <td>{txSuccessRate || "-"}</td>
      <td>{slotTiming?.stats?.numTransactionEntries || "-"}</td>
      <td>{avgTpe || "-"}</td>
      <td>{slotTiming?.stats?.maxTransactionsPerEntry || "-"}</td>
      <td>{timeElapsed(timing?.subscribed, slotTiming?.firstShred) || "-"}</td>
      <td>{timeElapsed(timing?.subscribed, landedTime) || "-"}</td>
      <td>{timeElapsed(timing?.subscribed, slotTiming?.fullSlot) || "-"}</td>
      <td>{timeElapsed(timing?.subscribed, slotTiming?.createdBank) || "-"}</td>
      <td>{timeElapsed(timing?.subscribed, slotTiming?.frozen) || "-"}</td>
      <td>{timeElapsed(timing?.subscribed, slotTiming?.confirmed) || "-"}</td>
      <td>{timeElapsed(timing?.subscribed, slotTiming?.rooted) || "-"}</td>
    </tr>
  );
}
