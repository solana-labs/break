import * as React from 'react';

import './index.scss';

interface IProps {
    secondsCount: number
    transactionsCreated: number
    averageTransactionsTime: number
}

export const StartHead = ({secondsCount, transactionsCreated, averageTransactionsTime}: IProps) => {
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
        </div>
    );
};
