import * as React from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import { connect } from "react-redux";
import { Dispatch } from "redux";

import HomeScene from "./components/scenes/home-scene";
import GameScene from "./components/scenes/game-scene";
import { IService } from "./services/model";
import {
  IMapServicesToProps,
  withService
} from "./components/hoc-helpers/with-service";
import { IRootAppReducerState } from "./reducer/model";
import Header from "./components/containers/header";
import { Loader } from "./components/ui/loader";
import * as ILoader from "./reducers/loader/model";

interface IProps {
  dispatch: Dispatch;
  loaderState: ILoader.ModelState;
}

class App extends React.Component<IProps, {}> {
  render() {
    const loaderIsOpen = this.props.loaderState.isActive;

    return (
      <div>
        <Header />
        <Switch>
          <Route path="/" exact component={HomeScene} />
          <Route path="/game" exact component={GameScene} />
          <Redirect from="*" to="/" exact />
        </Switch>
        <Loader isOpen={loaderIsOpen} text={"Game initialization..."} />
      </div>
    );
  }
}

const mapServicesToProps: IMapServicesToProps = ({}: IService) => ({});

const mapStateToProps = ({
  loaderState
}: IRootAppReducerState): Partial<IRootAppReducerState> => ({ loaderState });

export default connect(mapStateToProps)(withService(mapServicesToProps)(App));
