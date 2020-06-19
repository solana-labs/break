import * as React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

import "styles/index.scss";

import App from "./app";
import { ApiProvider } from "providers/api";
import { BlockhashProvider } from "providers/blockhash";
import { PaymentProvider } from "providers/payment";
import { TransactionsProvider } from "providers/transactions";
import { SocketProvider } from "providers/socket";
import { GameStateProvider } from "providers/game";
import { ServerProvider } from "providers/server";

ReactDOM.render(
  <BrowserRouter>
    <ServerProvider>
      <ApiProvider>
        <SocketProvider>
          <BlockhashProvider>
            <PaymentProvider>
              <TransactionsProvider>
                <GameStateProvider>
                  <App />
                </GameStateProvider>
              </TransactionsProvider>
            </PaymentProvider>
          </BlockhashProvider>
        </SocketProvider>
      </ApiProvider>
    </ServerProvider>
  </BrowserRouter>,
  document.getElementById("root")
);
