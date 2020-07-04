import * as React from "react";
import { Route, Switch, Redirect, useRouteMatch } from "react-router-dom";

import Home from "pages/HomePage";
import Game from "pages/GamePage";
import Setup from "pages/SetupPage";
import Results from "pages/ResultsPage";

import ClusterModal from "components/ClusterModal";
import { LoadingModal } from "components/LoadingModal";
import { useGameState } from "providers/game";
import { useClusterModal } from "providers/server";

export default function App() {
  const isHomePage = !!useRouteMatch("/")?.isExact;
  const isSetupPage = !!useRouteMatch("/setup")?.isExact;
  const [gameState] = useGameState();
  const [showClusterModal] = useClusterModal();
  const showLoadingModal =
    !isHomePage && !isSetupPage && gameState === "loading";

  return (
    <div className="main-content">
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/game" exact component={Game} />
        <Route path="/setup" exact component={Setup} />
        <Route path="/results" exact component={Results} />
        <Redirect from="*" to="/" exact />
      </Switch>
      <LoadingModal show={showLoadingModal} />
      <ClusterModal />
      <Overlay show={showLoadingModal || showClusterModal} />
    </div>
  );
}

function Overlay({ show }: { show: boolean }) {
  if (show) return <div className="modal-backdrop fade show"></div>;
  return <div className="fade"></div>;
}
