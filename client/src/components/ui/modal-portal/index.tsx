import * as React from "react";
import ReactDOM from "react-dom";

import "./index.scss";

interface IProps {
  isOpenProps: boolean;
  children: any;
  onClose(): void;
}

interface IState {
  isOpenProps: boolean;
  isOpen: boolean;
}

export default class ModalPortal extends React.Component<IProps, IState> {
  state: IState = {
    isOpenProps: false,
    isOpen: false
  };

  static getDerivedStateFromProps(nextProps: IProps, prevState: IState) {
    if (prevState.isOpen !== nextProps.isOpenProps) {
      return {
        isOpen: nextProps.isOpenProps
      };
    }
    return null;
  }

  root: HTMLElement;

  constructor(props: IProps) {
    super(props);

    const div = document.createElement("div");
    div.setAttribute("id", "modal-root");
    document.body.appendChild(div);
    this.root = div;
  }

  componentWillUnmount() {
    if (this.root) {
      document.body.removeChild(this.root);
    }
  }

  render() {
    return ReactDOM.createPortal(
      <React.Fragment>
        {this.state.isOpen && (
          <div className={`modal-portal-wrapper`}>
            <div className={"overlay"} onClick={this.props.onClose} />
            {this.props.children}
          </div>
        )}
      </React.Fragment>,
      this.root
    );
  }
}
