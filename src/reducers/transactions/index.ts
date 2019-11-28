import ITransaction from "./model";
import {ADD_TRANSACTION} from "../../actions/types";

const initState: ITransaction.ModelState = {
    transactions: [],
};

const transactionReducer = (state = initState, action: any) => {

    console.log('act ', action)

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
        default:
            return state;
    }
};

export default transactionReducer;
