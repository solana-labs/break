import * as React from "react";
import { Route, Switch, Redirect, useRouteMatch } from "react-router-dom";

import { HomePage } from "pages/HomePage";
import { GamePage } from "pages/GamePage";
import { SlotsPage } from "pages/SlotsPage";
import { WalletPage } from "pages/WalletPage";
import { ResultsPage } from "pages/ResultsPage";
import { StartPage } from "pages/StartPage";

import { ClusterModal } from "components/ClusterModal";
import { LoadingModal } from "components/LoadingModal";
import { useGameState } from "providers/game";
import { useClusterModal } from "providers/server";
import { Header } from "components/Header";

export default function App() {
  const isHomePage = !!useRouteMatch("/")?.isExact;
  const isWalletPage = !!useRouteMatch("/wallet")?.isExact;
  const isSlotsPage = !!useRouteMatch("/slots")?.isExact;
  const [showClusterModal] = useClusterModal();
  const gameState = useGameState();

  if (isHomePage) {
    return (
      <div className="main-content">
        <HomePage />
      </div>
    );
  }

  const isLoading = gameState.loadingPhase !== "complete";
  const isInitializing =
    gameState.loadingPhase === "config" && !isWalletPage && !isSlotsPage;
  const showLoadingModal = isLoading && !isWalletPage && !isSlotsPage;
  return (
    <div className="main-content">
      <div className="min-vh-100 d-flex flex-column">
        <Header />
        {!isInitializing && (
          <Switch>
            <Route path="/game" exact component={GamePage} />
            <Route path="/slots" exact component={SlotsPage} />
            <Route path="/wallet" exact component={WalletPage} />
            <Route path="/results" exact component={ResultsPage} />
            <Route path="/start" exact component={StartPage} />
            <Redirect from="*" to="/" exact />
          </Switch>
        )}
      </div>
      <LoadingModal show={showLoadingModal} phase={gameState.loadingPhase} />
      <ClusterModal />
      <Overlay show={showLoadingModal || showClusterModal} />
    </div>
  );
}

function Overlay({ show }: { show: boolean }) {
  if (show) return <div className="modal-backdrop fade show"></div>;
  return <div className="fade"></div>;
}
