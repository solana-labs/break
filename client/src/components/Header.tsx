import * as React from "react";

import breakSvg from "images/break.svg";
import solanaSvg from "images/solana.svg";

export function Header() {
  return (
    <div className="header">
      <div className="header-body border-dark-purple">
        <div className="container">
          <div className="row align-items-center">
            <div className="col solana-header">
              <img src={breakSvg} alt="break" className="break mr-3" />
              <img src={solanaSvg} alt="solana" className="solana" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
