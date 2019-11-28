import * as React from 'react';
import {Route, Switch, Redirect} from 'react-router-dom';

import Header from "./components/containers/header";
import HomeScene from "./components/scenes/home-scene";
import GameScene from "./components/scenes/game-scene";

export default class App extends React.Component {

    render() {
        return(
            <div>
                <Header/>
                <Switch>
                    <Route path="/" exact component={HomeScene}/>
                    <Route path="/game" exact component={GameScene}/>
                    <Redirect from="*" to="/" exact/>
                </Switch>
            </div>
        )
    }
}
