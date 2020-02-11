import * as ITransaction from "./model";
import {
  ADD_TRANSACTION,
  RESET_TRANSACTIONS,
  UPDATE_TRANSACTION,
  SET_TPS
} from "../../actions/types";

const initState: ITransaction.ModelState = {
  transactions: [],
  userCompletedCount: 0,
  allCompletedCount: 0,
  transactionsPerSecond: 0
};

const transactionReducer = (
  state = initState,
  action: any
): ITransaction.ModelState => {
  switch (action.type) {
    case ADD_TRANSACTION: {
      const { accountId, signature } = action.payload;
      const newTransaction: ITransaction.Model = {
        status: "sent",
        info: {
          accountId,
          signature,
          confirmationTime: 0,
          userSent: false
        }
      };

      return {
        ...state,
        transactions: [...state.transactions, newTransaction]
      };
    }
    case UPDATE_TRANSACTION: {
      const { status, info }: ITransaction.Model = action.payload;

      const transactions: ITransaction.Model[] = state.transactions.map(
        (item: ITransaction.Model) => {
          if (item.info.accountId === info.accountId) {
            return {
              ...item,
              status,
              info
            };
          }
          return item;
        }
      );

      let allCompletedCount = state.allCompletedCount;
      let userCompletedCount = state.userCompletedCount;
      if (status === "success") {
        allCompletedCount += 1;
        if (info.userSent) {
          userCompletedCount += 1;
        }
      }

      return {
        ...state,
        transactions,
        allCompletedCount,
        userCompletedCount
      };
    }
    case RESET_TRANSACTIONS: {
      return {
        ...state,
        transactions: [],
        allCompletedCount: 0,
        userCompletedCount: 0,
        transactionsPerSecond: 0
      };
    }
    case SET_TPS: {
      return {
        ...state,
        transactionsPerSecond: action.payload
      };
    }
    default:
      return state;
  }
};

export default transactionReducer;
