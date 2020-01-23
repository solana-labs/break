import * as React from "react";
import { Helmet } from "react-helmet";

import "./index.scss";
import Home from "../../containers/home";

export default class HomeScene extends React.Component {
  render() {
    return (
      <React.Fragment>
        <Helmet>
          <title>Break Solana - Home</title>
        </Helmet>
        <Home />
      </React.Fragment>
    );
  }
}
