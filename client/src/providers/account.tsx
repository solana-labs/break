import * as React from "react";
import { Account } from "@solana/web3.js";

type SetAccount = (account: Account) => void;
type State = {
  account: Account | undefined;
  setAccount: SetAccount;
};

const StateContext = React.createContext<State | undefined>(undefined);

type Props = { children: React.ReactNode };
export function AccountProvider({ children }: Props) {
  const [account, setAccount] = React.useState<Account | undefined>(undefined);
  const state = { account, setAccount };
  return (
    <StateContext.Provider value={state}>{children}</StateContext.Provider>
  );
}

export function useAccountState(): [Account | undefined, SetAccount] {
  const state = React.useContext(StateContext);
  if (state === undefined) {
    throw new Error(`useAccountState must be used within a AccountProvider`);
  }
  return [state.account, state.setAccount];
}
