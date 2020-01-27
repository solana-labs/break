import transactionReducer from "../../reducers/transactions";
import * as ITransaction from "../../reducers/transactions/model";
import { TransactionServiceInfo } from "../../services/transactions-service/model";

describe("test function transactionReducer", () => {
  it("add transaction", () => {
    const expectedState = {
      transactions: [
        {
          id: "transaction0",
          status: "default",
          info: {
            signature: "",
            confirmationTime: 0,
            lamportsCount: 0
          }
        }
      ],
      countCompletedTransactions: 0,
      averageTransactionsTime: 0,
      transactionsPerSecond: 0
    };

    const action = {
      type: "ADD_TRANSACTION"
    };

    const result = transactionReducer(undefined, action);

    expect(result).toEqual(expectedState);
  });

  it("add transaction - 2", () => {
    const expectedState = {
      transactions: [
        {
          id: "transaction0",
          status: "default",
          info: {
            signature: "",
            confirmationTime: 0,
            lamportsCount: 0
          }
        },
        {
          id: "transaction1",
          status: "default",
          info: {
            signature: "",
            confirmationTime: 0,
            lamportsCount: 0
          }
        }
      ],
      countCompletedTransactions: 2,
      averageTransactionsTime: 0.1,
      transactionsPerSecond: 0
    };

    const initState = {
      transactions: [
        {
          id: "transaction0",
          status: "default",
          info: {
            signature: "",
            confirmationTime: 0,
            lamportsCount: 0
          }
        }
      ],
      countCompletedTransactions: 2,
      averageTransactionsTime: 0.1,
      transactionsPerSecond: 0
    };

    const action = {
      type: "ADD_TRANSACTION"
    };

    const result = transactionReducer(initState, action);

    expect(result).toEqual(expectedState);
  });

  it("reset transaction", () => {
    const expectedState = {
      transactions: [],
      countCompletedTransactions: 0,
      averageTransactionsTime: 0,
      transactionsPerSecond: 0
    };

    const action = {
      type: "RESET_TRANSACTIONS"
    };

    const result = transactionReducer(undefined, action);

    expect(result).toEqual(expectedState);
  });

  it("reset transaction - 2", () => {
    const initState = {
      transactions: [
        {
          id: "transaction0",
          status: "default",
          info: {
            signature: "",
            confirmationTime: 0,
            lamportsCount: 0
          }
        }
      ],
      countCompletedTransactions: 2,
      averageTransactionsTime: 0.1,
      transactionsPerSecond: 0
    };

    const expectedState = {
      transactions: [],
      countCompletedTransactions: 0,
      averageTransactionsTime: 0,
      transactionsPerSecond: 0
    };

    const action = {
      type: "RESET_TRANSACTIONS"
    };

    const result = transactionReducer(initState, action);

    expect(result).toEqual(expectedState);
  });

  it("test with invalid action", () => {
    const expectedState = {
      transactions: [],
      countCompletedTransactions: 0,
      averageTransactionsTime: 0,
      transactionsPerSecond: 0
    };

    const action = {
      type: "INVALID"
    };

    const result = transactionReducer(undefined, action);

    expect(result).toEqual(expectedState);
  });

  it("test with invalid action - 2", () => {
    const initState = {
      transactions: [
        {
          id: "transaction0",
          status: "default",
          info: {
            signature: "",
            confirmationTime: 0,
            lamportsCount: 0
          }
        }
      ],
      countCompletedTransactions: 2,
      averageTransactionsTime: 0.1,
      transactionsPerSecond: 0
    };

    const action = {
      type: "INVALID"
    };

    const result = transactionReducer(initState, action);

    expect(result).toEqual(initState);
  });

  it("test set info ", () => {
    const initState = {
      transactions: [
        {
          id: "transaction0",
          status: "default",
          info: {
            signature: "",
            confirmationTime: 0,
            lamportsCount: 0
          }
        },
        {
          id: "transaction1",
          status: "default",
          info: {
            signature: "",
            confirmationTime: 0,
            lamportsCount: 0
          }
        }
      ],
      countCompletedTransactions: 0,
      averageTransactionsTime: 0,
      transactionsPerSecond: 0
    };

    const info: TransactionServiceInfo = {
      signature: "signature",
      confirmationTime: 0.5,
      lamportsCount: 1000
    };

    const payload: ITransaction.Model = {
      id: "transaction0",
      status: "completed",
      info
    };

    const action = {
      type: "SET_INFO",
      payload
    };

    const expectedState = {
      transactions: [
        {
          id: "transaction0",
          status: "completed",
          info: {
            signature: "signature",
            confirmationTime: 0.5,
            lamportsCount: 1000
          }
        },
        {
          id: "transaction1",
          status: "default",
          info: {
            signature: "",
            confirmationTime: 0,
            lamportsCount: 0
          }
        }
      ],
      countCompletedTransactions: 1,
      averageTransactionsTime: 0.5,
      transactionsPerSecond: 0
    };

    const result = transactionReducer(initState, action);

    expect(result).toEqual(expectedState);
  });

  it("test set tps - 1 ", () => {
    const initState = {
      transactions: [],
      countCompletedTransactions: 0,
      averageTransactionsTime: 0,
      transactionsPerSecond: 0
    };

    const action = {
      type: "SET_TPS",
      payload: 10
    };

    const expectedState = {
      transactions: [],
      countCompletedTransactions: 0,
      averageTransactionsTime: 0,
      transactionsPerSecond: 2
    };

    const result = transactionReducer(initState, action);

    expect(result).toEqual(expectedState);
  });

  it("test set tps - 2 ", () => {
    const initState = {
      transactions: [],
      countCompletedTransactions: 0,
      averageTransactionsTime: 0,
      transactionsPerSecond: 0
    };

    const action = {
      type: "SET_TPS",
      payload: 9.5
    };

    const expectedState = {
      transactions: [],
      countCompletedTransactions: 0,
      averageTransactionsTime: 0,
      transactionsPerSecond: 1.9
    };

    const result = transactionReducer(initState, action);

    expect(result).toEqual(expectedState);
  });
});
