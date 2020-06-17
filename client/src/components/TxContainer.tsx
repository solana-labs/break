import React, { useRef, useEffect, useCallback } from "react";
import useThrottle from "@react-hook/throttle";

import { TransactionSquare } from "./TxSquare";
import { useCreateTx, useTransactions } from "providers/transactions";
import { useGameState, useResetGame, COUNTDOWN_SECS } from "providers/game";

type Mode = "enabled" | "reset" | "disabled";

export function TransactionContainer() {
  const scrollEl = useRef<HTMLDivElement>(null);
  const rawTransactions = useTransactions();
  const [transactions, setTransactions] = useThrottle(rawTransactions, 10);
  const createTx = useCreateTx();
  const [gameState, setGameState] = useGameState();
  const resetGame = useResetGame();

  let mode: Mode;
  switch (gameState) {
    case "loading":
    case "payment":
      mode = "disabled";
      break;
    case "reset":
      mode = "reset";
      break;
    default:
      mode = "enabled";
  }

  const enabled = mode === "enabled";
  const makeTransaction = useCallback(() => {
    if (enabled && createTx) {
      if (typeof gameState === "number") {
        createTx();
      } else if (gameState === "ready") {
        createTx();
        setGameState(performance.now());
      }
    }
  }, [enabled, createTx, gameState, setGameState]);

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

  const disabled = mode === "disabled";
  return (
    <div className="card h-100 mb-0">
      <div className="card-header">
        {!disabled && (
          <>
            <div className="text-truncate">Live Transaction Status</div>
            <div className="text-primary d-none d-md-block">
              {enabled
                ? "Press any key to send a transaction"
                : "Game finished"}
            </div>
          </>
        )}
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
        {!disabled && (
          <span
            className="btn btn-pink w-100 text-uppercase text-truncate"
            onClick={enabled ? makeTransaction : resetGame}
          >
            <span className={`fe fe-${enabled ? "zap" : "repeat"} mr-2`}></span>
            {enabled ? "Send new transaction" : "Play again"}
          </span>
        )}
      </div>
    </div>
  );
}
