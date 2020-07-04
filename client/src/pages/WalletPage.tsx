import React from "react";
import { useAccountState } from "providers/account";
import { Redirect, useLocation } from "react-router-dom";
import { Header } from "components/Header";
import { PaymentCard } from "components/PaymentCard";
import { useGameState } from "providers/game";

export default function Wallet() {
  const [account] = useAccountState();
  const [gameState] = useGameState();
  const location = useLocation();

  if (!account) {
    return <Redirect to={{ ...location, pathname: "/setup" }} />;
  } else if (gameState !== "payment") {
    return <Redirect to={{ ...location, pathname: "/game" }} />;
  }

  return (
    <div className="container min-vh-100 d-flex flex-column">
      <div>
        <Header />
      </div>
      <div className="row flex-grow-1 mb-5">
        <div className="col">
          <PaymentCard account={account} />
        </div>
      </div>
    </div>
  );
}
