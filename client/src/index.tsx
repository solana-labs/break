import * as React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

import "styles/index.scss";

import App from "./app";
import { ApiProvider } from "providers/api";
import { BlockhashProvider } from "providers/blockhash";
import { AccountProvider } from "providers/account";
import { BalanceProvider } from "providers/balance";
import { TransactionsProvider } from "providers/transactions";
import { SocketProvider } from "providers/socket";
import { GameStateProvider } from "providers/game";
import { ServerProvider } from "providers/server";

ReactDOM.render(
  <BrowserRouter>
    <ServerProvider>
      <AccountProvider>
        <ApiProvider>
          <SocketProvider>
            <BlockhashProvider>
              <BalanceProvider>
                <TransactionsProvider>
                  <GameStateProvider>
                    <App />
                  </GameStateProvider>
                </TransactionsProvider>
              </BalanceProvider>
            </BlockhashProvider>
          </SocketProvider>
        </ApiProvider>
      </AccountProvider>
    </ServerProvider>
  </BrowserRouter>,
  document.getElementById("root")
);
