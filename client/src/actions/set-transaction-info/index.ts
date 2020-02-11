import { Action, UPDATE_TRANSACTION } from "../types";
import * as ITransaction from "../../reducers/transactions/model";

export const updateTransaction = (model: ITransaction.Model): Action => {
  return {
    type: UPDATE_TRANSACTION,
    payload: model
  };
};
