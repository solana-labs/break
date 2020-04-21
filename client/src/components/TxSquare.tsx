import * as React from "react";

import "styles/animate.scss";
import { UserTransaction } from "providers/transactions";
import { useSelectTransaction } from "providers/transactions/selected";

interface Props {
  transaction: UserTransaction;
}

export function TransactionSquare({ transaction }: Props) {
  const { status, signature } = transaction;
  const selectTransaction = useSelectTransaction();

  let statusClass = "";
  if (status === "success") {
    statusClass = "primary";
  } else if (status === "timeout") {
    statusClass = "danger";
  } else if (typeof status === "object" && "msg" in status) {
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
