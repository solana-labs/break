import React, { useRef, useEffect } from "react";
import useThrottle from "@react-hook/throttle";

import "./index.scss";
import TransactionSquare from "../transaction-square";
import tapIcon from "images/icons/tap.svg";
import { useTransactions } from "providers/transactions";
import { useConfig } from "providers/api";
import { useCreateTx } from "providers/transactions";

export function TransactionContainer() {
  const scrollEl = useRef<HTMLDivElement>(null);
  const { clusterParam } = useConfig();
  const createTx = useCreateTx();
  const rawTransactions = useTransactions();
  const [transactions, setTransactions] = useThrottle(rawTransactions, 10);

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
    <>
      <div className={`square-container-wrapper`}>
        <div ref={scrollEl} className={`square-container`} tabIndex={0}>
          {transactions.map(tx => (
            <TransactionSquare
              key={tx.signature}
              transaction={tx}
              clusterParam={clusterParam}
            />
          ))}
        </div>
      </div>

      <button className={`click-zone`} onClick={createTx}>
        <div className={"tap-icon-wrapper"}>
          <img src={tapIcon} alt="tap" />
          <p>
            tap <br /> here
          </p>
        </div>
        <p className={"info"}>Or use keyboard button</p>
      </button>
    </>
  );
}
