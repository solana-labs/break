import {SET_STATUS_LOADER} from "../types";

export const setStatusLoader = (status: boolean) => {
    return {
        type: SET_STATUS_LOADER,
        payload: status
    }
};