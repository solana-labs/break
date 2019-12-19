import {SET_USER_RECORD} from "../types";
import IUsers from "../../reducers/users/model";

export const setUserRecord = (payload: IUsers.Model) => {
    if(payload.nickname){
        localStorage.setItem('nickname', payload.nickname);
    }
    return {
        type: SET_USER_RECORD,
        payload: payload
    }
};


