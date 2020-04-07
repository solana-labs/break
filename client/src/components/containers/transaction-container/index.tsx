import React, { useRef, useEffect } from "react";

import "./index.scss";
import TransactionSquare from "../transaction-square";
import * as Transaction from "../../../reducers/transactions/model";
import tapIcon from "@images/icons/tap.svg";

interface Props {
  transactions: Transaction.Model[];
  clusterParam: string;
  onTap: () => void;
}

export function TransactionContainer({
  transactions,
  clusterParam,
  onTap
}: Props) {
  const scrollEl = useRef<HTMLDivElement>(null);
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
          {transactions.map(item => (
            <TransactionSquare
              key={item.info.signature}
              status={item.status}
              information={item.info}
              clusterParam={clusterParam}
            />
          ))}
        </div>
      </div>

      <button className={`click-zone`} onClick={onTap}>
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
