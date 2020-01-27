import * as React from "react";

import "./index.scss";
import { Link } from "react-router-dom";

interface IProps {
  name: string;
  linkTo?: string;
  typeButton?: boolean;
  typeALink?: boolean;
  animate?: string;
  onClick?(): void;
}

export const Button = ({
  name,
  linkTo,
  typeButton,
  typeALink,
  onClick,
  animate
}: IProps) => {
  return (
    <React.Fragment>
      {!typeButton && !typeALink && (
        <Link
          to={linkTo ? linkTo : "#"}
          className={`button-component ${animate ? animate : ""}`}
        >
          <span>{name}</span>
        </Link>
      )}
      {typeButton && (
        <button
          onClick={onClick}
          className={`button-component ${animate ? animate : ""}`}
        >
          <span>{name}</span>
        </button>
      )}
      {typeALink && (
        <a
          href={linkTo}
          className={`button-component ${animate ? animate : ""}`}
        >
          <span>{name}</span>
        </a>
      )}
    </React.Fragment>
  );
};
