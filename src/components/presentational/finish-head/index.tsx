import * as React from 'react';

import './index.scss';
import {Button} from "../../ui/button";
import {FacebookShareButton, TwitterShareButton} from "react-share";

const shareTwitterIcon = require('../../../shared/images/share-twitter.svg');
const shareFacebookIcon = require('../../../shared/images/share-facebook.svg');

interface IProps {
    completedCount: number
    totalCount: number
    percentCapacity: number
    averageTransactionsTime: number
    tryAgain(): void
    openPopup(): void
}

interface IState {
    disableWrapper: boolean
}

export default class HomeScene extends React.Component<IProps, IState> {

    state: IState = {
        disableWrapper: true
    };

    componentDidMount(): void {
        setTimeout(() => {
            this.setState({
                disableWrapper: false
            })
        }, 1000)
    }

    render() {
        const {completedCount, totalCount, percentCapacity, tryAgain, openPopup, averageTransactionsTime} = this.props;
        const disabledStatus = this.state.disableWrapper ? 'disabled' : '';

        return (
            <div className={`finish-head-wrapper ${disabledStatus}`}>
                <h2 className={'title'}>Your high score is <span>{completedCount}</span>. Try harder next time to beat it!</h2>
                <div className={'diagrams-wrapper'}>
                    <div className="single-chart">
                        <svg viewBox="0 0 36 36" className="circular-chart">
                            <path className="circle-bg"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path className="circle"
                                  strokeDasharray={`${percentCapacity && percentCapacity < 0.1 ? 0.1 : percentCapacity}, 100`}
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                        </svg>
                        <div className={'info'}>
                            <p>{percentCapacity}%</p>
                            <p>of solana capacity used</p>
                        </div>
                    </div>

                    <div className="single-chart">
                        <svg viewBox="0 0 36 36" className="circular-chart">
                            <path className="circle-bg"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path className="circle"
                                  strokeDasharray={`${100 * completedCount / totalCount}, 100`}
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                        </svg>
                        <div className={'info'}>
                            <p>{completedCount} of {totalCount}</p>
                            <p>transactions processed</p>
                        </div>
                    </div>

                    <div className="single-chart">
                        <svg viewBox="0 0 36 36" className="circular-chart">
                            <path className="circle-bg"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path className="circle-dash"
                                  strokeDasharray="100, 100"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                        </svg>
                        <div className={'info'}>
                            <p>{averageTransactionsTime} sec</p>
                            <p>avg. transactions <br/> proccessing time</p>
                        </div>
                    </div>
                </div>
                <div className={'info-block'}>
                    <p>With <span className={'green-text semibold'}>{completedCount}</span> transactions in
                        15 seconds you took up <span className={'green-text semibold'}>{percentCapacity}%</span> of Solana's network bandwidth.
                        If you invited more people, maybe you'd stand a better chance.
                        Review every transaction with stats on confirmation and signatures by hovering over it below.</p>
                </div>
                <div className={'buttons-block'}>
                    <Button typeButton={true} name={'Try Again'} onClick={tryAgain}/>
                    <Button typeALink={true} linkTo={'https://solana.com/developers/'} name={'Build on Solana'}/>
                </div>
                <div className={'share-block-wrapper'}>
                    <p>Share your result:</p>
                    <div className={'share-block'}>
                        <TwitterShareButton
                            className={'share-button'}
                            title={`My results breaking Solana: \nTotal transactions: ${totalCount} \nSolana capacity used: ${percentCapacity}% \n\nYou can try to break Solana by your own`}
                            url={'https://break.solana.com/'}>
                            <img src={shareTwitterIcon}/>
                        </TwitterShareButton>
                        <FacebookShareButton
                            className={'share-button'}
                            quote={`My results breaking Solana: \nTotal transactions: ${totalCount} \nSolana capacity used: ${percentCapacity}% \n\nYou can try to break Solana by your own`}
                            url={'https://break.solana.com/'}>
                            <img src={shareFacebookIcon}/>
                        </FacebookShareButton>
                    </div>
                </div>
            </div>
        );
    }
}
