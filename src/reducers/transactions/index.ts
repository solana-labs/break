import ITransaction from "./model";
import {ADD_TRANSACTION, RESET_TRANSACTIONS, SET_INFO} from "../../actions/types";

const initState: ITransaction.ModelState = {
    transactions: [],
    countCompletedTransactions: 0,
    averageTransactionsTime: 0,
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
            const {id, status, info} = action.payload;

            let newTransactions: ITransaction.Model[] = [];
            let newArrayConfirmationTime: number[] = [];
            let newAverageTransactionsTime: number = 0;

            newTransactions = state.transactions.map((item: ITransaction.Model) => {
                if (item.id === id) {
                    return {
                        id, status, info
                    }
                }
                return item;
            });

            newArrayConfirmationTime = state.transactions.map((item: ITransaction.Model) => {
                console.log(item.status);
                return item.info.confirmationTime;

            });

            newAverageTransactionsTime = newArrayConfirmationTime.reduce((accumulator, currentValue) => accumulator + currentValue) / newArrayConfirmationTime.length;

            console.log('newArrayConfirmationTime', newArrayConfirmationTime)
            console.log('newAverageTransactionsTime', newAverageTransactionsTime)


            return {
                ...state,
                transactions: newTransactions,
                countCompletedTransactions: state.countCompletedTransactions + 1,
                averageTransactionsTime: newAverageTransactionsTime
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