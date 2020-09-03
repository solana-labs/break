import * as React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";

import "styles/index.scss";

import App from "./app";
import { ApiProvider } from "providers/api";
import { BlockhashProvider } from "providers/blockhash";
import { WalletProvider } from "providers/wallet";
import { BalanceProvider } from "providers/balance";
import { TransactionsProvider } from "providers/transactions";
import { SocketProvider } from "providers/socket";
import { GameStateProvider } from "providers/game";
import { ServerProvider } from "providers/server";

Sentry.init({
  dsn:
    "https://727cd3fff6f949449c1ce5030928e667@o434108.ingest.sentry.io/5411826",
  integrations: [new Integrations.BrowserTracing()],
  tracesSampleRate: 1.0,
});

ReactDOM.render(
  <BrowserRouter>
    <ServerProvider>
      <WalletProvider>
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
      </WalletProvider>
    </ServerProvider>
  </BrowserRouter>,
  document.getElementById("root")
);
