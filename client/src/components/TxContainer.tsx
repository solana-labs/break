import React, { useRef, useEffect, useCallback } from "react";
import useThrottle from "@react-hook/throttle";

import { TransactionSquare } from "./TxSquare";
import { useCreateTx, useTransactions } from "providers/transactions";
import { useGameState, useResetGame, COUNTDOWN_SECS } from "providers/game";

export function TransactionContainer({ enabled }: { enabled?: boolean }) {
  const scrollEl = useRef<HTMLDivElement>(null);
  const rawTransactions = useTransactions();
  const [transactions, setTransactions] = useThrottle(rawTransactions, 10);
  const createTx = useCreateTx();
  const [gameState, setGameState] = useGameState();
  const resetGame = useResetGame();
  const [rapidFire, setRapidFire] = React.useState(false);

  const makeTransaction = useCallback(() => {
    if (enabled) {
      if (typeof gameState === "number") {
        createTx();
      } else if (gameState === "ready") {
        createTx();
        setGameState(performance.now());
      }
    }
  }, [enabled, createTx, gameState, setGameState]);

  useEffect(() => {
    if (!rapidFire || !enabled) {
      setRapidFire(false);
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

  useEffect(() => {
    setTransactions(rawTransactions);
  }, [rawTransactions, setTransactions]);

  useEffect(() => {
    const current = scrollEl.current;
    if (current) {
      current.scrollTop = current.scrollHeight;
    }
  }, [transactions.length]);

  return (
    <div className="card h-100 mb-0">
      <div className="card-header">
        <div className="text-truncate">Live Transaction Statuses</div>
        <div className="text-primary d-none d-md-block">
          {enabled ? "Press any key to send a transaction" : "Game finished"}
        </div>
      </div>
      <div className="card-body">
        <div className="tx-wrapper border-1 border-primary h-100 position-relative">
          {!transactions.length && enabled ? (
            <div className="d-flex h-100 justify-content-center align-items-center p-3">
              <h2 className="text-center">
                Try to break Solana's network by sending as many transactions as
                you can in {COUNTDOWN_SECS} seconds!
              </h2>
            </div>
          ) : null}
          <div ref={scrollEl} className="square-container" tabIndex={0}>
            {transactions.map((tx) => (
              <TransactionSquare key={tx.signature} transaction={tx} />
            ))}
          </div>
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
