import * as React from "react";
import { useTransactions, UserTransaction } from "./index";

type SetSelected = React.Dispatch<React.SetStateAction<string | undefined>>;
export const SelectedContext = React.createContext<
  [UserTransaction | undefined, SetSelected] | undefined
>(undefined);
type ProviderProps = { children: React.ReactNode };
export function SelectedTxProvider({ children }: ProviderProps) {
  const transactions = useTransactions();
  const [signature, selectSignature] = React.useState<string | undefined>(
    undefined
  );
  const [transaction, selectTransaction] = React.useState<
    UserTransaction | undefined
  >(undefined);

  React.useEffect(() => {
    selectTransaction(transactions.find(tx => tx.signature === signature));
  }, [transactions, signature]);

  return (
    <SelectedContext.Provider value={[transaction, selectSignature]}>
      {children}
    </SelectedContext.Provider>
  );
}

export function useSelectedTransaction() {
  const state = React.useContext(SelectedContext);
  if (!state) {
    throw new Error(`useSelectedTx must be used within a TransactionsProvider`);
  }
  return state[0];
}

export function useSelectTransaction() {
  const state = React.useContext(SelectedContext);
  if (!state) {
    throw new Error(`useSelectTx must be used within a TransactionsProvider`);
  }
  return state[1];
}
