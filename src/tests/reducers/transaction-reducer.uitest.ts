import transactionReducer from "../../reducers/transactions";

describe('test function transactionReducer', () => {
    it('add transaction', () => {
        const expectedState = {
            transactions: [
                {
                    id: 'transaction0',
                    status: 'default',
                    info: {
                        signature: '',
                        confirmationTime: 0,
                        lamportsCount: 0
                    }
                }
            ],
            countCompletedTransactions: 0,
            averageTransactionsTime: 0,
        };

        const action = {
            type: 'ADD_TRANSACTION',
        };

        const result = transactionReducer(undefined, action);

        expect(result).toEqual(expectedState);
    });

    it('add transaction - 2', () => {
        const expectedState = {
            transactions: [
                {
                    id: 'transaction0',
                    status: 'default',
                    info: {
                        signature: '',
                        confirmationTime: 0,
                        lamportsCount: 0
                    }
                },
                {
                    id: 'transaction1',
                    status: 'default',
                    info: {
                        signature: '',
                        confirmationTime: 0,
                        lamportsCount: 0
                    }
                }
            ],
            countCompletedTransactions: 2,
            averageTransactionsTime: 0.1,
        };

        const initState = {
            transactions: [
                {
                    id: 'transaction0',
                    status: 'default',
                    info: {
                        signature: '',
                        confirmationTime: 0,
                        lamportsCount: 0
                    }
                }
            ],
            countCompletedTransactions: 2,
            averageTransactionsTime: 0.1,
        };

        const action = {
            type: 'ADD_TRANSACTION',
        };

        const result = transactionReducer(initState, action);

        expect(result).toEqual(expectedState);
    });

    it('reset transaction', () => {
        const expectedState = {
            transactions: [],
            countCompletedTransactions: 0,
            averageTransactionsTime: 0
        };

        const action = {
            type: 'RESET_TRANSACTIONS',
        };

        const result = transactionReducer(undefined, action);

        expect(result).toEqual(expectedState);
    });

    it('reset transaction - 2', () => {
        const initState = {
            transactions: [
                {
                    id: 'transaction0',
                    status: 'default',
                    info: {
                        signature: '',
                        confirmationTime: 0,
                        lamportsCount: 0
                    }
                }
            ],
            countCompletedTransactions: 2,
            averageTransactionsTime: 0.1,
        };

        const expectedState = {
            transactions: [],
            countCompletedTransactions: 0,
            averageTransactionsTime: 0
        };

        const action = {
            type: 'RESET_TRANSACTIONS',
        };

        const result = transactionReducer(initState, action);

        expect(result).toEqual(expectedState);
    });

    it('test with invalid action', () => {
        const expectedState = {
            transactions: [],
            countCompletedTransactions: 0,
            averageTransactionsTime: 0,
        };

        const action = {
            type: 'INVALID',
        };

        const result = transactionReducer(undefined, action);

        expect(result).toEqual(expectedState);
    });

    it('test with invalid action - 2', () => {
        const initState = {
            transactions: [
                {
                    id: 'transaction0',
                    status: 'default',
                    info: {
                        signature: '',
                        confirmationTime: 0,
                        lamportsCount: 0
                    }
                }
            ],
            countCompletedTransactions: 2,
            averageTransactionsTime: 0.1,
        };

        const action = {
            type: 'INVALID',
        };

        const result = transactionReducer(initState, action);

        expect(result).toEqual(initState);
    });
});