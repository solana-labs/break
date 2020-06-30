import * as React from "react";
import { AccountInfo } from "@solana/web3.js";
import { useConfig } from "./api";
import { PAYMENT_ACCOUNT } from "utils";

type Balance = number | "loading";
const StateContext = React.createContext<Balance | undefined>(undefined);

type Props = { children: React.ReactNode };
export function PaymentProvider({ children }: Props) {
  const [balance, setBalance] = React.useState<Balance>("loading");
  const config = useConfig();
  const connection = config?.connection;
  const paymentRequired = config?.paymentRequired;

  const refreshBalance = React.useCallback(() => {
    if (connection === undefined || paymentRequired !== true) return;
    connection
      .getBalance(PAYMENT_ACCOUNT.publicKey, "singleGossip")
      .then((balance: number) => {
        setBalance(balance);
      })
      .catch((err) => {
        console.error("Failed to refresh balance", err);
      });
  }, [connection, paymentRequired]);

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
    if (connection === undefined || paymentRequired !== true) return;
    const subscription = connection.onAccountChange(
      PAYMENT_ACCOUNT.publicKey,
      (accountInfo: AccountInfo) => setBalance(accountInfo.lamports),
      "singleGossip"
    );

    return () => {
      connection.removeAccountChangeListener(subscription);
    };
  }, [connection, paymentRequired]);

  return (
    <StateContext.Provider value={balance}>{children}</StateContext.Provider>
  );
}

export function useBalance() {
  const balance = React.useContext(StateContext);
  if (balance === undefined) {
    throw new Error(`useBalance must be used within a PaymentProvider`);
  }
  return balance;
}
