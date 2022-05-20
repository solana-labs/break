import React from "react";
import { TrackedCommitment } from "./transactions";

export interface ClientConfig {
  computeUnitPrice?: number;
  parallelization: number;
  trackedCommitment: TrackedCommitment;
  showDebugTable: boolean;
  countdownSeconds: number;
  retryTransactionEnabled: boolean;
  autoSendTransactions: boolean;
  useTpu: boolean;
  rpcUrl?: string;
  extraWriteAccount?: string;
}

const DEFAULT_CONFIG: ClientConfig = {
  parallelization: 4,
  trackedCommitment: "confirmed",
  showDebugTable: false,
  retryTransactionEnabled: false,
  autoSendTransactions: false,
  countdownSeconds: 15,
  useTpu: false,
};

type SetConfig = React.Dispatch<React.SetStateAction<ClientConfig>>;
const ConfigContext = React.createContext<
  [ClientConfig, SetConfig] | undefined
>(undefined);

type Props = { children: React.ReactNode };
export function ConfigProvider({ children }: Props) {
  const stateHook = React.useState<ClientConfig>(DEFAULT_CONFIG);
  return (
    <ConfigContext.Provider value={stateHook}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useClientConfig() {
  const context = React.useContext(ConfigContext);
  if (!context) {
    throw new Error(`useClientConfig must be used within a ConfigProvider`);
  }
  return context;
}
