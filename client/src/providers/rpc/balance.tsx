import * as React from "react";
import { AccountInfo } from "@solana/web3.js";

import { useWalletState } from "providers/wallet";
import { useConnection } from "providers/rpc";
import { getFeePayers, reportError } from "utils";
import { useClientConfig } from "providers/config";

type Balance = number | "loading";

interface State {
  payer: Balance;
  feePayers: Array<number>;
}

const StateContext = React.createContext<State | undefined>(undefined);

type Props = { children: React.ReactNode };
export function BalanceProvider({ children }: Props) {
  const [balance, setBalance] = React.useState<Balance>("loading");
  const [{ parallelization }] = useClientConfig();
  const [feePayerBalances, setFeePayerBalances] = React.useState(
    Array(parallelization).fill(0)
  );
  const payer = useWalletState().wallet;
  const connection = useConnection();

  const refreshBalance = React.useCallback(() => {
    if (payer === undefined || connection === undefined) {
      setBalance("loading");
      return;
    }

    (async () => {
      try {
        const balance = await connection.getBalance(payer.publicKey);
        setBalance(balance);
      } catch (err) {
        reportError(err, "Failed to refresh balance");
      }
    })();
  }, [payer, connection]);

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
    if (!payer || !connection) return;
    const subscription = connection.onAccountChange(
      payer.publicKey,
      (accountInfo: AccountInfo<Buffer>) => setBalance(accountInfo.lamports)
    );

    return () => {
      connection.removeAccountChangeListener(subscription);
    };
  }, [payer, connection]);

  const feePayers = React.useMemo(
    () => getFeePayers(parallelization),
    [parallelization]
  );
  const feePayerCounter = React.useRef(0);
  React.useEffect(() => {
    if (!connection) return;
    feePayerCounter.current++;
    const currentCounter = feePayerCounter.current;

    (async () => {
      const balances = await Promise.all(
        feePayers.map((feePayer) => {
          return connection.getBalance(feePayer.publicKey);
        })
      );
      if (feePayerCounter.current === currentCounter) {
        setFeePayerBalances(balances);
      }
    })();

    const subscriptions = feePayers.map((feePayer, index) => {
      return connection.onAccountChange(
        feePayer.publicKey,
        (accountInfo: AccountInfo<Buffer>) => {
          setFeePayerBalances((balances) => {
            const copy = [...balances];
            copy[index] = accountInfo.lamports;
            return copy;
          });
        }
      );
    });

    return () => {
      subscriptions.forEach((subscription) => {
        connection.removeAccountChangeListener(subscription);
      });
    };
  }, [connection, feePayers]);

  const state = React.useMemo(
    () => ({
      payer: balance,
      feePayers: feePayerBalances,
    }),
    [balance, feePayerBalances]
  );

  return (
    <StateContext.Provider value={state}>{children}</StateContext.Provider>
  );
}

export function useBalanceState(): State {
  const state = React.useContext(StateContext);
  if (state === undefined) {
    throw new Error(`useBalanceState must be used within a BalanceProvider`);
  }
  return state;
}
