import * as React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
// import * as Sentry from "@sentry/react";
// import { Integrations } from "@sentry/tracing";

import "styles/index.scss";

import App from "./app";
import { WalletProvider } from "providers/wallet";
import { TransactionsProvider } from "providers/transactions";
import { GameStateProvider } from "providers/game";
import { ServerProvider } from "providers/server";
import { RpcProvider } from "providers/rpc";
import { SlotProvider } from "providers/slot";
import { AccountsProvider } from "providers/accounts";
import { TorusProvider } from "providers/torus";
import { ConfigProvider } from "providers/config";

// if (process.env.NODE_ENV === "production") {
//   Sentry.init({
//     dsn:
//       "https://727cd3fff6f949449c1ce5030928e667@o434108.ingest.sentry.io/5411826",
//     integrations: [new Integrations.BrowserTracing()],
//     tracesSampleRate: 1.0,
//   });
// }

ReactDOM.render(
  <ConfigProvider>
    <BrowserRouter>
      <ServerProvider>
        <TorusProvider>
          <WalletProvider>
            <RpcProvider>
              <AccountsProvider>
                <SlotProvider>
                  <TransactionsProvider>
                    <GameStateProvider>
                      <App />
                    </GameStateProvider>
                  </TransactionsProvider>
                </SlotProvider>
              </AccountsProvider>
            </RpcProvider>
          </WalletProvider>
        </TorusProvider>
      </ServerProvider>
    </BrowserRouter>
  </ConfigProvider>,
  document.getElementById("root")
);
