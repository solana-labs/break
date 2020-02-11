export const SET_STATISTICS_GAME = "SET_STATISTICS_GAME";
export const RESET_STATISTICS_GAME = "RESET_STATISTICS_GAME";

export const UPDATE_TRANSACTION = "UPDATE_TRANSACTION";
export const ADD_TRANSACTION = "ADD_TRANSACTION";
export const RESET_TRANSACTIONS = "RESET_TRANSACTIONS";

export const SET_STATUS_LOADER = "SET_STATUS_LOADER";
export const SET_TPS = "SET_TPS";

export interface Action {
  type: string;
  payload?: any;
}
