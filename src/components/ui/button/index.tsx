import * as React from 'react';

import './index.scss';
import {Link} from "react-router-dom";

interface IProps {
    name: string
    linkTo: string
    typeButton?: boolean
    typeALink?: boolean
    onClick?(): void
}

export const Button = ({name, linkTo, typeButton,typeALink,onClick}: IProps) => {

    return (
        <React.Fragment>
            {!typeButton && !typeALink && <Link to={linkTo} className={'button-component'}>{name}</Link>}
            {typeButton && <button onClick={onClick} className={'button-component'}>{name}</button>}
            {typeALink && <a href={linkTo} className={'button-component'}>{name}</a>}
        </React.Fragment>
    );
};
