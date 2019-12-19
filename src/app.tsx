import * as React from 'react';
import {Route, Switch, Redirect} from 'react-router-dom';
import {connect} from "react-redux";
import {Dispatch} from "redux";

import HomeScene from "./components/scenes/home-scene";
import GameScene from "./components/scenes/game-scene";
import {IService} from "./services/model";
import {IMapServicesToProps, withService} from "./components/hoc-helpers/with-service";
import {IRootAppReducerState} from "./reducer/model";
import Header from "./components/containers/header";

interface IProps{
    dispatch: Dispatch
}

class App extends React.Component<IProps, {}> {

    render() {
        return(
            <div>
                <Header/>
                <Switch>
                    <Route path="/" exact component={HomeScene}/>
                    <Route path="/game" exact component={GameScene}/>
                    <Redirect from="*" to="/" exact />
                </Switch>
            </div>
        )
    }
}

const mapServicesToProps: IMapServicesToProps = ({ }: IService) => ({ });

const mapStateToProps = ({}: IRootAppReducerState) => ({});

export default connect(mapStateToProps)(
    withService(mapServicesToProps)(App)
);