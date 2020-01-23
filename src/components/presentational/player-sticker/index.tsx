import * as React from 'react';

import './index.scss';

import userImg from '@images/icons/user.svg';

interface IProps {
    name: string;
}

export const PlayerSticker = ({name}: IProps) => {
    return (
        <div className={'player-sticker-wrapper'} title={name}>
            <div className={'user-circle'}>
                <img src={userImg} alt="user"/>
            </div>
            <p>{name}</p>
        </div>
    );
};
