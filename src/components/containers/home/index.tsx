import * as React from 'react';
import gsap, {TimelineMax, Power0, Cubic} from 'gsap'
import {Dispatch} from "redux";
import {connect} from "react-redux";
import {withRouter} from "react-router";

import './index.scss';
import {Button} from "../../ui/button";
import {IMapServicesToProps, withService} from "../../hoc-helpers/with-service";
import {IService} from "../../../services/model";
import {IRootAppReducerState} from "../../../reducer/model";
import {IGameService} from "../../../services/game-service/model";
import {StatisticsBoard} from "../../presentational/statistics-board";

const heroImage = require('../../../shared/images/hero.svg');

interface IProps {
    dispatch: Dispatch
    gameService: IGameService
}

interface IState {
    dayTransactionCounts: number,
    gameTransactionCounts: number
}

class Home extends React.Component<IProps, IState> {
    _isMounted = false;

    state: IState = {
        dayTransactionCounts: 0,
        gameTransactionCounts: 0
    };

    private startAnimation = () => {
        gsap.registerPlugin();
        const hero: any = document.getElementById("hero");
        if (hero) {
            const svgDocHero = hero.contentDocument;
            if (svgDocHero) {
                const circle1 = svgDocHero.getElementById("circle1");
                const circle2 = svgDocHero.getElementById("circle2");
                const circle3 = svgDocHero.getElementById("circle3");
                const circle4 = svgDocHero.getElementById("circle4");
                const circle5 = svgDocHero.getElementById("circle5");
                const circle6 = svgDocHero.getElementById("circle6");

                const tlHeroC1 = new TimelineMax({repeat: -1});
                const tlHeroC2 = new TimelineMax({repeat: -1});
                const tlHeroC3 = new TimelineMax({repeat: -1});
                const tlHeroC4 = new TimelineMax({repeat: -1});
                const tlHeroC5 = new TimelineMax({repeat: -1});
                const tlHeroC6 = new TimelineMax({repeat: -1});

                tlHeroC1.to(circle1, 5, {
                    rotation: 90,
                    transformOrigin: "center",
                    ease: Power0.easeIn
                }).to(circle1, 5, {
                    rotation: 180,
                    transformOrigin: "center",
                    ease: Power0.easeIn
                }).to(circle1, 3, {
                    rotation: 270,
                    transformOrigin: "center",
                    ease: Power0.easeIn
                }).to(circle1, 3, {
                    rotation: 360,
                    transformOrigin: "center",
                    ease: Power0.easeIn
                });

                tlHeroC2.to(circle2, 6, {
                    rotation: 360,
                    transformOrigin: "center",
                    ease: Cubic.easeIn
                });

                tlHeroC3.to(circle3, 20, {
                    rotation: -360,
                    transformOrigin: "center",
                    ease: Cubic.easeIn
                });

                tlHeroC4.to(circle4, 8, {
                    rotation: 90,
                    transformOrigin: "center",
                    ease: Power0.easeIn
                }).to(circle4, 8, {
                    rotation: 180,
                    transformOrigin: "center",
                    ease: Power0.easeIn
                }).to(circle4, 4, {
                    rotation: 270,
                    transformOrigin: "center",
                    ease: Power0.easeIn
                }).to(circle4, 4, {
                    rotation: 360,
                    transformOrigin: "center",
                    ease: Power0.easeIn
                });

                tlHeroC5.to(circle5, 30, {
                    rotation: -360,
                    transformOrigin: "center",
                    ease: Power0.easeIn
                });

                tlHeroC6.to(circle6, 30, {
                    rotation: 360,
                    transformOrigin: "center",
                    ease: Power0.easeIn
                });
            }
        }
    };

    private getDayTransactionCounts = async() => {
        const response = await this.props.gameService.getDailyTransactionCounts();

        if(this._isMounted){
            this.setState({
                dayTransactionCounts: response
            })
        }
    };

    private getGameTransactionCounts = async () => {
        const response = await this.props.gameService.getGameTransactionCounts();

        if(this._isMounted){
            this.setState({
                gameTransactionCounts: response
            });
        }
    };

    private startGetGameTransactionCounts = async () => {
        this.getGameTransactionCounts();

        setInterval(async() => {
            this.getGameTransactionCounts()
        }, 15000)
    };

    componentDidMount(): void {
        this._isMounted = true;
        this.getDayTransactionCounts();
        this.startGetGameTransactionCounts();
    }

    componentWillUnmount(): void {
        this._isMounted = false;
    }

    render() {
        const {dayTransactionCounts, gameTransactionCounts} = this.state;
        const percentCapacity = (dayTransactionCounts / 50000).toFixed(4);

        return (
            <div className={'home-wrapper'}>
                <div className={'container'}>
                    <div className={'main-info'}>
                        <h1 className={'glitch'} data-text="Break Solana">Can You Break Solana?</h1>
                        <p>This game gives you the chance to try and break the most performant blockchain in the world.
                            Every action—key press or mouse click—creates an on-chain transaction. After 15 seconds, we'll show you how close you came to
                            overwhelming the system.</p>
                        <div className={'buttons-block'}>
                            <Button linkTo={'/game'} name={'Play the game'}/>
                            <a href="https://solana.com/category/blog/">Read how it works</a>
                        </div>
                    </div>
                    <StatisticsBoard
                        dayTransactionCounts={dayTransactionCounts}
                        percentCapacity={percentCapacity}
                        gameTransactionCounts={gameTransactionCounts}
                    />
                </div>
                <object id={'hero'} data={heroImage} type={'image/svg+xml'} onLoad={this.startAnimation}/>
            </div>
        )
    }
}

const mapServicesToProps: IMapServicesToProps = ({ gameService }: IService) => ({ gameService });

const mapStateToProps = ({}: IRootAppReducerState) => ({});

export default connect(mapStateToProps)(
    withRouter(withService(mapServicesToProps)(Home))
);

