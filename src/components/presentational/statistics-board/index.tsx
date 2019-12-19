import * as React from 'react';

import './index.scss';

interface IProps {
    dayTransactionCounts: number
    percentCapacity: string
    gameTransactionCounts: number
}

export const StatisticsBoard = ({dayTransactionCounts, percentCapacity, gameTransactionCounts}: IProps) => {
    return (
        <div className={'statistics-board-wrapper'}>
            <div className={'head'}>
                <p>Statistics</p>
            </div>
            <div className={'row'}>
                <p><span>{dayTransactionCounts}</span> transactions / 24h</p>
                <p>If these transactions were created in 1 second, players would use {percentCapacity}% of Solana capacity.</p>
            </div>
            <div className={'row'}>
                <p><span>{gameTransactionCounts}</span> transactions / 15sec</p>
                <p>You may try to collaborate with people from around the world to break Solana right now!</p>
            </div>
        </div>
    );
};
