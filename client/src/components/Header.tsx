import * as React from "react";

import breakSvg from "images/break.svg";
import solanaSvg from "images/solana.svg";
import { useGameState, COUNTDOWN_SECS } from "providers/game";
import ClusterStatusButton from "./ClusterStatusButton";

export function Header() {
  return (
    <div className="header solana-header">
      <div className="header-body border-dark-purple py-3">
        <div className="container">
          <div className="row align-items-center justify-content-between">
            <div className="col-auto d-flex flex-column d-md-block align-items-center">
              <img src={breakSvg} alt="break" className="break mr-3" />
              <img src={solanaSvg} alt="solana" className="solana" />
            </div>
            <div className="col-auto">
              <div className="d-flex flex-row align-items-center">
                <HeaderCTA />
                <div className="d-md-inline-block d-none ml-3">
                  <ClusterStatusButton />
                </div>
                <a
                  className="btn btn-white lift ml-3"
                  href="https://github.com/solana-labs/break"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="fe fe-github mr-2"></span>
                  Source
                </a>
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
    </div>
  );
}

function HeaderCTA() {
  const gameState = useGameState();
  const [, setRefresh] = React.useState<boolean>(false);
  const countdownStart = gameState.countdownStartTime;
  const gameStatus = gameState.status;

  React.useEffect(() => {
    if (countdownStart !== undefined) {
      const timerId = setInterval(() => {
        setRefresh((r) => !r);
      }, 1000);
      return () => clearTimeout(timerId);
    }
  }, [countdownStart]);

  if (gameStatus === "loading" || gameStatus === "setup") {
    return null;
  }

  if (gameStatus === "finished") {
    return (
      <div className="btn btn-pink lift" onClick={gameState.resetGame}>
        Play Again
      </div>
    );
  }

  let secondsRemaining = COUNTDOWN_SECS;
  if (countdownStart !== undefined) {
    secondsRemaining = Math.max(
      0,
      COUNTDOWN_SECS - Math.floor((performance.now() - countdownStart) / 1000)
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
}
