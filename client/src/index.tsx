import * as React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import Bugsnag from "@bugsnag/js";
import BugsnagPluginReact from "@bugsnag/plugin-react";

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

Bugsnag.start({
  apiKey: "e1e5631e036a4288aa58e273e0a7afd5",
  plugins: [new BugsnagPluginReact()],
});

function NoOpBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

const ErrorBoundary =
  Bugsnag.getPlugin("react")?.createErrorBoundary(React) || NoOpBoundary;

ReactDOM.render(
  <ErrorBoundary>
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
    </BrowserRouter>
  </ErrorBoundary>,
  document.getElementById("root")
);
