import * as React from "react";

import "styles/animate.scss";
import { TransactionState } from "providers/transactions";
import { useSelectTransaction } from "providers/transactions/selected";

interface Props {
  transaction: TransactionState;
}

export function TxTableRow({ transaction }: Props) {
  const signature = transaction.details.signature;
  const selectTransaction = useSelectTransaction();

  let targetSlot;
  let landedSlot;
  let timing;
  if (transaction.status === "success") {
    targetSlot = transaction.slot.target;
    landedSlot = transaction.slot.landed;
    timing = transaction.timing;
  } else if (transaction.status === "timeout") {
  } else {
    targetSlot = transaction.pending.targetSlot;
  }

  return (
    <tr className="debug-row" onClick={() => selectTransaction(signature)}>
      <td className="text-monospace">{signature.slice(0, 10)}...</td>
      <td>{targetSlot || "-"}</td>
      <td>{landedSlot || "-"}</td>
      <td>{timing?.recent?.toFixed(3) || "-"}</td>
      <td>{timing?.singleGossip?.toFixed(3) || "-"}</td>
      <td>{timing?.single?.toFixed(3) || "-"}</td>
    </tr>
  );
}
