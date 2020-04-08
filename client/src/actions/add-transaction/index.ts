import { Action, ADD_TRANSACTION } from "../types";

export const addTransaction = (signature: string): Action => {
  return {
    type: ADD_TRANSACTION,
    payload: {
      signature
    }
  };
};
