import * as React from 'react';

import './index.scss';

interface IProps {
    secondsCount: number
    transactionsCreated: number
    processingTime: number
}

export const StartHead = ({secondsCount, transactionsCreated, processingTime}: IProps) => {
    return (
        <div className={'start-head-wrapper'}>
            <div className={'timer'}>
                <p>Time Left</p>
                <p>{secondsCount} sec</p>
            </div>
            <div className={'counter'}>
                <p>Transactions Created</p>
                <p>{transactionsCreated}</p>
            </div>
            <div className={'processing'}>
                <p>Avg. Transactions Processing Time</p>
                <p>{processingTime} sec</p>
            </div>
        </div>
    );
};
