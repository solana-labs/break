import * as React from 'react';
import {Route, Switch, Redirect} from 'react-router-dom';
import {connect} from "react-redux";
import {Dispatch} from "redux";

import HomeScene from "./components/scenes/home-scene";
import GameScene from "./components/scenes/game-scene";
import {IUsersService} from "./services/users-service/model";
import {IService} from "./services/model";
import {IMapServicesToProps, withService} from "./components/hoc-helpers/with-service";
import {IRootAppReducerState} from "./reducer/model";
import IUsers from "./reducers/users/model";
import {getLeaderboard} from "./actions/get-leaderboard";
import Header from "./components/containers/header";

interface IProps{
    usersService: IUsersService;
    usersState: IUsers.ModelState;
    dispatch: Dispatch
}

class App extends React.Component<IProps, {}> {
    componentDidMount(): void {
        this.getLeaderboard()
    }

    private getLeaderboard = async () => {
        try {
            const response = await this.props.usersService.getLeaderboard(10);
            this.props.dispatch(getLeaderboard(response));
        } catch (err) {
            console.error(err);
        }
    };

    render() {
        const nickname = this.props.usersState.userRecord && this.props.usersState.userRecord.nickname;

        return(
            <div>
                <Header userName={nickname? nickname : ''}/>
                <Switch>
                    <Route path="/" exact component={HomeScene}/>
                    <Route path="/game" exact component={GameScene}/>
                    <Redirect from="*" to="/" exact />
                </Switch>
            </div>
        )
    }
}

const mapServicesToProps: IMapServicesToProps = ({ usersService }: IService) => ({ usersService });

const mapStateToProps = ({usersState}: IRootAppReducerState) => ({usersState});

export default connect(mapStateToProps)(
    withService(mapServicesToProps)(App)
);