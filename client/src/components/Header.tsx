import * as React from "react";

import breakSvg from "images/break.svg";
import solanaSvg from "images/solana.svg";
import {
  useCountdown,
  COUNTDOWN_SECS,
  PAUSE_COUNTDOWN
} from "providers/countdown";
import { useHistory } from "react-router-dom";
import { useDispatch, ActionType } from "providers/transactions";

export function Header() {
  const [countdown, setCountdown] = useCountdown();
  const history = useHistory();
  const dispatch = useDispatch();

  const timerValue = countdown !== undefined ? countdown : COUNTDOWN_SECS;
  const resetGame = () => {
    dispatch({ type: ActionType.ResetStats });
    setCountdown(undefined);
    history.push("/game");
  };

  const cta = () => {
    if (timerValue > PAUSE_COUNTDOWN) {
      let text = `${timerValue}s`;
      if (timerValue <= 0) {
        text = "Finished";
      }

      return (
        <div className="btn-group">
          <div className="btn btn-pink btn-secondary">
            <span className="fe fe-clock" />
          </div>
          <div className="btn btn-pink btn-secondary countdown text-center">
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
