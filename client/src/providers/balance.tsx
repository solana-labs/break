import * as React from "react";
import { AccountInfo } from "@solana/web3.js";
import { useConfig } from "./api";
import { useAccountState } from "./account";

type Balance = number | "loading";
const StateContext = React.createContext<Balance | undefined>(undefined);

type Props = { children: React.ReactNode };
export function BalanceProvider({ children }: Props) {
  const [balance, setBalance] = React.useState<Balance>("loading");
  const [account] = useAccountState();
  const config = useConfig();
  const connection = config?.connection;
  const paymentRequired = config?.paymentRequired;

  const refreshBalance = React.useCallback(() => {
    if (
      account === undefined ||
      connection === undefined ||
      paymentRequired !== true
    )
      return;

    (async () => {
      try {
        const balance = await connection.getBalance(
          account.publicKey,
          "singleGossip"
        );
        setBalance(balance);
      } catch (err) {
        console.error("Failed to refresh balance", err);
      }
    })();
  }, [account, connection, paymentRequired]);

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
      account === undefined ||
      connection === undefined ||
      paymentRequired !== true
    )
      return;
    const subscription = connection.onAccountChange(
      account.publicKey,
      (accountInfo: AccountInfo) => setBalance(accountInfo.lamports),
      "singleGossip"
    );

    return () => {
      connection.removeAccountChangeListener(subscription);
    };
  }, [account, connection, paymentRequired]);

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
