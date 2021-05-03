import React, { useRef, useEffect, useCallback } from "react";

import { TransactionSquare } from "./TxSquare";
import { useCreateTxRef, useTransactions } from "providers/transactions";
import { useGameState, COUNTDOWN_SECS } from "providers/game";
import { TxTableRow } from "./TxTableRow";
import { DEBUG_MODE } from "providers/transactions/confirmed";

export function TransactionContainer({ enabled }: { enabled?: boolean }) {
  const createTxRef = useCreateTxRef();
  const gameState = useGameState();
  const [rapidFire, setRapidFire] = React.useState(false);
  const countdownStart = gameState.countdownStartTime;

  const makeTransaction = useCallback(() => {
    if (enabled) {
      console.log("make tx", JSON.stringify(gameState));
      if (gameState.countdownStartTime !== undefined) {
        createTxRef.current();
      } else if (gameState.status === "play") {
        createTxRef.current();
        gameState.startGame();
      }
    }
  }, [enabled, createTxRef, gameState]);

  useEffect(() => {
    if (rapidFire && !enabled) {
      setRapidFire(false);
      return;
    } else if (!rapidFire) {
      return;
    }

    let intervalId: NodeJS.Timeout;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        makeTransaction();
      }, 30);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [rapidFire, enabled, makeTransaction]);

  useEffect(() => {
    const testMode = new URLSearchParams(window.location.search).has("test");
    if (!testMode) return;
    makeTransaction();
    const testInterval = window.setInterval(() => makeTransaction(), 1000);
    return () => clearInterval(testInterval);
  }, [makeTransaction]);

  useEffect(() => {
    document.addEventListener("keyup", makeTransaction);
    return () => {
      document.removeEventListener("keyup", makeTransaction);
    };
  }, [makeTransaction]);

  return (
    <div className="card h-100 mb-0">
      <div className="card-header">
        <div className="d-flex align-items-center">
          <HelpButton />
          <span className="text-truncate">Live Transaction Statuses</span>
        </div>
        <div className="text-primary d-none d-md-block">
          {enabled ? "Press any key to send a transaction" : "Game finished"}
        </div>
      </div>
      {DEBUG_MODE ? (
        <DebugTable />
      ) : (
        <div className="card-body">
          <div className="tx-wrapper border-1 border-primary h-100 position-relative">
            {countdownStart === undefined && enabled ? (
              <div className="d-flex h-100 justify-content-center align-items-center p-3">
                <h2 className="text-center">
                  Try to break Solana's network by sending as many transactions
                  as you can in {COUNTDOWN_SECS} seconds!
                </h2>
              </div>
            ) : null}
            <InnerContainer />
          </div>
        </div>
      )}
      <div className="card-footer">
        <button
          className="btn btn-pink w-100 text-uppercase text-truncate touch-action-none"
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={() => setRapidFire(true)}
          onPointerUp={() => setRapidFire(false)}
          onPointerLeave={() => setRapidFire(false)}
          onPointerCancel={() => setRapidFire(false)}
          disabled={!enabled}
          onClick={makeTransaction}
        >
          {enabled && <span className="fe fe-zap mr-2"></span>}
          {enabled ? "Send new transactions" : "Game finished"}
        </button>
      </div>
    </div>
  );
}

function DebugTable() {
  const scrollEl = useRef<HTMLDivElement>(null);
  const transactions = useTransactions();

  useEffect(() => {
    const current = scrollEl.current;
    if (current) {
      current.scrollTop = current.scrollHeight;
    }
  }, [transactions.length]);

  return (
    <div className="main">
      <div className="content">
        <div ref={scrollEl} className="debug-wrapper">
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th className="text-muted sticky">Transaction</th>
                <th className="text-muted sticky">Target Slot</th>
                <th className="text-muted sticky">Inclusion Slot</th>
                <th className="text-muted sticky">Tx Count</th>
                <th className="text-muted sticky">Tx Success %</th>
                <th className="text-muted sticky">Tx Entries</th>
                <th className="text-muted sticky">Avg Tx Per Entry</th>
                <th className="text-muted sticky">Max Tx Per Entry</th>
                <th className="text-muted sticky">First Shred</th>
                <th className="text-muted sticky">Tx Landed</th>
                <th className="text-muted sticky">Shreds Full</th>
                <th className="text-muted sticky">Bank Created</th>
                <th className="text-muted sticky">Bank Frozen</th>
                <th className="text-muted sticky">Confirmed</th>
                <th className="text-muted sticky">Rooted</th>
              </tr>
            </thead>
            <tbody className="list">
              {transactions.map((tx) => (
                <TxTableRow key={tx.details.signature} transaction={tx} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InnerContainer() {
  const scrollEl = useRef<HTMLDivElement>(null);
  const transactions = useTransactions();

  useEffect(() => {
    const current = scrollEl.current;
    if (current) {
      current.scrollTop = current.scrollHeight;
    }
  }, [transactions.length]);

  const renderTransactions = transactions.map((tx) => (
    <TransactionSquare key={tx.details.signature} transaction={tx} />
  ));

  return (
    <div ref={scrollEl} className="square-container" tabIndex={0}>
      {renderTransactions}
    </div>
  );
}

function HelpButton() {
  const [show, setShow] = React.useState(false);

  return (
    <div
      className="popover-container c-pointer mr-3"
      onClick={() => setShow(true)}
      onMouseOver={() => setShow(true)}
      onMouseOut={() => setShow(false)}
    >
      <span className="fe fe-help-circle"></span>
      <Legend show={show} />
    </div>
  );
}

function Legend({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="popover bs-popover-bottom right show">
      <div className="arrow" />
      <div className="popover-body">
        <div className="d-flex flex-column">
          <div className="d-flex align-items-center mb-3">
            <div className="btn square legend slideInRight btn-dark mr-2" />
            <span>Pending transaction</span>
          </div>

          <div className="d-flex align-items-center mb-3">
            <div className="btn square legend slideInRight btn-primary mr-2" />
            <span>Confirmed transaction</span>
          </div>

          <div className="d-flex align-items-center">
            <div className="btn square legend slideInRight btn-danger mr-2" />
            <span>Failed transaction</span>
          </div>
        </div>
      </div>
    </div>
  );
}
