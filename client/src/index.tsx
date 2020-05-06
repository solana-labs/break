import * as React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

import "styles/index.scss";

import App from "./app";
import { ApiProvider } from "providers/api";
import { BlockhashProvider } from "providers/blockhash";
import { TransactionsProvider } from "providers/transactions";
import { SocketProvider } from "providers/socket";
import { GameStateProvider } from "providers/game";

ReactDOM.render(
  <ApiProvider>
    <SocketProvider>
      <BlockhashProvider>
        <TransactionsProvider>
          <BrowserRouter>
            <GameStateProvider>
              <App />
            </GameStateProvider>
          </BrowserRouter>
        </TransactionsProvider>
      </BlockhashProvider>
    </SocketProvider>
  </ApiProvider>,
  document.getElementById("root")
);
