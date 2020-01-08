import * as React from 'react';
import {Helmet} from 'react-helmet';

import './index.scss';
import Game from "../../containers/game";

export default class GameScene extends React.Component {
    render() {
        return (
            <React.Fragment>
                <Helmet>
                    <title>Break Solana - Game</title>
                </Helmet>
                <Game/>
            </React.Fragment>
        );
    }
}