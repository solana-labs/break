import * as React from 'react';

import './index.scss';

interface IProps {
    name: string
    onClick?(): void
}

export const ButtonAnimate = ({name, onClick}: IProps) => {

    return (
        <button onClick={onClick} className={'button-animate-component animated infinite pulse'}>{name}</button>
    )
};
