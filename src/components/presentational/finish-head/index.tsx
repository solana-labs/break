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
    tryAgain(): void
    openPopup(): void
}

export const FinishHead = ({completedCount, totalCount, percentCapacity, tryAgain, openPopup}: IProps) => {
    return (
        <div className={'finish-head-wrapper'}>
            <div className={'stats-block'}>
                <p>Stats: </p>
                <p>Transaction(s) processed: {completedCount} of {totalCount}</p>
                <p>{percentCapacity}% of Solana capacity used</p>
                <Button typeButton={true} name={'Try Again'} onClick={tryAgain}/>
            </div>
            <div className={'info-block'}>
                <p>Well, perhaps if you invited a fem more friends... With <span className={'green-text semibold'}>{completedCount}</span> transactions
                    in 15 seconds you took up <span className={'green-text semibold'}>{percentCapacity}%</span> of
                    our blockchain's network capabilities. If you invited couple more people our
                    decentralized database would start to slow down. You can review every
                    transaction with stats on confirmation and signatures hovering it.</p>
            </div>
            <div className={'share-block'}>
                <p>Share your result:</p>
                <div className={'share-buttons-wrapper'}>
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
                <Button typeButton={true} name={'Build on Solana'} onClick={openPopup}/>
            </div>
        </div>
    );
};
