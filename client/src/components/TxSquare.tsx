import * as React from "react";

import { UserTransaction } from "providers/transactions";
import { useSelectTransaction } from "providers/transactions/selected";

interface Props {
  key: string;
  transaction: UserTransaction;
}

export function TransactionSquare({ transaction, key }: Props) {
  const { status, signature } = transaction;
  const selectTransaction = useSelectTransaction();

  const noEvent = !signature ? "no-event" : "";

  let statusClass = "";
  if (status === "success") {
    statusClass = "success";
  } else if (status === "timeout") {
    statusClass = "timeout";
  } else if (typeof status === "object" && "msg" in status) {
    statusClass = "error";
  }

  const completedClass = status !== "sent" ? "completed" : "";

  return (
    <div
      key={key}
      onClick={() => selectTransaction(signature)}
      className={`btn square slideInRight ${statusClass} ${completedClass} ${noEvent}`}
    >
      <span className="fe fe-info"></span>
    </div>
  );
}
