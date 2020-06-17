import * as React from "react";
import { Route, Switch, Redirect, useRouteMatch } from "react-router-dom";

import Home from "components/HomePage";
import Game from "components/GamePage";
import Results from "components/ResultsPage";
import { LoadingModal } from "components/LoadingModal";
import { PaymentModal } from "components/PaymentModal";
import { useGameState } from "providers/game";

export default function App() {
  const isHomePage = !!useRouteMatch("/")?.isExact;
  const isGamePage = !!useRouteMatch("/game")?.isExact;
  const [gameState] = useGameState();

  const showPaymentModal = isGamePage && gameState === "payment";
  const showLoadingModal = !isHomePage && gameState === "loading";

  return (
    <div className="main-content">
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/game" exact component={Game} />
        <Route path="/results" exact component={Results} />
        <Redirect from="*" to="/" exact />
      </Switch>
      <PaymentModal show={showPaymentModal} />
      <LoadingModal show={showLoadingModal} />
      <Overlay show={showPaymentModal || showLoadingModal} />
    </div>
  );
}

function Overlay({ show }: { show: boolean }) {
  if (show) return <div className="modal-backdrop fade show"></div>;
  return <div className="fade"></div>;
}
