import * as React from "react";
import { Keypair } from "@solana/web3.js";
import { getLocalStorageKeypair } from "utils";
import { useHistory, useLocation } from "react-router";
import { useConfig } from "./server/http";

interface State {
  wallet?: Keypair;
  selectWallet: (wallet: Keypair | undefined) => void;
}

const StateContext = React.createContext<State | undefined>(undefined);

type Props = { children: React.ReactNode };
export function WalletProvider({ children }: Props) {
  const [wallet, setWallet] = React.useState<Keypair>();
  const config = useConfig();

  const history = useHistory();
  const location = useLocation();
  const selectWallet = React.useCallback(
    (keypair: Keypair | undefined) => {
      setWallet(keypair);
      if (keypair === undefined) {
        history.push({ ...location, pathname: "/wallet" });
      } else {
        history.push({ ...location, pathname: "/start" });
      }
    },
    [history, location]
  );

  React.useEffect(() => {
    if (config?.airdropEnabled) {
      setWallet(LOCAL_WALLET);
    } else {
      setWallet(undefined);
    }
  }, [config?.airdropEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const state = React.useMemo(
    () => ({
      wallet,
      selectWallet,
    }),
    [wallet, selectWallet]
  );

  return (
    <StateContext.Provider value={state}>{children}</StateContext.Provider>
  );
}

export const LOCAL_WALLET = (() => {
  return getLocalStorageKeypair("paymentKey");
})();

export function useWalletState(): State {
  const state = React.useContext(StateContext);
  if (state === undefined) {
    throw new Error(`usePayerState must be used within a WalletProvider`);
  }
  return state;
}
