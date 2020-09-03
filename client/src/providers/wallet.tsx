import * as React from "react";
import { Account } from "@solana/web3.js";

type SetAccount = (account: Account | undefined) => void;
type State = [Account | undefined, SetAccount];

const StateContext = React.createContext<State | undefined>(undefined);

type Props = { children: React.ReactNode };
export function WalletProvider({ children }: Props) {
  const state = React.useState<Account>();
  return (
    <StateContext.Provider value={state}>{children}</StateContext.Provider>
  );
}

export function usePayerState(): State {
  const state = React.useContext(StateContext);
  if (state === undefined) {
    throw new Error(`usePayerState must be used within a WalletProvider`);
  }
  return state;
}
