import * as React from "react";

import "styles/animate.scss";
import { TransactionState } from "providers/transactions";
import { useSelectTransaction } from "providers/transactions/selected";

interface Props {
  transaction: TransactionState;
}

const debugMode = new URLSearchParams(window.location.search).has("debug");

export function TransactionSquare({ transaction }: Props) {
  const { status, details } = transaction;
  const selectTransaction = useSelectTransaction();

  let statusClass = "";
  let confirmationTime = "-";
  let slot = "-";
  if (transaction.status === "success") {
    statusClass = "primary";
    confirmationTime = "" + Math.floor(transaction.confirmationTime * 1000);
    const slotString = "" + transaction.slot;
    slot = slotString.substring(slotString.length - 3);
  } else if (status === "timeout") {
    statusClass = "danger";
  } else {
    statusClass = "dark";
  }

  return (
    <div
      onClick={() => selectTransaction(details.signature)}
      className={`btn d-flex flex-column justify-content-center align-items-center square slideInRight btn-${statusClass}`}
    >
      {debugMode && (
        <>
          <div>#{slot}</div>
          <div>{confirmationTime}ms</div>
        </>
      )}
    </div>
  );
}
