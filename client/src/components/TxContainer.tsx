import React, { useRef, useEffect, useCallback } from "react";

import { TransactionSquare } from "./TxSquare";
import { useCreateTxRef, useTransactions } from "providers/transactions";
import {
  useGameState,
  useResetGame,
  COUNTDOWN_SECS,
  useCountdown,
} from "providers/game";
import { TxTableRow } from "./TxTableRow";
import { DEBUG_MODE } from "providers/transactions/confirmed";

export function TransactionContainer({ enabled }: { enabled?: boolean }) {
  const createTxRef = useCreateTxRef();
  const gameState = useGameState();
  const [countdown, setCountdown] = useCountdown();
  const resetGame = useResetGame();
  const [rapidFire, setRapidFire] = React.useState(false);

  const makeTransaction = useCallback(() => {
    if (enabled) {
      if (countdown !== undefined) {
        createTxRef.current();
      } else if (gameState === "play") {
        createTxRef.current();
        setCountdown(performance.now());
      }
    }
  }, [enabled, createTxRef, gameState, countdown, setCountdown]);

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
    const testInterval = window.setInterval(() => makeTransaction(), 30);
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
      <div className="card-body">
        <div className="tx-wrapper border-1 border-primary h-100 position-relative">
          {countdown === undefined && enabled ? (
            <div className="d-flex h-100 justify-content-center align-items-center p-3">
              <h2 className="text-center">
                Try to break Solana's network by sending as many transactions as
                you can in {COUNTDOWN_SECS} seconds!
              </h2>
            </div>
          ) : null}
          <InnerContainer />
        </div>
      </div>
      <div className="card-footer">
        <span
          className="btn btn-pink w-100 text-uppercase text-truncate touch-action-none"
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={() => setRapidFire(true)}
          onPointerUp={() => setRapidFire(false)}
          onPointerLeave={() => setRapidFire(false)}
          onPointerCancel={() => setRapidFire(false)}
          onClick={enabled ? makeTransaction : resetGame}
        >
          <span className={`fe fe-${enabled ? "zap" : "repeat"} mr-2`}></span>
          {enabled ? "Send new transactions" : "Play again"}
        </span>
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

  const renderTransactions = DEBUG_MODE ? (
    <div className="table-responsive mb-0">
      <table className="table table-sm table-nowrap">
        <thead>
          <tr>
            <th className="text-muted">Transaction</th>
            <th className="text-muted">Target Slot</th>
            <th className="text-muted">Landed Slot</th>
            <th className="text-muted">Recent Conf Time</th>
            <th className="text-muted">SingleGossip Conf Time</th>
            <th className="text-muted">Single Conf Time</th>
          </tr>
        </thead>
        <tbody className="list">
          {transactions.map((tx) => (
            <TxTableRow key={tx.details.signature} transaction={tx} />
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    transactions.map((tx) => (
      <TransactionSquare key={tx.details.signature} transaction={tx} />
    ))
  );

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
