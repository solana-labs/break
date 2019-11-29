import ITransaction from "./model";
import {ADD_TRANSACTION, RESET_TRANSACTIONS, SET_INFO} from "../../actions/types";

const initState: ITransaction.ModelState = {
    transactions: [],
};

const transactionReducer = (state = initState, action: any) => {

    switch (action.type) {
        case ADD_TRANSACTION: {
            const newTransaction: ITransaction.Model = {
                id: 'transaction' + state.transactions.length,
                status: 'default',
                info: {
                    description: ''
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
                })
            }
        }
        case RESET_TRANSACTIONS: {
            return {
                transactions: []
            }
        }
        default:
            return state;
    }
};

export default transactionReducer;