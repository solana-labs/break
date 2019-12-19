import * as React from 'react';

import './index.scss';

interface IProps {
    secondsCount: number
    transactionsCreated: number
    averageTransactionsTime: number
    myTopResult: number
}

export const StartHead = ({secondsCount, transactionsCreated, averageTransactionsTime, myTopResult}: IProps) => {
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
                <p>Avg. Transactions Time</p>
                <p>{averageTransactionsTime} sec</p>
            </div>
            <div className={'top'}>
                <p>My Top Result</p>
                <p>{myTopResult}</p>
            </div>
        </div>
    );
};
