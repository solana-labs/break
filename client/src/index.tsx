import * as React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

import "shared/styles/global.scss";

import App from "./app";
import { ApiProvider } from "providers/api";
import { SolanaProvider } from "providers/solana";
import { BlockhashProvider } from "providers/blockhash";
import { TransactionsProvider } from "providers/transactions";
import { SocketProvider } from "providers/socket";

ReactDOM.render(
  <ApiProvider>
    <SocketProvider>
      <SolanaProvider>
        <BlockhashProvider>
          <TransactionsProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </TransactionsProvider>
        </BlockhashProvider>
      </SolanaProvider>
    </SocketProvider>
  </ApiProvider>,
  document.getElementById("root")
);
