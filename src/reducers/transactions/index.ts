import ITransaction from "./model";
import {ADD_TRANSACTION, SET_INFO} from "../../actions/types";

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

            console.log('id - ', newTransaction.id);

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
        default:
            return state;
    }
};

export default transactionReducer;
