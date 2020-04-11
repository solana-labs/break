import * as React from "react";
import ReactDOM from "react-dom";

import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";

import "shared/styles/global.scss";

import App from "./app";
import appStore from "./store";
import Service from "./services";
import { ServiceProvider } from "./components/context/service-context";

ReactDOM.render(
  <Provider store={appStore}>
    <ServiceProvider value={new Service()}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ServiceProvider>
  </Provider>,
  document.getElementById("root")
);
