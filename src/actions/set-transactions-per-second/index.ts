import {Action, SET_TPS} from "../types";

export const setTransactionsPerSecond = (tps: number): Action => {
    return {
        type: SET_TPS,
        payload: tps,
    }
};