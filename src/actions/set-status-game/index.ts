import {SET_STATUS_GAME} from "../types";

export const setStatusGame = (status: string) => {
    return {
        type: SET_STATUS_GAME,
        payload: status
    }
};