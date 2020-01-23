import {Action, SET_INFO} from "../types";
import ITransaction from "../../reducers/transactions/model";

export const setTransactionInfo = (info: ITransaction.Model): Action => {
    return {
        type: SET_INFO,
        payload: info
    }
};