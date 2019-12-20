import * as React from 'react';

import './index.scss';
import {Link} from "react-router-dom";

const logo = require('../../../shared/images/logo.svg');


export default class Header extends React.Component {

    render() {


        return (
            <header className={'header-wrapper'}>
                <div className={'container'}>
                    <a href={'https://solana.com/'} className={'logo'}>
                        <img src={logo} alt="solana"/>
                    </a>
                </div>
            </header>
        );
    }
}



