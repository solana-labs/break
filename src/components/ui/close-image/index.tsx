import * as React from "react";
import "./index.scss";

import closeImg from "@images/icons/close.svg";

interface Props {
  className?: string;
  onClick?(): void;
}

export const CloseImage = ({ onClick, className }: Props) => (
  <div className={"close-image-component"}>
    <img
      onClick={onClick}
      className={`${className}`}
      src={closeImg}
      alt="close"
      data-testid="close-img"
    />
  </div>
);
