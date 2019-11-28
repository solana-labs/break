import * as React from 'react';
import {Route, Switch, Redirect} from 'react-router-dom';

import HomeScene from "./components/scenes/home-scene";

export default class App extends React.Component {

    render() {
        return(
            <div>
                <Switch>
                    <Route path="/" exact component={HomeScene}/>
                    <Redirect from="*" to="/" exact/>
                </Switch>
            </div>
        )
    }
}
