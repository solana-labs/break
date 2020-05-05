import * as React from "react";
import { Route, Switch, Redirect, useRouteMatch } from "react-router-dom";

import Home from "components/HomePage";
import Game from "components/GamePage";
import Results from "components/ResultsPage";
import { LoadingModal } from "components/LoadingModal";
import { useBlockhash } from "providers/blockhash";
import { useSocket } from "providers/socket";
import { useConfig } from "providers/api";

export default function App() {
  const notHome = !useRouteMatch("/")?.isExact;
  const blockhash = useBlockhash();
  const config = useConfig();
  const socket = useSocket();
  const isLoading = !blockhash || !config || !socket;

  return (
    <div className="main-content">
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/game" exact component={Game} />
        <Route path="/results" exact component={Results} />
        <Redirect from="*" to="/" exact />
      </Switch>
      <LoadingModal show={notHome && isLoading} />
      <Overlay show={notHome && isLoading} />
    </div>
  );
}

function Overlay({ show }: { show: boolean }) {
  if (show) return <div className="modal-backdrop fade show"></div>;
  return <div className="fade"></div>;
}
