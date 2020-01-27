import * as React from "react";
import { RouteComponentProps } from "react-router";
import * as H from "history";
import { withRouter } from "react-router-dom";

import "./index.scss";

import logo from "@images/logo.svg";

interface IProps extends RouteComponentProps {
  history: H.History;
}

class Header extends React.Component<IProps, {}> {
  private copyPath = () => {
    const copyText: any = document.getElementById("break-game-link");

    copyText.select();
    copyText.setSelectionRange(0, 99999);

    document.execCommand("copy");
  };

  render() {
    const isHomeScene = this.props.history.location.pathname === "/";

    return (
      <header className={"header-wrapper"}>
        <div className={"container"}>
          <a href={"https://solana.com/"} className={"logo"}>
            <img src={logo} alt="solana" />
          </a>

          {!isHomeScene && (
            <div className={"copy-link-block"}>
              <input
                id={"break-game-link"}
                type="text"
                defaultValue={"https://break.solana.com/game"}
              />
              <span onClick={this.copyPath}>Copy URL</span>
            </div>
          )}
        </div>
      </header>
    );
  }
}

export default withRouter(Header);
