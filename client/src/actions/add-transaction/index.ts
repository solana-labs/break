import { Action, ADD_TRANSACTION } from "../types";

export const addTransaction = (
  accountId: string,
  signature: string
): Action => {
  return {
    type: ADD_TRANSACTION,
    payload: {
      accountId,
      signature
    }
  };
};
