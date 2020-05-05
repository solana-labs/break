import * as React from "react";

import { AccountInfo, Connection } from "@solana/web3.js";
import { useConfig } from "./api";
import * as Bytes from "utils/bytes";

enum Status {
  Initializing,
  Refreshing,
  Active,
  Inactive
}

interface State {
  status: Status;
  connection?: Connection;
}

const SolanaContext = React.createContext<State | undefined>(undefined);
const AccountIdsContext = React.createContext<Set<number> | undefined>(
  undefined
);

type ProviderProps = { children: React.ReactNode };
export function SolanaProvider({ children }: ProviderProps) {
  const [state, setState] = React.useState<State>({ status: Status.Inactive });
  const [accountIds, setAccountIds] = React.useState<Set<number>>(new Set());
  const config = useConfig();

  React.useEffect(() => {
    if (!config) return;

    const connection = new Connection(config.clusterUrl, "recent");
    const subscriptionId = connection.onAccountChange(
      config.programAccount,
      (accountInfo: AccountInfo) =>
        setAccountIds(new Set(Bytes.toIds(accountInfo.data)))
    );

    setState({ status: Status.Active, connection });

    return () => {
      setState({ status: Status.Inactive });
      connection.removeAccountChangeListener(subscriptionId);
    };
  }, [config]);

  return (
    <SolanaContext.Provider value={state}>
      <AccountIdsContext.Provider value={accountIds}>
        {children}
      </AccountIdsContext.Provider>
    </SolanaContext.Provider>
  );
}

export function useAccountIds() {
  const context = React.useContext(AccountIdsContext);
  if (!context) {
    throw new Error(`useAccountIds must be used within a SolanaProvider`);
  }
  return context;
}
