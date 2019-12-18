import {GET_LEADERBOARD} from "../../actions/types";
import IUsers from "./model";

const initState: IUsers.ModelState = {
    leaderboard: null
};

const usersReducer = (state = initState, action: any) => {
    switch (action.type) {
        case GET_LEADERBOARD:
            return {
                ...state,
                leaderboard: action.payload
            };
        default:
            return state;
    }
};

export default usersReducer;
