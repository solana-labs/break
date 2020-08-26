import * as React from "react";

import "styles/animate.scss";
import { TransactionState } from "providers/transactions";
import { useSelectTransaction } from "providers/transactions/selected";

interface Props {
  transaction: TransactionState;
}

export function TransactionSquare({ transaction }: Props) {
  const { status, details } = transaction;
  const selectTransaction = useSelectTransaction();

  let statusClass = "";
  if (transaction.status === "success") {
    statusClass = "primary";
  } else if (status === "timeout") {
    statusClass = "danger";
  } else {
    statusClass = "dark";
  }

  return (
    <div
      onClick={() => selectTransaction(details.signature)}
      className={`btn d-flex flex-column justify-content-center align-items-center square slideInRight btn-${statusClass}`}
    ></div>
  );
}
