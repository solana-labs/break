import * as React from "react";
import { Connection, Account, AccountInfo } from "@solana/web3.js";
import { useConfig, useRefreshAccounts } from "./api";

interface State {
  account: Account;
  balance: number;
}

const StateContext = React.createContext<State | undefined>(undefined);

const paymentAccount = (() => {
  const paymentKey = window.localStorage.getItem("paymentKey");
  if (paymentKey) {
    return new Account(Buffer.from(paymentKey, "base64"));
  } else {
    const paymentAccount = new Account();
    window.localStorage.setItem(
      "paymentKey",
      Buffer.from(paymentAccount.secretKey).toString("base64")
    );
    return paymentAccount;
  }
})();

type Props = { children: React.ReactNode };
export function PaymentProvider({ children }: Props) {
  const account = React.useRef(paymentAccount);
  const [balance, setBalance] = React.useState(-1);
  const lastBalance = React.useRef(0);
  const config = useConfig();
  const clusterUrl = config?.clusterUrl;
  const gameCost = config?.gameCost;

  const refreshBalance = React.useCallback(() => {
    if (!clusterUrl) return;
    const connection = new Connection(clusterUrl, "singleGossip");
    connection.getBalance(account.current.publicKey).then((balance: number) => {
      setBalance(balance);
    });
  }, [clusterUrl]);

  React.useEffect(() => {
    refreshBalance();
    const onChange = () => {
      if (document.visibilityState !== "visible") return;
      refreshBalance();
    };

    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, [refreshBalance]);

  const refreshAccounts = useRefreshAccounts();
  React.useEffect(() => {
    if (gameCost === undefined) return;
    if (balance > lastBalance.current) {
      if (balance < gameCost) {
        refreshAccounts();
      } else {
        refreshAccounts(account.current);
      }
    }
    lastBalance.current = balance;
  }, [balance, refreshAccounts, gameCost]);

  React.useEffect(() => {
    if (!clusterUrl) return;

    const connection = new Connection(clusterUrl);
    const subscription = connection.onAccountChange(
      account.current.publicKey,
      (accountInfo: AccountInfo) => setBalance(accountInfo.lamports),
      "singleGossip"
    );

    return () => {
      connection.removeAccountChangeListener(subscription);
    };
  }, [clusterUrl]);

  return (
    <StateContext.Provider value={{ account: account.current, balance }}>
      {children}
    </StateContext.Provider>
  );
}

export function usePaymentAccount() {
  const state = React.useContext(StateContext);
  const gameCost = useConfig()?.gameCost;
  if (!state) {
    throw new Error(`usePaymentAccount must be used within a PaymentProvider`);
  }

  if (gameCost) {
    return state.account;
  }
}
