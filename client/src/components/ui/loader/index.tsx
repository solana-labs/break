import * as React from "react";

import "./index.scss";

import loaderImg from "shared/images/icons/loader.svg";

interface IProps {
  isOpen: boolean;
  text?: string;
}

export const Loader = ({ isOpen, text }: IProps) => {
  if (!isOpen) return null;

  return (
    <div className={"loader-wrapper"}>
      <img className={"loader-image"} src={loaderImg} alt="loader-solana" />
      <p className={"text"}>{text}</p>
    </div>
  );
};
