import * as React from 'react';
import * as H from "history";
import {withRouter} from 'react-router-dom';
import {RouteComponentProps} from "react-router";

import './index.scss';
import {Link} from "react-router-dom";
import {PlayerSticker} from "../../presentational/player-sticker";

const logo = require('../../../shared/images/logo.svg');

interface IProps extends RouteComponentProps {
    userName: string;
    history: H.History;
}

class Header extends React.Component<IProps, {}> {

    render() {
        const name = this.props.userName;
        const isHomeScene = this.props.history.location.pathname === '/';

        return (
            <header className={'header-wrapper'}>
                <div className={'container'}>
                    <Link to={'/'} className={'logo'}>
                        <img src={logo} alt="solana"/>
                    </Link>
                    {!isHomeScene && <PlayerSticker name={name}/>}
                </div>
            </header>
        );
    }
}

export default withRouter(Header);

