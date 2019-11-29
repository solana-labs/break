import * as React from 'react';

import './index.scss';
import {Link} from "react-router-dom";

interface IProps {
    name: string
    linkTo: string
}

export const Button = ({name, linkTo}: IProps) => {

    return (
        <Link to={linkTo} className={'button-component'}>{name}</Link>
    );
};
