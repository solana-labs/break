import { Action, ADD_TRANSACTION } from "../types";

export const addTransaction = (): Action => {
  return {
    type: ADD_TRANSACTION
  };
};
