import React, { useRef, useEffect } from "react";
import useThrottle from "@react-hook/throttle";

import { TransactionSquare } from "./TxSquare";
import { useTransactions, useCreateTx } from "providers/transactions";

export function TransactionContainer() {
  const scrollEl = useRef<HTMLDivElement>(null);
  const rawTransactions = useTransactions();
  const [transactions, setTransactions] = useThrottle(rawTransactions, 10);
  const createTx = useCreateTx();

  useEffect(() => {
    setTransactions(rawTransactions);
  }, [rawTransactions, setTransactions]);

  useEffect(() => {
    const current = scrollEl.current;
    if (current) {
      current.scrollTop = current.scrollHeight;
    }
  }, [transactions]);

  return (
    <div className="card h-100 mb-0">
      <div className="card-header">
        <div className="text-truncate">Live Transaction Status</div>
        <div className="text-primary d-none d-md-block">
          Press any key to send a transaction
        </div>
      </div>
      <div className="card-body">
        <div className="tx-wrapper border-1 border-primary h-100 position-relative">
          <div ref={scrollEl} className="square-container" tabIndex={0}>
            {transactions.map(tx => (
              <TransactionSquare key={tx.signature} transaction={tx} />
            ))}
          </div>
        </div>
      </div>
      <div className="card-footer d-lg-none">
        <span
          className="btn btn-pink w-100 text-uppercase text-truncate"
          onClick={createTx}
        >
          <span className="fe fe-zap mr-2"></span>
          Send new transaction
        </span>
      </div>
    </div>
  );
}
