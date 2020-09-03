import * as React from "react";
import { AccountInfo } from "@solana/web3.js";
import { useConfig } from "./server/http";
import { usePayerState } from "./wallet";
import { reportError } from "utils";

type Balance = number | "loading";
const StateContext = React.createContext<Balance | undefined>(undefined);

type Props = { children: React.ReactNode };
export function BalanceProvider({ children }: Props) {
  const [balance, setBalance] = React.useState<Balance>("loading");
  const [payer] = usePayerState();
  const config = useConfig();
  const connection = config?.connection;
  const paymentRequired = config?.paymentRequired;

  const refreshBalance = React.useCallback(() => {
    if (
      payer === undefined ||
      connection === undefined ||
      paymentRequired !== true
    ) {
      setBalance("loading");
      return;
    }

    (async () => {
      try {
        const balance = await connection.getBalance(
          payer.publicKey,
          "singleGossip"
        );
        setBalance(balance);
      } catch (err) {
        reportError(err, "Failed to refresh balance");
      }
    })();
  }, [payer, connection, paymentRequired]);

  React.useEffect(() => {
    refreshBalance();
    const onChange = () => {
      if (document.visibilityState !== "visible") return;
      refreshBalance();
    };

    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, [refreshBalance]);

  React.useEffect(() => {
    if (
      payer === undefined ||
      connection === undefined ||
      paymentRequired !== true
    )
      return;
    const subscription = connection.onAccountChange(
      payer.publicKey,
      (accountInfo: AccountInfo<Buffer>) => setBalance(accountInfo.lamports),
      "singleGossip"
    );

    return () => {
      connection.removeAccountChangeListener(subscription);
    };
  }, [payer, connection, paymentRequired]);

  return (
    <StateContext.Provider value={balance}>{children}</StateContext.Provider>
  );
}

export function useBalance(): Balance {
  const state = React.useContext(StateContext);
  if (state === undefined) {
    throw new Error(`useBalance must be used within a BalanceProvider`);
  }
  return state;
}
