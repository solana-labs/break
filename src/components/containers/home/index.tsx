import * as React from 'react';

import './index.scss';
import {Button} from "../../ui/button";

const heroImage = require('../../../shared/images/hero.svg')


export default class Home extends React.Component {

    render() {
        return (
            <div className={'home-wrapper'}>
                <div className={'container'}>
                    <div className={'main-info'}>
                        <h1>Break Solana (the game)</h1>
                        <p>This quick game gives you the chance to break the most performant blockhain in the world.
                            Simply use your keyboard to input as many transactions in a 15 second period.
                            At the end, we will show you how close you came to overhelm the system.</p>
                        <Button name={'Play the game'} linkTo={'/game'}/>
                        <div className={'padding-b'}/>
                        <Button typeALink={true} name={'Read how it works'} linkTo={'https://solana.com/category/blog/'}/>
                    </div>
                    <div className={'hero-illustration'}>
                        <object id={'hero'} data={heroImage} type={'image/svg+xml'}/>
                    </div>
                </div>
            </div>
        )
    }
}


