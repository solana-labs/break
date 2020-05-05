import * as React from "react";

import "styles/animate.scss";
import { TransactionState } from "providers/transactions";
import { useSelectTransaction } from "providers/transactions/selected";

interface Props {
  transaction: TransactionState;
}

export function TransactionSquare({ transaction }: Props) {
  const { status, signature } = transaction;
  const selectTransaction = useSelectTransaction();

  let statusClass = "";
  if (status === "success") {
    statusClass = "primary";
  } else if (status === "timeout") {
    statusClass = "danger";
  } else {
    statusClass = "dark";
  }

  return (
    <div
      onClick={() => selectTransaction(signature)}
      className={`btn square slideInRight btn-${statusClass}`}
    />
  );
}
