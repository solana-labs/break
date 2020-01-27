import { Action, RESET_TRANSACTIONS } from "../types";

export const resetTransactions = (): Action => {
  return {
    type: RESET_TRANSACTIONS
  };
};
