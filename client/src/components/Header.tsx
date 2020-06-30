import * as React from "react";

import breakSvg from "images/break.svg";
import solanaSvg from "images/solana.svg";
import { useGameState, useResetGame, COUNTDOWN_SECS } from "providers/game";
import ClusterStatusButton from "./ClusterStatusButton";
import { useBalance } from "providers/payment";
import { useConfig, useRefreshAccounts } from "providers/api";

export function Header() {
  const [gameState] = useGameState();
  const [, setRefresh] = React.useState<boolean>(false);
  const resetGame = useResetGame();
  const balance = useBalance();
  const gameCostLamports = useConfig()?.gameCost || 0;
  const refreshAccounts = useRefreshAccounts();
  const balanceSufficient = balance >= gameCostLamports;

  React.useEffect(() => {
    if (typeof gameState === "number") {
      const timerId = setInterval(() => {
        setRefresh((r) => !r);
      }, 1000);
      return () => clearTimeout(timerId);
    }
  }, [gameState]);

  const cta = () => {
    if (gameState === "payment" && balanceSufficient) {
      return (
        <div className="btn btn-pink" onClick={refreshAccounts}>
          Play
        </div>
      );
    }

    if (gameState === "loading" || gameState === "payment") {
      return null;
    }

    if (gameState === "reset") {
      return (
        <div className="btn btn-pink" onClick={resetGame}>
          Play Again
        </div>
      );
    }

    let secondsRemaining = COUNTDOWN_SECS;
    if (gameState !== "ready") {
      secondsRemaining = Math.max(
        0,
        COUNTDOWN_SECS - Math.floor((performance.now() - gameState) / 1000)
      );
    }

    return (
      <div className="btn-group">
        <div className="btn btn-pink btn-secondary">
          <span className="fe fe-clock" />
        </div>
        <div className="btn btn-pink btn-secondary gameState text-center">
          {secondsRemaining}s
        </div>
      </div>
    );
  };

  return (
    <div className="header solana-header">
      <div className="header-body border-dark-purple">
        <div className="row align-items-center justify-content-between">
          <div className="col-auto d-flex flex-column d-md-block align-items-center">
            <img src={breakSvg} alt="break" className="break mr-3" />
            <img src={solanaSvg} alt="solana" className="solana" />
          </div>
          <div className="col-auto">
            <div className="d-flex flex-row align-items-center">
              {cta()}
              <div className="d-md-inline-block d-none ml-2">
                <ClusterStatusButton />
              </div>
            </div>
          </div>
        </div>
        <div className="row align-items-center d-md-none mt-4">
          <div className="col-12">
            <ClusterStatusButton />
          </div>
        </div>
      </div>
    </div>
  );
}
