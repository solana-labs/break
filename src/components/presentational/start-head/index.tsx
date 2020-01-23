import * as React from "react";

import "./index.scss";

interface IProps {
  transactionsCreated: number;
  confirmedCount: number;
}

export const StartHead = ({ transactionsCreated, confirmedCount }: IProps) => {
  return (
    <div className={"start-head-wrapper"}>
      <div className={"timer"}>
        <p>Transactions Created</p>
        <p>{transactionsCreated}</p>
      </div>
      <div className={"counter"}>
        <p>Transactions Confirmed</p>
        <p>{confirmedCount}</p>
      </div>
      <div className={"capacity"}>
        <p>Solana Capacity Used</p>
        <p> %</p>
      </div>
      <div className={"speed"}>
        <p>Transactions per Second</p>
        <p></p>
      </div>
    </div>
  );
};
