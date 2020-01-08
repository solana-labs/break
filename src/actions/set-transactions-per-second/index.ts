import {SET_TPS} from "../types";

export const setTransactionsPerSecond = (tps: number) => {
    return {
        type: SET_TPS,
        payload: tps,
    }
};