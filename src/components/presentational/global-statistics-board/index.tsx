import * as React from 'react';

import './index.scss';

interface IProps {
    dayTransactionCounts: number
    gameTransactionCounts: number
}

export const GlobalStatisticsBoard = ({dayTransactionCounts, gameTransactionCounts}: IProps) => {
    return (
        <div className={'statistics-board-wrapper'}>
            <div className={'head'}>
                <p>Global Statistics:</p>
            </div>
            <div className={'row'}>
                <div>
                    <p>{dayTransactionCounts ? dayTransactionCounts : 0}</p>
                    <p>transactions / 24h</p>
                </div>
                <div>
                    <p>{gameTransactionCounts ? gameTransactionCounts : 0}</p>
                    <p>transactions / 15sec</p>
                </div>
            </div>
        </div>
    );
};
