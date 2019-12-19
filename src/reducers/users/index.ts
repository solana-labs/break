import {GET_LEADERBOARD, SET_USER_RECORD} from "../../actions/types";
import IUsers from "./model";

const initState: IUsers.ModelState = {
    leaderboard: null,
    userRecord: null
};

const usersReducer = (state = initState, action: any) => {
    switch (action.type) {
        case GET_LEADERBOARD:
            return {
                ...state,
                leaderboard: action.payload
            };
        case SET_USER_RECORD:
            return {
                ...state,
                userRecord: action.payload
            };
        default:
            return state;
    }
};

export default usersReducer;
