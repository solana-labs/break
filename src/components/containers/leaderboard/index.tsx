import * as React from 'react';
import {connect} from "react-redux";

import './index.scss';
import {IRootAppReducerState} from "../../../reducer/model";
import IUsers from "../../../reducers/users/model";

const tableCup = require('../../../shared/images/icons/table-cup.svg');

interface IProps{
    usersState: IUsers.ModelState;
}

class LeaderBoard extends React.Component<IProps, {}> {
    render() {
        const leaderboard = this.props.usersState && this.props.usersState.leaderboard;
        const leaderboardList = leaderboard &&leaderboard.list;

        return (
            <div className={'leader-board-wrapper'}>
                <div className={'head'}>
                    <img src={tableCup} alt="cup"/>
                    <p>leaderboard</p>
                    <p>Score</p>
                </div>
                {leaderboardList && leaderboardList.map((item: IUsers.Model, index: number) => (
                    <div className={'row'} key={index}>
                        <p>{index+1}</p>
                        <p>{item.nickname}</p>
                        <p>{item.record}</p>
                    </div>
                ))}
            </div>
        )
    }
}


const mapStateToProps = ({usersState}: IRootAppReducerState) => ({usersState});

export default connect(mapStateToProps)(LeaderBoard);