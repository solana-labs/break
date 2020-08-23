import * as React from "react";
import { useTransactions, TransactionState } from "./index";

type SetSelected = React.Dispatch<React.SetStateAction<string | undefined>>;
type SelectedState = [TransactionState | undefined, SetSelected];
export const SelectedContext = React.createContext<SelectedState | undefined>(
  undefined
);
type ProviderProps = { children: React.ReactNode };
export function SelectedTxProvider({ children }: ProviderProps) {
  const transactions = useTransactions();
  const [signature, selectSignature] = React.useState<string | undefined>(
    undefined
  );
  const [transaction, selectTransaction] = React.useState<
    TransactionState | undefined
  >(undefined);

  React.useEffect(() => {
    selectTransaction(
      transactions.find((tx) => tx.details.signature === signature)
    );
  }, [transactions, signature]);

  const selectedState: SelectedState = React.useMemo(() => {
    return [transaction, selectSignature];
  }, [transaction]);

  return (
    <SelectedContext.Provider value={selectedState}>
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
