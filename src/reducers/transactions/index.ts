import ITransaction from "./model";
import {ADD_TRANSACTION, RESET_TRANSACTIONS, SET_INFO} from "../../actions/types";

const initState: ITransaction.ModelState = {
    transactions: [],
    countCompletedTransactions: 0,
};

const transactionReducer = (state = initState, action: any) => {

    switch (action.type) {
        case ADD_TRANSACTION: {
            const newTransaction: ITransaction.Model = {
                id: 'transaction' + state.transactions.length,
                status: 'default',
                info: {
                    signature: '',
                    confirmationTime: 0
                }
            };

            return {
                ...state,
                transactions: [
                    ...state.transactions,
                    newTransaction
                ]
            }
        }
        case SET_INFO: {
            const { id, status, info } = action.payload;
            return {
                ...state,
                transactions: state.transactions.map((item: ITransaction.Model) => {
                    if (item.id === id) {
                        return {
                            id, status, info
                        }
                    }
                    return item;
                }),
                countCompletedTransactions: state.countCompletedTransactions + 1,
            }
        }
        case RESET_TRANSACTIONS: {
            return {
                transactions: [],
                countCompletedTransactions: 0
            }
        }
        default:
            return state;
    }
};

export default transactionReducer;