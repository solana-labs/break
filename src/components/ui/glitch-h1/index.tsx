import * as React from 'react';

import './index.scss';

interface IProps {
    children: string;
}

export const GlitchH1 = ({children}: IProps) => {
    return (
        <h1 className={'glitch-text'} data-text={children}>{children}</h1>
    );
};
