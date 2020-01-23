import {Action, SET_STATUS_LOADER} from "../types";

export const setStatusLoader = (status: boolean): Action => {
    return {
        type: SET_STATUS_LOADER,
        payload: status
    }
};