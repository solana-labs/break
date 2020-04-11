import * as React from "react";
import { Route, Switch, Redirect, useRouteMatch } from "react-router-dom";

import Home from "components/containers/home";
import Game from "components/containers/game";
import Header from "./components/containers/header";
import { Loader } from "./components/ui/loader";
import { useBlockhash } from "providers/blockhash";
import { useSocket } from "providers/socket";
import { useConfig } from "providers/api";

export default function App() {
  const isGameRoute = !!useRouteMatch("/game");
  const blockhash = useBlockhash();
  const config = useConfig().config;
  const socket = useSocket();
  const isLoading = !blockhash || !config || !socket;

  return (
    <div>
      <Header />
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/game" exact component={Game} />
        <Redirect from="*" to="/" exact />
      </Switch>
      <Loader isOpen={isGameRoute && isLoading} text={"Game loading..."} />
    </div>
  );
}
