import * as React from 'react';

import './index.scss';
import {Button} from "../../ui/button";
import CircleAnimation from "../circle-animation";
import {GlitchH1} from "../../ui/glitch-h1";

export default class Home extends React.Component {

    render() {
        return (
            <div className={'home-wrapper'}>
                <div className={'container'}>
                    <div className={'main-info'}>
                        <GlitchH1>Can You Break Solana?</GlitchH1>
                        <p>This game gives you the chance to try and break the most performant blockchain in the world.
                            Every action—key press or mouse click—creates an on-chain transaction. After 15 seconds, we'll show you how close you came to
                            overwhelming the system.</p>
                        <div className={'buttons-block'}>
                            <Button linkTo={'/game'} name={'Play the game'}/>
                            <a href="https://solana.com/category/blog/">Read how it works</a>
                        </div>
                    </div>
                </div>
                <CircleAnimation className={'hero'}/>
            </div>
        )
    }
}

