import * as React from 'react';

import './index.scss';

const tableCup = require('../../../shared/images/icons/table-cup.svg')

export default class LeaderBoard extends React.Component {
    render() {
        return (
            <div className={'leader-board-wrapper'}>
                <div className={'head'}>
                    <img src={tableCup} alt="cup"/>
                    <p>leaderboard</p>
                    <p>Score</p>
                </div>
                <div className={'row'}>
                    <p>1</p>
                    <p>Player 1</p>
                    <p>226</p>
                </div>
            </div>
        )
    }
}


