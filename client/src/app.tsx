import * as React from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import { connect } from "react-redux";

import HomeScene from "./components/scenes/home-scene";
import GameScene from "./components/scenes/game-scene";
import { IRootAppReducerState } from "./reducer/model";
import Header from "./components/containers/header";
import { Loader } from "./components/ui/loader";
import * as ILoader from "./reducers/loader/model";

interface IProps {
  loaderState: ILoader.ModelState;
}

function App(props: IProps) {
  const loaderIsOpen = props.loaderState.isActive;

  return (
    <div>
      <Header />
      <Switch>
        <Route path="/" exact component={HomeScene} />
        <Route path="/game" exact component={GameScene} />
        <Redirect from="*" to="/" exact />
      </Switch>
      <Loader isOpen={loaderIsOpen} text={"Game loading..."} />
    </div>
  );
}

const mapStateToProps = ({ loaderState }: IRootAppReducerState): IProps => ({
  loaderState
});

export default connect(mapStateToProps)(App);
