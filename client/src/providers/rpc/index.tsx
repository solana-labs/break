import React from "react";
import { Connection } from "@solana/web3.js";
import { useConfig } from "providers/server/http";
import { BlockhashProvider } from "./blockhash";
import { BalanceProvider } from "./balance";

type SetUrl = (url: string) => void;
type State = [string | undefined, SetUrl];

type ConnectionState = {
  connection?: Connection;
};

const StateContext = React.createContext<State | undefined>(undefined);
const ConnectionContext = React.createContext<ConnectionState | undefined>(
  undefined
);

type ProviderProps = { children: React.ReactNode };
export function RpcProvider({ children }: ProviderProps) {
  const state = React.useState<string>();
  const [rpcUrl, setRpcUrl] = state;

  // Reset rpc url whenever config is fetched
  const configRpcUrl = useConfig()?.rpcUrl;
  React.useEffect(() => {
    setRpcUrl(configRpcUrl);
  }, [configRpcUrl, setRpcUrl]);

  const connection: ConnectionState = React.useMemo(() => {
    if (rpcUrl === undefined) return {};
    try {
      const url = new URL(rpcUrl).toString();
      return { connection: new Connection(url) };
    } catch (err) {
      console.error(err);
      return {};
    }
  }, [rpcUrl]);

  return (
    <StateContext.Provider value={state}>
      <ConnectionContext.Provider value={connection}>
        <BlockhashProvider>
          <BalanceProvider>{children}</BalanceProvider>
        </BlockhashProvider>
      </ConnectionContext.Provider>
    </StateContext.Provider>
  );
}

export function useRpcUrlState(): State {
  const state = React.useContext(StateContext);
  if (state === undefined) {
    throw new Error(`useRpcUrlState must be used within a RpcProvider`);
  }
  return state;
}

export function useConnection(): Connection | undefined {
  const state = React.useContext(ConnectionContext);
  if (state === undefined) {
    throw new Error(`useConnection must be used within a RpcProvider`);
  }
  return state.connection;
}
