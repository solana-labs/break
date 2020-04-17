import * as React from "react";

import breakSvg from "images/break.svg";
import solanaSvg from "images/solana.svg";
import { useGameState, COUNTDOWN_SECS } from "providers/game";
import { useHistory } from "react-router-dom";
import { useDispatch, ActionType } from "providers/transactions";

export function Header() {
  const [gameState, setGameState] = useGameState();
  const history = useHistory();
  const dispatch = useDispatch();
  const [, setRefresh] = React.useState<boolean>(false);

  const resetGame = () => {
    dispatch({ type: ActionType.ResetStats });
    setGameState("ready");
    history.push("/game");
  };

  React.useEffect(() => {
    if (typeof gameState === "number") {
      const timerId = setInterval(() => {
        setRefresh(r => !r);
      }, 1000);
      return () => clearTimeout(timerId);
    }
  }, [gameState]);

  const cta = () => {
    if (gameState !== "reset") {
      let text;
      switch (gameState) {
        case "ready": {
          text = `${COUNTDOWN_SECS}s`;
          break;
        }
        case "paused": {
          text = "Finished";
          break;
        }
        default: {
          const timer =
            COUNTDOWN_SECS - Math.floor((performance.now() - gameState) / 1000);
          text = `${timer}s`;
        }
      }

      return (
        <div className="btn-group">
          <div className="btn btn-pink btn-secondary">
            <span className="fe fe-clock" />
          </div>
          <div className="btn btn-pink btn-secondary gameState text-center">
            {text}
          </div>
        </div>
      );
    }

    return (
      <div className="btn btn-pink" onClick={resetGame}>
        Play Again
      </div>
    );
  };

  return (
    <div className="header solana-header">
      <div className="header-body border-dark-purple">
        <div className="container">
          <div className="row align-items-center justify-content-between">
            <div className="col-auto d-flex flex-column d-md-block align-items-center">
              <img src={breakSvg} alt="break" className="break mr-3" />
              <img src={solanaSvg} alt="solana" className="solana" />
            </div>
            <div className="col-auto">{cta()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
